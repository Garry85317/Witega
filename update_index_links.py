#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 index.html 中的產品連結，從 product/xxx.html 改成 product.html?id=xxx
"""

import re
from pathlib import Path

def update_index_links():
    """更新 index.html 中的產品連結"""
    index_path = Path("index.html")
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替換產品連結
    # 從 href="./product/xxx.html" 改成 href="product.html?id=xxx"
    # 或從 href="./product/xxx/yyy.html" 改成 href="product.html?id=yyy"
    
    def replace_link(match):
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
        
        # 處理特殊 ID 映射
        id_mapping = {
            'RX1': 'RX1',  # 保持不變，但 products.js 中是 RX-1
            'RU1': 'RU1',  # 保持不變，但 products.js 中是 RU-1
            'RL1': 'RL1',  # 保持不變，但 products.js 中是 RL-1
        }
        
        # 如果 products.js 中使用的是帶連字號的版本，需要檢查
        # 但根據之前的更新，product-details.js 中使用的是不帶連字號的版本
        # 所以這裡直接使用檔案名作為 ID
        
        return f'href="product.html?id={product_id}"'
    
    # 匹配 href="./product/..." 格式
    pattern = r'href="\./product/([^"]+\.html)"'
    new_content = re.sub(pattern, replace_link, content)
    
    # 寫入檔案
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✓ 已更新 {index_path}")
    
    # 統計更新的連結數量
    old_count = len(re.findall(pattern, content))
    print(f"  共更新 {old_count} 個產品連結")

if __name__ == '__main__':
    update_index_links()

