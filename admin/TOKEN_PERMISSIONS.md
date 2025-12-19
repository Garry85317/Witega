# GitHub Token 權限設定指南

## 錯誤：Resource not accessible by personal access token

如果你看到這個錯誤，表示你的 GitHub Token 權限不足。

## 解決方法

### 方法 1：使用 Classic Token（推薦，最簡單）

1. 前往 [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. 點擊 **Generate new token** → **Generate new token (classic)**
3. 填寫以下資訊：
   - **Note**: 例如「產品管理後台」
   - **Expiration**: 選擇過期時間
   - **Select scopes**: 勾選 **repo**（完整權限）
     - 這會自動包含所有需要的權限：
       - `repo:status`
       - `repo_deployment`
       - `public_repo`
       - `repo:invite`
       - `security_events`
4. 點擊 **Generate token**
5. 複製 token（格式：`ghp_xxxxxxxxxxxx`）
6. 更新 `admin/config.js` 中的 token

### 方法 2：使用 Fine-grained Token（更安全但設定較複雜）

如果你使用的是 fine-grained token（格式：`github_pat_...`），需要確保：

1. **Repository 權限**：
   - 選擇 **Only select repositories**
   - 選擇你的 repository（例如：`Garry85317/Witega`）

2. **Repository permissions**：
   - **Contents**: 必須設為 **Read and write**
   - **Metadata**: Read-only（自動包含）

3. **Account permissions**：
   - 通常不需要額外設定

4. 確認 token 未過期

## 檢查 Token 權限

### 使用 Classic Token

1. 前往 [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. 找到你的 token
3. 確認 **repo** 權限已勾選

### 使用 Fine-grained Token

1. 前往 [GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. 找到你的 token
3. 點擊進入詳情
4. 確認：
   - Repository access 包含你的 repository
   - Repository permissions 中 **Contents** 設為 **Read and write**

## 常見問題

### Q: 為什麼會出現 "Resource not accessible" 錯誤？

A: 可能的原因：
1. Token 沒有 `repo` 權限（Classic Token）
2. Token 沒有 `Contents: Read and write` 權限（Fine-grained Token）
3. Token 沒有訪問該 Repository 的權限
4. Token 已過期

### Q: 如何確認 Token 是否有效？

A: 可以透過以下方式測試：
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
```

如果返回你的用戶資訊，表示 Token 有效。

### Q: Fine-grained Token 和 Classic Token 有什麼區別？

A:
- **Classic Token**: 權限較廣泛，設定簡單，但安全性較低
- **Fine-grained Token**: 權限更精細，可以針對特定 Repository 設定，更安全

### Q: 推薦使用哪種 Token？

A: 對於個人專案，推薦使用 **Classic Token**，因為：
- 設定簡單
- 權限明確（只需要勾選 `repo`）
- 相容性好

## 重新生成 Token

如果 Token 有問題，建議重新生成：

1. 刪除舊的 Token
2. 按照上述步驟創建新的 Token
3. 更新 `admin/config.js` 中的 token

## 安全建議

⚠️ **重要**：
- Token 就像密碼，請勿分享給他人
- 不要在公開場所顯示 token
- 如果 token 洩露，請立即刪除該 token
- `config.js` 已加入 `.gitignore`，不會被提交到 Git

