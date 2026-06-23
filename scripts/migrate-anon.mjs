/**
 * 一次性遷移（anon key 版）：products.js + product-details.js + 本地圖片 → Supabase。
 * 遷移期間 DB 暫開 anon 寫入 policy，跑完會由 MCP 收回。
 * 用法：cd scripts && npm install && node migrate-anon.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUCKET = 'product-images';
const URL = 'https://pjcwiskivlwipvgiaqpz.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqY3dpc2tpdmx3aXB2Z2lhcXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTY2MzUsImV4cCI6MjA5Nzc3MjYzNX0.6gMSL79FscTIqGgfGE5r4711GgAC_mITwf_hz8Q_kLI';
const db = createClient(URL, ANON, { auth: { persistSession: false } });

function evalConst(file, varName) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  return new Function(`${text}; return ${varName};`)();
}
const productsData = evalConst('assets/data/products.js', 'productsData');
const productDetails = evalConst('assets/data/product-details.js', 'productDetails');

const idMapping = { 'RX-1': 'RX1', 'RU-1': 'RU1', 'RL-1': 'RL1' };
const sortOrder = {};
let counter = 0;
(productsData.categories || []).forEach((cat) =>
  (cat.products || []).forEach((p) => {
    sortOrder[idMapping[p.id] || p.id] = counter++;
  })
);

const toKey = (p) => p.replace(/^assets\/img\/products\//, '').replace(/^assets\//, '');
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const mimeOf = (p) => MIME[extname(p).slice(1).toLowerCase()] || 'application/octet-stream';

async function run() {
  const ids = Object.keys(productDetails);
  console.log(`產品 ${ids.length} 個`);
  let imgOk = 0, imgMiss = 0, rowOk = 0, rowErr = 0;

  for (const id of ids) {
    const p = productDetails[id];
    const keys = [];
    for (const imgPath of p.images || []) {
      const key = toKey(imgPath);
      const local = resolve(ROOT, imgPath);
      if (!existsSync(local)) {
        console.warn(`  ⚠ 缺圖 ${imgPath}`);
        imgMiss++;
        continue;
      }
      const { error } = await db.storage
        .from(BUCKET)
        .upload(key, readFileSync(local), { upsert: true, contentType: mimeOf(imgPath) });
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
      sort_order: sortOrder[id] ?? 9999,
    };
    const { error } = await db.from('products').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`✗ ${id}: ${error.message}`);
      rowErr++;
    } else {
      rowOk++;
    }
  }
  console.log(`\n完成。資料列 OK ${rowOk} / 失敗 ${rowErr}；圖片 OK ${imgOk} / 缺 ${imgMiss}`);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
