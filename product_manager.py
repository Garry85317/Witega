#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產品管理系統 - 從 JSON 配置自動生成產品頁面
使用方法：
1. 編輯 products_config.json 新增或修改產品
2. 執行: python3 product_manager.py
3. 系統會自動生成 HTML、更新 products.js 和 sitemap.xml
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# 產品頁面模板
PRODUCT_TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />

    <title>{title} - Witega</title>
    <meta
      content="{meta_description}"
      name="description"
    />
    <meta
      content="{keywords}"
      name="keywords"
    />

    <!-- Favicons -->
    <link href="{assets_prefix}assets/img/favicon.png" rel="icon" />
    <link href="{assets_prefix}assets/img/favicon.png" rel="apple-touch-icon" />

    <!-- Google Fonts -->
    <link
      href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Raleway:300,300i,400,400i,500,500i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i"
      rel="stylesheet"
    />

    <!-- Vendor CSS Files -->
    <link
      href="{assets_prefix}assets/vendor/animate.css/animate.min.css"
      rel="stylesheet"
    />
    <link href="{assets_prefix}assets/vendor/aos/aos.css" rel="stylesheet" />
    <link
      href="{assets_prefix}assets/vendor/bootstrap/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      href="{assets_prefix}assets/vendor/bootstrap-icons/bootstrap-icons.css"
      rel="stylesheet"
    />
    <link
      href="{assets_prefix}assets/vendor/boxicons/css/boxicons.min.css"
      rel="stylesheet"
    />
    <link
      href="{assets_prefix}assets/vendor/glightbox/css/glightbox.min.css"
      rel="stylesheet"
    />
    <link href="{assets_prefix}assets/vendor/remixicon/remixicon.css" rel="stylesheet" />
    <link
      href="{assets_prefix}assets/vendor/swiper/swiper-bundle.min.css"
      rel="stylesheet"
    />

    <!-- Template Main CSS File -->
    <link href="{assets_prefix}assets/css/style.css" rel="stylesheet" />
  </head>

  <body>
    <!-- ======= Header ======= -->
    <header id="header" class="fixed-top d-flex align-items-center">
      <div class="container d-flex align-items-center justify-content-between">
        <div class="logo">
          <a href="{root_prefix}index.html"
            ><img src="{assets_prefix}assets/img/logo.png" alt="" class="img-fluid"
          /></a>
        </div>

        <nav id="navbar" class="navbar">
          <ul>
            <li>
              <a class="nav-link scrollto" href="{root_prefix}index.html#hero">首頁</a>
            </li>
            <li>
              <a class="nav-link scrollto" href="{root_prefix}index.html#services"
                >產品服務</a
              >
            </li>
            <li>
              <a class="nav-link scrollto" href="{root_prefix}products.html">產品列表</a>
            </li>
            <li>
              <a class="nav-link scrollto" href="{root_prefix}index.html#about"
                >關於威特嘉</a
              >
            </li>
            <li>
              <a class="nav-link scrollto" href="{root_prefix}index.html#portfolio"
                >案例分享</a
              >
            </li>
            <!-- <li><a class="nav-link scrollto" href="#team">團隊</a></li> -->
            <li>
              <a class="nav-link scrollto" href="{root_prefix}index.html#contact"
                >聯絡我們</a
              >
            </li>
          </ul>
          <i
            class="bi bi-list mobile-nav-toggle"
            style="
              font-family: Arial, Helvetica, sans-serif;
              font-style: normal;
            "
          ></i>
        </nav>
        <!-- .navbar -->
      </div>
    </header>
    <!-- End Header -->

    <main id="main">
      <!-- ======= Breadcrumbs ======= -->
      <section id="breadcrumbs" class="breadcrumbs">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center">
            <h2>產品介紹</h2>
            <ol>
              <li><a href="{root_prefix}products.html">產品列表</a></li>
              <li><a href="{root_prefix}products.html?category={category_id}">{category_name}</a></li>
              <li>{product_name}</li>
            </ol>
          </div>
        </div>
      </section>
      <!-- End Breadcrumbs -->

      <!-- ======= Portfolio Details Section ======= -->
      <section id="portfolio-details" class="portfolio-details">
        <div class="container">
          <div class="row gy-4">
            <div class="col-lg-8">
              <div class="portfolio-details-slider swiper">
                <div class="swiper-wrapper align-items-center">
{image_slides}
                </div>
                <div class="swiper-pagination"></div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="portfolio-info">
                <h3>{product_name}</h3>
                <ul>
{specs_list}
{downloads_list}
{video_link}
                </ul>
              </div>
              <div class="portfolio-description">
                <h2>產品資訊</h2>
                <p>{description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- End Portfolio Details Section -->
    </main>
    <!-- End #main -->

    <!-- ======= Footer ======= -->
    <footer id="footer">
      <div class="container">
        <h3>威特嘉科技開發股份有限公司</h3>
        <p>Witega Technology Development CO., Ltd.</p>
        <div class="social-links">
          <a href="https://lin.ee/UNmlNbW" class="line"
            ><i class="bi bi-line"></i
          ></a>
          <a href="https://www.facebook.com/witegatw" class="facebook"
            ><i class="bx bxl-facebook"></i
          ></a>
          <a
            href="https://www.youtube.com/channel/UC3h1ePfYfp-Eb-kIvi5LaKA"
            class="instagram"
            ><i class="bi bi-youtube"></i
          ></a>
          <a class="telbtn" onclick="location.href='tel:04-83405528'"
            ><i class="bx bxs-phone"></i
          ></a>
          <!--<a href="#" class="google-plus"><i class="bx bxl-skype"></i></a>
        <a href="#" class="linkedin"><i class="bx bxl-linkedin"></i></a>-->
        </div>
        <div class="copyright">
          &copy; Copyright <strong><span>Witega</span></strong
          >. All Rights Reserved
        </div>
      </div>
    </footer>
    <!-- End Footer -->

    <a
      href="#"
      class="back-to-top d-flex align-items-center justify-content-center"
      ><i class="bi bi-arrow-up-short"></i
    ></a>

    <!-- Vendor JS Files -->
    <script src="{assets_prefix}assets/vendor/aos/aos.js"></script>
    <script src="{assets_prefix}assets/vendor/bootstrap/js/bootstrap.min.js"></script>
    <script src="{assets_prefix}assets/vendor/glightbox/js/glightbox.min.js"></script>
    <script src="{assets_prefix}assets/vendor/isotope-layout/isotope.pkgd.min.js"></script>
    <script src="{assets_prefix}assets/vendor/swiper/swiper-bundle.min.js"></script>
    <script src="https://code.iconify.design/2/2.1.0/iconify.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <!-- Template Main JS File -->
    <script src="{assets_prefix}assets/js/main.js"></script>
  </body>
</html>'''

# 分類名稱映射
CATEGORY_NAMES = {
    "tools": "省工機具",
    "smart-detection": "智能檢測儀器",
    "biosecurity": "生物安全防治設備",
    "animal-marking": "動物標示",
    "injection": "注射防疫",
    "temperature": "環溫控制",
    "disinfection": "清洗消毒",
    "epidemicPrevention": "豬場防疫",
    "equipment": "養殖器械"
}

def get_path_prefixes(file_path: str) -> tuple:
    """根據文件路徑計算相對路徑前綴"""
    path = Path(file_path)
    depth = len(path.parts) - 1  # 減去文件名
    
    if depth == 1:  # product/xxx.html
        return "../", "../"
    elif depth == 2:  # product/xxx/yyy.html
        return "../../", "../../"
    else:
        return "../", "../"

def generate_image_slides(images: List[str], product_name: str) -> str:
    """生成圖片輪播 HTML"""
    slides = []
    for img in images:
        slides.append(f'''                  <div class="swiper-slide">
                    <img
                      src="{img}"
                      alt="{product_name}"
                    />
                  </div>''')
    return "\n".join(slides)

def generate_specs_list(specs: List[Dict]) -> str:
    """生成規格列表 HTML"""
    items = []
    for spec in specs:
        items.append(f'                  <li><strong>{spec["label"]}：</strong>{spec["value"]}</li>')
    return "\n".join(items)

def generate_downloads_list(downloads: List[Dict]) -> str:
    """生成下載連結 HTML"""
    if not downloads:
        return ""
    
    links = []
    for i, download in enumerate(downloads):
        if i == 0:
            links.append(f'                  <li>\n                    <strong>檔案下載：</strong\n                    ><a href="{download["url"]}" download="{download["filename"]}">{download["label"]}</a>')
        else:
            links.append(f'、<a href="{download["url"]}" download="{download["filename"]}">{download["label"]}</a>')
    
    links.append("                  </li>")
    return "\n".join(links)

def generate_video_link(video_url: str) -> str:
    """生成影片連結 HTML"""
    if not video_url:
        return ""
    return f'''                  <li>
                    <strong>操作示範：</strong
                    ><a href="{video_url}" target="_blank"
                      >影片連結</a
                    >
                  </li>'''

def generate_product_html(product: Dict, category_name: str) -> str:
    """生成產品 HTML 頁面"""
    file_path = product["path"]
    root_prefix, assets_prefix = get_path_prefixes(file_path)
    
    # 生成各部分 HTML
    image_slides = generate_image_slides(product.get("images", []), product["name"])
    specs_list = generate_specs_list(product.get("specs", []))
    downloads_list = generate_downloads_list(product.get("downloads", []))
    video_link = generate_video_link(product.get("videoUrl"))
    
    # 組合 HTML
    html = PRODUCT_TEMPLATE.format(
        title=product["name"],
        meta_description=product.get("metaDescription", ""),
        keywords=product.get("keywords", ""),
        assets_prefix=assets_prefix,
        root_prefix=root_prefix,
        category_id=product["category"],
        category_name=category_name,
        product_name=product["name"],
        image_slides=image_slides,
        specs_list=specs_list,
        downloads_list=downloads_list,
        video_link=video_link,
        description=product.get("description", "")
    )
    
    return html

def update_products_js(products: List[Dict], categories: Dict):
    """更新 products.js 檔案"""
    # 讀取現有的 products.js
    products_js_path = Path("assets/data/products.js")
    
    # 構建新的產品數據結構
    category_products = {}
    for product in products:
        category_id = product["category"]
        if category_id not in category_products:
            category_products[category_id] = []
        
        # 確定產品圖片（使用第一張圖片）
        img = product.get("images", [""])[0] if product.get("images") else ""
        # 移除相對路徑前綴，轉為絕對路徑
        if img.startswith("../"):
            img = img[3:]
        elif img.startswith("../../"):
            img = img[6:]
        
        category_products[category_id].append({
            "id": product["id"],
            "name": product["name"],
            "img": img,
            "url": product["path"]
        })
    
    # 生成 JavaScript 代碼
    js_content = "const productsData = {\n  \"categories\": [\n"
    
    for category_id, category_name in CATEGORY_NAMES.items():
        if category_id in category_products:
            js_content += f'''    {{
      "id": "{category_id}",
      "name": "{category_name}",
      "products": [
'''
            for product in category_products[category_id]:
                js_content += f'''        {{
          "id": "{product["id"]}",
          "name": "{product["name"]}",
          "img": "{product["img"]}",
          "url": "{product["url"]}"
        }},
'''
            js_content = js_content.rstrip(",\n") + "\n      ]\n    },\n"
    
    js_content = js_content.rstrip(",\n") + "\n  ]\n};"
    
    # 寫入檔案
    with open(products_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✓ 已更新 {products_js_path}")

def main():
    """主函數"""
    # 讀取產品配置
    config_path = Path("products_config.json")
    if not config_path.exists():
        print(f"錯誤: 找不到 {config_path}")
        print("請先創建 products_config.json 檔案")
        return
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    products = config.get("products", [])
    
    if not products:
        print("警告: products_config.json 中沒有產品")
        return
    
    print(f"找到 {len(products)} 個產品，開始生成...")
    
    # 生成每個產品的 HTML
    generated_count = 0
    for product in products:
        category_id = product["category"]
        category_name = CATEGORY_NAMES.get(category_id, category_id)
        
        # 生成 HTML
        html = generate_product_html(product, category_name)
        
        # 寫入檔案
        file_path = Path(product["path"])
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        generated_count += 1
        print(f"✓ 已生成: {file_path}")
    
    # 更新 products.js
    update_products_js(products, CATEGORY_NAMES)
    
    # 更新 sitemap.xml
    print("\n正在更新 sitemap.xml...")
    os.system("python3 generate_sitemap.py")
    
    print(f"\n完成! 成功生成 {generated_count} 個產品頁面")

if __name__ == '__main__':
    main()

