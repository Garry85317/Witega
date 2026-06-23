/**
 * 一次性遷移：把 products.js + product-details.js 與本地圖片搬到 Supabase。
 *
 * 用法：
 *   cd scripts && npm install
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE=eyJ... \
 *   node migrate.mjs
 *
 * service_role key 只在本機使用，請勿提交到 Git。
 * 執行前請先在 Supabase 跑完 supabase/schema.sql 並建立 product-images bucket。
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'product-images';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE;
if (!URL || !KEY) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE 環境變數');
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });

// --- 讀取舊資料檔（檔案用 const 宣告，無 export）---
function evalConst(file, varName) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  return new Function(`${text}; return ${varName};`)();
}
const productsData = evalConst('assets/data/products.js', 'productsData');
const productDetails = evalConst('assets/data/product-details.js', 'productDetails');

// 圖片本地路徑 → storage key（去掉 assets/img/products/ 前綴）
function toKey(imgPath) {
  return imgPath.replace(/^assets\/img\/products\//, '').replace(/^assets\//, '');
}
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
function mimeOf(p) {
  return MIME[extname(p).slice(1).toLowerCase()] || 'application/octet-stream';
}

// 列表 id → 詳情 id 映射（與 product-detail.js 一致）
const idMapping = { 'RX-1': 'RX1', 'RU-1': 'RU1', 'RL-1': 'RL1' };

// 從 products.js 推導排序（依分類順序 + 分類內順序）
const sortOrder = {};
let counter = 0;
(productsData.categories || []).forEach((cat) => {
  (cat.products || []).forEach((p) => {
    const detailId = idMapping[p.id] || p.id;
    sortOrder[detailId] = counter++;
  });
});

async function run() {
  const ids = Object.keys(productDetails);
  console.log(`共 ${ids.length} 個產品要遷移`);

  let imgOk = 0, imgMiss = 0;
  for (const id of ids) {
    const p = productDetails[id];
    const keys = [];

    for (const imgPath of p.images || []) {
      const key = toKey(imgPath);
      const localPath = resolve(ROOT, imgPath);
      if (!existsSync(localPath)) {
        console.warn(`  ⚠ 找不到本地圖片，跳過：${imgPath}`);
        imgMiss++;
        continue;
      }
      const buf = readFileSync(localPath);
      const { error } = await db.storage
        .from(BUCKET)
        .upload(key, buf, { upsert: true, contentType: mimeOf(imgPath) });
      if (error) {
        console.error(`  ✗ 上傳失敗 ${key}: ${error.message}`);
        continue;
      }
      keys.push(key);
      imgOk++;
    }

    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description || '',
      meta_description: p.metaDescription || p.description || '',
      keywords: p.keywords || '',
      video_url: p.videoUrl || null,
      images: keys,
      specs: p.specs || [],
      downloads: p.downloads || [],
      sort_order: sortOrder[p.id] ?? 9999,
    };
    const { error } = await db.from('products').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`✗ ${id} 寫入失敗: ${error.message}`);
    } else {
      console.log(`✓ ${id} (${keys.length} 張圖)`);
    }
  }

  console.log(`\n完成。圖片上傳 ${imgOk} 張，缺失 ${imgMiss} 張。`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
