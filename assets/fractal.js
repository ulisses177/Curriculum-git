/* ============ estado base (do seu print) ============ */
const BASE = {
  zoom: 0.369, panX: 0.10337, panY: -0.03367, angle: -0.08,
  cRe: 0.50274, cIm: 0.47987, lineH: 4.0, maxIter: 40.0
};
const SPAN = 0.6;               // intervalo (radianos) que o c gira conforme você rola
const BASE_THETA = Math.atan2(BASE.cIm, BASE.cRe);
const BASE_R = Math.hypot(BASE.cRe, BASE.cIm);

let canvas = document.getElementById('fx');
let gl, program, ctx2d, renderer = 'none';
let progress = 0.5;

/* ============ shader (estimador de distância, só o contorno) ============ */
const VS = `attribute vec4 position; void main(){ gl_Position = position; }`;

const FS = `precision highp float;
uniform vec2 resolution;
uniform float zoom;
uniform vec2 pan;
uniform float angle;
uniform vec2 c;
uniform float lineH;
uniform float maxIter;
const float MAXI = 400.0;
vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
void main(){
  vec2 res = resolution;
  float m = min(res.x, res.y);
  vec2 uv = (gl_FragCoord.xy - 0.5*res)/m;
  float s = sin(angle), co = cos(angle);
  uv = mat2(co,-s,s,co)*uv;
  uv = uv/zoom + pan;
  float pw = 1.0/(m*zoom);
  vec2 z = uv; vec2 dz = vec2(1.0,0.0); float escaped = 0.0;
  for(float i=0.0;i<MAXI;i++){
    dz = 2.0*cmul(z,dz);
    z = cmul(z,z) + c;
    if(dot(z,z) > 256.0){ escaped = 1.0; break; }
    if(i >= maxIter) break;
  }
  float ink = 0.0;
  if(escaped > 0.5){
    float mm = sqrt(dot(z,z));
    float d = mm*log(mm)/max(length(dz),1e-9);
    float eps = pw*max(0.4,lineH);
    ink = 1.0 - smoothstep(eps, eps+pw, d);
  }
  gl_FragColor = vec4(vec3(1.0 - ink), 1.0);
}`;

function compile(type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(sh)); return null; }
  return sh;
}

function initGL(){
  gl = canvas.getContext('webgl', {antialias:true}) || canvas.getContext('experimental-webgl');
  if(gl){
    const vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    if(vs && fs){
      program = gl.createProgram();
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        renderer = 'webgl';
        return;
      }
    }
    gl = null;
  }
  // fallback 2D
  const nc = canvas.cloneNode(false);
  canvas.parentNode.replaceChild(nc, canvas);
  canvas = nc;
  ctx2d = canvas.getContext('2d');
  renderer = ctx2d ? '2d' : 'none';
}

function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  if(renderer === 'webgl') gl.viewport(0,0,canvas.width,canvas.height);
  else dirty = true;
}

/* 2D fallback (mesma matemática) */
let dirty = true;
function escDist2D(wx, wy, cx, cy, maxIter){
  let zx = wx, zy = wy, dzx = 1, dzy = 0;
  const mi = Math.min(maxIter, 400);
  for(let k=0;k<mi;k++){
    const ndzx = 2*(zx*dzx - zy*dzy), ndzy = 2*(zx*dzy + zy*dzx);
    dzx = ndzx; dzy = ndzy;
    const nx = zx*zx - zy*zy + cx, ny = 2*zx*zy + cy;
    zx = nx; zy = ny;
    const r2 = zx*zx + zy*zy;
    if(r2 > 256){
      const mm = Math.sqrt(r2);
      return mm*Math.log(mm)/Math.max(Math.hypot(dzx,dzy),1e-9);
    }
  }
  return -1;
}
function render2D(cx, cy){
  const scale = 0.5;
  const W = Math.max(2, Math.round(canvas.width*scale));
  const H = Math.max(2, Math.round(canvas.height*scale));
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d');
  const img = octx.createImageData(W, H);
  const data = img.data;
  const m = Math.min(W, H), zoom = BASE.zoom * (W / (canvas.width)); // mantém enquadramento
  const zoomW = BASE.zoom * (canvas.width / m); // world zoom relativo
  const sA = Math.sin(BASE.angle), cA = Math.cos(BASE.angle);
  const pw = 1/(m*BASE.zoom);
  const eps = pw*Math.max(0.4, BASE.lineH);
  const smooth = (a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
  for(let y=0;y<H;y++){
    const idy = (H/2 - (y+0.5))/m;
    for(let x=0;x<W;x++){
      const idx = (x+0.5 - W/2)/m;
      const ux = cA*idx - sA*idy, uy = sA*idx + cA*idy;
      const wx = ux/BASE.zoom + BASE.panX, wy = uy/BASE.zoom + BASE.panY;
      const d = escDist2D(wx, wy, cx, cy, BASE.maxIter);
      let ink = 0;
      if(d >= 0) ink = 1 - smooth(eps, eps+pw, d);
      const v = Math.round(255*(1-Math.max(0,Math.min(1,ink))));
      const o = (y*W+x)*4;
      data[o]=v; data[o+1]=v; data[o+2]=v; data[o+3]=255;
    }
  }
  octx.putImageData(img,0,0);
  ctx2d.clearRect(0,0,canvas.width,canvas.height);
  ctx2d.imageSmoothingEnabled = true;
  ctx2d.drawImage(off,0,0,canvas.width,canvas.height);
  dirty = false;
}

function draw(){
  const th = BASE_THETA + (progress - 0.5) * SPAN;
  const cx = BASE_R*Math.cos(th), cy = BASE_R*Math.sin(th);
  if(renderer === 'webgl'){
    gl.useProgram(program);
    const u = (n)=>gl.getUniformLocation(program,n);
    gl.uniform2f(u('resolution'), canvas.width, canvas.height);
    gl.uniform1f(u('zoom'), BASE.zoom);
    gl.uniform2f(u('pan'), BASE.panX, BASE.panY);
    gl.uniform1f(u('angle'), BASE.angle);
    gl.uniform2f(u('c'), cx, cy);
    gl.uniform1f(u('lineH'), BASE.lineH);
    gl.uniform1f(u('maxIter'), BASE.maxIter);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } else if(renderer === '2d' && dirty){
    render2D(cx, cy);
  }
}

function updateProgress(){
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress = max > 4 ? Math.min(1, Math.max(0, window.scrollY/max)) : 0.5;
  if(renderer === '2d') dirty = true;
  const h = document.getElementById('hint');
  if(h && window.scrollY > 40) h.style.opacity = '0';
}

/* ============ tema ============ */
const themeToggle = document.getElementById('theme-toggle');
const darkLabel = themeToggle.dataset.darkLabel || 'Tema escuro';
const lightLabel = themeToggle.dataset.lightLabel || 'Tema claro';
function syncThemeToggle(){
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.textContent = dark ? lightLabel : darkLabel;
  themeToggle.setAttribute('aria-label', dark ? lightLabel : darkLabel);
}
themeToggle.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', document.documentElement.dataset.theme); } catch(e) {}
  syncThemeToggle();
});
syncThemeToggle();

function loop(){ draw(); requestAnimationFrame(loop); }

window.addEventListener('scroll', updateProgress, {passive:true});
window.addEventListener('resize', () => { resize(); updateProgress(); });
window.addEventListener('load', () => {
  initGL(); resize(); updateProgress(); loop();
});
