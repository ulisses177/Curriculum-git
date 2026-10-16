# Currículo Interativo — Ulisses Casemiro

Versão **web / mobile** do meu currículo: leitura em coluna centralizada com uma
animação do **conjunto de Julia** ao fundo, cuja rotação no plano complexo é
**dirigida pelo scroll** (parallax no espaço dos parâmetros `c`).

Este repositório é um espaço livre pra experimentar coisas que não caberiam num PDF.

## Rodar localmente

Abra o `index.html` no navegador, ou sirva a pasta:

```bash
python3 -m http.server 8000
# depois: http://localhost:8000
```

## Publicar (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → Branch: `main` / `/ (root)`.
O `index.html` passa a ser a página inicial.

## Arquivos

- `index.html` — a página (self-contained; fractal renderizado em WebGL, com fallback em Canvas 2D)

## Notas

- O parâmetro do fractal é animado conforme o scroll; a constante `SPAN` (no `<script>`)
  controla o intervalo de rotação.
- O estado-base do fractal (`zoom`, `pan`, `angle`, `c`, `lineH`, `maxIter`) também fica
  no topo do `<script>`, no objeto `BASE`.
