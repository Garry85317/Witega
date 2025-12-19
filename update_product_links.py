#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 products.js 中的產品連結，從 product/xxx.html 改成 product.html?id=xxx
"""

import re
from pathlib import Path

def update_products_js():
    """更新 products.js 中的產品連結"""
    products_js_path = Path("assets/data/products.js")
    
    with open(products_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替換產品連結
    # 從 "url": "product/xxx.html" 改成 "url": "product.html?id=xxx"
    # 或從 "url": "product/xxx/yyy.html" 改成 "url": "product.html?id=yyy"
    
    def replace_url(match):
        full_match = match.group(0)
        url = match.group(1)
        # 提取產品 ID
        if "/" in url:
            # product/xxx/yyy.html -> yyy
            parts = url.split("/")
            product_id = parts[-1].replace(".html", "")
        else:
            # product/xxx.html -> xxx
            product_id = url.replace("product/", "").replace(".html", "")
        
        return f'"url": "product.html?id={product_id}"'
    
    # 匹配 "url": "product/..." 格式
    pattern = r'"url":\s*"(product/[^"]+\.html)"'
    new_content = re.sub(pattern, replace_url, content)
    
    # 寫入檔案
    with open(products_js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✓ 已更新 {products_js_path}")

if __name__ == '__main__':
    update_products_js()

