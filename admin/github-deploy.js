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

    // 統一的 commit message
    const commitMessage = `新增產品: ${productData.name}`;
    
    // 準備所有要更新的檔案
    const filesToUpdate = [];

    // 1. 準備 product-details.js 更新
    const productDetailsContent = await window.prepareFileContent(
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
    const productsContent = await window.prepareFileContent(
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
        
        // 將 base64 轉換為 binary
        const base64Data = img.data.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let j = 0; j < binaryData.length; j++) {
          bytes[j] = binaryData.charCodeAt(j);
        }

        // 轉換為 base64
        const binString = Array.from(bytes, (byte) =>
          String.fromCodePoint(byte)
        ).join('');
        const base64Content = btoa(binString);

        filesToUpdate.push({
          path: path,
          content: base64Content,
          sha: null, // 新檔案沒有 sha
          isText: false // 圖片是二進制檔案
        });
      }
    }

    // 4. 使用 Git Data API 在單一 commit 中提交所有檔案
    await window.commitMultipleFiles(
      token,
      owner,
      repoName,
      filesToUpdate,
      commitMessage
    );

    return { success: true, message: '產品已成功提交到 GitHub！' };
  } catch (error) {
    console.error('GitHub 提交失敗:', error);
    throw error;
  }
};

// 準備檔案內容（不直接上傳）
window.prepareFileContent = async function(token, owner, repo, path, productData, type) {
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

  // 返回準備好的內容和 sha（不直接上傳）
  const content = btoa(unescape(encodeURIComponent(newContent)));
  
  return {
    content: content,
    sha: sha
  };
};

// 獲取檔案的最新 SHA
window.getFileSHA = async function(token, owner, repo, path) {
  const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const getResponse = await fetch(getFileUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (getResponse.ok) {
    const fileData = await getResponse.json();
    return fileData.sha;
  } else if (getResponse.status === 404) {
    // 檔案不存在，返回 null
    return null;
  } else {
    throw new Error(`無法讀取檔案 SHA (HTTP ${getResponse.status})`);
  }
};

// 直接更新檔案到 GitHub（暴露到全局，帶重試機制）
window.updateFileOnGitHubDirect = async function(token, owner, repo, path, content, sha, message, retryCount = 0) {
  const maxRetries = 2; // 最多重試 2 次
  const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  const requestBody = {
    message: message,
    content: content
  };
  
  // 如果是更新現有檔案，需要提供 sha
  if (sha) {
    requestBody.sha = sha;
  }
  
  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = `更新失敗 (HTTP ${response.status})`;
    let shouldRetry = false;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      
      // 檢查是否為 SHA 不匹配錯誤
      if (errorData.message && (
        errorData.message.includes('sha') || 
        errorData.message.includes('does not match') ||
        errorData.message.includes('is at') ||
        response.status === 409 // 409 Conflict 通常表示 SHA 不匹配
      )) {
        // SHA 不匹配，嘗試重新獲取最新的 SHA 並重試
        if (retryCount < maxRetries && sha) {
          console.log(`SHA 不匹配，重新獲取最新 SHA 並重試 (${retryCount + 1}/${maxRetries})...`);
          const newSHA = await window.getFileSHA(token, owner, repo, path);
          if (newSHA) {
            // 等待一小段時間後重試
            await new Promise(resolve => setTimeout(resolve, 500));
            return await window.updateFileOnGitHubDirect(token, owner, repo, path, content, newSHA, message, retryCount + 1);
          }
        }
        errorMessage = `檔案已被其他人修改，請重新整理頁面後再試。\n原始錯誤: ${errorData.message}`;
      } else if (errorData.errors && errorData.errors.length > 0) {
        errorMessage += ': ' + errorData.errors.map(e => e.message).join(', ');
      }
    } catch (e) {
      errorMessage = `${errorMessage}: ${await response.text()}`;
    }
    throw new Error(`${path}: ${errorMessage}`);
  }

  return await response.json();
};

// 使用 Git Data API 在單一 commit 中提交多個檔案
window.commitMultipleFiles = async function(token, owner, repo, files, message, branch = 'main') {
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

// 上傳檔案到 GitHub（保留作為備用，現在使用 commitMultipleFiles）
window.uploadFileToGitHub = async function(token, owner, repo, path, content, message) {
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

  return await window.updateFileOnGitHubDirect(token, owner, repo, path, base64Content, null, message);
};

