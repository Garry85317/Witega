/**
 * 產品管理後台 JavaScript
 */

// 儲存上傳的圖片（暴露到全局以便 GitHub 部署使用）
let uploadedImages = [];
window.uploadedImages = uploadedImages;

// 儲存所有產品資料（用於篩選）
let allProductsData = [];

// 儲存產品詳細資料（用於編輯）
let allProductDetails = {};

// 當前編輯模式（true = 編輯，false = 新增）
let isEditMode = false;
let editingProductId = null;

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
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="標籤（如：DM）"
          data-download-label
        />
      </div>
      <div class="col-md-4">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="檔案路徑"
          data-download-url
        />
      </div>
      <div class="col-md-4">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="檔案名稱"
          data-download-filename
        />
      </div>
      <div class="col-md-1">
        <button
          type="button"
          class="btn btn-sm btn-remove"
          onclick="removeDownload('${downloadId}')"
        >
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
  
  // 不清空現有圖片，只添加新圖片
  // preview.innerHTML = '';
  // uploadedImages = [];
  // window.uploadedImages = uploadedImages;

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
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger ms-3"
              onclick="removeImage('${imageId}')"
              title="刪除圖片"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;
        preview.appendChild(img);

        // 儲存圖片資料
        const imageData = {
          id: imageId,
          name: file.name,
          data: e.target.result,
          type: file.type,
          existing: false
        };
        uploadedImages.push(imageData);
        window.uploadedImages = uploadedImages; // 同步到全局
      };
      reader.readAsDataURL(file);
    }
  });
  
  // 清空文件輸入，允許重新選擇相同文件
  event.target.value = '';
}

// 刪除圖片
function removeImage(imageId) {
  const imageElement = document.getElementById(imageId);
  if (imageElement) {
    // 從 uploadedImages 中移除
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    window.uploadedImages = uploadedImages;
    
    // 從 DOM 中移除
    imageElement.remove();
  }
}

