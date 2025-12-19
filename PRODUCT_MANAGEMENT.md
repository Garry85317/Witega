# 產品管理系統使用說明

## 概述

這個系統讓你可以透過編輯一個 JSON 配置檔案來管理所有產品，自動生成 HTML 頁面、更新產品列表和網站地圖。

## 快速開始

### 1. 新增產品

編輯 `products_config.json`，在 `products` 陣列中新增產品配置：

```json
{
  "id": "新產品ID",
  "name": "產品名稱",
  "category": "tools",
  "description": "產品描述",
  "metaDescription": "SEO 描述",
  "keywords": "關鍵字1 關鍵字2 關鍵字3",
  "images": [
    "../assets/img/products/新產品ID/圖片1.jpg",
    "../assets/img/products/新產品ID/圖片2.jpg"
  ],
  "specs": [
    {
      "label": "產品類別",
      "value": "省工機具"
    },
    {
      "label": "尺寸",
      "value": "120 * 55 * 173 cm"
    }
  ],
  "downloads": [
    {
      "label": "DM",
      "url": "../assets/img/DM/新產品ID.jpg",
      "filename": "新產品ID.jpg"
    }
  ],
  "videoUrl": "https://youtu.be/影片ID",
  "path": "product/新產品ID.html"
}
```

### 2. 準備產品照片

將產品照片放到對應的資料夾：
- `assets/img/products/產品ID/` - 產品照片
- `assets/img/DM/產品ID.jpg` - DM 圖片（可選）
- `assets/doc/產品ID/產品ID.pdf` - 產品說明書（可選）

### 3. 執行腳本

```bash
python3 product_manager.py
```

系統會自動：
- ✅ 生成所有產品 HTML 頁面
- ✅ 更新 `assets/data/products.js`
- ✅ 更新 `sitemap.xml`

## 產品配置欄位說明

| 欄位 | 必填 | 說明 |
|------|------|------|
| `id` | ✅ | 產品唯一識別碼（英文、數字、連字號） |
| `name` | ✅ | 產品中文名稱 |
| `category` | ✅ | 產品分類 ID（見下方分類列表） |
| `description` | ✅ | 產品描述（顯示在頁面底部） |
| `metaDescription` | ❌ | SEO 描述（用於搜尋引擎） |
| `keywords` | ❌ | SEO 關鍵字（用空格分隔） |
| `images` | ✅ | 產品圖片陣列（至少一張） |
| `specs` | ❌ | 產品規格列表 |
| `downloads` | ❌ | 下載檔案列表（DM、說明書等） |
| `videoUrl` | ❌ | YouTube 影片連結 |
| `path` | ✅ | HTML 檔案路徑 |

## 產品分類

| 分類 ID | 分類名稱 |
|---------|----------|
| `tools` | 省工機具 |
| `smart-detection` | 智能檢測儀器 |
| `biosecurity` | 生物安全防治設備 |
| `animal-marking` | 動物標示 |
| `injection` | 注射防疫 |
| `temperature` | 環溫控制 |
| `disinfection` | 清洗消毒 |
| `epidemicPrevention` | 豬場防疫 |
| `equipment` | 養殖器械 |

## 範例配置

### 簡單產品（只有基本資訊）

```json
{
  "id": "NEW1",
  "name": "新產品",
  "category": "tools",
  "description": "這是一個新產品",
  "images": [
    "../assets/img/products/NEW1/NEW1-1.jpg"
  ],
  "specs": [
    {
      "label": "產品類別",
      "value": "省工機具"
    }
  ],
  "path": "product/NEW1.html"
}
```

### 完整產品（包含所有欄位）

```json
{
  "id": "NEW2",
  "name": "完整產品範例",
  "category": "smart-detection",
  "description": "這是一個功能完整的產品描述",
  "metaDescription": "威特嘉科技開發致力於生產適合台灣養豬產業使用之省工設備",
  "keywords": "產品 關鍵字 搜尋",
  "images": [
    "../assets/img/products/NEW2/NEW2-1.jpg",
    "../assets/img/products/NEW2/NEW2-2.jpg",
    "../assets/img/products/NEW2/NEW2-3.jpg"
  ],
  "specs": [
    {
      "label": "產品類別",
      "value": "智能檢測儀器"
    },
    {
      "label": "尺寸",
      "value": "120 * 55 * 173 cm"
    },
    {
      "label": "產地",
      "value": "台灣"
    }
  ],
  "downloads": [
    {
      "label": "DM",
      "url": "../assets/img/DM/NEW2.jpg",
      "filename": "NEW2.jpg"
    },
    {
      "label": "產品說明書",
      "url": "../assets/doc/NEW2/NEW2.pdf",
      "filename": "NEW2.pdf"
    }
  ],
  "videoUrl": "https://youtu.be/影片ID",
  "path": "product/NEW2.html"
}
```

## 子資料夾產品

如果產品放在子資料夾（如 `product/smartDetection/`），路徑需要包含子資料夾：

```json
{
  "id": "newDetector",
  "name": "新檢測器",
  "category": "smart-detection",
  "description": "新的檢測器產品",
  "images": [
    "../../assets/img/products/smartDetection/newDetector.jpg"
  ],
  "path": "product/smartDetection/newDetector.html"
}
```

注意：子資料夾產品的圖片路徑需要使用 `../../` 前綴。

## 工作流程建議

1. **準備階段**
   - 準備產品照片，放到 `assets/img/products/產品ID/`
   - 準備 DM 圖片（可選），放到 `assets/img/DM/`
   - 準備產品說明書 PDF（可選），放到 `assets/doc/產品ID/`

2. **配置階段**
   - 編輯 `products_config.json`
   - 新增或修改產品配置

3. **生成階段**
   - 執行 `python3 product_manager.py`
   - 檢查生成的 HTML 頁面

4. **驗證階段**
   - 在瀏覽器中打開生成的產品頁面
   - 檢查產品列表頁面是否正確顯示
   - 檢查麵包屑導航是否正確

## 常見問題

### Q: 如何修改現有產品？

A: 編輯 `products_config.json` 中對應產品的配置，然後重新執行 `product_manager.py`。

### Q: 如何刪除產品？

A: 從 `products_config.json` 中移除該產品配置，然後重新執行腳本。注意：這不會自動刪除 HTML 檔案，需要手動刪除。

### Q: 圖片路徑怎麼設定？

A: 
- 根目錄產品：`../assets/img/products/產品ID/圖片.jpg`
- 子資料夾產品：`../../assets/img/products/子資料夾/圖片.jpg`

### Q: 可以批量新增產品嗎？

A: 可以！在 `products_config.json` 的 `products` 陣列中一次新增多個產品配置即可。

## 進階功能

### 自動更新 Sitemap

執行 `product_manager.py` 時會自動更新 `sitemap.xml`，包含所有產品頁面。

### 自動更新產品列表

`assets/data/products.js` 會根據配置自動更新，產品列表頁面會自動顯示新產品。

## 注意事項

1. **備份重要**：執行腳本前建議先備份現有檔案
2. **圖片路徑**：確保圖片路徑正確，否則頁面會顯示破圖
3. **分類 ID**：使用正確的分類 ID，否則麵包屑會顯示錯誤
4. **產品 ID**：產品 ID 必須唯一，建議使用英文和數字

