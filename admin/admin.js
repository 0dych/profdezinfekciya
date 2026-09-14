/**
 * Адмін-панель ТОВ «ПРОФДЕЗІНФЕКЦІЯ ЗАКАРПАТТЯ»
 * Логіка керування контентом
 */

const DEFAULT_PIN = "1234";
let currentData = null;
let ordersCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initAuth();
  await loadAdminData();
  initTabs();
  initFormActions();
  initOrderManager();
  initTelegramSettings();
  initSecuritySettings();
  initUnsavedState();
});

/**
 * Проста авторизація за PIN-кодом
 */
async function initAuth() {
  const lockScreen = document.getElementById("adminLockScreen");
  const pinInput = document.getElementById("adminPinInput");
  const loginBtn = document.getElementById("adminLoginBtn");
  const errorMsg = document.getElementById("adminPinError");

  let serverAuthAvailable = false;
  try {
    const response = await fetch("api/auth.php", { cache: "no-store" });
    if (response.ok) {
      const serverState = await response.json();
      serverAuthAvailable = true;
      if (serverState.authenticated) {
        sessionStorage.setItem("pdt_admin_logged", "true");
        if (lockScreen) lockScreen.style.display = "none";
      }
    }
  } catch (_) {
    // Статичний режим без PHP: доступний лише локальний перегляд.
  }

  // Локальний режим використовується лише якщо PHP-сервер не запущено.
  if (!serverAuthAvailable && sessionStorage.getItem("pdt_admin_logged") === "true") {
    if (lockScreen) lockScreen.style.display = "none";
  }

  async function handleLogin() {
    const pin = pinInput.value;
    let authenticated = false;
    try {
      const response = await fetch("api/auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", pin })
      });
      authenticated = response.ok && (await response.json()).success;
    } catch (_) {
      // Локальний fallback потрібний, щоб макет можна було відкрити без PHP.
      authenticated = pin === (localStorage.getItem("pdt_custom_pin") || DEFAULT_PIN);
    }
    if (authenticated) {
      sessionStorage.setItem("pdt_admin_logged", "true");
      lockScreen.style.display = "none";
      loadOrders();
    } else {
      errorMsg.style.display = "block";
      pinInput.value = "";
      pinInput.focus();
    }
  }

  if (loginBtn) loginBtn.addEventListener("click", handleLogin);
  if (pinInput) {
    pinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("api/auth.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" })
        });
      } catch (_) {}
      sessionStorage.removeItem("pdt_admin_logged");
      window.location.reload();
    });
  }
}

/**
 * Завантаження даних
 */
async function loadAdminData() {
  // 1. Серверний файл пріоритетний, щоб адмінка показувала актуальні спільні дані.
  try {
    const res = await fetch("../data/content.json");
    if (res.ok) {
      currentData = await res.json();
      populateForm(currentData);
      return;
    }
  } catch (e) {
    console.info("Серверні дані недоступні; перевіряємо локальну копію");
  }

  // 2. Локальна копія використовується лише без PHP/в автономному режимі.
  const local = localStorage.getItem("pdt_site_content");
  if (local) {
    try {
      currentData = JSON.parse(local);
      populateForm(currentData);
      return;
    } catch (e) {
      console.warn("Помилка JSON з localStorage", e);
    }
  }

  // 3. Fallback
  currentData = {
    company: {
      name: "ТОВ «ПРОФДЕЗІНФЕКЦІЯ ЗАКАРПАТТЯ»",
      nameEn: "LLC «PDT»",
      edrpou: "40769799",
      extract: "Виписка від 09.02.2024 № 1003231070005003995",
      director: "Ольга Химинець",
      address: "89603, Закарпатська обл., Мукачівський р-н, м. Мукачево, вул. Берегівська-об’їзна, 7",
      region: "м. Мукачево, Ужгород та вся Закарпатська область",
      phones: ["+38 (067) 744-77-49", "+38 (066) 212-20-70"],
      email: "profdezzak@gmail.com",
      workHours: "Пн-Нд: 08:00 - 20:00 (Аварійні виїзди 24/7)",
      socials: {
        viber: "viber://chat?number=%2B380677447749",
        telegram: "https://t.me/+380677447749",
        whatsapp: "https://wa.me/380677447749",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com"
      }
    },
    services: [],
    products: []
  };
  populateForm(currentData);
}

