/**
 * 簡易雙語 i18n（中文 zh / 英文 en）
 * 語言來源優先序：URL ?lang= > localStorage > 預設 zh
 * 用法：
 *   元素文字   <span data-i18n="nav.products"></span>
 *   placeholder <input data-i18n-ph="products.search">
 *   程式取字串  window.WITEGA_I18N.t('products.empty')
 *   切換語言    window.WITEGA_I18N.setLang('en')
 *   目前語言    window.WITEGA_I18N.lang
 */
(function () {
  const STORE = 'witega_lang';

  const DICT = {
    // 導覽列
    'nav.home': { zh: '首頁', en: 'Home' },
    'nav.services': { zh: '產品服務', en: 'Services' },
    'nav.products': { zh: '產品列表', en: 'Products' },
    'nav.about': { zh: '關於威特嘉', en: 'About' },
    'nav.cases': { zh: '案例分享', en: 'Cases' },
    'nav.contact': { zh: '聯絡我們', en: 'Contact' },
    'nav.lang': { zh: 'EN', en: '中文' }, // 切換鈕顯示「切去的語言」

    // 頁尾
    'footer.company': { zh: '威特嘉科技開發股份有限公司', en: 'Witega Technology Development Co., Ltd.' },
    'footer.rights': { zh: '版權所有', en: 'All Rights Reserved' },

    // 產品列表頁
    'products.pageTitle': { zh: '產品列表 - Witega', en: 'Products - Witega' },
    'products.categories': { zh: '產品分類', en: 'Categories' },
    'products.all': { zh: '全部產品', en: 'All Products' },
    'products.search': { zh: '輸入關鍵字搜尋產品（名稱、編號）', en: 'Search products (name / code)' },
    'products.emptyCat': { zh: '該分類暫無產品', en: 'No products in this category' },
    'products.loadFail': { zh: '無法載入產品數據', en: 'Failed to load products' },

    // 產品詳情頁
    'detail.pageTitle': { zh: '產品介紹 - Witega', en: 'Product - Witega' },
    'detail.title': { zh: '產品介紹', en: 'Product' },
    'detail.productList': { zh: '產品列表', en: 'Products' },
    'detail.info': { zh: '產品資訊', en: 'Product Information' },
    'detail.loading': { zh: '載入中...', en: 'Loading...' },
    'detail.video': { zh: '操作示範', en: 'Demo Video' },
    'detail.videoLink': { zh: '影片連結', en: 'Watch video' },
    'detail.download': { zh: '檔案下載', en: 'Downloads' },
    'detail.notFound': { zh: '找不到產品', en: 'Product not found' },
    'detail.loadFail': { zh: '載入產品資料失敗', en: 'Failed to load product' },
    'detail.needId': { zh: '請提供產品 ID', en: 'Missing product ID' },

    // ===== 首頁 home =====
    // Hero 輪播
    'home.hero1.title': { zh: '威特嘉科技開發', en: 'Witega Technology Development' },
    'home.hero1.desc': { zh: '提供國內外畜牧產業設備、產品， 生產適合台灣養豬產業使用之省工設備， 配合政府導入自動化省工設備之補助案， 優惠熱烈進行中！', en: "Providing domestic and international livestock equipment and products, producing labor-saving equipment for Taiwan's pig farming industry. Government automation subsidy programs are ongoing!" },
    'home.hero.viewAll': { zh: '查看所有產品', en: 'View All Products' },
    'home.hero.portfolio': { zh: '實例花絮', en: 'Portfolio' },
    'home.learnMore': { zh: '了解更多', en: 'Learn more' },
    'home.hero2.title': { zh: '無線智能超音波', en: 'Wireless Smart Ultrasound' },
    'home.hero2.desc': { zh: '使用WIFI連結手機、平板，高清成像快速判讀子宮情況，畫面可截圖、錄影並傳送到交流群組討論。', en: 'Connect via WiFi to a smartphone or tablet to quickly assess the uterus with high-definition imaging. Capture screenshots, record video, and share to discussion groups.' },
    'home.hero3.title': { zh: '仔豬處理工作臺車', en: 'Piglet Processing Cart' },
    'home.hero3.desc': { zh: '車身以不鏽鋼製造搭配鋁製注射器、餵食器，及剪尾器、閹割鉗等多樣選配工具，一人操作省時省力，全車在台生產，品質保障。', en: 'A stainless-steel cart with aluminum syringe, feeder, tail-docking device, ligation nipper and other optional tools. Single-person operation, made in Taiwan with guaranteed quality.' },
    'home.hero4.title': { zh: '多功能斃死豬搬運車', en: 'Multifunctional Dead Pig Transport Vehicle' },
    'home.hero4.desc': { zh: '主要用於斃死豬搬運，迅速安全將斃死豬移出，多功能車身能適用於各種場地，多種情境操作，解決您搬運的問題！', en: 'Mainly used for the quick and safe removal of deceased pigs. The multifunctional body suits various sites and scenarios, solving your transport needs!' },

    // Services 區塊
    'home.services.subtitle': { zh: '產品及服務', en: 'Product and Services' },
    'home.detailsBtn': { zh: '詳細規格', en: 'Details' },
    'home.viewFullList': { zh: '查看完整產品列表', en: 'View Full Product List' },
    'home.tab1': { zh: '電動省工機具', en: 'Auto Machinery' },
    'home.tab2': { zh: '智能檢測儀器', en: 'Intelligent Scanner' },
    'home.tab3': { zh: '生物安全防治設備', en: 'Biosecurity Equipment' },
    'home.tab4': { zh: '其他相關設備', en: 'Other Equipment' },
    'home.tab5': { zh: '消耗性產品', en: 'Expendable Product' },

    'home.tab1.intro': { zh: '因應時代變遷畜牧場人力短缺，電動省工機具可減少人力耗費，提升安全性及效率，達到事半功倍的效果！', en: 'Electric-powered machinery offers a labor-saving solution for livestock farms, addressing manpower shortages while improving safety and efficiency.' },
    'home.t1p1.name': { zh: '多功能斃死豬搬運車', en: 'Multifunctional Dead Pig Transport Vehicle' },
    'home.t1p1.desc': { zh: '主要用於斃死豬搬運，迅速安全將斃死豬移出，多功能車身能適用於各種場地，多種情境操作，解決您搬運的問題！', en: 'Mainly used for the quick and safe removal of deceased pigs. The multifunctional body suits various sites and scenarios, solving your transport problems!' },
    'home.t1p2.name': { zh: '電動公豬試情車', en: 'Electric Boar Estrus Car' },
    'home.t1p2.desc': { zh: '主要用於試情配種，乘載公豬進行，可控制行走速率，有效降低公豬緊迫，提升母豬發情及配種率，兼顧操作人員安全,提升試情品質！', en: 'Designed for efficient estrus testing and mating. Controlled walking speed reduces boar stress, improves sow estrus and mating rates, ensures operator safety, and enhances testing quality!' },
    'home.t1p3.name': { zh: '電動小豬搬運車', en: 'Piglet Weaning Cart' },
    'home.t1p3.desc': { zh: '主要用於仔豬離乳，減少人力耗費，可記錄離乳窩重及個別重量，進階飼養管理，提升育成效率！', en: 'Mainly used for piglet weaning, reducing labor. It records litter and individual weights for advanced breeding management and higher rearing efficiency!' },

    'home.tab2.intro': { zh: '使用智能檢測設備，時刻能輕鬆檢測場內豬隻情形，即時做出處置，減少損失浪費，能有效提生產及產值！', en: 'With intelligent detection equipment, continuous monitoring of pig conditions becomes effortless, greatly improving production, output, and profitability.' },
    'home.t2p1.name': { zh: '無線超音波測孕器', en: 'Wireless Ultrasound Pregnancy Scanner' },
    'home.t2p1.desc': { zh: '檢測受孕情形，呈像清晰，方便操作使用，提升效率及產值！', en: 'Clear imaging and user-friendly operation make pregnancy detection easier, raising efficiency and profitability!' },
    'home.t2p2.name': { zh: '無線超音波背脂機', en: 'Wireless Ultrasound Backfat Scanner' },
    'home.t2p2.desc': { zh: '檢測背脂情形，控制體態，調整飼料配方，管理飼效！', en: 'Detecting backfat enables body condition control, feed formula adjustment, and efficient feed management!' },
    'home.t2p3.name': { zh: '無線超音波腰眼面積測定機', en: 'Wireless Ultrasound Loin Eye Area Scanner' },
    'home.t2p3.desc': { zh: '檢測腰眼面積，選種育種，屠體評級，精準快速測定！', en: 'Accurate and fast measurement of loin eye area for breeding selection and carcass grading!' },
    'home.t2p4.name': { zh: '精子相位差顯微鏡', en: 'Sperm Phase Contrast Microscope' },
    'home.t2p4.desc': { zh: '檢測精液情形，避免無效配種損失！', en: 'Evaluates semen condition to avoid losses from ineffective mating!' },
    'home.t2p5.name': { zh: '自動精子檢測機', en: 'Smart Semen Analyzer System' },
    'home.t2p5.desc': { zh: '自動檢測精液情形，可測活力及濃度，並做紀錄管理！', en: 'Automatically analyzes semen, measuring vitality and concentration with recording and management!' },

    'home.tab3.intro': { zh: '為防止非洲豬瘟疫情擴大，威特嘉科技積極研擬防疫配套措施，阻擋豬瘟入侵台灣寶貴的豬場！', en: "To prevent the spread of African swine fever, Witega Technology actively develops prevention measures to keep the disease out of Taiwan's valuable pig farms!" },
    'home.t3p1.name': { zh: '生物安全小屋', en: 'Biosecurity Cabin' },
    'home.t3p1.desc': { zh: '鑒於非洲豬瘟肆虐，提供完整消毒隔絕方案，有效防堵疫情！', en: 'A complete disinfection and isolation solution to effectively block disease outbreaks amid African swine fever!' },
    'home.t3p2.name': { zh: '高壓清洗機', en: 'High-pressure Cleaning Machine' },
    'home.t3p2.desc': { zh: '用於豬舍清潔消毒，搭配清洗液，省水省力省時！', en: 'For cleaning and disinfecting pig pens; paired with cleaning agents it saves water, labor, and time!' },
    'home.t3p3.name': { zh: '消毒噴霧機', en: 'Disinfection Sprayer' },
    'home.t3p3.desc': { zh: '做環境定期消毒，並可有效降低環境臭味，提升飼養品質！', en: 'For regular environmental disinfection; effectively reduces odors and improves farming quality!' },

    'home.tab4.intro': { zh: '威特嘉科技開發多項省工設備，幫助您節省人力與時間，並達到高效產值與安全防護！', en: 'Witega Technology has developed a range of labor-saving equipment to save manpower and time while achieving high productivity and safety!' },
    'home.t4p1.name': { zh: '無針注射器', en: 'Needle-free Injector' },
    'home.t4p1.desc': { zh: '氣動式手持無針注射器，可連續注射1200頭仔豬，並避免交叉感染病毒！', en: 'A pneumatic handheld needle-free injector for continuous injection of 1,200 piglets, avoiding cross-infection!' },
    'home.t4p2.name': { zh: '電動磨牙機', en: 'Piglet Teeth Grinding Machine' },
    'home.t4p2.desc': { zh: '採用德國大廠BOSCH主機與威特嘉開發鋁帽頭，輕鬆完成仔豬磨牙工作，減少傷口感染！', en: "Using a German BOSCH mainframe with Witega's aluminum cap to easily grind piglet teeth and reduce wound infection!" },
    'home.t4p3.name': { zh: '仔豬電熱剪尾器', en: 'Electric Tail Docking Tool for Piglets' },
    'home.t4p3.desc': { zh: '刀片瞬熱輕鬆完成小豬剪尾工作，減少流血及傷口感染！', en: 'The instantly heated blade easily docks piglet tails, reducing bleeding and wound infection!' },
    'home.t4p4.name': { zh: '多功能仔豬工作車', en: 'Multi-function Piglet Processing Cart' },
    'home.t4p4.desc': { zh: '僅需一人即可完成仔豬首次處理的所有工作事項，節省人力及時間！', en: 'One person can complete all first-handling tasks for piglets, saving manpower and time!' },
    'home.t4p5.name': { zh: '不鏽鋼去勢鉗', en: 'Stainless Steel Ligation Nipper' },
    'home.t4p5.desc': { zh: '快速完成仔豬閹割，避免流血及傷口感染！', en: 'Quickly castrates piglets while preventing bleeding and wound infection!' },

    'home.t5p1.name': { zh: '傷口隔絕劑', en: 'Wound Barrier Spray' },
    'home.t5p1.desc': { zh: '豬舍專用噴劑，有效隔絕傷口，避免感染、蚊蟲咬傷，加強傷口癒合！', en: 'A pig-pen spray that isolates wounds, prevents infection and insect bites, and aids healing!' },
    'home.t5p2.name': { zh: '清洗泡沫劑', en: 'Foam Cleansing Agent' },
    'home.t5p2.desc': { zh: '豬舍專用清洗泡沫，有效分解殘料油脂及豬隻糞便，降低細菌生成、不影響廢水排放， 省時、省力、省水！', en: 'A pig-pen foam cleanser that breaks down residual oils and feces, reduces bacteria without affecting wastewater discharge — saving time, labor, and water!' },

    // About 區塊
    'home.about.subtitle': { zh: '關於威特嘉', en: 'About Witega' },
    'home.about.p1': { zh: '威特嘉科技開發股份有限公司於2020年在台中成立， 旨在提升國內養豬產業工作效率及環境衛生安全， 提供國內外畜牧產業設備、產品， 並配合政府導入自動化省工設備之補助案， 生產適合台灣養豬產業使用之省工設備！', en: "Witega Technology Development Co., Ltd. was established in Taichung in 2020 to enhance the work efficiency and biosecurity of Taiwan's pig farming industry. We provide domestic and international livestock equipment and products, cooperate with government labor-saving automation subsidies, and produce labor-saving equipment suitable for Taiwan's pig farming!" },
    'home.about.li1': { zh: '提供無線智能超音波設備，並提供測孕相關之教學及服務。', en: 'Offer wireless intelligent ultrasound devices with training and services for pregnancy detection.' },
    'home.about.li2': { zh: '客製化生產小豬工作車、斃死豬搬運車及公豬試情車等省工設備。', en: 'Custom-build piglet work carts, carcass transport carts, boar estrus cars and other labor-saving equipment.' },
    'home.about.li3': { zh: '設計客製化生物安全小屋，以實現台灣畜牧產業生物安全防治之目標。', en: "Design customized biosecurity cabins to achieve the biosecurity goals of Taiwan's livestock industry." },
    'home.about.p2': { zh: '威特嘉致力於在台生產符合台灣養殖環境之相關設備， 能做到超越國外大廠品質並實現在台快速保固及維修服務， 讓您買得放心用得安心。 有任何設備與服務相關問題及建議煩請與我們聯繫：<br />電話：(04)3707-8258 <br />信箱：service@witega.com.tw &nbsp; <br />LINE：@witega <br />地址：台中市西屯區安和一街37號', en: "Witega is dedicated to manufacturing equipment that fits Taiwan's farming environment, surpassing the quality of foreign manufacturers with fast local warranty and repair so you can buy and use with confidence. For any questions or suggestions, please contact us:<br />Phone: +886 4-3707-8258 <br />Email: service@witega.com.tw &nbsp; <br />LINE: @witega <br />Address: No. 37, Anhe 1st St., Xitun Dist., Taichung City 407022, Taiwan (R.O.C.)" },

    // CTA 區塊
    'home.cta.title': { zh: '立即來電', en: 'Call Immediately' },
    'home.cta.desc': { zh: '配合行政院農委會「擴大養豬場導入新式整合型設備」補助案第三大類，養豬場導入自動化省工設備之相關補助項目優惠實施中！', en: 'In line with the Council of Agriculture\'s "Expanded Integrated Equipment for Pig Farms" subsidy program (Category 3), incentives for adopting labor-saving automation equipment are now available!' },
    'home.cta.call': { zh: '立即來電', en: 'Call Now' },
    'home.cta.viewProducts': { zh: '查看產品', en: 'View Products' },

    // Portfolio 區塊
    'home.portfolio.subtitle': { zh: '案例分享', en: 'Portfolio and Collection' },
    'home.filter.all': { zh: 'All', en: 'All' },
    'home.filter.customer': { zh: '客戶案例', en: 'Customer case' },
    'home.filter.guide': { zh: '操作指導', en: 'Operation guide' },
    'home.filter.event': { zh: '活動花絮', en: 'Event highlights' },
    'home.pf.cust1': { zh: '客戶案例 1', en: 'Customer case 1' },
    'home.pf.cust2': { zh: '客戶案例 2', en: 'Customer case 2' },
    'home.pf.cust3': { zh: '客戶案例 3', en: 'Customer case 3' },
    'home.pf.guide1': { zh: '操作指導 1', en: 'Operation guide 1' },
    'home.pf.guide2': { zh: '操作指導 2', en: 'Operation guide 2' },
    'home.pf.guide3': { zh: '操作指導 3', en: 'Operation guide 3' },
    'home.pf.event2': { zh: '活動花絮 2', en: 'Event highlights 2' },
    'home.pf.event3': { zh: '活動花絮 3', en: 'Event highlights 3' },

    // Contact 區塊
    'home.contact.subtitle': { zh: '聯絡我們', en: 'Contact us' },
    'home.contact.addr': { zh: '地址：', en: 'Address:' },
    'home.contact.addrVal': { zh: '台中市西屯區安和一街37號', en: 'No. 37, Anhe 1st St., Xitun Dist., Taichung City 407022, Taiwan (R.O.C.)' },
    'home.contact.email': { zh: 'Email：', en: 'Email:' },
    'home.contact.phone': { zh: '電話：', en: 'Phone:' },
    'home.contact.phoneVal': { zh: '(04)3707-8258', en: '+886 4-3707-8258' },
    'home.form.name': { zh: '姓名', en: 'Name' },
    'home.form.phone': { zh: '電話', en: 'Phone' },
    'home.form.subject': { zh: '主旨', en: 'Subject' },
    'home.form.message': { zh: '訊息', en: 'Message' },
    'home.form.nameErr': { zh: '請輸入姓名。', en: 'Please enter your name.' },
    'home.form.phoneErr': { zh: '請輸入正確的電話格式。', en: 'Please enter a valid phone number.' },
    'home.form.subjectErr': { zh: '請輸入主旨。', en: 'Please enter a subject.' },
    'home.form.messageErr': { zh: '請輸入訊息。', en: 'Please enter a message.' },
    'home.form.submit': { zh: '送出', en: 'Submit' },
  };

  function getLang() {
    const u = new URLSearchParams(location.search).get('lang');
    if (u === 'en' || u === 'zh') {
      try { localStorage.setItem(STORE, u); } catch (e) {}
      return u;
    }
    try {
      return localStorage.getItem(STORE) === 'en' ? 'en' : 'zh';
    } catch (e) {
      return 'zh';
    }
  }

  const lang = getLang();

  function t(key, l) {
    const entry = DICT[key];
    if (!entry) return null;
    const lng = l || lang;
    return entry[lng] != null ? entry[lng] : entry.zh;
  }

  function setLang(next) {
    try { localStorage.setItem(STORE, next); } catch (e) {}
    const url = new URL(location.href);
    url.searchParams.set('lang', next);
    location.href = url.toString();
  }

  // 套用到 DOM
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    scope.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n-ph'));
      if (v != null) el.setAttribute('placeholder', v);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n-html'));
      if (v != null) el.innerHTML = v;
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  }

  // 在 ?lang 與 localStorage 不同步時，補進網址（方便連結帶語言）
  document.addEventListener('DOMContentLoaded', () => apply());

  window.WITEGA_I18N = { lang, t, setLang, apply, DICT };
})();
