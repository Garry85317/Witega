# GitHub Token 設定說明

## 為什麼需要 GitHub Token？

GitHub Token 允許後台系統自動將產品資料提交到你的 GitHub Repository，無需手動操作。

## 如何取得 GitHub Token

### 步驟 1：前往 GitHub Settings

1. 登入 GitHub
2. 點擊右上角頭像
3. 選擇 **Settings**

### 步驟 2：建立 Personal Access Token

1. 在左側選單找到 **Developer settings**
2. 點擊 **Personal access tokens**
3. 選擇 **Tokens (classic)** 或 **Fine-grained tokens**

#### 使用 Classic Token（推薦）

1. 點擊 **Generate new token** → **Generate new token (classic)**
2. 填寫以下資訊：
   - **Note**: 例如「產品管理後台」
   - **Expiration**: 選擇過期時間（建議選擇較長時間或 No expiration）
   - **Select scopes**: 勾選 **repo**（完整權限）
3. 點擊 **Generate token**
4. **重要**：複製生成的 token（格式：`ghp_xxxxxxxxxxxx`），只會顯示一次！

#### 使用 Fine-grained Token（更安全）

1. 點擊 **Generate new token** → **Generate new token (fine-grained)**
2. 填寫以下資訊：
   - **Token name**: 例如「產品管理後台」
   - **Expiration**: 選擇過期時間
   - **Repository access**: 選擇 **Only select repositories**，然後選擇你的 repository
   - **Repository permissions**: 
     - **Contents**: Read and write
     - **Metadata**: Read-only
3. 點擊 **Generate token**
4. 複製生成的 token

### 步驟 3：在後台填入 Token

1. 打開 `admin/index.html`
2. 在「GitHub Token」欄位貼上你的 token
3. 在「Repository」欄位填入你的 repository（格式：`username/repo`）
4. Token 會自動儲存到瀏覽器本地，下次使用時會自動填入

## 安全注意事項

⚠️ **重要**：
- Token 就像密碼，請勿分享給他人
- 不要在公開場所顯示 token
- 如果 token 洩露，請立即到 GitHub 刪除該 token
- Token 會儲存在瀏覽器的 localStorage 中，請確保使用安全的電腦

## 使用自動提交

配置好 Token 後：

1. 填寫產品資訊
2. 上傳圖片
3. 點擊「儲存產品」
4. 系統會自動：
   - 更新 `product-details.js`
   - 更新 `products.js`
   - 上傳圖片到對應資料夾
   - 提交到 GitHub

5. 等待 GitHub Pages 自動部署（約 1-2 分鐘）

## 不使用自動提交

如果不想使用自動提交：

1. 留空 GitHub Token 和 Repository 欄位
2. 點擊「儲存產品」後會下載檔案
3. 按照 `DEPLOY_INSTRUCTIONS.md` 手動更新檔案
4. 執行 `git push` 手動提交

## 疑難排解

### Token 無效
- 確認 token 是否過期
- 確認 token 是否有 `repo` 權限
- 確認 token 是否正確複製（沒有多餘空格）

### Repository 格式錯誤
- 格式應為：`username/repo`
- 例如：`yourusername/witega`
- 不要包含 `https://github.com/` 前綴

### 提交失敗
- 檢查網路連線
- 確認 repository 是否存在
- 確認 token 是否有寫入權限
- 查看瀏覽器控制台的錯誤訊息

