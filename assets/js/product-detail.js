/**
 * 產品詳情頁面動態渲染
 */

(function () {
  'use strict';

  // 從 URL 獲取產品 ID
  function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  // 渲染產品內容
  function renderProduct(product) {
    if (!product) {
      renderError('找不到該產品');
      return;
    }

    // 更新頁面標題和 Meta
    document.getElementById('page-title').textContent = product.name + ' - Witega';
    document.getElementById('meta-description').setAttribute('content', product.metaDescription || '');
    document.getElementById('meta-keywords').setAttribute('content', product.keywords || '');

    // 更新麵包屑
    const categoryName = categoryNames[product.category] || product.category;
    const categoryBreadcrumb = document.getElementById('category-breadcrumb');
    categoryBreadcrumb.innerHTML = `<a href="products.html?category=${product.category}">${categoryName}</a>`;
    
    const productBreadcrumb = document.getElementById('product-breadcrumb');
    productBreadcrumb.textContent = product.name;

    // 更新產品名稱
    document.getElementById('product-name').textContent = product.name;

    // 更新產品描述
    document.getElementById('product-description').textContent = product.description || '';

    // 渲染圖片輪播
    renderImages(product.images || [], product.name);

    // 渲染規格列表
    renderSpecs(product.specs || [], product.downloads || [], product.videoUrl);

    // 初始化 Swiper
    initSwiper();
  }

  // 渲染圖片
  function renderImages(images, productName) {
    const slider = document.getElementById('image-slider');
    slider.innerHTML = '';

    if (images.length === 0) {
      slider.innerHTML = '<div class="swiper-slide"><img src="assets/img/placeholder.jpg" alt="' + productName + '" /></div>';
      return;
    }

    images.forEach((imgSrc) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.innerHTML = `<img src="${imgSrc}" alt="${productName}" />`;
      slider.appendChild(slide);
    });
  }

  // 渲染規格列表
  function renderSpecs(specs, downloads, videoUrl) {
    const specsList = document.getElementById('product-specs');
    specsList.innerHTML = '';

    // 添加規格項目
    specs.forEach((spec) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${spec.label}：</strong>${spec.value}`;
      specsList.appendChild(li);
    });

    // 添加影片連結
    if (videoUrl) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>操作示範：</strong><a href="${videoUrl}" target="_blank">影片連結</a>`;
      specsList.appendChild(li);
    }

    // 添加下載連結
    if (downloads && downloads.length > 0) {
      const li = document.createElement('li');
      const downloadLinks = downloads.map((download, index) => {
        if (index === 0) {
          return `<strong>檔案下載：</strong><a href="${download.url}" download="${download.filename}">${download.label}</a>`;
        } else {
          return `、<a href="${download.url}" download="${download.filename}">${download.label}</a>`;
        }
      }).join('');
      li.innerHTML = downloadLinks;
      specsList.appendChild(li);
    }
  }

  // 初始化 Swiper
  function initSwiper() {
    // 如果 Swiper 已經初始化，先銷毀
    if (window.productSwiper) {
      window.productSwiper.destroy(true, true);
    }

    // 重新初始化 Swiper
    window.productSwiper = new Swiper('.portfolio-details-slider', {
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  // 渲染錯誤訊息
  function renderError(message) {
    document.getElementById('product-name').textContent = '錯誤';
    document.getElementById('product-description').textContent = message;
    document.getElementById('image-slider').innerHTML = 
      '<div class="swiper-slide"><p>無法載入產品資訊</p></div>';
  }

  // ID 映射（處理不一致的 ID）
  const idMapping = {
    'RX-1': 'RX1',
    'RU-1': 'RU1',
    'RL-1': 'RL1'
  };

  // 初始化
  document.addEventListener('DOMContentLoaded', function () {
    const productId = getProductId();

    if (!productId) {
      renderError('請提供產品 ID');
      return;
    }

    // 處理 ID 映射
    const actualId = idMapping[productId] || productId;

    // 查找產品資料
    const product = productDetails[actualId];

    if (!product) {
      renderError('找不到產品 ID: ' + productId);
      return;
    }

    // 渲染產品
    renderProduct(product);
  });
})();

