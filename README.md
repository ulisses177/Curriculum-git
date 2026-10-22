# Currículo Interativo — Ulisses Casemiro

🔗 **https://ulisses177.github.io/Curriculum-git/**

Currículo em português e inglês, com versão web para leitura em celular e versões em PDF.
A página usa uma animação do **conjunto de Julia** ao fundo, com rotação no plano complexo
dirigida pelo scroll. O tema claro/escuro segue o navegador na primeira visita e pode ser
alternado pelo botão no canto superior direito.

## Estrutura

- `content/pt.json` — todo o texto em português.
- `content/en.json` — todo o texto em inglês britânico.
- `content/private.json` — telefone usado apenas no PDF local, não versionado (opcional).
- `templates/resume.html` — template da versão web.
- `templates/resume-pdf.html` — template das versões em PDF.
- `assets/styles.css` — estilos da versão web.
- `assets/fractal.js` — fractal, tema e controles da versão web.
- `assets/pdf.css` — estilos do PDF.
- `assets/fractal-pdf.png` — imagem de fundo usada no PDF.
- `build.py` — gera as páginas web e os PDFs.
- `index.html` — página em português, gerada pelo build.
- `en/index.html` — página em inglês, gerada pelo build.
- `pdf/Curriculo-Ulisses-Casemiro-pt.pdf` — PDF em português, gerado pelo build.
- `pdf/Curriculo-Ulisses-Casemiro-en.pdf` — PDF em inglês, gerado pelo build.

Não edite `index.html` nem `en/index.html` diretamente. Eles são sobrescritos pelo build.
Para mudar o texto, edite os arquivos em `content/` e rode o build.

## Editar o texto

1. Altere `content/pt.json` ou `content/en.json`.
2. Rode o build:

```bash
python3 build.py
```

O build atualiza as duas páginas web e os dois PDFs.

## Exportar os PDFs

O build usa o WeasyPrint para gerar os PDFs a partir de `templates/resume-pdf.html`.
Instale as dependências, se necessário:

```bash
pip install weasyprint jinja2
```

Depois rode:

```bash
python3 build.py
```

Para gerar apenas os PDFs:

```bash
python3 build.py --pdf-only
```

Para gerar apenas as páginas web:

```bash
python3 build.py --web-only
```

Saídas:

- `pdf/Curriculo-Ulisses-Casemiro-pt.pdf`
- `pdf/Curriculo-Ulisses-Casemiro-en.pdf`

Os PDFs são gerados localmente e não são versionados. O `pdf/` e os arquivos
temporários `_pdf-*.html` estão no `.gitignore`.

Para incluir o telefone no PDF, crie `content/private.json` com:

```json
{"phone": "(11) 93915-5418"}
```

Esse arquivo está no `.gitignore`. Sem ele, o PDF é gerado sem telefone.

O layout do PDF fica em `assets/pdf.css` e a imagem de fundo em `assets/fractal-pdf.png`.
O deslocamento horizontal do fractal no PDF é definido por `right: -37%` em `.bg`.

## Paginação do PDF

- Cada experiência é um bloco `.entry` e não quebra no meio.
- Cada grupo de competências é um bloco `.skill-group` e não quebra no meio.
- A Trajetória é uma lista de parágrafos em `content/pt.json` e `content/en.json`.
  Cada parágrafo não quebra no meio, então as quebras acontecem entre parágrafos.
- Os títulos usam `break-after: avoid` para não ficarem sozinhos no fim da página.
- A partir da segunda página, o PDF tem um cabeçalho com o nome e uma margem superior.

Para mudar a Trajetória, edite a lista `paragraphs` do JSON. Para adicionar uma experiência,
acrescente um novo objeto em `entries`. O build reorganiza as páginas automaticamente.

## Rodar localmente

```bash
python3 -m http.server 8000
```

- Português: http://localhost:8000
- Inglês: http://localhost:8000/en/

## Publicar (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → Branch: `main` / `/ (root)`.
O `index.html` é a página inicial e `en/index.html` é a versão em inglês.

## Notas

- O parâmetro do fractal é animado conforme o scroll. A constante `SPAN` em
  `assets/fractal.js` controla o intervalo de rotação.
- O estado-base do fractal (`zoom`, `pan`, `angle`, `c`, `lineH`, `maxIter`) fica no
  objeto `BASE`, no topo de `assets/fractal.js`.
- O tema é salvo no `localStorage`. Na primeira visita, sem escolha salva, ele usa a
  preferência do navegador.
- A troca de idioma é um link entre `/` e `/en/`. O tema continua salvo ao trocar de página.
