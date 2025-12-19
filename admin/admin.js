/**
 * 產品管理後台 JavaScript
 */

// 儲存上傳的圖片（暴露到全局以便 GitHub 部署使用）
let uploadedImages = [];
window.uploadedImages = uploadedImages;

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
  preview.innerHTML = '';

  uploadedImages = [];
  window.uploadedImages = uploadedImages; // 同步到全局

  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement('div');
        img.className = 'image-preview';
        img.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${e.target.result}" alt="預覽 ${index + 1}" style="max-width: 150px; max-height: 150px;" />
            <div class="ms-3">
              <small>${file.name}</small>
            </div>
          </div>
        `;
        preview.appendChild(img);

        // 儲存圖片資料
        const imageData = {
          name: file.name,
          data: e.target.result,
          type: file.type,
        };
        uploadedImages.push(imageData);
        window.uploadedImages = uploadedImages; // 同步到全局
      };
      reader.readAsDataURL(file);
    }
  });
}

// 收集表單資料
function collectFormData() {
  const productId = document.getElementById('productId').value.trim();
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
  const images = uploadedImages.map((img, index) => {
    // 根據分類決定圖片路徑
    const imagePath = `assets/img/products/${productId}/${productId}-${index + 1}.${getFileExtension(img.name)}`;
    return imagePath;
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

// 下載檔案
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

  // 驗證必填欄位
  if (!productData.id || !productData.name || !productData.category) {
    alert('請填寫所有必填欄位');
    return;
  }

  if (productData.images.length === 0) {
    alert('請至少上傳一張產品圖片');
    return;
  }

  try {
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
      return;
    }

    // 驗證配置
    if (!gasUrl) {
      return;
    }

    if (!githubRepo) {
      return;
    }

    // 使用 GAS 代理或直接調用 GitHub API
    if (gasUrl && githubRepo) {
      // 顯示載入提示
      const loadingAlert = document.createElement('div');
      loadingAlert.className = 'alert alert-info alert-dismissible fade show';
      loadingAlert.innerHTML = `
        <strong>正在自動提交到 GitHub...</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      document.querySelector('.card-body').insertBefore(loadingAlert, document.querySelector('form'));

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
      } catch (error) {
        // 移除載入提示
        loadingAlert.remove();
      }
    } else {
      // 沒有配置 GitHub，使用手動模式
      downloadFiles(files);
    }
  } catch (error) {
    // 錯誤已通過 throw 向上傳遞
  }
}

// 下載檔案函數
function downloadFiles(files) {
  // 逐一下載檔案（避免瀏覽器阻止多個下載）
  let downloadIndex = 0;
  function downloadNext() {
    if (downloadIndex >= files.length) {
      return;
    }

    const file = files[downloadIndex];
    setTimeout(() => {
      if (file.blob) {
        // 下載 ZIP 檔案
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // 下載文字檔案
        downloadFile(file.content, file.name, 'text/plain');
      }
      downloadIndex++;
      downloadNext();
    }, 500); // 延遲 500ms 避免瀏覽器阻止
  }
  downloadNext();
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


// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async function () {
  
  // 檢查 config.js 是否已配置
  if (typeof GITHUB_CONFIG !== 'undefined' && GITHUB_CONFIG.gasUrl && GITHUB_CONFIG.repo) {
    // 顯示成功提示
    const alertContainer = document.querySelector('.card-body');
    if (alertContainer) {
      const configAlert = document.createElement('div');
      configAlert.className = 'alert alert-success alert-dismissible fade show';
      configAlert.id = 'githubConfigAlert';
      configAlert.innerHTML = `
        <strong><i class="bi bi-check-circle"></i> 已從 config.js 載入 GitHub 配置（使用 GAS 代理）</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      const infoAlert = document.querySelector('.alert-info');
      if (infoAlert) {
        infoAlert.insertAdjacentElement('afterend', configAlert);
      } else {
        alertContainer.insertBefore(configAlert, alertContainer.firstChild);
      }
      
    }
  } else {
    // 顯示未配置提示
    const alertContainer = document.querySelector('.card-body');
    if (alertContainer) {
      const warningAlert = document.createElement('div');
      warningAlert.className = 'alert alert-warning alert-dismissible fade show';
      warningAlert.innerHTML = `
        <strong><i class="bi bi-exclamation-triangle"></i> 未配置 GitHub</strong>
        <p class="mb-0">請在 <code>config.js</code> 中配置 gasUrl 和 repo 以使用自動提交功能。</p>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      const infoAlert = document.querySelector('.alert-info');
      if (infoAlert) {
        infoAlert.insertAdjacentElement('afterend', warningAlert);
      } else {
        alertContainer.insertBefore(warningAlert, alertContainer.firstChild);
      }
    }
  }
});