/**
 * Заповнення полів форми
 */
function populateForm(data) {
  if (!data) return;

  const c = data.company || {};
  setVal("c_name", c.name);
  setVal("c_nameEn", c.nameEn);
  setVal("c_edrpou", c.edrpou);
  setVal("c_extract", c.extract);
  setVal("c_director", c.director);
  setVal("c_address", c.address);
  setVal("c_region", c.region);
  setVal("c_phone1", (c.phones && c.phones[0]) || "");
  setVal("c_phone2", (c.phones && c.phones[1]) || "");
  setVal("c_email", c.email);
  setVal("c_workHours", c.workHours);

  const s = c.socials || {};
  setVal("s_viber", s.viber);
  setVal("s_telegram", s.telegram);
  setVal("s_whatsapp", s.whatsapp);
  setVal("s_facebook", s.facebook);
  setVal("s_instagram", s.instagram);

  const trust = data.trust || {};
  setVal("t_eyebrow", trust.eyebrow);
  setVal("t_title", trust.title);
  setVal("t_subtitle", trust.subtitle);
  renderTrustList(trust.items || []);

  renderServicesList(data.services || []);
  renderProductsList(data.products || []);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/**
 * Вкладки навігації
 */
function initTabs() {
  const btns = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

       btn.classList.add("active");
       const target = document.getElementById(btn.dataset.tab);
       if (target) target.classList.add("active");
       if (btn.dataset.tab === "tab-orders") loadOrders();
       if (btn.dataset.tab === "tab-telegram") loadTelegramSettings();
    });
  });
}

/**
 * Список послуг
 */
