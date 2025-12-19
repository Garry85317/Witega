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
window.deployToGitHubDirect = async function(productData, gasUrl, repo, isEditMode = false) {
  // 注意：gasUrl 用於獲取 token，但 GitHub API 調用仍需要直接進行
  // 由於 CORS 限制，刪除文件的操作需要特殊處理
  try {
    // 1. 从 GAS 获取 token
    const token = await getTokenFromGAS(gasUrl);
    
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      throw new Error('Repository 格式錯誤，應為 username/repo');
    }

    // 根據模式設置 commit message
    const commitMessage = isEditMode 
      ? `編輯產品: ${productData.name}` 
      : `新增產品: ${productData.name}`;
    
    // 準備所有要更新的檔案
    const filesToUpdate = [];

    // 1. 準備 product-details.js 更新
    const productDetailsContent = await window.prepareFileContentForGitHub(
      token,
      owner,
      repoName,
      'assets/data/product-details.js',
      productData,
      'product-details',
      isEditMode
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
      'products',
      isEditMode
    );
    filesToUpdate.push({
      path: 'assets/data/products.js',
      content: productsContent.content,
      sha: productsContent.sha,
      isText: true
    });

    // 3. 準備圖片上傳 - 只處理新上傳的圖片（不是現有圖片）
    // 使用 productData.images 中生成的路径（已经处理了编号重用）
    if (window.uploadedImages && window.uploadedImages.length > 0) {
      // 過濾出需要上傳的新圖片（排除現有圖片）
      const imagesToUpload = window.uploadedImages.filter(img => {
        return img && 
               !img.existing && 
               img.data && 
               typeof img.data === 'string' && 
               img.data.trim().length > 0;
      });
      
      // 找出 productData.images 中哪些是新上传的图片路径
      // 新上传的图片路径不在现有图片路径中
      const existingImagePaths = new Set();
      window.uploadedImages.forEach(img => {
        if (img && img.existing === true && img.path) {
          existingImagePaths.add(img.path);
        }
      });
      
      // 从 productData.images 中找出新上传的图片路径
      const newImagePaths = productData.images.filter(path => !existingImagePaths.has(path));
      
      console.log('新上傳的圖片路徑:', newImagePaths);
      console.log('需要上傳的圖片對象數量:', imagesToUpload.length);
      
      // 確保數量匹配
      if (newImagePaths.length !== imagesToUpload.length) {
        console.warn(`圖片路徑數量 (${newImagePaths.length}) 與圖片對象數量 (${imagesToUpload.length}) 不匹配`);
      }
      
      // 為每個新上傳的圖片創建文件
      for (let i = 0; i < imagesToUpload.length; i++) {
        const img = imagesToUpload[i];
        const imagePath = newImagePaths[i]; // 使用 collectFormData 生成的路径
        
        if (!imagePath) {
          console.warn('找不到對應的圖片路徑，跳過:', img);
          continue;
        }
        
        // 確保圖片對象和名稱有效
        if (!img || !img.name) {
          continue;
        }
        
        // 直接使用 base64 數據（img.data 格式為 "data:image/...;base64,xxxxx"）
        // 提取 base64 部分
        let base64Content;
        try {
          // 確保 data 是字符串
          if (img.data && typeof img.data === 'string') {
            if (img.data.includes(',')) {
              base64Content = img.data.split(',')[1];
            } else {
              // 如果已經是純 base64，直接使用
              base64Content = img.data;
            }
          } else {
            console.warn('跳過無效的圖片數據:', img);
            continue;
          }
        } catch (e) {
          console.error('處理圖片數據時出錯:', e, img);
          continue;
        }

        console.log(`上傳圖片: ${imagePath}`);
        filesToUpdate.push({
          path: imagePath, // 使用 collectFormData 生成的路径
          content: base64Content,
          sha: null, // 新檔案沒有 sha
          isText: false // 圖片是二進制檔案
        });
      }
    }

    // 4. 處理刪除的圖片（編輯模式下）
    // 使用 Contents API 刪除圖片文件
    const deletedImagePaths = [];
    if (isEditMode && window.deletedImagePaths && window.deletedImagePaths.length > 0) {
      deletedImagePaths.push(...window.deletedImagePaths);
      console.log('準備刪除的圖片:', deletedImagePaths);
      
      // 為每個要刪除的圖片獲取 SHA，然後添加到 filesToUpdate 中標記為刪除
      console.log(`開始處理 ${deletedImagePaths.length} 張要刪除的圖片`);
      
      for (let i = 0; i < deletedImagePaths.length; i++) {
        const imagePath = deletedImagePaths[i];
        console.log(`處理第 ${i + 1}/${deletedImagePaths.length} 張圖片: ${imagePath}`);
        
        try {
          // 通過 GAS 代理獲取圖片的 SHA（避免 CORS）
          const requestData = {
            action: 'getFileSha',
            repo: repo,
            path: imagePath
          };
          const dataParam = encodeURIComponent(JSON.stringify(requestData));
          const getImageResponse = await fetch(`${gasUrl}?data=${dataParam}`, {
            method: 'GET',
            mode: 'cors'
          });
          
          console.log(`獲取 SHA 響應狀態: ${getImageResponse.status} for ${imagePath}`);
          
          if (getImageResponse.ok) {
            const result = await getImageResponse.json();
            console.log(`獲取 SHA 結果:`, result);
            
            if (result.sha) {
              // 添加刪除標記
              filesToUpdate.push({
                path: imagePath,
                content: '', // 空內容表示刪除
                sha: result.sha,
                isText: false,
                isDelete: true // 標記為刪除
              });
              console.log(`✓ 成功準備刪除圖片: ${imagePath}, SHA: ${result.sha}`);
            } else {
              console.warn(`✗ 無法獲取圖片 SHA（result.sha 為空），跳過刪除: ${imagePath}`, result);
            }
          } else if (getImageResponse.status === 404) {
            // 文件不存在，跳過
            console.warn(`✗ 圖片文件不存在（404），跳過刪除: ${imagePath}`);
          } else {
            const errorText = await getImageResponse.text().catch(() => '無法讀取錯誤信息');
            console.warn(`✗ 無法獲取圖片 SHA（HTTP ${getImageResponse.status}），跳過刪除: ${imagePath}`, errorText);
          }
        } catch (error) {
          console.error(`✗ 處理刪除圖片時出錯: ${imagePath}`, error);
        }
      }
      
      const deleteFilesCount = filesToUpdate.filter(f => f.isDelete).length;
      console.log(`總共準備刪除 ${deleteFilesCount} 個文件（期望 ${deletedImagePaths.length} 個）`);
    }

    // 5. 使用 Git Data API 在單一 commit 中提交所有檔案（包括刪除）
    const result = await window.commitMultipleFilesForGitHub(
      token,
      owner,
      repoName,
      filesToUpdate,
      commitMessage,
      'main',
      deletedImagePaths, // 傳遞要刪除的圖片路徑
      gasUrl // 傳遞 GAS URL 用於代理請求
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

  // 生成新內容 - 簡化邏輯：解析為對象，直接修改，再序列化
  let newContent = '';
  
  if (type === 'product-details') {
    // 解析 productDetails 對象
    try {
      // 提取 productDetails 對象
      const productDetailsMatch = currentContent.match(/const productDetails\s*=\s*(\{[\s\S]*\});/);
      if (!productDetailsMatch) {
        throw new Error('無法解析 productDetails 對象');
      }
      
      // 使用 Function 構造函數安全地執行代碼
      const func = new Function('return ' + productDetailsMatch[1]);
      const productDetails = func();
      
      // 直接更新或添加產品
      productDetails[productData.id] = productData;
      
      // 格式化為字符串
      const formattedProducts = Object.keys(productDetails).map(id => {
        return `  "${id}": ${JSON.stringify(productDetails[id], null, 4)}`;
      }).join(',\n');
      
      newContent = `const productDetails = {\n${formattedProducts}\n};`;
    } catch (e) {
      console.error('解析 product-details.js 失敗:', e);
      throw new Error(`無法解析 product-details.js: ${e.message}`);
    }
  } else if (type === 'products') {
    // 解析 productsData 對象
    try {
      // 提取 productsData 對象
      const productsDataMatch = currentContent.match(/const productsData\s*=\s*(\{[\s\S]*\});/);
      if (!productsDataMatch) {
        throw new Error('無法解析 productsData 對象');
      }
      
      // 使用 Function 構造函數安全地執行代碼
      const func = new Function('return ' + productsDataMatch[1]);
      const productsData = func();
      
      // 驗證解析結果
      if (!productsData || !productsData.categories || !Array.isArray(productsData.categories)) {
        throw new Error('解析後的 productsData 格式不正確');
      }
      
      // 記錄原始產品數量（用於驗證）
      const totalProductsBefore = productsData.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
      console.log(`編輯前總產品數: ${totalProductsBefore}`);
      
      // 找到對應的分類
      const category = productsData.categories.find(cat => cat.id === productData.category);
      if (!category) {
        throw new Error(`找不到分類 ${productData.category}`);
      }
      
      if (!category.products || !Array.isArray(category.products)) {
        throw new Error(`分類 ${productData.category} 的 products 不是數組`);
      }
      
      // 記錄該分類的原始產品數量
      const categoryProductsBefore = category.products.length;
      console.log(`分類 ${productData.category} 編輯前產品數: ${categoryProductsBefore}`);
      
      // 準備要更新的產品項
      const productItem = {
        id: productData.id,
        name: productData.name,
        img: productData.images[0] || '',
        url: `product.html?id=${productData.id}`
      };
      
      // 找到產品在數組中的索引
      const productIndex = category.products.findIndex(p => p && p.id === productData.id);
      
      if (productIndex >= 0) {
        // 產品已存在，更新它
        console.log(`更新產品 ${productData.id}，索引: ${productIndex}`);
        category.products[productIndex] = productItem;
      } else {
        // 產品不存在，添加新產品
        console.log(`添加新產品 ${productData.id}`);
        category.products.push(productItem);
      }
      
      // 驗證更新後的產品數量
      const categoryProductsAfter = category.products.length;
      const totalProductsAfter = productsData.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
      console.log(`分類 ${productData.category} 編輯後產品數: ${categoryProductsAfter}`);
      console.log(`編輯後總產品數: ${totalProductsAfter}`);
      
      // 確保所有分類和產品都被保留
      if (totalProductsAfter < totalProductsBefore) {
        console.error('警告：產品數量減少！', {
          before: totalProductsBefore,
          after: totalProductsAfter,
          categories: productsData.categories.map(cat => ({
            id: cat.id,
            count: cat.products?.length || 0
          }))
        });
      }
      
      // 格式化為字符串（保持原有格式）
      const formattedCategories = productsData.categories.map(cat => {
        if (!cat.products || !Array.isArray(cat.products)) {
          console.error(`分類 ${cat.id} 的 products 不是數組:`, cat);
          return `    {\n      "id": "${cat.id}",\n      "name": "${cat.name}",\n      "products": []\n    }`;
        }
        
        const formattedProducts = cat.products.map(p => {
          if (!p || !p.id) {
            console.error('無效的產品對象:', p);
            return null;
          }
          // 格式化產品對象，保持縮進
          return `        {\n          "id": "${p.id}",\n          "name": "${p.name}",\n          "img": "${p.img || ''}",\n          "url": "${p.url || `product.html?id=${p.id}`}"\n        }`;
        }).filter(p => p !== null).join(',\n');
        
        return `    {\n      "id": "${cat.id}",\n      "name": "${cat.name}",\n      "products": [\n${formattedProducts}\n      ]\n    }`;
      }).join(',\n');
      
      newContent = `const productsData = {\n  "categories": [\n${formattedCategories}\n  ]\n};`;
    } catch (e) {
      console.error('解析 products.js 失敗:', e);
      console.error('錯誤詳情:', {
        message: e.message,
        stack: e.stack,
        productData: productData
      });
      throw new Error(`無法解析 products.js: ${e.message}`);
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
window.commitMultipleFilesForGitHub = async function(token, owner, repo, files, message, branch = 'main', deletedPaths = [], gasUrl = null) {
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

  // 3. 創建所有檔案的 blob（跳過要刪除的文件）
  const blobPromises = files
    .filter(file => !file.isDelete && file.content) // 跳過標記為刪除的文件和無內容的文件
    .map(async (file) => {
      // 確保 content 存在且不為空
      if (!file.content || (typeof file.content === 'string' && file.content.trim().length === 0)) {
        throw new Error(`文件 ${file.path} 的內容為空`);
      }
      
      const blobResponse = await fetch(`${baseUrl}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'base64' // 所有內容都已經是 base64 編碼（prepareFileContentForGitHub 返回的是 base64）
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

  // 檢查是否有錯誤的 blob 創建
  const treeItems = await Promise.all(blobPromises);
  
  // 驗證 treeItems 不為空（至少應該有 product-details.js 和 products.js）
  if (treeItems.length === 0) {
    throw new Error('沒有文件要提交！請檢查文件內容是否正確。');
  }
  
  // 驗證關鍵文件是否存在
  const hasProductDetails = treeItems.some(item => item.path === 'assets/data/product-details.js');
  const hasProducts = treeItems.some(item => item.path === 'assets/data/products.js');
  
  if (!hasProductDetails || !hasProducts) {
    console.error('缺少關鍵文件:', {
      hasProductDetails,
      hasProducts,
      treeItemsPaths: treeItems.map(item => item.path)
    });
    throw new Error('缺少關鍵文件（product-details.js 或 products.js）！');
  }
  
  // 4. 處理刪除的文件
  // 從 files 中找出標記為 isDelete 的文件
  const deleteFiles = files.filter(file => file.isDelete && file.sha);
  const deletePaths = deleteFiles.map(file => file.path);
  
  console.log(`處理刪除操作: 找到 ${deleteFiles.length} 個要刪除的文件`);
  console.log('要刪除的文件路徑:', deletePaths);
  console.log('要刪除的文件詳情:', deleteFiles.map(f => ({ path: f.path, sha: f.sha })));
  
  let allTreeItems = treeItems;
  
  if (deletePaths.length > 0) {
    console.log(`準備刪除 ${deletePaths.length} 個文件:`, deletePaths);
    
    // 需要獲取完整的 tree 來排除要刪除的文件
    // 通過 GAS 代理獲取 tree（避免 CORS）
    try {
      if (gasUrl) {
        const requestData = {
          action: 'getTree',
          repo: `${owner}/${repo}`,
          treeSha: baseTreeSha,
          recursive: true
        };
        const dataParam = encodeURIComponent(JSON.stringify(requestData));
        const getTreeResponse = await fetch(`${gasUrl}?data=${dataParam}`, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (getTreeResponse.ok) {
          const result = await getTreeResponse.json();
          const existingTreeItems = result.tree || [];
          
          console.log(`獲取到 ${existingTreeItems.length} 個現有文件`);
          
          // 過濾掉要刪除的文件
          const filteredExistingItems = existingTreeItems.filter(item => !deletePaths.includes(item.path));
          
          console.log(`過濾後剩餘 ${filteredExistingItems.length} 個文件（刪除了 ${deletePaths.length} 個）`);
          
          // 合併現有文件（排除刪除的）和新的/更新的文件
          const pathMap = new Map();
          
          // 先添加現有文件（排除要刪除的）
          filteredExistingItems.forEach(item => {
            pathMap.set(item.path, item);
          });
          
          // 然後添加新文件或更新文件（會覆蓋現有的）
          treeItems.forEach(item => {
            pathMap.set(item.path, item);
          });
          
          allTreeItems = Array.from(pathMap.values());
          console.log(`最終 tree 包含 ${allTreeItems.length} 個文件`);
        } else {
          console.warn('無法獲取完整 tree，使用 base_tree（刪除操作可能不會生效）');
        }
      } else {
        console.warn('沒有 GAS URL，無法獲取完整 tree（刪除操作可能不會生效）');
      }
    } catch (error) {
      console.error('獲取 tree 時出錯:', error);
      // 如果出錯，使用 base_tree（會保留所有文件）
    }
  }

  // 5. 創建新的 tree
  // 如果有刪除操作且成功獲取了完整 tree，不使用 base_tree
  // 否則使用 base_tree 保留所有現有文件
  const treeRequestBody = {
    ...(deletePaths.length > 0 && allTreeItems.length > treeItems.length ? {} : { base_tree: baseTreeSha }),
    tree: allTreeItems
  };
  
  console.log('創建 tree，包含文件:', treeItems.map(item => item.path));
  console.log('使用 base_tree:', baseTreeSha);
  
  const newTreeResponse = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treeRequestBody)
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

