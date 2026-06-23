/**
 * 把原 products.js 的列表縮圖（img）搬進 Supabase：
 * 上傳縮圖檔（若 storage 沒有）+ 寫入 products.thumbnail。
 * 需先由 MCP 暫開 anon 寫入 policy。
 * 用法：cd scripts && node thumbnails.mjs
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

const ps = new Function(
  readFileSync(resolve(ROOT, 'assets/data/products.js'), 'utf8') + ';return productsData;'
)();
const idMap = { 'RX-1': 'RX1', 'RU-1': 'RU1', 'RL-1': 'RL1' };
const toKey = (p) => p.replace(/^assets\/img\/products\//, '').replace(/^assets\//, '');
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const mimeOf = (p) => MIME[extname(p).slice(1).toLowerCase()] || 'application/octet-stream';

async function run() {
  let setOk = 0, setErr = 0, up = 0, miss = 0;
  for (const c of ps.categories) {
    for (const p of c.products) {
      if (!p.img) continue;
      const id = idMap[p.id] || p.id;
      const key = toKey(p.img);
      const local = resolve(ROOT, p.img);

      // storage 沒有才上傳
      const exists = await db.storage.from(BUCKET).list(key.split('/')[0], { search: key.split('/').pop() });
      const has = exists.data && exists.data.some((f) => f.name === key.split('/').pop());
      if (!has) {
        if (existsSync(local)) {
          const { error } = await db.storage
            .from(BUCKET)
            .upload(key, readFileSync(local), { upsert: true, contentType: mimeOf(p.img) });
          if (error) console.error(`  ✗ 上傳 ${key}: ${error.message}`);
          else { up++; }
        } else {
          console.warn(`  ⚠ 縮圖本機缺檔 ${p.img}（${id}）`);
          miss++;
        }
      }

      const { error } = await db.from('products').update({ thumbnail: key }).eq('id', id);
      if (error) { console.error(`✗ ${id} thumbnail: ${error.message}`); setErr++; }
      else setOk++;
    }
  }
  console.log(`thumbnail 寫入 OK ${setOk} / 失敗 ${setErr}；新上傳縮圖 ${up} 張；缺檔 ${miss}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
