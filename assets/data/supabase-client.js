/**
 * Witega 資料層 — 統一走 Supabase。
 * 前台（products.html / product.html）只用讀取函式；
 * 後台（admin）另用寫入/刪除/上傳/登入函式。
 *
 * 依賴：先載入 supabase-js UMD 與 supabase-config.js。
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="assets/data/supabase-config.js"></script>
 *   <script src="assets/data/supabase-client.js"></script>
 */
(function () {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || !window.supabase) {
    console.error('Supabase 未初始化：缺少 supabase-js 或 supabase-config.js');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

  // 分類順序與名稱（前台列表分組用，固定不變）
  const CATEGORIES = [
    { id: 'tools', name: '省工機具', nameEn: 'Labor-saving Equipment' },
    { id: 'smart-detection', name: '智能檢測儀器', nameEn: 'Smart Detection Instruments' },
    { id: 'biosecurity', name: '生物安全防治設備', nameEn: 'Biosecurity Equipment' },
    { id: 'animal-marking', name: '動物標示', nameEn: 'Animal Marking' },
    { id: 'injection', name: '注射防疫', nameEn: 'Injection & Prevention' },
    { id: 'temperature', name: '環溫控制', nameEn: 'Temperature Control' },
    { id: 'disinfection', name: '清洗消毒', nameEn: 'Cleaning & Disinfection' },
    { id: 'epidemicPrevention', name: '豬場防疫', nameEn: 'Farm Biosecurity' },
    { id: 'equipment', name: '養殖器械', nameEn: 'Farming Equipment' },
  ];

  // 圖片 storage key → 公開 URL
  function publicUrl(key) {
    if (!key) return '';
    // 已是完整 URL（相容舊資料）直接回傳
    if (/^https?:\/\//.test(key)) return key;
    return client.storage.from(cfg.bucket).getPublicUrl(key).data.publicUrl;
  }

  // DB row（snake_case）→ 前端 productData（camelCase），依語言取欄位、圖片轉公開 URL
  // lang = 'en' 時優先取 *_en，缺則 fallback 中文
  function rowToDetail(row, lang) {
    const en = lang === 'en';
    const pick = (zh, env) => (en && env ? env : zh);
    const specsEn = row.specs_en || [];
    return {
      id: row.id,
      name: pick(row.name, row.name_en),
      category: row.category,
      description: pick(row.description, row.description_en) || '',
      metaDescription:
        pick(row.meta_description, row.meta_description_en) ||
        pick(row.description, row.description_en) ||
        '',
      keywords: pick(row.keywords, row.keywords_en) || '',
      images: (row.images || []).map(publicUrl),
      imageKeys: row.images || [], // 原始 storage key（後台編輯用）
      thumbnail: row.thumbnail || null, // 列表縮圖 storage key
      specs: en && specsEn.length ? specsEn : row.specs || [],
      downloads: row.downloads || [],
      videoUrl: row.video_url || null,
      // 英文原始欄位（後台編輯用，不受語言切換影響）
      nameEn: row.name_en || null,
      descriptionEn: row.description_en || null,
      metaDescriptionEn: row.meta_description_en || null,
      keywordsEn: row.keywords_en || null,
      specsEn: specsEn,
    };
  }

  // ---- 前台讀取 ----

  // 回傳與舊 products.js 相同結構：{ categories: [{id,name,products:[{id,name,img,url}]}] }
  async function getProductsData(lang) {
    const en = lang === 'en';
    const { data, error } = await client
      .from('products')
      .select('id,name,name_en,category,thumbnail,images,sort_order')
      .order('sort_order', { ascending: true });
    if (error) throw error;

    const langQ = en ? '&lang=en' : '';
    const byCat = {};
    (data || []).forEach((row) => {
      // 列表縮圖優先用 thumbnail（保留原策展縮圖），沒有才用第一張圖
      const thumbKey = row.thumbnail || (row.images || [])[0];
      (byCat[row.category] = byCat[row.category] || []).push({
        id: row.id,
        name: en && row.name_en ? row.name_en : row.name,
        img: publicUrl(thumbKey),
        url: `product.html?id=${row.id}${langQ}`,
      });
    });

    return {
      categories: CATEGORIES.map((c) => ({
        id: c.id,
        name: en ? c.nameEn : c.name,
        products: byCat[c.id] || [],
      })),
    };
  }

  // 單一產品詳情（product.html）
  async function getProductDetail(id, lang) {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToDetail(data, lang) : null;
  }

  // ---- 後台寫入 / 刪除 / 上傳 / 登入 ----

  async function listProducts() {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToDetail);
  }

  // 新增或更新（productData 為 admin 收集的 camelCase 物件；images 為 storage key 陣列）
  async function upsertProduct(p) {
    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description || '',
      meta_description: p.metaDescription || p.description || '',
      keywords: p.keywords || '',
      video_url: p.videoUrl || null,
      images: p.images || [],
      thumbnail: p.thumbnail || (p.images || [])[0] || null,
      specs: p.specs || [],
      downloads: p.downloads || [],
      name_en: p.nameEn || null,
      description_en: p.descriptionEn || null,
      meta_description_en: p.metaDescriptionEn || null,
      keywords_en: p.keywordsEn || null,
      specs_en: p.specsEn && p.specsEn.length ? p.specsEn : [],
    };
    const { error } = await client.from('products').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async function deleteProduct(id) {
    // 先刪 Storage 圖片資料夾，再刪資料列
    const { data: row } = await client
      .from('products')
      .select('images')
      .eq('id', id)
      .maybeSingle();
    const keys = (row && row.images) || [];
    if (keys.length) {
      await client.storage.from(cfg.bucket).remove(keys);
    }
    const { error } = await client.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  // 上傳圖片。key 例 "R1/R1-1.jpg"；fileOrBlob 為 File/Blob
  async function uploadImage(key, fileOrBlob, contentType) {
    const { error } = await client.storage
      .from(cfg.bucket)
      .upload(key, fileOrBlob, { upsert: true, contentType });
    if (error) throw error;
    return key;
  }

  async function removeImages(keys) {
    if (!keys || !keys.length) return;
    const { error } = await client.storage.from(cfg.bucket).remove(keys);
    if (error) throw error;
  }

  // Auth
  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    await client.auth.signOut();
  }
  async function getUser() {
    const { data } = await client.auth.getUser();
    return data.user || null;
  }

  window.witega = {
    client,
    CATEGORIES,
    publicUrl,
    getProductsData,
    getProductDetail,
    listProducts,
    upsertProduct,
    deleteProduct,
    uploadImage,
    removeImages,
    signIn,
    signOut,
    getUser,
  };
})();
