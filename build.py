#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
import subprocess

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent
BASE_URL = "https://ulisses177.github.io/Curriculum-git/"
ENV = Environment(
    loader=FileSystemLoader(ROOT / "templates"),
    autoescape=select_autoescape(["html"]),
)
WEB_TEMPLATE = ENV.get_template("resume.html")
PDF_TEMPLATE = ENV.get_template("resume-pdf.html")


def load_private():
    path = ROOT / "content" / "private.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load(lang):
    path = ROOT / "content" / f"{lang}.json"
    content = json.loads(path.read_text(encoding="utf-8"))
    content["footer"]["phone"] = load_private().get("phone", "")
    return content


def clean(html):
    return "\n".join(line.rstrip() for line in html.splitlines()) + "\n"


def render_web(cfg):
    cfg["web_out"].parent.mkdir(parents=True, exist_ok=True)
    html = clean(WEB_TEMPLATE.render(**cfg))
    cfg["web_out"].write_text(html, encoding="utf-8")
    print(f"web {cfg['lang']}: {cfg['web_out'].relative_to(ROOT)}")


def render_pdf(cfg):
    cfg["pdf_out"].parent.mkdir(parents=True, exist_ok=True)
    temp = ROOT / f"_pdf-{cfg['lang']}.html"
    temp.write_text(clean(PDF_TEMPLATE.render(**cfg)), encoding="utf-8")
    try:
        subprocess.run(
            ["weasyprint", str(temp), str(cfg["pdf_out"])],
            check=True,
        )
        print(f"pdf {cfg['lang']}: {cfg['pdf_out'].relative_to(ROOT)}")
    finally:
        temp.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(
        description="Gera as páginas web e os PDFs do currículo."
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--pdf-only", action="store_true", help="Gera apenas os PDFs.")
    group.add_argument("--web-only", action="store_true", help="Gera apenas as páginas web.")
    args = parser.parse_args()

    configs = [
        {
            "lang": "pt",
            "content": load("pt"),
            "asset_prefix": "",
            "canonical": BASE_URL,
            "og_locale": "pt_BR",
            "web_out": ROOT / "index.html",
            "pdf_out": ROOT / "pdf" / "Curriculo-Ulisses-Casemiro-pt.pdf",
        },
        {
            "lang": "en",
            "content": load("en"),
            "asset_prefix": "../",
            "canonical": BASE_URL + "en/",
            "og_locale": "en_GB",
            "web_out": ROOT / "en" / "index.html",
            "pdf_out": ROOT / "pdf" / "Curriculo-Ulisses-Casemiro-en.pdf",
        },
    ]

    for cfg in configs:
        if not args.pdf_only:
            render_web(cfg)
        if not args.web_only:
            render_pdf(cfg)


if __name__ == "__main__":
    main()
