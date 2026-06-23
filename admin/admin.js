/**
 * 產品管理後台 JavaScript（Supabase 版）
 * 資料與圖片皆走 Supabase（見 ../assets/data/supabase-client.js）。
 */

// 儲存上傳的圖片
let uploadedImages = [];
window.uploadedImages = uploadedImages;

// 儲存所有產品資料（用於篩選列表）
let allProductsData = [];

// 儲存產品詳細資料（用於編輯，key = id）
let allProductDetails = {};

// 當前編輯模式（true = 編輯，false = 新增）
let isEditMode = false;
let editingProductId = null;

// 記錄被刪除的圖片 storage key（用於從 Storage 刪除）
let deletedImagePaths = [];

// 目前選為「列表縮圖」的圖片（uploadedImages 的 id）
let selectedThumbnailId = null;

// 分類名稱映射
const categoryNames = {
  tools: '省工機具',
  'smart-detection': '智能檢測儀器',
  biosecurity: '生物安全防治設備',
  'animal-marking': '動物標示',
  injection: '注射防疫',
  temperature: '環溫控制',
  disinfection: '清洗消毒',
  epidemicPrevention: '豬場防疫',
  equipment: '養殖器械',
};

// 新增規格項目
function addSpec() {
  const container = document.getElementById('specsContainer');
  const specId = 'spec_' + Date.now();
  const specItem = document.createElement('div');
  specItem.className = 'spec-item';
  specItem.id = specId;
  specItem.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="規格名稱"
          data-spec-label
        />
      </div>
      <div class="col-md-6">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="規格值"
          data-spec-value
        />
      </div>
      <div class="col-md-1">
        <button
          type="button"
          class="btn btn-sm btn-remove"
          onclick="removeSpec('${specId}')"
        >
          <i class="bi bi-x-circle"></i>
        </button>
      </div>
    </div>
  `;
  container.appendChild(specItem);
}

// 移除規格項目
function removeSpec(id) {
  document.getElementById(id).remove();
}

// 新增下載項目
function addDownload() {
  const container = document.getElementById('downloadsContainer');
  const downloadId = 'download_' + Date.now();
  const downloadItem = document.createElement('div');
  downloadItem.className = 'spec-item';
  downloadItem.id = downloadId;
  downloadItem.innerHTML = `
    <div class="row">
      <div class="col-md-3">
        <input type="text" class="form-control form-control-sm" placeholder="標籤（如：DM）" data-download-label />
      </div>
      <div class="col-md-4">
        <input type="text" class="form-control form-control-sm" placeholder="檔案路徑" data-download-url />
      </div>
      <div class="col-md-4">
        <input type="text" class="form-control form-control-sm" placeholder="檔案名稱" data-download-filename />
      </div>
      <div class="col-md-1">
        <button type="button" class="btn btn-sm btn-remove" onclick="removeDownload('${downloadId}')">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>
    </div>
  `;
  container.appendChild(downloadItem);
}

// 移除下載項目
function removeDownload(id) {
  document.getElementById(id).remove();
}

// 處理圖片上傳
function handleImageUpload(event) {
  const files = event.target.files;
  const preview = document.getElementById('imagePreview');

  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imageId = 'img_' + Date.now() + '_' + index;
        const img = document.createElement('div');
        img.className = 'image-preview';
        img.id = imageId;
        img.innerHTML = `
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img src="${e.target.result}" alt="預覽 ${index + 1}" style="max-width: 150px; max-height: 150px;" />
              <div class="ms-3">
                <small><strong>${file.name}</strong></small>
                <br>
                <small class="text-muted">新上傳的圖片</small>
                <div class="thumb-controls mt-1">
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setThumbnail('${imageId}')">設為列表縮圖</button>
                  <span class="badge bg-success thumb-label ms-1" style="display:none">列表縮圖</span>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger ms-3" onclick="removeImage('${imageId}')" title="刪除圖片">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;
        preview.appendChild(img);

        // 儲存圖片資料（保留原始 File 供上傳 Storage 用）
        uploadedImages.push({
          id: imageId,
          name: file.name,
          data: e.target.result,
          file: file,
          type: file.type,
          existing: false,
        });
        window.uploadedImages = uploadedImages;

        // 沒選縮圖時，預設第一張新圖
        if (!selectedThumbnailId) selectedThumbnailId = imageId;
        refreshThumbButtons();
      };
      reader.readAsDataURL(file);
    }
  });

  // 清空文件輸入，允許重新選擇相同文件
  event.target.value = '';
}

