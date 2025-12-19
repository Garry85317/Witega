/**
 * 直接调用 GitHub API 部署功能
 * ⚠️ 注意：此方案会通过 GAS 获取 token，然后在前端直接调用 GitHub API
 * Token 会在浏览器中暴露，安全性低于 GAS 代理方案
 */

// 从 GAS 获取 token
async function getTokenFromGAS(gasUrl) {
  const requestData = {
    action: 'getToken'
  };
  const dataParam = encodeURIComponent(JSON.stringify(requestData));
  const response = await fetch(`${gasUrl}?data=${dataParam}`, {
    method: 'GET',
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`获取 Token 失败 (HTTP ${response.status})`);
  }

  const text = await response.text();
  const result = JSON.parse(text);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  if (!result.token) {
    throw new Error('GAS 未返回 Token');
  }
  
  return result.token;
}

// 直接通过 GitHub API 提交多个文件（单个 commit）
// 使用与 github-deploy.js 相同的逻辑，但从 GAS 获取 token
window.deployToGitHubDirect = async function(productData, gasUrl, repo) {
  try {
    // 1. 从 GAS 获取 token
    const token = await getTokenFromGAS(gasUrl);
    
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Repository 格式錯誤，應為 username/repo');
    }

    // 統一的 commit message
    const commitMessage = `新增產品: ${productData.name}`;
    
    // 準備所有要更新的檔案
    const filesToUpdate = [];

    // 1. 準備 product-details.js 更新
    const productDetailsContent = await window.prepareFileContentForGitHub(
      token,
      owner,
      repoName,
      'assets/data/product-details.js',
      productData,
      'product-details'
    );
    filesToUpdate.push({
      path: 'assets/data/product-details.js',
      content: productDetailsContent.content,
      sha: productDetailsContent.sha,
      isText: true
    });

    // 2. 準備 products.js 更新
    const productsContent = await window.prepareFileContentForGitHub(
      token,
      owner,
      repoName,
      'assets/data/products.js',
      productData,
      'products'
    );
    filesToUpdate.push({
      path: 'assets/data/products.js',
      content: productsContent.content,
      sha: productsContent.sha,
      isText: true
    });

    // 3. 準備圖片上傳
    if (window.uploadedImages && window.uploadedImages.length > 0) {
      for (let i = 0; i < window.uploadedImages.length; i++) {
        const img = window.uploadedImages[i];
        const ext = img.name.split('.').pop().toLowerCase();
        const path = `assets/img/products/${productData.id}/${productData.id}-${i + 1}.${ext}`;
        
        // 直接使用 base64 數據（img.data 格式為 "data:image/...;base64,xxxxx"）
        // 提取 base64 部分
        let base64Content;
        if (img.data.includes(',')) {
          base64Content = img.data.split(',')[1];
        } else {
          // 如果已經是純 base64，直接使用
          base64Content = img.data;
        }

        filesToUpdate.push({
          path: path,
          content: base64Content,
          sha: null, // 新檔案沒有 sha
          isText: false // 圖片是二進制檔案
        });
      }
    }

    // 4. 使用 Git Data API 在單一 commit 中提交所有檔案
    const result = await window.commitMultipleFilesForGitHub(
      token,
      owner,
      repoName,
      filesToUpdate,
      commitMessage
    );

    return { 
      success: true, 
      message: '產品已成功提交到 GitHub！',
      commitSha: result.commitSha
    };
  } catch (error) {
    throw error;
  }
};

// 準備檔案內容（與 github-deploy.js 相同的邏輯）
window.prepareFileContentForGitHub = async function(token, owner, repo, path, productData, type) {
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
    // 使用 TextDecoder 正確解碼 UTF-8（支持中文）
    try {
      const base64Data = fileData.content.replace(/\s/g, '');
      const binaryString = atob(base64Data);
      // 將 binary string 轉換為 Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // 使用 TextDecoder 解碼 UTF-8
      currentContent = new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      // 如果解碼失敗，嘗試直接使用 atob（兼容舊方法）
      try {
        currentContent = atob(fileData.content.replace(/\s/g, ''));
      } catch (e2) {
        currentContent = fileData.content || '';
      }
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

  // 返回準備好的內容和 sha（不直接上傳）
  // 使用正確的 UTF-8 編碼方式（支持中文）
  // 使用與 github-deploy.js 相同的方法：btoa(unescape(encodeURIComponent()))
  // 這是處理 UTF-8 中文字符的標準方法
  const content = btoa(unescape(encodeURIComponent(newContent)));
  
  return {
    content: content,
    sha: sha
  };
};

// 使用 Git Data API 在單一 commit 中提交多個檔案（與 github-deploy.js 相同的邏輯）
window.commitMultipleFilesForGitHub = async function(token, owner, repo, files, message, branch = 'main') {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. 獲取當前分支的 ref
  let refResponse = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
  if (!refResponse.ok && refResponse.status === 404) {
    // 嘗試 master 分支
    branch = 'master';
    refResponse = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
  }
  
  if (!refResponse.ok) {
    throw new Error(`無法獲取分支 ref (HTTP ${refResponse.status})`);
  }
  
  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // 2. 獲取最新的 commit
  const commitResponse = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
  if (!commitResponse.ok) {
    throw new Error(`無法獲取 commit (HTTP ${commitResponse.status})`);
  }
  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. 創建所有檔案的 blob
  const blobPromises = files.map(async (file) => {
    const blobResponse = await fetch(`${baseUrl}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: file.content,
        encoding: 'base64'
      })
    });
    
    if (!blobResponse.ok) {
      throw new Error(`無法創建 blob for ${file.path} (HTTP ${blobResponse.status})`);
    }
    
    const blobData = await blobResponse.json();
    return {
      path: file.path,
      mode: '100644', // 普通檔案
      type: 'blob',
      sha: blobData.sha
    };
  });

  const treeItems = await Promise.all(blobPromises);

  // 5. 創建新的 tree（使用 base_tree，GitHub 會自動處理目錄結構和現有檔案）
  const newTreeResponse = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha, // 從現有 tree 開始
      tree: treeItems // 只提供要更新/添加的檔案，GitHub 會自動處理其餘部分
    })
  });

  if (!newTreeResponse.ok) {
    const errorData = await newTreeResponse.json();
    throw new Error(`無法創建 tree (HTTP ${newTreeResponse.status}): ${JSON.stringify(errorData)}`);
  }
  
  const newTreeData = await newTreeResponse.json();
  const newTreeSha = newTreeData.sha;

  // 7. 創建新的 commit
  const newCommitResponse = await fetch(`${baseUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: message,
      tree: newTreeSha,
      parents: [latestCommitSha]
    })
  });

  if (!newCommitResponse.ok) {
    const errorData = await newCommitResponse.json();
    throw new Error(`無法創建 commit (HTTP ${newCommitResponse.status}): ${JSON.stringify(errorData)}`);
  }
  
  const newCommitData = await newCommitResponse.json();
  const newCommitSha = newCommitData.sha;

  // 8. 更新分支 ref
  const updateRefResponse = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitSha
    })
  });

  if (!updateRefResponse.ok) {
    const errorData = await updateRefResponse.json();
    throw new Error(`無法更新 ref (HTTP ${updateRefResponse.status}): ${JSON.stringify(errorData)}`);
  }

  return { success: true, commitSha: newCommitSha };
};