function renderServicesList(services) {
  const container = document.getElementById("servicesListContainer");
  if (!container) return;

  container.innerHTML = "";

  services.forEach((srv, index) => {
    const row = document.createElement("div");
    row.className = "item-edit-row";
    row.innerHTML = `
      <button type="button" class="item-delete-btn" onclick="deleteService(${index})">Видалити</button>
      <div class="form-grid">
        <div>
          <label class="admin-label">ID (латиницею):</label>
          <input type="text" class="admin-input srv-id" value="${escapeHtml(srv.id || '')}">
        </div>
        <div>
          <label class="admin-label">Категорія:</label>
          <input type="text" class="admin-input srv-category" value="${escapeHtml(srv.category || '')}" placeholder="pest-control / sanitation / business / agro">
        </div>
        <div>
          <label class="admin-label">Назва послуги:</label>
          <input type="text" class="admin-input srv-title" value="${escapeHtml(srv.title || '')}">
        </div>
        <div>
          <label class="admin-label">Бейдж (наприклад: НАССР сертифіковано):</label>
          <input type="text" class="admin-input srv-badge" value="${escapeHtml(srv.badge || '')}">
        </div>
        <div class="form-group-full">
          <label class="admin-label">Короткий опис:</label>
          <textarea class="admin-textarea srv-desc" rows="2">${escapeHtml(srv.shortDesc || '')}</textarea>
        </div>
        <div class="form-group-full">
          <label class="admin-label">Повний опис:</label>
          <textarea class="admin-textarea srv-full-desc" rows="3">${escapeHtml(srv.fullDesc || '')}</textarea>
        </div>
        <div class="form-group-full">
          <label class="admin-label">Що входить у послугу (один пункт з нового рядка):</label>
          <textarea class="admin-textarea srv-items" rows="4">${escapeHtml((srv.items || []).join('\n'))}</textarea>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

window.deleteService = function(index) {
  if (confirm("Видалити цю послугу?")) {
    currentData.services.splice(index, 1);
    renderServicesList(currentData.services);
  }
};

window.addNewService = function() {
  if (!currentData.services) currentData.services = [];
  currentData.services.push({
    id: "new-service-" + Date.now(),
    category: "pest-control",
    title: "Нова послуга",
    badge: "Гарантія",
    shortDesc: "Опис послуги...",
    items: []
  });
  renderServicesList(currentData.services);
};

/**
 * Список товарів
 */
function renderProductsList(products) {
  const container = document.getElementById("productsListContainer");
  if (!container) return;

  container.innerHTML = "";

  products.forEach((prod, index) => {
    const row = document.createElement("div");
    row.className = "item-edit-row";
    row.innerHTML = `
      <button type="button" class="item-delete-btn" onclick="deleteProduct(${index})">Видалити</button>
      <div class="form-grid">
        <div>
          <label class="admin-label">ID (латиницею):</label>
          <input type="text" class="admin-input prod-id" value="${escapeHtml(prod.id || '')}">
        </div>
        <div>
          <label class="admin-label">Назва товару:</label>
          <input type="text" class="admin-input prod-title" value="${escapeHtml(prod.title || '')}">
        </div>
        <div>
          <label class="admin-label">Ціна / Статус:</label>
          <input type="text" class="admin-input prod-price" value="${escapeHtml(prod.price || 'За запитом')}">
        </div>
        <div>
          <label class="admin-label">Бейдж:</label>
          <input type="text" class="admin-input prod-badge" value="${escapeHtml(prod.badge || '')}">
        </div>
        <div>
          <label class="admin-label">Наявність:</label>
          <input type="text" class="admin-input prod-status" value="${escapeHtml(prod.status || '')}">
        </div>
        <div class="form-group-full">
          <label class="admin-label">Опис товару:</label>
          <textarea class="admin-textarea prod-desc" rows="2">${escapeHtml(prod.shortDesc || '')}</textarea>
        </div>
        <div class="form-group-full">
          <label class="admin-label">Характеристики (один пункт з нового рядка):</label>
          <textarea class="admin-textarea prod-features" rows="4">${escapeHtml((prod.features || []).join('\n'))}</textarea>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

window.deleteProduct = function(index) {
  if (confirm("Видалити цей товар?")) {
    currentData.products.splice(index, 1);
    renderProductsList(currentData.products);
  }
};

window.addNewProduct = function() {
  if (!currentData.products) currentData.products = [];
  currentData.products.push({
    id: "new-product-" + Date.now(),
    title: "Новий товар",
    price: "За запитом",
    badge: "В наявності",
    shortDesc: "Опис товару...",
    features: []
  });
  renderProductsList(currentData.products);
};

/**
 * Переваги / блок довіри на головній
 */
function renderTrustList(items) {
  const container = document.getElementById("trustListContainer");
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-edit-row";
    row.innerHTML = `
      <button type="button" class="item-delete-btn" onclick="deleteTrustItem(${index})">Видалити</button>
      <div class="form-grid">
        <div>
          <label class="admin-label">Іконка (1 символ):</label>
          <input type="text" class="admin-input trust-icon-input" maxlength="2" value="${escapeHtml(item.icon || '✓')}">
        </div>
        <div>
          <label class="admin-label">Заголовок:</label>
          <input type="text" class="admin-input trust-title-input" value="${escapeHtml(item.title || '')}">
        </div>
        <div class="form-group-full">
          <label class="admin-label">Пояснення:</label>
          <textarea class="admin-textarea trust-subtitle-input" rows="2">${escapeHtml(item.subtitle || '')}</textarea>
        </div>
      </div>`;
    container.appendChild(row);
  });
}

window.deleteTrustItem = function(index) {
  if (confirm("Видалити цей пункт з блоку довіри?")) {
    currentData.trust.items.splice(index, 1);
    renderTrustList(currentData.trust.items);
  }
};

window.addNewTrustItem = function() {
  currentData.trust = currentData.trust || { items: [] };
  currentData.trust.items = currentData.trust.items || [];
  currentData.trust.items.push({ icon: "✓", title: "Нова перевага", subtitle: "Коротке пояснення" });
  renderTrustList(currentData.trust.items);
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[char]));
}

