# Supabase 遷移設定步驟

把產品的新增 / 編輯 / 刪除從「推 Git」改成「存 Supabase」。圖片存 Supabase Storage，後台用 Supabase Auth 登入。

## 1. 建立資料表與 RLS
Supabase Dashboard → SQL Editor → 貼上並執行 [`schema.sql`](schema.sql)。

## 2. 建立 Storage bucket
Dashboard → Storage → New bucket：
- 名稱：`product-images`
- Public bucket：**開啟**（前台要能直接讀圖）

（bucket 的讀寫 policy 已包含在 `schema.sql` 裡。）

## 3. 建立後台登入帳號
Dashboard → Authentication → Users → Add user：
- 填 email + password（這就是後台登入帳密）
- 建議關閉「Confirm email」或直接用 Add user 建立已確認帳號

## 4. 填入前端設定
編輯 [`../assets/data/supabase-config.js`](../assets/data/supabase-config.js)：
```js
window.SUPABASE_CONFIG = {
  url: 'https://你的專案.supabase.co',
  anonKey: '你的 anon key',   // Dashboard → Project Settings → API
  bucket: 'product-images',
};
```
anon key 是公開金鑰，提交到 GitHub 沒問題（寫入由 RLS + Auth 擋）。

## 5. 一次性遷移舊資料
把現有 `products.js` + `product-details.js` 與本地圖片搬進 Supabase：
```bash
cd scripts
npm install
SUPABASE_URL=https://你的專案.supabase.co \
SUPABASE_SERVICE_ROLE=你的 service_role key \
node migrate.mjs
```
- service_role key：Dashboard → Project Settings → API（**只在本機用，勿提交**）。
- 跑完到 Dashboard 確認 `products` 表有資料、Storage 有圖片。

## 6. 驗證
- 前台列表：`products.html`
- 前台詳情：`product.html?id=R1`
- 後台：`admin/index.html` → 用步驟 3 的帳密登入 → 新增 / 編輯 / 刪除

## 7. 清掉舊檔（確認 6 都正常後）
不再需要：
- `assets/data/products.js`
- `assets/data/product-details.js`
- GAS 專案（取 GitHub token 用的）— 可停用

遷移腳本還會用到上面兩個舊 js，所以**遷移成功後再刪**。