// 刪除圖片（編輯模式下若刪的是現有圖片，記錄 storage key）
function removeImage(imageId) {
  const imageElement = document.getElementById(imageId);
  if (!imageElement) return;

  const imageToRemove = uploadedImages.find((img) => img && img.id === imageId);
  if (isEditMode && imageToRemove && imageToRemove.existing === true && imageToRemove.path) {
    deletedImagePaths.push(imageToRemove.path);
  }

  uploadedImages = uploadedImages.filter((img) => img && img.id && img.id !== imageId);
  window.uploadedImages = uploadedImages;
  imageElement.remove();

  // 刪到的是縮圖 → 改選剩下第一張
  if (selectedThumbnailId === imageId) {
    selectedThumbnailId = uploadedImages[0] ? uploadedImages[0].id : null;
  }
  refreshThumbButtons();
}

// 設定某張圖為列表縮圖
function setThumbnail(imageId) {
  selectedThumbnailId = imageId;
  refreshThumbButtons();
}

// 依 selectedThumbnailId 更新所有縮圖按鈕 / 標籤
function refreshThumbButtons() {
  document.querySelectorAll('#imagePreview .image-preview').forEach((el) => {
    const isThumb = el.id === selectedThumbnailId;
    const label = el.querySelector('.thumb-label');
    const btn = el.querySelector('.thumb-controls button');
    if (label) label.style.display = isThumb ? '' : 'none';
    if (btn) {
      btn.classList.toggle('btn-success', isThumb);
      btn.classList.toggle('btn-outline-secondary', !isThumb);
      btn.textContent = isThumb ? '✓ 列表縮圖' : '設為列表縮圖';
    }
  });
}

// 收集表單資料（images 為 Supabase Storage key 陣列）
function collectFormData() {
  const productId =
    isEditMode && editingProductId
      ? editingProductId
      : document.getElementById('productId').value.trim();
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const description = document.getElementById('productDescription').value.trim();
  const metaDescription =
    document.getElementById('metaDescription').value.trim() || description;
  const keywords = document.getElementById('keywords').value.trim();
  const videoUrl = document.getElementById('videoUrl').value.trim();

  // 規格
  const specs = [];
  document.querySelectorAll('[data-spec-label]').forEach((input) => {
    const label = input.value.trim();
    const valueInput = input.parentElement.parentElement.querySelector('[data-spec-value]');
    const value = valueInput ? valueInput.value.trim() : '';
    if (label && value) specs.push({ label, value });
  });

  // 下載
  const downloads = [];
  document.querySelectorAll('[data-download-label]').forEach((input) => {
    const label = input.value.trim();
    const urlInput = input.parentElement.parentElement.querySelector('[data-download-url]');
    const filenameInput = input.parentElement.parentElement.querySelector('[data-download-filename]');
    const url = urlInput ? urlInput.value.trim() : '';
    const filename = filenameInput ? filenameInput.value.trim() : '';
    if (label && url && filename) downloads.push({ label, url, filename });
  });

  // 生成圖片 key（沿用原編號重用邏輯）
  const images = [];
  const cleanedImages = (uploadedImages || []).filter((img) => img != null);

  const usedNumbers = new Set();
  let maxImageNumber = 0;

  cleanedImages.forEach((img) => {
    if (img && img.existing === true && img.path && typeof img.path === 'string') {
      images.push(img.path);
      const match = img.path.match(/-(\d+)\./);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          usedNumbers.add(num);
          if (num > maxImageNumber) maxImageNumber = num;
        }
      }
    }
  });

  const missingNumbers = [];
  for (let i = 1; i <= maxImageNumber; i++) {
    if (!usedNumbers.has(i)) missingNumbers.push(i);
  }
  missingNumbers.sort((a, b) => a - b);

  let missingIndex = 0;
  cleanedImages.forEach((img) => {
    if (!img || img.existing === true) return;
    if (!img.name || typeof img.name !== 'string') return;
    if (!img.file && (typeof img.data !== 'string' || img.data.trim().length === 0)) return;

    let imageNumber;
    if (missingIndex < missingNumbers.length) {
      imageNumber = missingNumbers[missingIndex];
      missingIndex++;
    } else {
      maxImageNumber++;
      imageNumber = maxImageNumber;
    }

    const ext = getFileExtension(img.name);
    // Supabase Storage key（bucket 內路徑）
    images.push(`${productId}/${productId}-${imageNumber}.${ext}`);
  });

  return {
    id: productId,
    name: productName,
    category: category,
    description: description,
    metaDescription: metaDescription,
    keywords: keywords,
    images: images,
    specs: specs,
    downloads: downloads,
    videoUrl: videoUrl || null,
  };
}

