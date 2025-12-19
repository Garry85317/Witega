# 單頁產品系統使用說明

## 概述

現在所有產品都使用**單一頁面** `product.html` 來顯示，透過 URL 參數 `?id=產品ID` 來動態載入不同產品的內容。

## 優點

✅ **只需一個 HTML 檔案** - 不用為每個產品創建單獨的 HTML  
✅ **統一管理** - 所有產品資料都在 `assets/data/product-details.js`  
✅ **易於維護** - 修改產品頁面樣式只需改一個檔案  
✅ **新增產品超簡單** - 只需在 JSON 中新增資料  

## 檔案結構

```
product.html                    # 單一產品頁面（所有產品共用）
assets/
  ├── data/
  │   ├── products.js           # 產品列表資料（用於產品列表頁）
  │   └── product-details.js   # 產品詳細資料（用於產品詳情頁）
  └── js/
      └── product-detail.js     # 產品頁面動態渲染腳本
```

## 使用方式

### 訪問產品頁面

```
product.html?id=G1          # 查看 G1 產品
product.html?id=T1          # 查看 T1 產品
product.html?id=RX1         # 查看 RX1 產品
```

### 新增產品

1. **準備產品資料**

   在 `assets/data/product-details.js` 的 `productDetails` 物件中新增：

   ```javascript
   "新產品ID": {
     "id": "新產品ID",
     "name": "產品名稱",
     "category": "tools",  // 分類 ID
     "description": "產品描述",
     "metaDescription": "SEO 描述",
     "keywords": "關鍵字1 關鍵字2",
     "images": [
       "assets/img/products/新產品ID/圖片1.jpg",
       "assets/img/products/新產品ID/圖片2.jpg"
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
         "url": "assets/img/DM/新產品ID.jpg",
         "filename": "新產品ID.jpg"
       }
     ],
     "videoUrl": "https://youtu.be/影片ID"  // 可選
   }
   ```

2. **更新產品列表**

   在 `assets/data/products.js` 的對應分類中新增：

   ```javascript
   {
     "id": "新產品ID",
     "name": "產品名稱",
     "img": "assets/img/products/新產品ID/圖片1.jpg",
     "url": "product.html?id=新產品ID"
   }
   ```

3. **完成！**

   產品會自動顯示在產品列表頁，點擊後會載入單頁產品詳情。

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

## 資料欄位說明

### 必填欄位

- `id`: 產品唯一識別碼
- `name`: 產品名稱
- `category`: 產品分類 ID
- `description`: 產品描述
- `images`: 產品圖片陣列（至少一張）

### 選填欄位

- `metaDescription`: SEO 描述
- `keywords`: SEO 關鍵字
- `specs`: 產品規格列表
- `downloads`: 下載檔案列表
- `videoUrl`: YouTube 影片連結

## 範例

### 簡單產品

```javascript
"NEW1": {
  "id": "NEW1",
  "name": "新產品",
  "category": "tools",
  "description": "這是一個新產品",
  "images": [
    "assets/img/products/NEW1/NEW1-1.jpg"
  ],
  "specs": [],
  "downloads": [],
  "videoUrl": null
}
```

### 完整產品

```javascript
"NEW2": {
  "id": "NEW2",
  "name": "完整產品範例",
  "category": "smart-detection",
  "description": "這是一個功能完整的產品",
  "metaDescription": "產品 SEO 描述",
  "keywords": "產品 關鍵字",
  "images": [
    "assets/img/products/NEW2/NEW2-1.jpg",
    "assets/img/products/NEW2/NEW2-2.jpg"
  ],
  "specs": [
    {
      "label": "產品類別",
      "value": "智能檢測儀器"
    },
    {
      "label": "尺寸",
      "value": "120 * 55 * 173 cm"
    }
  ],
  "downloads": [
    {
      "label": "DM",
      "url": "assets/img/DM/NEW2.jpg",
      "filename": "NEW2.jpg"
    }
  ],
  "videoUrl": "https://youtu.be/影片ID"
}
```

## 注意事項

1. **產品 ID 必須唯一**
2. **圖片路徑使用絕對路徑**（從 `assets/` 開始）
3. **分類 ID 必須正確**，否則麵包屑會顯示錯誤
4. **產品 ID 映射**：`RX-1` → `RX1`、`RU-1` → `RU1`、`RL-1` → `RL1`（已在 JS 中處理）

## 從舊系統遷移

如果你有舊的 HTML 產品頁面，可以使用 `extract_all_products.py` 腳本自動提取產品資料：

```bash
python3 extract_all_products.py
```

這會自動從所有 `product/*.html` 檔案中提取產品資訊，生成 `product-details.js`。

## 技術細節

- 使用原生 JavaScript（無需框架）
- 動態更新頁面標題和 Meta 標籤（SEO 友好）
- 自動初始化 Swiper 圖片輪播
- 支援多張圖片、規格列表、下載連結、影片連結

