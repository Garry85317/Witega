#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
從現有 HTML 檔案提取產品資訊，生成 products_config.json
用於將現有產品遷移到新的管理系統
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
    
    # 提取圖片
    image_matches = re.findall(r'<img\s+src="([^"]+)"\s+alt="[^"]*"', content)
    images = [img for img in image_matches if "products" in img and not "favicon" in img]
    
    # 提取規格
    specs = []
    spec_matches = re.findall(r'<li><strong>([^<]+)：</strong>([^<]+)</li>', content)
    for label, value in spec_matches:
        if label not in ["檔案下載", "操作示範"]:
            specs.append({"label": label, "value": value.strip()})
    
    # 提取下載連結
    downloads = []
    download_matches = re.findall(r'<a href="([^"]+)" download="([^"]+)"[^>]*>([^<]+)</a>', content)
    for url, filename, label in download_matches:
        downloads.append({
            "label": label,
            "url": url,
            "filename": filename
        })
    
    # 提取影片連結
    video_match = re.search(r'<a href="(https://youtu\.be/[^"]+)"', content)
    video_url = video_match.group(1) if video_match else None
    
    # 確定產品 ID（從檔案名）
    product_id = html_file.stem
    
    # 確定路徑前綴
    depth = len(html_file.parts) - 1
    if depth == 2:  # product/xxx.html
        path_prefix = "../"
    elif depth == 3:  # product/xxx/yyy.html
        path_prefix = "../../"
    else:
        path_prefix = "../"
    
    # 調整圖片路徑（確保使用正確的前綴）
    adjusted_images = []
    for img in images:
        if not img.startswith("../") and not img.startswith("../../"):
            adjusted_images.append(path_prefix + img.lstrip("/"))
        else:
            adjusted_images.append(img)
    
    return {
        "id": product_id,
        "name": name,
        "category": category_id,
        "description": description,
        "metaDescription": meta_description,
        "keywords": keywords,
        "images": adjusted_images[:5],  # 最多5張圖片
        "specs": specs,
        "downloads": downloads,
        "videoUrl": video_url,
        "path": str(html_file).replace("\\", "/")
    }

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
            print(f"✓ 已提取: {html_file}")
        except Exception as e:
            print(f"✗ 提取失敗 {html_file}: {e}")
    
    # 按分類和 ID 排序
    products.sort(key=lambda x: (x["category"], x["id"]))
    
    # 生成 JSON
    config = {
        "products": products
    }
    
    # 寫入檔案
    output_path = Path("products_config.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print(f"\n完成! 已生成 {output_path}")
    print(f"共提取 {len(products)} 個產品")
    print("\n下一步：")
    print("1. 檢查 products_config.json 中的產品資訊")
    print("2. 根據需要調整配置")
    print("3. 執行 python3 product_manager.py 重新生成所有頁面")

if __name__ == '__main__':
    main()