// 獲取檔案副檔名
function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return 'jpg';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
}

// 預覽資料（渲染成可讀預覽，非原始 JSON）
function previewData() {
  const data = collectFormData();
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
    );
  const catName = categoryNames[data.category] || data.category || '—';

  const imgsHtml =
    (uploadedImages || [])
      .filter((i) => i)
      .map((img) => {
        const src = img.existing ? window.witega.publicUrl(img.path) : img.data;
        const isThumb = img.id === selectedThumbnailId;
        return `<div style="display:inline-block;text-align:center;margin:6px;vertical-align:top">
          <img src="${src}" style="width:120px;height:120px;object-fit:contain;border:1px solid #ddd;border-radius:4px${isThumb ? ';outline:3px solid #198754' : ''}">
          ${isThumb ? '<div><span class="badge bg-success mt-1">列表縮圖</span></div>' : ''}
        </div>`;
      })
      .join('') || '<span class="text-muted">（無圖片）</span>';

  const specsHtml = data.specs.length
    ? '<ul class="mb-0">' +
      data.specs.map((s) => `<li><strong>${esc(s.label)}：</strong>${esc(s.value)}</li>`).join('') +
      '</ul>'
    : '<span class="text-muted">（無）</span>';

  const dlHtml =
    data.downloads && data.downloads.length
      ? data.downloads.map((d) => `${esc(d.label)}（${esc(d.filename)}）`).join('、')
      : '<span class="text-muted">（無）</span>';

  const html = `
    <div style="white-space:normal">
      <h5>${esc(data.name) || '(未填名稱)'} <small class="text-muted">${esc(data.id)}</small></h5>
      <p class="mb-1"><strong>類別：</strong>${esc(catName)}</p>
      <p class="mb-1"><strong>描述：</strong>${esc(data.description) || '—'}</p>
      <p class="mb-1"><strong>SEO 描述：</strong>${esc(data.metaDescription) || '—'}</p>
      <p class="mb-1"><strong>關鍵字：</strong>${esc(data.keywords) || '—'}</p>
      <p class="mb-1"><strong>影片：</strong>${data.videoUrl ? `<a href="${esc(data.videoUrl)}" target="_blank">${esc(data.videoUrl)}</a>` : '—'}</p>
      <p class="mb-1 mt-2"><strong>規格：</strong></p>${specsHtml}
      <p class="mb-1 mt-2"><strong>下載：</strong>${dlHtml}</p>
      <p class="mb-1 mt-2"><strong>圖片（綠框為列表縮圖）：</strong></p>
      <div>${imgsHtml}</div>
    </div>`;

  const el = document.getElementById('previewContent');
  el.style.whiteSpace = 'normal';
  el.style.background = 'transparent';
  el.innerHTML = html;
  new bootstrap.Modal(document.getElementById('previewModal')).show();
}

// base64 dataURL → Blob（File 缺失時的後備）
function dataUrlToBlob(dataUrl, fallbackType) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);/) || [])[1] || fallbackType || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// 在 modal 內顯示提示
function showFormAlert(cls, html) {
  const modalBody = document.getElementById('productFormModal')?.querySelector('.modal-body');
  const productForm = document.getElementById('productForm');
  const a = document.createElement('div');
  a.className = `alert ${cls} alert-dismissible fade show`;
  a.innerHTML = html + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
  if (productForm && modalBody) modalBody.insertBefore(a, productForm);
  else if (modalBody) modalBody.insertBefore(a, modalBody.firstChild);
  return a;
}

