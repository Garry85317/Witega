/**
 * GitHub API 自動提交功能
 * 需要 GitHub Personal Access Token
 */

// 將函數暴露到全局作用域
window.deployToGitHub = async function(productData, token, repo) {
  try {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Repository 格式錯誤，應為 username/repo');
    }

    // 1. 更新 product-details.js
    await window.updateFileOnGitHub(
      token,
      owner,
      repoName,
      'assets/data/product-details.js',
      productData,
      'product-details'
    );

    // 2. 更新 products.js
    await window.updateFileOnGitHub(
      token,
      owner,
      repoName,
      'assets/data/products.js',
      productData,
      'products'
    );

    // 3. 上傳圖片
    if (window.uploadedImages && window.uploadedImages.length > 0) {
      for (let i = 0; i < window.uploadedImages.length; i++) {
        const img = window.uploadedImages[i];
        const ext = img.name.split('.').pop().toLowerCase();
        const path = `assets/img/products/${productData.id}/${productData.id}-${i + 1}.${ext}`;
        
        // 將 base64 轉換為 binary
        const base64Data = img.data.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
          bytes[j] = binaryData.charCodeAt(j);
        }

        await window.uploadFileToGitHub(
          token,
          owner,
          repoName,
          path,
          bytes,
          `新增產品圖片: ${productData.name}`
        );
      }
    }

    return { success: true, message: '產品已成功提交到 GitHub！' };
  } catch (error) {
    console.error('GitHub 提交失敗:', error);
    throw error;
  }
};

// 更新檔案到 GitHub（暴露到全局）
window.updateFileOnGitHub = async function(token, owner, repo, path, productData, type) {
  // 先獲取現有檔案內容
  const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const getResponse = await fetch(getFileUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  let sha = null;
  let currentContent = '';

  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
    // 正確解碼 base64 內容（GitHub API 返回的 content 是 base64 編碼的）
    try {
      currentContent = atob(fileData.content.replace(/\s/g, ''));
    } catch (e) {
      // 如果解碼失敗，嘗試直接使用
      currentContent = fileData.content || '';
    }
  } else if (getResponse.status === 404) {
    // 檔案不存在，創建新檔案
    currentContent = '';
  } else {
    let errorMessage = `無法讀取檔案 (HTTP ${getResponse.status})`;
    try {
      const errorData = await getResponse.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      errorMessage = `${errorMessage}: ${await getResponse.text()}`;
    }
    throw new Error(errorMessage);
  }

  // 生成新內容
  let newContent = '';
  if (type === 'product-details') {
    // 在 productDetails 物件中添加新產品
    const productItem = `  "${productData.id}": ${JSON.stringify(productData, null, 4)}`;
    
    if (currentContent.includes('const productDetails = {')) {
      // 找到最後一個產品項目的位置（更精確的匹配）
      const lastProductRegex = /("[\w-]+":\s*\{[^}]*\}),?\s*(\n\s*\};\s*)$/s;
      const match = currentContent.match(lastProductRegex);
      
      if (match) {
        // 在最後一個產品後添加新產品
        newContent = currentContent.replace(
          lastProductRegex,
          `$1,\n${productItem}$2`
        );
      } else {
        // 在 productDetails 物件中添加
        newContent = currentContent.replace(
          'const productDetails = {',
          `const productDetails = {\n${productItem},`
        );
      }
    } else {
      // 如果檔案格式不對，創建新格式
      newContent = `const productDetails = {\n${productItem}\n};`;
    }
  } else if (type === 'products') {
    // 在對應分類的 products 陣列中添加新產品
    const categoryId = productData.category;
    const firstImage = productData.images[0] || '';
    const productItem = `        {
          "id": "${productData.id}",
          "name": "${productData.name}",
          "img": "${firstImage}",
          "url": "product.html?id=${productData.id}"
        }`;
    
    // 找到對應分類（更精確的匹配）
    const categoryRegex = new RegExp(
      `("id":\\s*"${categoryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*"products":\\s*\\[)([^\\]]*)(\\])`,
      's'
    );
    const match = currentContent.match(categoryRegex);
    
    if (match) {
      const productsArray = match[2].trim();
      const newProductsArray = productsArray
        ? productsArray + ',\n' + productItem
        : productItem;
      newContent = currentContent.replace(
        categoryRegex,
        `$1\n${newProductsArray}\n      $3`
      );
    } else {
      throw new Error(`找不到分類 ${categoryId}，請確認分類 ID 是否正確`);
    }
  }

  // 上傳更新
  const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const content = btoa(unescape(encodeURIComponent(newContent)));
  
  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `新增產品: ${productData.name}`,
      content: content,
      sha: sha,
    }),
  });

  if (!response.ok) {
    let errorMessage = `更新失敗 (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage += ': ' + errorData.errors.map(e => e.message).join(', ');
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${await response.text()}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

// 上傳檔案到 GitHub（暴露到全局）
window.uploadFileToGitHub = async function(token, owner, repo, path, content, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  // 將 binary 轉換為 base64
  let base64Content = '';
  if (content instanceof Uint8Array) {
    const binString = Array.from(content, (byte) =>
      String.fromCodePoint(byte)
    ).join('');
    base64Content = btoa(binString);
  } else {
    base64Content = content;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      content: base64Content,
    }),
  });

  if (!response.ok) {
    let errorMessage = `上傳失敗 (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage += ': ' + errorData.errors.map(e => e.message).join(', ');
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${await response.text()}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

