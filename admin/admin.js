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

    // 嘗試使用 GitHub API 自動提交（優先從 config.js 讀取，否則從表單讀取）
    let githubToken = '';
    let githubRepo = '';
    
    // 優先從 config.js 讀取
    if (typeof GITHUB_CONFIG !== 'undefined') {
      githubToken = GITHUB_CONFIG.token || '';
      githubRepo = GITHUB_CONFIG.repo || '';
    }
    
    // 如果 config.js 沒有，從表單讀取
    if (!githubToken) {
      githubToken = document.getElementById('githubToken').value.trim();
    }
    if (!githubRepo) {
      githubRepo = document.getElementById('githubRepo').value.trim();
    }

    if (githubToken && githubRepo) {
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
        
        const result = await window.deployToGitHub(productData, githubToken, githubRepo);
        
        // 移除載入提示
        loadingAlert.remove();
        
        // 顯示成功訊息
        alert(
          '✅ 產品已成功自動提交到 GitHub！\n\n' +
          '📋 下一步：\n' +
          '1. 等待 GitHub Pages 自動部署（約 1-2 分鐘）\n' +
          '2. 訪問產品頁面確認：\n' +
          `   - 產品列表: products.html?category=${productData.category}\n` +
          `   - 產品詳情: product.html?id=${productData.id}`
        );
        
        // 成功時不下載檔案
      } catch (error) {
        // 移除載入提示
        loadingAlert.remove();
        
        console.error('GitHub 自動提交失敗:', error);
        
        // 顯示詳細錯誤訊息
        let errorMessage = error.message || '未知錯誤';
        
        // 如果錯誤包含更多資訊，顯示出來
        if (error.stack) {
          console.error('完整錯誤堆疊:', error.stack);
        }
        
        // 分析錯誤原因並給出建議
        let suggestion = '';
        if (errorMessage.includes('Resource not accessible') || errorMessage.includes('Bad credentials')) {
          suggestion = '\n\n💡 可能的原因：\n' +
            '1. Token 權限不足，請確認 Token 有 "repo" 權限\n' +
            '2. 如果使用 fine-grained token，請確認已授予對應 Repository 的 "Contents: Read and write" 權限\n' +
            '3. Token 可能已過期，請重新生成\n' +
            '4. Repository 名稱是否正確？';
        } else if (errorMessage.includes('Not Found')) {
          suggestion = '\n\n💡 可能的原因：\n' +
            '1. Repository 不存在或名稱錯誤\n' +
            '2. Token 沒有訪問該 Repository 的權限';
        } else if (errorMessage.includes('sha')) {
          suggestion = '\n\n💡 可能的原因：\n' +
            '1. 檔案已被其他人修改，請重新整理後再試';
        }
        
        alert(
          '⚠️ GitHub 自動提交失敗\n\n' +
          '錯誤訊息：' + errorMessage + suggestion
        );
      }
    } else {
      // 沒有配置 GitHub，使用手動模式
      downloadFiles(files);
      
      setTimeout(() => {
        alert(
          '✅ 產品資料已生成並下載完成！\n\n' +
          '📋 下一步（手動部署）：\n' +
          '1. 解壓縮圖片檔案到對應資料夾\n' +
          '2. 按照 DEPLOY_INSTRUCTIONS.md 更新 JSON 檔案\n' +
          '3. 執行 git add . && git commit -m "新增產品" && git push\n\n' +
          '💡 提示：如果想使用自動提交，請在上方填入 GitHub Token 和 Repository。'
        );
      }, 1000);
    }
  } catch (error) {
    console.error('儲存失敗:', error);
    alert('儲存失敗: ' + error.message);
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
document.addEventListener('DOMContentLoaded', function () {
  console.log('產品管理後台已載入');
  
  // 優先從 config.js 讀取配置
  let githubToken = '';
  let githubRepo = '';
  
  if (typeof GITHUB_CONFIG !== 'undefined') {
    githubToken = GITHUB_CONFIG.token || '';
    githubRepo = GITHUB_CONFIG.repo || '';
  }
  
  // 如果 config.js 沒有配置，從 localStorage 讀取
  if (!githubToken) {
    githubToken = localStorage.getItem('githubToken') || '';
  }
  if (!githubRepo) {
    githubRepo = localStorage.getItem('githubRepo') || '';
  }
  
  // 填入表單
  if (githubToken) {
    document.getElementById('githubToken').value = githubToken;
    // 如果從 config.js 讀取，顯示為已配置（但不顯示實際值）
    if (typeof GITHUB_CONFIG !== 'undefined' && GITHUB_CONFIG.token) {
      document.getElementById('githubToken').type = 'password';
      document.getElementById('githubToken').placeholder = '已從 config.js 載入';
      document.getElementById('githubToken').readOnly = true;
      document.getElementById('githubToken').title = 'Token 已從 config.js 載入，如需修改請編輯 config.js';
    }
  }
  
  if (githubRepo) {
    document.getElementById('githubRepo').value = githubRepo;
    if (typeof GITHUB_CONFIG !== 'undefined' && GITHUB_CONFIG.repo) {
      document.getElementById('githubRepo').readOnly = true;
      document.getElementById('githubRepo').title = 'Repository 已從 config.js 載入，如需修改請編輯 config.js';
    }
  }

  // 如果使用 config.js，顯示提示
  if (typeof GITHUB_CONFIG !== 'undefined' && (GITHUB_CONFIG.token || GITHUB_CONFIG.repo)) {
    const configAlert = document.createElement('div');
    configAlert.className = 'alert alert-success alert-dismissible fade show';
    configAlert.innerHTML = `
      <strong><i class="bi bi-check-circle"></i> 已從 config.js 載入 GitHub 配置</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const githubConfig = document.querySelector('.github-config');
    githubConfig.insertBefore(configAlert, githubConfig.firstChild);
  }

  // 儲存 GitHub 配置到 localStorage（僅當手動輸入時）
  document.getElementById('githubToken').addEventListener('change', function () {
    if (!this.readOnly) {
      localStorage.setItem('githubToken', this.value);
    }
  });
  document.getElementById('githubRepo').addEventListener('change', function () {
    if (!this.readOnly) {
      localStorage.setItem('githubRepo', this.value);
    }
  });
});