// 儲存產品（新增 / 編輯）
async function saveProduct() {
  const form = document.getElementById('productForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const productData = collectFormData();
  if (isEditMode && editingProductId) productData.id = editingProductId;

  if (!productData.id || !productData.name || !productData.category) {
    alert('請填寫所有必填欄位');
    return;
  }
  if (productData.images.length === 0) {
    alert('請至少上傳一張產品圖片');
    return;
  }

  // 新增模式檢查 ID 是否重複
  if (!isEditMode) {
    if (Object.keys(allProductDetails).length === 0) await loadProductDetails();
    if (allProductDetails[productData.id]) {
      alert(`產品 ID "${productData.id}" 已存在，請使用其他 ID`);
      document.getElementById('productId').focus();
      return;
    }
  }

  const saveBtn = document.getElementById('saveProductBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const previewBtn = document.getElementById('previewBtn');
  const originalSaveBtnHTML = saveBtn.innerHTML;

  saveBtn.disabled = true;
  if (cancelBtn) cancelBtn.disabled = true;
  if (previewBtn) previewBtn.disabled = true;
  saveBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>正在儲存...';

  const loadingAlert = showFormAlert('alert-info', '<strong>正在儲存到 Supabase...</strong>');

  const restoreButtons = () => {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalSaveBtnHTML;
    if (cancelBtn) cancelBtn.disabled = false;
    if (previewBtn) previewBtn.disabled = false;
  };

  try {
    // 找出新上傳圖片對應的 Storage key
    const existingKeys = new Set(
      (uploadedImages || [])
        .filter((img) => img && img.existing === true && img.path)
        .map((img) => img.path)
    );
    const newKeys = productData.images.filter((k) => !existingKeys.has(k));
    const newImages = (uploadedImages || []).filter(
      (img) => img && !img.existing && (img.file || (typeof img.data === 'string' && img.data))
    );

    // 逐張上傳新圖片
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      const key = newKeys[i];
      if (!key) continue;
      const body = img.file || dataUrlToBlob(img.data, img.type);
      await window.witega.uploadImage(key, body, img.type);
    }

    // 解析所選列表縮圖 → storage key
    let thumbKey = null;
    if (selectedThumbnailId) {
      const sel = (uploadedImages || []).find((i) => i && i.id === selectedThumbnailId);
      if (sel) {
        thumbKey = sel.existing ? sel.path : newKeys[newImages.indexOf(sel)];
      }
    }
    productData.thumbnail = thumbKey || productData.images[0] || null;

    // 寫入 / 更新資料列
    await window.witega.upsertProduct(productData);

    // 移除已刪除的圖片（編輯模式）
    if (isEditMode && deletedImagePaths && deletedImagePaths.length) {
      await window.witega.removeImages(deletedImagePaths);
    }

    loadingAlert.remove();
    restoreButtons();

    const actionText = isEditMode ? '更新' : '新增';
    const ok = showFormAlert(
      'alert-success',
      `<strong><i class="bi bi-check-circle"></i> 產品已成功${actionText}！</strong>`
    );

    await loadProductsTable();
    await loadProductDetails();

    setTimeout(() => {
      hideProductForm();
      if (ok.parentNode) ok.remove();
    }, 1500);
  } catch (error) {
    loadingAlert.remove();
    restoreButtons();
    showFormAlert(
      'alert-danger',
      `<strong><i class="bi bi-exclamation-triangle"></i> 儲存失敗</strong><br><small>${error.message || '未知錯誤'}</small>`
    );
  }
}

// 載入產品列表（從 Supabase）
async function loadProductsTable() {
  const container = document.getElementById('productsTableContainer');
  try {
    const details = await window.witega.listProducts();
    allProductDetails = {};
    allProductsData = details.map((d) => {
      allProductDetails[d.id] = d;
      // 與前台一致：優先顯示策展縮圖
      const img = d.thumbnail ? window.witega.publicUrl(d.thumbnail) : d.images[0] || '';
      return {
        id: d.id,
        name: d.name,
        img: img,
        categoryId: d.category,
        categoryName: categoryNames[d.category] || d.category,
      };
    });
    renderProductsTable();
  } catch (error) {
    console.error('載入產品列表失敗:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <strong><i class="bi bi-exclamation-triangle"></i> 載入產品列表失敗</strong>
        <p class="mb-0 mt-2">${error.message}</p>
        <button class="btn btn-sm btn-primary mt-2" onclick="loadProductsTable()">
          <i class="bi bi-arrow-clockwise"></i> 重新載入
        </button>
      </div>
    `;
  }
}

// 渲染產品表格
function renderProductsTable(filteredProducts = null) {
  const container = document.getElementById('productsTableContainer');
  const productsToShow = filteredProducts !== null ? filteredProducts : allProductsData;

  let tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 100px;">縮圖</th>
            <th>產品名稱</th>
            <th>類別</th>
            <th style="width: 140px;">操作</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (productsToShow && productsToShow.length > 0) {
    productsToShow.forEach((product) => {
      const thumbnail = product.img || '';
      const productName = product.name || product.id;
      const categoryName = product.categoryName || '';
      const safeName = String(productName).replace(/'/g, "\\'");

      tableHTML += `
        <tr>
          <td>
            ${thumbnail ? `<img src="${thumbnail}" alt="${productName}" class="product-thumbnail" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23ddd\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3E無圖片%3C/text%3E%3C/svg%3E'">` : '<span class="text-muted">無圖片</span>'}
          </td>
          <td><strong>${productName}</strong></td>
          <td><span class="badge bg-secondary">${categoryName}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${product.id}')" title="編輯">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger ms-1" onclick="confirmDeleteProduct('${product.id}', '${safeName}')" title="刪除">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    tableHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="mt-3 text-muted">${filteredProducts !== null ? '沒有符合篩選條件的產品' : '目前沒有任何產品'}</p>
          ${filteredProducts === null ? `<button class="btn btn-primary" onclick="showProductForm()"><i class="bi bi-plus-circle"></i> 新增第一個產品</button>` : ''}
        </td>
      </tr>
    `;
  }

  tableHTML += `
        </tbody>
      </table>
    </div>
    <div class="mt-2 text-muted">
      <small>顯示 ${productsToShow.length} / ${allProductsData.length} 個產品</small>
    </div>
  `;

  container.innerHTML = tableHTML;
}

// 刪除產品（含 Storage 圖片）
async function confirmDeleteProduct(id, name) {
  if (!confirm(`確定要刪除產品「${name || id}」嗎？此動作無法復原，圖片也會一併刪除。`)) {
    return;
  }
  try {
    await window.witega.deleteProduct(id);
    await loadProductsTable();
    await loadProductDetails();
  } catch (error) {
    console.error('刪除產品失敗:', error);
    alert('刪除失敗：' + (error.message || '未知錯誤'));
  }
}

// 篩選產品
function filterProducts() {
  const searchName = document.getElementById('searchProductName')?.value.trim().toLowerCase() || '';
  const filterCategory = document.getElementById('filterCategory')?.value || '';

  let filtered = allProductsData;
  if (searchName) {
    filtered = filtered.filter((product) =>
      (product.name || product.id || '').toLowerCase().includes(searchName)
    );
  }
  if (filterCategory) {
    filtered = filtered.filter((product) => product.categoryId === filterCategory);
  }
  renderProductsTable(filtered);
}

// 清除篩選
function clearFilters() {
  document.getElementById('searchProductName').value = '';
  document.getElementById('filterCategory').value = '';
  renderProductsTable();
}

// 顯示產品表單 Modal
function showProductForm() {
  if (!isEditMode) {
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    uploadedImages = [];
    window.uploadedImages = [];
    selectedThumbnailId = null;
    document.getElementById('specsContainer').innerHTML = '';
    document.getElementById('productId').disabled = false;
    document.getElementById('productFormModalLabel').innerHTML =
      '<i class="bi bi-file-earmark-plus"></i> 新增產品';
  }
  new bootstrap.Modal(document.getElementById('productFormModal')).show();
}

// 隱藏產品表單 Modal
function hideProductForm() {
  const modalElement = document.getElementById('productFormModal');
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) modal.hide();

  document.getElementById('productForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
  uploadedImages = [];
  window.uploadedImages = [];
  document.getElementById('specsContainer').innerHTML = '';
  const fileInput = document.getElementById('productImages');
  if (fileInput) fileInput.value = '';
  document.getElementById('productId').disabled = false;
  isEditMode = false;
  editingProductId = null;
  deletedImagePaths = [];
  selectedThumbnailId = null;
}

// 載入產品詳細資料（從 Supabase，建立 id → detail 映射）
async function loadProductDetails() {
  try {
    const details = await window.witega.listProducts();
    allProductDetails = {};
    details.forEach((d) => {
      allProductDetails[d.id] = d;
    });
    return allProductDetails;
  } catch (error) {
    console.error('載入產品詳細資料失敗:', error);
    return {};
  }
}

// 編輯產品
async function editProduct(productId) {
  isEditMode = true;
  editingProductId = productId;
  deletedImagePaths = [];

  if (Object.keys(allProductDetails).length === 0) await loadProductDetails();

  const productData = allProductDetails[productId];
  if (!productData) {
    alert('找不到產品資料，產品 ID: ' + productId);
    isEditMode = false;
    editingProductId = null;
    return;
  }

  showProductForm();

  document.getElementById('productFormModalLabel').innerHTML =
    '<i class="bi bi-pencil"></i> 編輯產品';

  document.getElementById('productId').value = productData.id || '';
  document.getElementById('productName').value = productData.name || '';
  document.getElementById('productCategory').value = productData.category || '';
  document.getElementById('productDescription').value = productData.description || '';
  document.getElementById('metaDescription').value = productData.metaDescription || '';
  document.getElementById('keywords').value = productData.keywords || '';
  document.getElementById('videoUrl').value = productData.videoUrl || '';

  // 編輯時不可改 ID
  document.getElementById('productId').disabled = true;

  // 規格
  const specsContainer = document.getElementById('specsContainer');
  specsContainer.innerHTML = '';
  if (productData.specs && productData.specs.length > 0) {
    productData.specs.forEach((spec) => {
      addSpec();
      const specItems = specsContainer.querySelectorAll('.spec-item');
      const lastSpec = specItems[specItems.length - 1];
      const labelInput = lastSpec.querySelector('[data-spec-label]');
      const valueInput = lastSpec.querySelector('[data-spec-value]');
      if (labelInput) labelInput.value = spec.label || '';
      if (valueInput) valueInput.value = spec.value || '';
    });
  }

  // 現有圖片（imageKeys = storage key，images = 公開 URL）
  const imagePreview = document.getElementById('imagePreview');
  imagePreview.innerHTML = '';
  uploadedImages = [];
  window.uploadedImages = [];

  const keys = productData.imageKeys || [];
  const urls = productData.images || [];
  let preselect = null;
  keys.forEach((key, index) => {
    const imageId = 'img_existing_' + productId + '_' + index;
    if (key === productData.thumbnail) preselect = imageId;
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-preview';
    imgDiv.id = imageId;
    imgDiv.innerHTML = `
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <img src="${urls[index] || ''}" alt="現有圖片 ${index + 1}" style="max-width: 150px; max-height: 150px;" onerror="this.style.display='none'">
          <div class="ms-3">
            <small><strong>現有圖片 ${index + 1}</strong></small>
            <br>
            <small class="text-muted">${key}</small>
            <div class="thumb-controls mt-1">
              <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setThumbnail('${imageId}')">設為列表縮圖</button>
              <span class="badge bg-success thumb-label ms-1" style="display:none">列表縮圖</span>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger ms-3" onclick="removeImage('${imageId}')" title="刪除圖片">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    imagePreview.appendChild(imgDiv);

    uploadedImages.push({
      id: imageId,
      name: key.split('/').pop(),
      data: null,
      type: 'image/jpeg',
      existing: true,
      path: key, // storage key
    });
    window.uploadedImages = uploadedImages;
  });

  // 預選：原縮圖在圖片清單中就選它，否則選第一張
  selectedThumbnailId = preselect || (uploadedImages[0] ? uploadedImages[0].id : null);
  refreshThumbButtons();
}

// 頁面載入時：綁定 modal 關閉重置（資料載入由 index.html checkAuth 觸發）
document.addEventListener('DOMContentLoaded', function () {
  const productFormModal = document.getElementById('productFormModal');
  if (productFormModal) {
    productFormModal.addEventListener('hidden.bs.modal', function () {
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      uploadedImages = [];
      window.uploadedImages = [];
      document.getElementById('specsContainer').innerHTML = '';
      const fileInput = document.getElementById('productImages');
      if (fileInput) fileInput.value = '';
      document.getElementById('productId').disabled = false;
      isEditMode = false;
      editingProductId = null;
      deletedImagePaths = [];
      selectedThumbnailId = null;
      const modalBody = productFormModal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.querySelectorAll('.alert').forEach((alert) => alert.remove());
      }
      document.getElementById('productFormModalLabel').innerHTML =
        '<i class="bi bi-file-earmark-plus"></i> 新增產品';
    });
  }
});
