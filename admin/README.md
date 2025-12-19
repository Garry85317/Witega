# 產品管理後台使用說明

## 功能介紹

這個後台系統可以讓你輕鬆新增產品，無需手動編輯 JSON 檔案。

## 使用步驟

### 1. 開啟後台頁面

在瀏覽器中打開 `admin/index.html`

### 2. 填寫產品資訊

- **產品 ID**: 唯一識別碼（例如：NEW1）
- **產品名稱**: 產品的中文名稱
- **產品類別**: 選擇產品所屬的分類
- **產品描述**: 簡短的產品描述
- **SEO 描述**: 用於搜尋引擎優化（可選）
- **關鍵字**: SEO 關鍵字，用空格分隔（可選）

### 3. 新增產品規格

點擊「新增規格」按鈕，填寫規格名稱和值。例如：
- 規格名稱：產品類別
- 規格值：省工機具

### 4. 上傳產品圖片

點擊「選擇檔案」按鈕，選擇產品圖片（可多選）。圖片會自動預覽。

### 5. 新增下載檔案（可選）

如果需要提供 DM 或說明書下載，點擊「新增下載」按鈕，填寫：
- 標籤：例如「DM」或「產品說明書」
- 檔案路徑：例如 `assets/img/DM/NEW1.jpg`
- 檔案名稱：下載時的檔案名

### 6. 新增影片連結（可選）

如果有 YouTube 操作示範影片，填入影片連結。

### 7. 預覽資料

點擊「預覽資料」按鈕，檢查產品資料是否正確。

### 8. 儲存產品

點擊「儲存產品」按鈕，系統會自動生成以下檔案：

1. **product-details-item.js** - 產品詳細資料（需要添加到 `product-details.js`）
2. **products-js-item.js** - 產品列表項目（需要添加到 `products.js`）
3. **產品ID-data.json** - 完整的產品資料 JSON
4. **產品ID-images.zip** - 產品圖片壓縮檔
5. **DEPLOY_INSTRUCTIONS.md** - 詳細的部署說明

### 9. 部署產品

按照 `DEPLOY_INSTRUCTIONS.md` 的說明：

1. **解壓縮圖片**
   ```bash
   unzip NEW1-images.zip -d assets/img/products/NEW1/
   ```

2. **更新 product-details.js**
   - 打開 `assets/data/product-details.js`
   - 將 `product-details-item.js` 的內容添加到 `productDetails` 物件中

3. **更新 products.js**
   - 打開 `assets/data/products.js`
   - 找到對應的分類，將 `products-js-item.js` 的內容添加到該分類的 `products` 陣列中

4. **提交到 GitHub**
   ```bash
   git add .
   git commit -m "新增產品: 產品名稱"
   git push
   ```

## GitHub Pages 自動部署

推送後，GitHub Pages 會自動部署，網站會在幾分鐘內更新。

## 注意事項

1. **產品 ID 必須唯一**，建議使用英文和數字
2. **圖片路徑**會自動根據產品 ID 和分類生成
3. **分類必須正確**，否則產品不會顯示在正確的分類中
4. **至少需要一張圖片**，否則無法儲存
5. **檔案下載後**，需要手動更新 JSON 檔案並提交到 Git

## 疑難排解

### 圖片無法上傳
- 確保圖片格式為 JPG 或 PNG
- 檢查瀏覽器是否支援 File API

### 資料格式錯誤
- 使用「預覽資料」功能檢查資料格式
- 確保所有必填欄位都已填寫

### 部署後產品未顯示
- 檢查 JSON 檔案格式是否正確
- 確認圖片路徑是否正確
- 檢查瀏覽器快取，嘗試強制重新整理（Ctrl+F5）

