#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根據目前專案檔案，自動產生 sitemap.xml
"""

from pathlib import Path
from datetime import datetime

BASE_URL = "https://witega.com.tw"


def main():
  root = Path(".").resolve()

  urls = []

  # 基本頁面
  urls.append(f"{BASE_URL}/")
  if (root / "index.html").exists():
    urls.append(f"{BASE_URL}/index.html")
  if (root / "index_en.html").exists():
    urls.append(f"{BASE_URL}/index_en.html")
  if (root / "products.html").exists():
    urls.append(f"{BASE_URL}/products.html")

  # 所有 product 底下的 html
  product_dir = root / "product"
  if product_dir.exists():
    for html_file in sorted(product_dir.rglob("*.html")):
      rel_path = html_file.relative_to(root).as_posix()
      urls.append(f"{BASE_URL}/{rel_path}")

  # 若要保留原本 PDF 也可以一併加入
  pdf_dir = root / "assets" / "doc"
  if pdf_dir.exists():
    for pdf_file in sorted(pdf_dir.rglob("*.pdf")):
      rel_path = pdf_file.relative_to(root).as_posix()
      urls.append(f"{BASE_URL}/{rel_path}")

  # 產生 sitemap.xml
  now_iso = datetime.utcnow().replace(microsecond=0).isoformat() + "+00:00"

  lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    "<!-- auto generated sitemap -->",
    "",
  ]

  for url in urls:
    priority = "1.00" if url in (f"{BASE_URL}/", f"{BASE_URL}/index.html") else "0.80"
    if url.endswith(".pdf"):
      priority = "0.64"
    lines += [
      "<url>",
      f"  <loc>{url}</loc>",
      f"  <lastmod>{now_iso}</lastmod>",
      f"  <priority>{priority}</priority>",
      "</url>",
    ]

  lines.append("")
  lines.append("</urlset>")

  (root / "sitemap.xml").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
  main()