/**
 * Збір даних з полів та збереження
 */
function collectDataFromForm() {
  const d = currentData || {};

  d.company = d.company || {};
  d.company.name = getVal("c_name");
  d.company.nameEn = getVal("c_nameEn");
  d.company.edrpou = getVal("c_edrpou");
  d.company.extract = getVal("c_extract");
  d.company.director = getVal("c_director");
  d.company.address = getVal("c_address");
  d.company.region = getVal("c_region");
  d.company.phones = [getVal("c_phone1"), getVal("c_phone2")].filter(Boolean);
  d.company.email = getVal("c_email");
  d.company.workHours = getVal("c_workHours");

  d.company.socials = {
    viber: getVal("s_viber"),
    telegram: getVal("s_telegram"),
    whatsapp: getVal("s_whatsapp"),
    facebook: getVal("s_facebook"),
    instagram: getVal("s_instagram")
  };

  d.trust = d.trust || {};
  d.trust.eyebrow = getVal("t_eyebrow");
  d.trust.title = getVal("t_title");
  d.trust.subtitle = getVal("t_subtitle");
  d.trust.items = [...document.querySelectorAll("#trustListContainer .item-edit-row")].map(row => ({
    icon: row.querySelector(".trust-icon-input").value.trim() || "✓",
    title: row.querySelector(".trust-title-input").value.trim(),
    subtitle: row.querySelector(".trust-subtitle-input").value.trim()
  })).filter(item => item.title || item.subtitle);

  // Оновлення послуг з DOM
  const srvRows = document.querySelectorAll("#servicesListContainer .item-edit-row");
  srvRows.forEach((row, i) => {
    if (d.services[i]) {
      d.services[i].id = row.querySelector(".srv-id").value.trim();
      d.services[i].category = row.querySelector(".srv-category").value.trim();
      d.services[i].title = row.querySelector(".srv-title").value;
      d.services[i].badge = row.querySelector(".srv-badge").value;
      d.services[i].shortDesc = row.querySelector(".srv-desc").value;
      d.services[i].fullDesc = row.querySelector(".srv-full-desc").value;
      d.services[i].items = row.querySelector(".srv-items").value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    }
  });

  // Оновлення товарів з DOM
  const prodRows = document.querySelectorAll("#productsListContainer .item-edit-row");
  prodRows.forEach((row, i) => {
    if (d.products[i]) {
      d.products[i].id = row.querySelector(".prod-id").value.trim();
      d.products[i].title = row.querySelector(".prod-title").value;
      d.products[i].price = row.querySelector(".prod-price").value;
      d.products[i].badge = row.querySelector(".prod-badge").value;
      d.products[i].status = row.querySelector(".prod-status").value;
      d.products[i].shortDesc = row.querySelector(".prod-desc").value;
      d.products[i].features = row.querySelector(".prod-features").value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    }
  });

  return d;
}

/** Заявки */
function initOrderManager() {
  document.getElementById("ordersRefreshBtn")?.addEventListener("click", loadOrders);
  loadOrders();
}