// 收集表單資料
function collectFormData() {
  // 如果是編輯模式，使用編輯中的產品 ID（因為欄位被禁用）
  const productId = isEditMode && editingProductId 
    ? editingProductId 
    : document.getElementById('productId').value.trim();
  const productName = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const description = document.getElementById('productDescription').value.trim();
  const metaDescription =
    document.getElementById('metaDescription').value.trim() || description;
  const keywords = document.getElementById('keywords').value.trim();
  const videoUrl = document.getElementById('videoUrl').value.trim();

  // 收集規格
  const specs = [];
  document.querySelectorAll('[data-spec-label]').forEach((input) => {
    const label = input.value.trim();
    const valueInput = input.parentElement.parentElement.querySelector(
      '[data-spec-value]'
    );
    const value = valueInput ? valueInput.value.trim() : '';
    if (label && value) {
      specs.push({ label, value });
    }
  });

  // 收集下載
  const downloads = [];
  document.querySelectorAll('[data-download-label]').forEach((input) => {
    const label = input.value.trim();
    const urlInput = input.parentElement.parentElement.querySelector(
      '[data-download-url]'
    );
    const filenameInput = input.parentElement.parentElement.querySelector(
      '[data-download-filename]'
    );
    const url = urlInput ? urlInput.value.trim() : '';
    const filename = filenameInput ? filenameInput.value.trim() : '';
    if (label && url && filename) {
      downloads.push({ label, url, filename });
    }
  });

  // 生成圖片路徑
  const categoryName = categoryNames[category] || category;
  const images = [];
  
  // 處理現有圖片（編輯模式）
  uploadedImages.forEach((img, index) => {
    if (img.existing && img.path) {
      // 保留現有圖片路徑
      images.push(img.path);
    } else if (!img.existing) {
      // 新上傳的圖片
      const imagePath = `assets/img/products/${productId}/${productId}-${images.length + 1}.${getFileExtension(img.name)}`;
      images.push(imagePath);
    }
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
  return filename.split('.').pop().toLowerCase();
}

// 預覽資料
function previewData() {
  const data = collectFormData();
  const previewContent = document.getElementById('previewContent');
  previewContent.textContent = JSON.stringify(data, null, 2);
  const modal = new bootstrap.Modal(document.getElementById('previewModal'));
  modal.show();
}

// 生成產品資料 JSON
function generateProductData(productData) {
  return `  "${productData.id}": ${JSON.stringify(productData, null, 4)}`;
}

// 生成 products.js 項目
function generateProductsJsItem(productData) {
  const firstImage = productData.images[0] || '';
  return `        {
          "id": "${productData.id}",
          "name": "${productData.name}",
          "img": "${firstImage}",
          "url": "product.html?id=${productData.id}"
        }`;
}

// 儲存產品
async function saveProduct() {
  // 驗證表單
  const form = document.getElementById('productForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const productData = collectFormData();
  
  // 如果是編輯模式，確保 ID 正確
  if (isEditMode && editingProductId) {
    productData.id = editingProductId;
  }

  // 驗證必填欄位
  if (!productData.id || !productData.name || !productData.category) {
    alert('請填寫所有必填欄位');
    return;
  }

  if (productData.images.length === 0) {
    alert('請至少上傳一張產品圖片');
    return;
  }

  // 檢查產品 ID 是否重複（僅在新增模式時檢查）
  if (!isEditMode) {
    // 確保產品詳細資料已載入
    if (Object.keys(allProductDetails).length === 0) {
      await loadProductDetails();
    }
    
    // 檢查 ID 是否已存在
    if (allProductDetails[productData.id]) {
      alert(`產品 ID "${productData.id}" 已存在，請使用其他 ID`);
      // 聚焦到產品 ID 欄位
      document.getElementById('productId').focus();
      return;
    }
  }

    // 生成檔案
    const files = [];

    // 1. 產品詳細資料（product-details.js 格式）
    const productDetailsItem = generateProductData(productData);
    files.push({
      name: 'product-details-item.js',
      content: productDetailsItem,
      description: '產品詳細資料（需要手動添加到 product-details.js）',
    });

    // 2. 產品列表項目（products.js 格式）
    const productsJsItem = generateProductsJsItem(productData);
    files.push({
      name: 'products-js-item.js',
      content: productsJsItem,
      description: '產品列表項目（需要手動添加到 products.js）',
    });

    // 3. 完整的產品資料 JSON
    files.push({
      name: `${productData.id}-data.json`,
      content: JSON.stringify(productData, null, 2),
      description: '完整的產品資料 JSON',
    });

    // 4. 圖片檔案（ZIP）
    if (uploadedImages.length > 0) {
      // 使用 JSZip 來打包圖片
      if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        uploadedImages.forEach((img, index) => {
          const ext = getFileExtension(img.name);
          const filename = `${productData.id}-${index + 1}.${ext}`;
          // 將 base64 轉換為 binary
          const base64Data = img.data.split(',')[1];
          zip.file(filename, base64Data, { base64: true });
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        files.push({
          name: `${productData.id}-images.zip`,
          blob: zipBlob,
          description: '產品圖片壓縮檔',
        });
      }
    }

    // 5. 部署說明
    const deployInstructions = generateDeployInstructions(productData, files);
    files.push({
      name: 'DEPLOY_INSTRUCTIONS.md',
      content: deployInstructions,
      description: '部署說明文件',
    });

    // 從 config.js 讀取 GitHub 配置
    let githubRepo = '';
    let gasUrl = '';
    
    if (typeof GITHUB_CONFIG !== 'undefined') {
      githubRepo = GITHUB_CONFIG.repo || '';
      gasUrl = GITHUB_CONFIG.gasUrl || '';
    } else {
      alert('GitHub 配置未載入，請檢查 config.js');
      return;
    }

    // 驗證配置
    if (!gasUrl) {
      alert('請在 config.js 中配置 gasUrl');
      return;
    }

    if (!githubRepo) {
      alert('請在 config.js 中配置 repo');
      return;
    }

    // 使用 GAS 代理或直接調用 GitHub API
      // 禁用按鈕並顯示載入狀態
      const saveBtn = document.getElementById('saveProductBtn');
      const cancelBtn = document.getElementById('cancelBtn');
      const previewBtn = document.getElementById('previewBtn');
      
      const originalSaveBtnHTML = saveBtn.innerHTML;
      const originalSaveBtnDisabled = saveBtn.disabled;
      
      // 禁用所有按鈕
      saveBtn.disabled = true;
      if (cancelBtn) cancelBtn.disabled = true;
      if (previewBtn) previewBtn.disabled = true;
      
      // 更新保存按鈕顯示載入狀態
      saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        正在儲存...
      `;
      
      // 顯示載入提示
      const loadingAlert = document.createElement('div');
      loadingAlert.className = 'alert alert-info alert-dismissible fade show';
      loadingAlert.innerHTML = `
        <strong>正在自動提交到 GitHub...</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      const modalBody = document.getElementById('productFormModal')?.querySelector('.modal-body');
      const productForm = document.getElementById('productForm');
      if (productForm && modalBody) {
        modalBody.insertBefore(loadingAlert, productForm);
      } else if (modalBody) {
        modalBody.insertBefore(loadingAlert, modalBody.firstChild);
      }

      try {
        // 確保 uploadedImages 在全局可用
        window.uploadedImages = uploadedImages;
        
        // 通過 GAS 獲取 Token，前端直接調用 GitHub API
        if (typeof window.deployToGitHubDirect === 'undefined') {
          throw new Error('github-deploy-direct.js 未載入');
        }
        
        const result = await window.deployToGitHubDirect(productData, gasUrl, githubRepo);
        
        // 移除載入提示
        loadingAlert.remove();
        
        // 恢復按鈕狀態
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalSaveBtnHTML;
        if (cancelBtn) cancelBtn.disabled = false;
        if (previewBtn) previewBtn.disabled = false;
        
        // 顯示成功訊息
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success alert-dismissible fade show';
        const commitShaShort = result.commitSha ? result.commitSha.substring(0, 7) : 'N/A';
        const actionText = isEditMode ? '更新' : '新增';
        successAlert.innerHTML = `
          <strong><i class="bi bi-check-circle"></i> 產品已成功${actionText}並提交到 GitHub！</strong>
          <br>
          <small>Commit: <code>${commitShaShort}</code> | 等待 GitHub Pages 自動部署（約 1-2 分鐘）</small>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        const modalBody = document.getElementById('productFormModal')?.querySelector('.modal-body');
        const productForm = document.getElementById('productForm');
        if (productForm && modalBody) {
          modalBody.insertBefore(successAlert, productForm);
        } else if (modalBody) {
          modalBody.insertBefore(successAlert, modalBody.firstChild);
        }
        
        // 重新載入產品列表和詳細資料
        await loadProductsTable();
        await loadProductDetails();
        
        // 3 秒後關閉 modal 並清除表單
        setTimeout(() => {
          hideProductForm();
          if (successAlert.parentNode) {
            successAlert.remove();
          }
        }, 3000);
      } catch (error) {
        // 移除載入提示
        loadingAlert.remove();
        
        // 恢復按鈕狀態
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalSaveBtnHTML;
        if (cancelBtn) cancelBtn.disabled = false;
        if (previewBtn) previewBtn.disabled = false;
        
        // 顯示錯誤訊息
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.innerHTML = `
          <strong><i class="bi bi-exclamation-triangle"></i> GitHub 提交失敗</strong>
          <br>
          <small>${error.message || '未知錯誤'}</small>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        const modalBody = document.getElementById('productFormModal')?.querySelector('.modal-body');
        const productForm = document.getElementById('productForm');
        if (productForm && modalBody) {
          modalBody.insertBefore(errorAlert, productForm);
        } else if (modalBody) {
          modalBody.insertBefore(errorAlert, modalBody.firstChild);
        }
      }
}

// 生成部署說明
function generateDeployInstructions(productData, files) {
  const categoryName = categoryNames[productData.category] || productData.category;
  
  return `# 產品部署說明

## 產品資訊
- **產品 ID**: ${productData.id}
- **產品名稱**: ${productData.name}
- **產品類別**: ${categoryName}

## 部署步驟

### 1. 解壓縮圖片檔案
解壓縮 \`${productData.id}-images.zip\` 到以下路徑：
\`\`\`
assets/img/products/${productData.id}/
\`\`\`

**注意**：如果資料夾不存在，請先創建：
\`\`\`bash
mkdir -p assets/img/products/${productData.id}
\`\`\`

### 2. 更新 product-details.js
打開 \`assets/data/product-details.js\`，找到 \`const productDetails = {\`，在物件中添加：

\`\`\`javascript
${generateProductData(productData)},
\`\`\`

**位置**：可以添加到物件的任何位置，建議按字母順序或分類順序排列。

### 3. 更新 products.js
打開 \`assets/data/products.js\`，找到分類 \`"id": "${productData.category}"\`，在該分類的 \`products\` 陣列中添加：

\`\`\`javascript
${generateProductsJsItem(productData)},
\`\`\`

**位置**：添加到該分類的 \`products\` 陣列中，可以放在陣列的任何位置。

### 4. 提交到 Git 並推送到 GitHub
\`\`\`bash
git add .
git commit -m "新增產品: ${productData.name}"
git push origin main
\`\`\`

**注意**：如果你的主分支是 \`master\`，請使用 \`git push origin master\`

### 5. 等待 GitHub Pages 自動部署
推送後，GitHub Pages 會自動部署，通常需要 1-2 分鐘。

## 驗證
完成後，訪問以下網址確認產品是否正常顯示：
- 產品列表: \`products.html?category=${productData.category}\`
- 產品詳情: \`product.html?id=${productData.id}\`

## 常見問題

### 圖片顯示不出來
- 檢查圖片路徑是否正確
- 確認圖片檔案已正確解壓縮到對應資料夾
- 檢查檔案名稱是否與 JSON 中的路徑一致

### 產品未出現在列表中
- 檢查 \`products.js\` 中的分類 ID 是否正確
- 確認產品資料已正確添加到對應分類的陣列中
- 檢查 JSON 語法是否正確（注意逗號和括號）

### 產品詳情頁面無法載入
- 檢查 \`product-details.js\` 中的產品 ID 是否正確
- 確認產品資料格式是否正確
- 檢查瀏覽器控制台是否有錯誤訊息
`;
}


// 載入產品列表
async function loadProductsTable() {
  const container = document.getElementById('productsTableContainer');
  
  try {
    // 載入 products.js
    const response = await fetch('../assets/data/products.js');
    if (!response.ok) {
      throw new Error('無法載入產品資料');
    }
    
    const text = await response.text();
    
    // 解析 JavaScript 文件（提取 productsData 物件）
    // 使用 eval 或 Function 來執行 JavaScript 代碼
    const func = new Function(text + '; return productsData;');
    const productsData = func();
    
    // 儲存所有產品資料（扁平化結構，方便篩選）
    allProductsData = [];
    if (productsData && productsData.categories) {
      productsData.categories.forEach(category => {
        if (category.products && category.products.length > 0) {
          category.products.forEach(product => {
            allProductsData.push({
              ...product,
              categoryId: category.id,
              categoryName: categoryNames[category.id] || category.name || category.id
            });
          });
        }
      });
    }
    
    // 渲染表格（使用篩選後的資料）
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
  
  // 建立表格
  let tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th style="width: 100px;">縮圖</th>
            <th>產品名稱</th>
            <th>類別</th>
            <th style="width: 100px;">操作</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // 如果有產品，顯示產品列表
  if (productsToShow && productsToShow.length > 0) {
    productsToShow.forEach(product => {
      const thumbnail = product.img || '';
      const productName = product.name || product.id;
      const categoryName = product.categoryName || '';
      
      tableHTML += `
        <tr>
          <td>
            ${thumbnail ? `<img src="../${thumbnail}" alt="${productName}" class="product-thumbnail" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\'%3E%3Crect fill=\'%23ddd\' width=\'80\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3E無圖片%3C/text%3E%3C/svg%3E'">` : '<span class="text-muted">無圖片</span>'}
          </td>
          <td><strong>${productName}</strong></td>
          <td><span class="badge bg-secondary">${categoryName}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="editProduct('${product.id}')" title="編輯">
              <i class="bi bi-pencil"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } else {
    // 如果沒有產品，顯示提示
    tableHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="mt-3 text-muted">${filteredProducts !== null ? '沒有符合篩選條件的產品' : '目前沒有任何產品'}</p>
          ${filteredProducts === null ? `<button class="btn btn-primary" onclick="showProductForm()">
            <i class="bi bi-plus-circle"></i> 新增第一個產品
          </button>` : ''}
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

// 篩選產品
function filterProducts() {
  const searchName = document.getElementById('searchProductName')?.value.trim().toLowerCase() || '';
  const filterCategory = document.getElementById('filterCategory')?.value || '';
  
  let filtered = allProductsData;
  
  // 按名稱篩選
  if (searchName) {
    filtered = filtered.filter(product => {
      const productName = (product.name || product.id || '').toLowerCase();
      return productName.includes(searchName);
    });
  }
  
  // 按類別篩選
  if (filterCategory) {
    filtered = filtered.filter(product => product.categoryId === filterCategory);
  }
  
  // 渲染篩選後的結果
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
  // 如果不是編輯模式，重置表單
  if (!isEditMode) {
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    uploadedImages = [];
    window.uploadedImages = [];
    document.getElementById('specsContainer').innerHTML = '';
    document.getElementById('productId').disabled = false;
  }
  
  // 重置 modal 標題（如果不是編輯模式）
  if (!isEditMode) {
    document.getElementById('productFormModalLabel').innerHTML = 
      '<i class="bi bi-file-earmark-plus"></i> 新增產品';
  }
  
  const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
  modal.show();
  
  // 顯示配置提示（如果有的話）
  const modalBody = document.getElementById('productFormModal')?.querySelector('.modal-body');
  if (modalBody) {
    // 移除舊的配置提示
    const oldConfigAlert = modalBody.querySelector('#githubConfigAlert');
    if (oldConfigAlert) {
      oldConfigAlert.remove();
    }
    
    // 檢查並顯示配置狀態
    if (typeof GITHUB_CONFIG !== 'undefined' && GITHUB_CONFIG.gasUrl && GITHUB_CONFIG.repo) {
      const configAlert = document.createElement('div');
      configAlert.className = 'alert alert-success alert-dismissible fade show';
      configAlert.id = 'githubConfigAlert';
      configAlert.innerHTML = `
        <strong><i class="bi bi-check-circle"></i> 已從 config.js 載入 GitHub 配置（使用 GAS 代理）</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      const productForm = document.getElementById('productForm');
      if (productForm) {
        modalBody.insertBefore(configAlert, productForm);
      } else {
        modalBody.insertBefore(configAlert, modalBody.firstChild);
      }
    } else {
      const warningAlert = document.createElement('div');
      warningAlert.className = 'alert alert-warning alert-dismissible fade show';
      warningAlert.innerHTML = `
        <strong><i class="bi bi-exclamation-triangle"></i> 未配置 GitHub</strong>
        <p class="mb-0">請在 <code>config.js</code> 中配置 gasUrl 和 repo 以使用自動提交功能。</p>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      const productForm = document.getElementById('productForm');
      if (productForm) {
        modalBody.insertBefore(warningAlert, productForm);
      } else {
        modalBody.insertBefore(warningAlert, modalBody.firstChild);
      }
    }
  }
}

// 隱藏產品表單 Modal
function hideProductForm() {
  const modalElement = document.getElementById('productFormModal');
  const modal = bootstrap.Modal.getInstance(modalElement);
  if (modal) {
    modal.hide();
  }
  // 重置表單
  document.getElementById('productForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
  uploadedImages = [];
  window.uploadedImages = [];
  // 清除規格容器
  document.getElementById('specsContainer').innerHTML = '';
  // 清除文件輸入
  const fileInput = document.getElementById('productImages');
  if (fileInput) {
    fileInput.value = '';
  }
  // 恢復產品 ID 欄位（編輯時被禁用）
  document.getElementById('productId').disabled = false;
  // 重置編輯模式
  isEditMode = false;
  editingProductId = null;
}

// 載入產品詳細資料
async function loadProductDetails() {
  try {
    const response = await fetch('../assets/data/product-details.js');
    if (!response.ok) {
      throw new Error('無法載入產品詳細資料');
    }
    
    const text = await response.text();
    const func = new Function(text + '; return productDetails;');
    allProductDetails = func();
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
  
  // 載入產品詳細資料（如果還沒載入）
  if (Object.keys(allProductDetails).length === 0) {
    await loadProductDetails();
  }
  
  // 獲取產品資料
  const productData = allProductDetails[productId];
  
  if (!productData) {
    alert('找不到產品資料，產品 ID: ' + productId);
    isEditMode = false;
    editingProductId = null;
    return;
  }
  
  // 顯示表單
  showProductForm();
  
  // 更新 modal 標題
  document.getElementById('productFormModalLabel').innerHTML = 
    '<i class="bi bi-pencil"></i> 編輯產品';
  
  // 填入表單資料
  document.getElementById('productId').value = productData.id || '';
  document.getElementById('productName').value = productData.name || '';
  document.getElementById('productCategory').value = productData.category || '';
  document.getElementById('productDescription').value = productData.description || '';
  document.getElementById('metaDescription').value = productData.metaDescription || '';
  document.getElementById('keywords').value = productData.keywords || '';
  document.getElementById('videoUrl').value = productData.videoUrl || '';
  
  // 禁用產品 ID 欄位（編輯時不能修改 ID）
  document.getElementById('productId').disabled = true;
  
  // 填入規格
  const specsContainer = document.getElementById('specsContainer');
  specsContainer.innerHTML = '';
  if (productData.specs && productData.specs.length > 0) {
    productData.specs.forEach(spec => {
      addSpec();
      const specItems = specsContainer.querySelectorAll('.spec-item');
      const lastSpec = specItems[specItems.length - 1];
      const labelInput = lastSpec.querySelector('[data-spec-label]');
      const valueInput = lastSpec.querySelector('[data-spec-value]');
      if (labelInput) labelInput.value = spec.label || '';
      if (valueInput) valueInput.value = spec.value || '';
    });
  }
  
  // 顯示現有圖片
  const imagePreview = document.getElementById('imagePreview');
  imagePreview.innerHTML = '';
  uploadedImages = [];
  window.uploadedImages = [];
  
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((imagePath, index) => {
      const imageId = 'img_existing_' + productId + '_' + index;
      const imgDiv = document.createElement('div');
      imgDiv.className = 'image-preview';
      imgDiv.id = imageId;
      imgDiv.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <img src="../${imagePath}" alt="現有圖片 ${index + 1}" style="max-width: 150px; max-height: 150px;" onerror="this.style.display='none'">
            <div class="ms-3">
              <small><strong>現有圖片 ${index + 1}</strong></small>
              <br>
              <small class="text-muted">${imagePath}</small>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger ms-3"
            onclick="removeImage('${imageId}')"
            title="刪除圖片"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      imagePreview.appendChild(imgDiv);
      
      // 儲存現有圖片資訊（用於更新時保留）
      uploadedImages.push({
        id: imageId,
        name: imagePath.split('/').pop(),
        data: null, // 現有圖片不需要 base64
        type: 'image/jpeg',
        existing: true,
        path: imagePath
      });
      window.uploadedImages = uploadedImages;
    });
  }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async function () {
  // 如果已登入，載入產品列表和詳細資料
  const isAuthenticated = sessionStorage.getItem('admin_authenticated') === 'true';
  if (isAuthenticated) {
    await loadProductsTable();
    await loadProductDetails();
  }
  
  // 監聽 modal 關閉事件，自動重置表單
  const productFormModal = document.getElementById('productFormModal');
  if (productFormModal) {
    productFormModal.addEventListener('hidden.bs.modal', function () {
      // 重置表單
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      uploadedImages = [];
      window.uploadedImages = [];
      // 清除規格容器
      document.getElementById('specsContainer').innerHTML = '';
      // 清除文件輸入
      const fileInput = document.getElementById('productImages');
      if (fileInput) {
        fileInput.value = '';
      }
      // 恢復產品 ID 欄位（編輯時被禁用）
      document.getElementById('productId').disabled = false;
      // 重置編輯模式
      isEditMode = false;
      editingProductId = null;
      // 移除所有 alert（除了配置提示）
      const modalBody = productFormModal.querySelector('.modal-body');
      if (modalBody) {
        const alerts = modalBody.querySelectorAll('.alert:not(#githubConfigAlert)');
        alerts.forEach(alert => alert.remove());
      }
      // 重置 modal 標題
      document.getElementById('productFormModalLabel').innerHTML = 
        '<i class="bi bi-file-earmark-plus"></i> 新增產品';
    });
  }
  
  // 檢查 config.js 是否已配置（配置提示會在 modal 打開時顯示）
  // 這裡不需要顯示，因為 modal 預設是隱藏的
});

