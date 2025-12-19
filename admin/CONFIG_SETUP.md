# 配置檔案設定說明

## 使用 config.js 配置（推薦）

為了安全起見，建議將 GitHub Token 和 Repository 寫在配置檔案中，而不是在後台頁面手動輸入。

### 設定步驟

1. **複製範例檔案**
   ```bash
   cp admin/config.js.example admin/config.js
   ```

2. **編輯 config.js**
   打開 `admin/config.js`，填入你的資訊：
   ```javascript
   const GITHUB_CONFIG = {
     token: 'ghp_你的GitHubToken',  // 你的 GitHub Personal Access Token
     repo: 'yourusername/witega',    // 你的 Repository
   };
   ```

3. **完成！**
   - `config.js` 已加入 `.gitignore`，不會被提交到 Git
   - 後台會自動讀取配置
   - 表單欄位會顯示「已從 config.js 載入」

### 優點

✅ **更安全**：Token 不會出現在 HTML 表單中  
✅ **更方便**：設定一次，永久使用  
✅ **不會誤提交**：`config.js` 已加入 `.gitignore`  
✅ **團隊協作**：每個成員可以有自己的 `config.js`

## 使用表單輸入（備選）

如果不想使用 `config.js`，也可以直接在後台頁面的表單中輸入：

1. 在「GitHub Token」欄位填入 Token
2. 在「Repository」欄位填入 Repository
3. 配置會儲存在瀏覽器的 localStorage 中

## 配置優先順序

系統會按以下順序讀取配置：

1. **config.js**（最高優先級）
2. **localStorage**（如果 config.js 沒有配置）
3. **表單輸入**（如果前兩者都沒有）

## 注意事項

⚠️ **重要**：
- `config.js` 包含敏感資訊，請勿提交到 Git
- 如果 `config.js` 已配置，表單欄位會變為唯讀
- 如需修改配置，請編輯 `config.js` 檔案
- 建議定期更新 Token，確保安全性

## 範例檔案

`config.js.example` 是範例檔案，可以提交到 Git，供團隊成員參考。