async function loadOrders() {
  const container = document.getElementById("ordersContainer");
  const summary = document.getElementById("ordersSummary");
  if (!container) return;
  try {
    const response = await fetch("api/orders.php", { cache: "no-store" });
    if (!response.ok) throw new Error("API недоступне");
    ordersCache = await response.json();
  } catch (error) {
    // Fallback: завантаження з localStorage або ../data/orders.json
    try {
      const local = JSON.parse(localStorage.getItem('pdt_orders') || '[]');
      if (local && local.length > 0) {
        ordersCache = local;
      } else {
        const fileRes = await fetch("../data/orders.json");
        ordersCache = fileRes.ok ? await fileRes.json() : [];
      }
    } catch {
      ordersCache = [];
    }
  }

  renderOrders(ordersCache);
  const newCount = ordersCache.filter(order => order.status === "new").length;
  if (summary) {
    summary.textContent = `Усього заявок: ${ordersCache.length}. Нових: ${newCount}. Натисніть на телефон для швидкого виклику або переходу в чат.`;
  }
  const count = document.getElementById("ordersNewCount");
  if (count) {
    count.textContent = newCount;
    count.hidden = newCount === 0;
  }
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  if (!orders.length) {
    container.innerHTML = '<div class="empty-orders">Нових заявок поки немає. Коли клієнт заповнить форму, вона з’явиться тут і, за налаштуванням, у Telegram.</div>';
    return;
  }
  const statusOptions = [
    ["new", "Нова"], ["in_progress", "В роботі"], ["done", "Виконано"], ["cancelled", "Неактуальна"]
  ];
  container.innerHTML = `<table class="orders-table"><thead><tr><th>Клієнт</th><th>Послуга / об'єкт</th><th>Адреса</th><th>Дата</th><th>Статус</th></tr></thead><tbody>${orders.map(order => `
    <tr class="${order.status === 'new' ? 'is-new' : ''}">
      <td><div class="order-client">${escapeHtml(order.name)}</div><a href="tel:${escapeHtml(String(order.phone).replace(/[^+\d]/g, ''))}">${escapeHtml(order.phone)}</a></td>
      <td>${escapeHtml(order.service)}<div class="order-meta">${escapeHtml(order.objectType || 'Тип об’єкта не вказано')}</div></td>
      <td>${escapeHtml(order.address || '—')}</td>
      <td>${escapeHtml(order.createdAt || '—')}</td>
      <td><select class="order-status" data-order-status="${escapeHtml(order.id)}">${statusOptions.map(([value, label]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></td>
    </tr>`).join('')}</tbody></table>`;
  container.querySelectorAll("[data-order-status]").forEach(select => select.addEventListener("change", async () => {
    const previous = ordersCache.find(order => order.id === select.dataset.orderStatus)?.status || "new";
    select.disabled = true;
    try {
      const response = await fetch("api/orders.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id: select.dataset.orderStatus, status: select.value })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error();
      await loadOrders();
    } catch {
      // Оновлення в локальному сховищі
      const local = JSON.parse(localStorage.getItem('pdt_orders') || '[]');
      const ord = local.find(o => o.id === select.dataset.orderStatus);
      if (ord) {
        ord.status = select.value;
        localStorage.setItem('pdt_orders', JSON.stringify(local));
      }
      const cached = ordersCache.find(o => o.id === select.dataset.orderStatus);
      if (cached) cached.status = select.value;
      renderOrders(ordersCache);
    } finally { select.disabled = false; }
  }));
}

/** Telegram: токен не зберігається у content.json */
function initTelegramSettings() {
  document.getElementById("telegramSaveBtn")?.addEventListener("click", saveTelegramSettings);
  loadTelegramSettings();
}

function initSecuritySettings() {
  document.getElementById("changePinBtn")?.addEventListener("click", async () => {
    const newPin = getVal("newAdminPin");
    const confirmation = getVal("confirmAdminPin");
    const status = document.getElementById("pinStatus");
    if (newPin !== confirmation) {
      if (status) status.textContent = "PIN-коди не збігаються.";
      return;
    }
    if (!/^\d{6,32}$/.test(newPin)) {
      if (status) status.textContent = "PIN має містити від 6 до 32 цифр.";
      return;
    }
    try {
      const response = await fetch("api/auth.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_pin", newPin })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      document.getElementById("newAdminPin").value = "";
      document.getElementById("confirmAdminPin").value = "";
      if (status) status.textContent = "✓ PIN оновлено.";
    } catch (error) {
      if (status) status.textContent = `Не вдалося оновити PIN: ${error.message || 'перевірте PHP-хостинг'}`;
    }
  });
}

async function loadTelegramSettings() {
  const status = document.getElementById("telegramStatus");
  try {
    const response = await fetch("api/telegram.php", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const data = await response.json();
    setVal("tg_chatId", data.chatId || "");
    if (status) status.textContent = data.configured ? "✓ Telegram налаштовано. Для заміни введіть новий токен." : "Telegram ще не налаштовано.";
  } catch {
    if (status) status.textContent = "Налаштування збережуться після запуску PHP на хостингу.";
  }
}

async function saveTelegramSettings() {
  const token = getVal("tg_botToken");
  const chatId = getVal("tg_chatId");
  const status = document.getElementById("telegramStatus");
  if (!token || !chatId) {
    if (status) status.textContent = "Вкажіть і токен, і Chat ID.";
    return;
  }
  try {
    const response = await fetch("api/telegram.php", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chatId })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message);
    document.getElementById("tg_botToken").value = "";
    if (status) status.textContent = "✓ Telegram налаштовано. Наступні заявки надходитимуть у чат.";
  } catch (error) {
    if (status) status.textContent = `Не вдалося зберегти: ${error.message || 'перевірте PHP-хостинг'}`;
  }
}

/**
 * Обробка збереження та експорту
 */
function initFormActions() {
  const saveBtn = document.getElementById("adminSaveBtn");
  const downloadBtn = document.getElementById("adminDownloadBtn");
  const resetBtn = document.getElementById("adminResetBtn");

  // Збереження (в браузерне сховище + спроба записати на PHP-сервер)
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      setSaveState("Зберігаємо…", "saving");
      saveBtn.disabled = true;
      const dataToSave = collectDataFromForm();
      const jsonString = JSON.stringify(dataToSave, null, 2);

      // 1. Миттєве збереження в localStorage (працює завжди!)
      localStorage.setItem("pdt_site_content", jsonString);

      // 2. Спроба зберегти на сервер через api/save.php (якщо хостинг підтримує PHP)
      let serverSaved = false;
      try {
        const res = await fetch("api/save.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonString
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) serverSaved = true;
        }
      } catch (e) {
        // Сервер PHP не запущений (працюємо в локальному або статичному режимі)
      }

      if (serverSaved) {
        setSaveState("Збережено на сервері", "saved");
        alert("✅ Успішно збережено на сервері (content.json оновлено) та у вашому браузері!");
      } else {
        setSaveState("Збережено лише в цьому браузері", "local");
        alert("✅ Зміни успішно збережено в браузері! Вони вже відображаються на всіх сторінках сайту.\n\nПорада: Якщо ви переноситимете файли на новий сервер без PHP, ви можете натиснути 'Завантажити content.json' та замінити файл у папці data/.");
      }
      saveBtn.disabled = false;
    });
  }

  // Експорт оновленого content.json
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const dataToSave = collectDataFromForm();
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "content.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Скидання змін
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Скинути всі внесені зміни та очистити кеш браузера?")) {
        localStorage.removeItem("pdt_site_content");
        window.location.reload();
      }
    });
  }
}

function initUnsavedState() {
  document.addEventListener("input", event => {
    if (event.target.closest(".admin-container")) setSaveState("Є незбережені зміни", "dirty");
  });
  document.addEventListener("change", event => {
    if (event.target.closest(".admin-container")) setSaveState("Є незбережені зміни", "dirty");
  });
}

function setSaveState(text, state) {
  const status = document.getElementById("adminSaveState");
  if (!status) return;
  status.textContent = text;
  status.dataset.state = state;
}
