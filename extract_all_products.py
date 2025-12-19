#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
從現有 HTML 檔案提取所有產品詳細資料，生成完整的 product-details.js
"""

import re
import json
from pathlib import Path
from typing import Dict, List

def extract_product_info(html_file: Path) -> Dict:
    """從 HTML 檔案提取產品資訊"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取產品名稱（從 title 或 h3）
    title_match = re.search(r'<title>([^<]+)', content)
    name = ""
    if title_match:
        name = title_match.group(1).replace(" - Witega", "").strip()
    
    if not name:
        h3_match = re.search(r'<h3>([^<]+)</h3>', content)
        if h3_match:
            name = h3_match.group(1).strip()
    
    # 提取描述
    desc_match = re.search(r'<div class="portfolio-description">.*?<p>([^<]+)</p>', content, re.DOTALL)
    description = desc_match.group(1).strip() if desc_match else ""
    
    # 提取 meta description
    meta_desc_match = re.search(r'<meta\s+content="([^"]+)"\s+name="description"', content)
    meta_description = meta_desc_match.group(1).strip() if meta_desc_match else ""
    
    # 提取 keywords
    keywords_match = re.search(r'<meta\s+content="([^"]+)"\s+name="keywords"', content)
    keywords = keywords_match.group(1).strip() if keywords_match else ""
    
    # 提取分類（從 breadcrumb）
    category_match = re.search(r'products\.html\?category=([^"]+)', content)
    category_id = category_match.group(1) if category_match else "equipment"
    
    # 提取圖片（從 swiper-slide）
    image_matches = re.findall(r'<img\s+src="([^"]+)"\s+alt="[^"]*"', content)
    images = []
    for img in image_matches:
        if "products" in img and "favicon" not in img and "logo" not in img:
            # 移除相對路徑前綴，統一為絕對路徑
            img_clean = img.replace("../", "").replace("../../", "")
            if not img_clean.startswith("assets/"):
                img_clean = "assets/" + img_clean.lstrip("/")
            if img_clean not in images:
                images.append(img_clean)
    
    # 提取規格
    specs = []
    spec_matches = re.findall(r'<li><strong>([^<：]+)[：:]\s*</strong>([^<]+)</li>', content)
    for label, value in spec_matches:
        label = label.strip()
        value = value.strip()
        # 跳過下載和影片連結
        if label not in ["檔案下載", "操作示範"] and value:
            specs.append({"label": label, "value": value})
    
    # 提取下載連結
    downloads = []
    download_matches = re.findall(r'<a href="([^"]+)" download="([^"]+)"[^>]*>([^<]+)</a>', content)
    for url, filename, label in download_matches:
        url_clean = url.replace("../", "").replace("../../", "")
        if not url_clean.startswith("assets/"):
            url_clean = "assets/" + url_clean.lstrip("/")
        downloads.append({
            "label": label.strip(),
            "url": url_clean,
            "filename": filename
        })
    
    # 提取影片連結
    video_match = re.search(r'<a href="(https://youtu\.be/[^"]+)"', content)
    video_url = video_match.group(1) if video_match else None
    
    # 確定產品 ID（從檔案名）
    product_id = html_file.stem
    
    return {
        "id": product_id,
        "name": name,
        "category": category_id,
        "description": description,
        "metaDescription": meta_description,
        "keywords": keywords,
        "images": images[:10],  # 最多10張圖片
        "specs": specs,
        "downloads": downloads,
        "videoUrl": video_url
    }

def generate_js_file(products: List[Dict], output_path: Path):
    """生成 JavaScript 檔案"""
    js_content = "// 產品詳細資料\n"
    js_content += "const productDetails = {\n"
    
    for i, product in enumerate(products):
        js_content += f'  "{product["id"]}": {json.dumps(product, ensure_ascii=False, indent=4).replace("{", "{").replace("}", "}")}'
        if i < len(products) - 1:
            js_content += ","
        js_content += "\n"
    
    js_content += "};\n\n"
    js_content += """// 分類名稱映射
const categoryNames = {
  "tools": "省工機具",
  "smart-detection": "智能檢測儀器",
  "biosecurity": "生物安全防治設備",
  "animal-marking": "動物標示",
  "injection": "注射防疫",
  "temperature": "環溫控制",
  "disinfection": "清洗消毒",
  "epidemicPrevention": "豬場防疫",
  "equipment": "養殖器械"
};
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

def main():
    """主函數"""
    # 查找所有產品 HTML 檔案
    product_dir = Path("product")
    html_files = list(product_dir.rglob("*.html"))
    
    products = []
    
    print(f"找到 {len(html_files)} 個產品檔案，開始提取...")
    
    for html_file in html_files:
        if html_file.name == "index.html":
            continue
        
        try:
            product_info = extract_product_info(html_file)
            products.append(product_info)
            print(f"✓ 已提取: {html_file.stem}")
        except Exception as e:
            print(f"✗ 提取失敗 {html_file}: {e}")
    
    # 按 ID 排序
    products.sort(key=lambda x: x["id"])
    
    # 生成 JS 檔案
    output_path = Path("assets/data/product-details.js")
    generate_js_file(products, output_path)
    
    print(f"\n完成! 已生成 {output_path}")
    print(f"共提取 {len(products)} 個產品")

if __name__ == '__main__':
    main()

