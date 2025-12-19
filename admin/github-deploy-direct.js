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
window.deployToGitHubDirect = async function(productData, gasUrl, repo) {
  try {
    // 1. 从 GAS 获取 token
    const token = await getTokenFromGAS(gasUrl);
    
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Repository 格式錯誤，應為 username/repo');
    }

    const baseUrl = `https://api.github.com/repos/${owner}/${repoName}`;
    const commitMessage = `新增產品: ${productData.name}`;
    
    // 2. 檢測分支名稱（main 或 master）
    let branch = 'main';
    let refUrl = `${baseUrl}/git/ref/heads/${branch}`;
    let refRes = await fetch(refUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    
    if (refRes.status === 404) {
      branch = 'master';
    }
    
    // 3. 準備所有要更新的檔案
    const filesToUpdate = [];

    // 3.1 準備 product-details.js 更新
    const productDetailsContent = await window.prepareFileContentForGitHub(
      baseUrl,
      token,
      'assets/data/product-details.js',
      productData,
      'product-details',
      branch
    );
    filesToUpdate.push({
      path: 'assets/data/product-details.js',
      content: productDetailsContent.content,
      sha: productDetailsContent.sha
    });

    // 3.2 準備 products.js 更新
    const productsContent = await window.prepareFileContentForGitHub(
      baseUrl,
      token,
      'assets/data/products.js',
      productData,
      'products',
      branch
    );
    filesToUpdate.push({
      path: 'assets/data/products.js',
      content: productsContent.content,
      sha: productsContent.sha
    });

    // 2.3 準備圖片上傳
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
          sha: null // 新檔案沒有 sha
        });
      }
    }

    // 4. 直接調用 GitHub API 提交所有檔案（單一 commit）
    // 4.1 獲取當前分支的 ref（使用已檢測的分支名稱）
    refUrl = `${baseUrl}/git/ref/heads/${branch}`;
    refRes = await fetch(refUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });

    if (refRes.status !== 200) {
      const errorData = await refRes.json();
      throw new Error(`無法獲取分支 ref: ${errorData.message || `HTTP ${refRes.status}`}`);
    }

    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitUrl = `${baseUrl}/git/commits/${latestCommitSha}`;
    const commitRes = await fetch(commitUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });

    if (commitRes.status !== 200) {
      const errorData = await commitRes.json();
      throw new Error(`無法獲取 commit: ${errorData.message || `HTTP ${commitRes.status}`}`);
    }

    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 4.3 創建所有文件的 blob
    const treeItems = [];
    for (let i = 0; i < filesToUpdate.length; i++) {
      const file = filesToUpdate[i];
      const blobUrl = `${baseUrl}/git/blobs`;
      const blobRes = await fetch(blobUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: file.content,
          encoding: 'base64'
        })
      });

      if (blobRes.status !== 201) {
        const errorData = await blobRes.json();
        throw new Error(`無法創建 blob for ${file.path}: ${errorData.message || `HTTP ${blobRes.status}`}`);
      }

      const blobData = await blobRes.json();
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    // 4.4 創建新的 tree
    const treeUrl = `${baseUrl}/git/trees`;
    const treeRes = await fetch(treeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });

    if (treeRes.status !== 201) {
      const errorData = await treeRes.json();
      throw new Error(`無法創建 tree: ${errorData.message || `HTTP ${treeRes.status}`}`);
    }

    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    // 4.5 創建新的 commit
    const newCommitUrl = `${baseUrl}/git/commits`;
    const newCommitRes = await fetch(newCommitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha]
      })
    });

    if (newCommitRes.status !== 201) {
      const errorData = await newCommitRes.json();
      throw new Error(`無法創建 commit: ${errorData.message || `HTTP ${newCommitRes.status}`}`);
    }

    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // 4.6 更新分支 ref（使用檢測到的分支名稱，這會自動 push 到 GitHub）
    const updateRefUrl = `${baseUrl}/git/refs/heads/${branch}`;
    const updateRefRes = await fetch(updateRefUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: newCommitSha
      })
    });

    if (updateRefRes.status !== 200) {
      const errorData = await updateRefRes.json();
      throw new Error(`無法更新 ref: ${errorData.message || `HTTP ${updateRefRes.status}`}`);
    }

    return { success: true, message: '產品已成功提交到 GitHub！' };
  } catch (error) {
    throw error;
  }
};

// 通過 GitHub API 獲取檔案內容
window.prepareFileContentForGitHub = async function(baseUrl, token, path, productData, type, branch = 'main') {
  // 先通過 GitHub API 獲取現有檔案內容
  const getUrl = `${baseUrl}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const getResponse = await fetch(getUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    }
  });

  let sha = null;
  let currentContent = '';

  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
    // 解碼 base64 內容
    currentContent = atob(fileData.content.replace(/\s/g, ''));
  } else if (getResponse.status !== 404) {
    const errorData = await getResponse.json();
    throw new Error(errorData.message || `無法讀取檔案 (HTTP ${getResponse.status})`);
  }

  // 生成新內容（與原來的邏輯相同）
  let newContent = '';
  if (type === 'product-details') {
    const productItem = `  "${productData.id}": ${JSON.stringify(productData, null, 4)}`;
    
    if (currentContent.includes('const productDetails = {')) {
      const lastProductRegex = /("[\w-]+":\s*\{[^}]*\}),?\s*(\n\s*\};\s*)$/s;
      const match = currentContent.match(lastProductRegex);
      
      if (match) {
        newContent = currentContent.replace(
          lastProductRegex,
          `$1,\n${productItem}$2`
        );
      } else {
        newContent = currentContent.replace(
          'const productDetails = {',
          `const productDetails = {\n${productItem},`
        );
      }
    } else {
      newContent = `const productDetails = {\n${productItem}\n};`;
    }
  } else if (type === 'products') {
    const categoryId = productData.category;
    const firstImage = productData.images[0] || '';
    const productItem = `        {
          "id": "${productData.id}",
          "name": "${productData.name}",
          "img": "${firstImage}",
          "url": "product.html?id=${productData.id}"
        }`;

    if (currentContent.includes(`"${categoryId}":`)) {
      // 找到對應分類的陣列，在最後一個產品後添加
      const categoryRegex = new RegExp(
        `("${categoryId}":\\s*\\[)([^\\]]*)(\\])`,
        's'
      );
      const match = currentContent.match(categoryRegex);
      
      if (match) {
        const existingProducts = match[2].trim();
        if (existingProducts) {
          newContent = currentContent.replace(
            categoryRegex,
            `$1${existingProducts},\n${productItem}\n      $3`
          );
        } else {
          newContent = currentContent.replace(
            categoryRegex,
            `$1\n${productItem}\n      $3`
          );
        }
      } else {
        throw new Error(`無法找到分類 ${categoryId} 的位置`);
      }
    } else {
      throw new Error(`無法找到分類 ${categoryId}，請確認 products.js 格式正確`);
    }
  }

  // 返回準備好的內容和 sha
  const content = btoa(unescape(encodeURIComponent(newContent)));
  
  return {
    content: content,
    sha: sha
  };
};

