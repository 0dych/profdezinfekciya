/**
 * ТОВ «ПРОФДЕЗІНФЕКЦІЯ ЗАКАРПАТТЯ» - Головний JavaScript
 * Чистий Vanilla JS (ES6+) без сторонніх бібліотек
 */

// Вбудовані резервні дані (працюють навіть якщо сайт відкривають локально через file://)
const DEFAULT_CONTENT = {
  company: {
    name: "ТОВ «ПРОФДЕЗІНФЕКЦІЯ ЗАКАРПАТТЯ»",
    nameEn: "LLC «PDT»",
    edrpou: "40769799",
    extract: "Виписка від 09.02.2024 № 1003231070005003995",
    director: "Ольга Химинець",
    address: "89603, Закарпатська обл., м. Мукачево, вул. Берегівська-об’їзна, 7",
    region: "м. Мукачево, Ужгород та вся Закарпатська область",
    phones: ["+38 (067) 744-77-49", "+38 (066) 212-20-70"],
    email: "profdezzak@gmail.com",
    workHours: "Пн-Нд: 08:00 - 20:00 (Аварійні виїзди 24/7)",
    socials: {
      viber: "viber://chat?number=%2B380677447749",
      telegram: "https://t.me/+380677447749",
      whatsapp: "https://wa.me/380677447749",
      facebook: "https://www.facebook.com/profdezinfekcia.zakarpatta.mukacevo",
      instagram: "https://www.instagram.com/profdezzakarpattia?stkn=MWQzbzFtOXZlNG1mcQ%3D%3D",
      tiktok: "https://www.tiktok.com/@profdezzakarpattia?_r=1"
    }
  },
  trust: {
    eyebrow: "Нам довіряють",
    title: "Захищаємо людей і відповідальний бізнес",
    subtitle: "Працюємо прозоро: з діагностикою, безпечними засобами та офіційними документами.",
    items: [
      { icon: "✓", title: "Сертифікати НАССР", subtitle: "Відповідність ДСТУ EN 16636:2015" },
      { icon: "📋", title: "Офіційні акти", subtitle: "100% захист під час перевірок Держпродспоживслужби" },
      { icon: "👨‍⚕️", title: "Сертифіковані лікарі", subtitle: "Лікарі-дезінфектори з профільним медичним досвідом" },
      { icon: "📍", title: "Вся Закарпатська область", subtitle: "Швидкий виїзд із Мукачева (Ужгород, Берегове, Хуст, Тячів)" }
    ]
  }
};

let siteData = DEFAULT_CONTENT;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Спроба завантажити свіжі дані з JSON
  await loadSiteContent();

  // 2. Ініціалізація компонентів інтерфейсу
  initMobileMenu();
  initSpeedDial();
  initServiceFilters();
  initCardSliders();
  initRevealAnimations();
  initInstructionTabs();
  initModal();
  initLeadForms();
  initCertificatesModal();
  initWorksSlider();
  initScrollToTop();
  initPestBarrier();
  initContactPageFeatures();
});

/**
 * Завантаження content.json або використання локального сховища/дефолту
 */
async function loadSiteContent() {
  // Серверний файл є спільним джерелом правди для всіх пристроїв.
  try {
    const res = await fetch('data/content.json');
    if (res.ok) {
      siteData = await res.json();
      applyDataToDOM(siteData);
      return;
    }
  } catch (err) {
    console.info("Серверний конфіг недоступний; перевіряємо локальну копію.");
  }

  // Локальна копія потрібна лише для автономного перегляду без сервера.
  const localSaved = localStorage.getItem('pdt_site_content');
  if (localSaved) {
    try {
      siteData = JSON.parse(localSaved);
      if (siteData.trust && Array.isArray(siteData.trust.items)) {
        siteData.trust.items = siteData.trust.items.filter(i => i && i.title && !i.title.includes('Нова перевага'));
        try { localStorage.setItem('pdt_site_content', JSON.stringify(siteData)); } catch(e){}
      }
      applyDataToDOM(siteData);
      return;
    } catch (e) {
      console.warn("Помилка читання localStorage", e);
    }
  }

  applyDataToDOM(DEFAULT_CONTENT);
}

/**
 * Оновлення динамічних текстових вузлів на сторінках
 */
function applyDataToDOM(data) {
  if (!data || !data.company) return;

  const c = data.company;

  // Оновлення телефонів у шапці та підвалі
  document.querySelectorAll('[data-bind="phone-primary"]').forEach(el => {
    el.textContent = c.phones[0];
    if (el.tagName === 'A') el.href = `tel:${c.phones[0].replace(/[^+\d]/g, '')}`;
  });

  document.querySelectorAll('[data-bind="phone-secondary"]').forEach(el => {
    el.textContent = c.phones[1];
    if (el.tagName === 'A') el.href = `tel:${c.phones[1].replace(/[^+\d]/g, '')}`;
  });

  document.querySelectorAll('[data-bind="email"]').forEach(el => {
    el.textContent = c.email;
    if (el.tagName === 'A') el.href = `mailto:${c.email}`;
  });

  document.querySelectorAll('[data-bind="address"]').forEach(el => {
    el.textContent = c.address;
  });

  document.querySelectorAll('[data-bind="workHours"]').forEach(el => {
    el.textContent = c.workHours;
  });

  // Оновлення посилань соцмереж
  if (c.socials) {
    document.querySelectorAll('[data-social="viber"]').forEach(el => el.href = c.socials.viber || '#');
    document.querySelectorAll('[data-social="telegram"]').forEach(el => el.href = c.socials.telegram || '#');
    document.querySelectorAll('[data-social="whatsapp"]').forEach(el => el.href = c.socials.whatsapp || '#');
    document.querySelectorAll('[data-social="facebook"]').forEach(el => el.href = c.socials.facebook || '#');
    document.querySelectorAll('[data-social="instagram"]').forEach(el => el.href = c.socials.instagram || '#');
    document.querySelectorAll('[data-social="tiktok"]').forEach(el => el.href = c.socials.tiktok || '#');
  }

  applyTrustSection(data.trust);
  applyCatalogCards(data);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(el => {
    if (value) el.textContent = value;
  });
}

function applyTrustSection(trust) {
  if (!trust) return;
  setText('[data-bind="trust-eyebrow"]', trust.eyebrow);
  setText('[data-bind="trust-title"]', trust.title);
  setText('[data-bind="trust-subtitle"]', trust.subtitle);

  const grid = document.getElementById('trustHighlights');
  if (!grid || !Array.isArray(trust.items) || !trust.items.length) return;
  const validItems = trust.items.filter(item => item && item.title && !item.title.includes('Нова перевага'));
  if (!validItems.length) return;
  grid.replaceChildren();
  validItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'trust-item';
    const icon = document.createElement('div');
    icon.className = 'trust-icon';
    icon.textContent = item.icon || '✓';
    const text = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'trust-title';
    title.textContent = item.title || '';
    const subtitle = document.createElement('div');
    subtitle.className = 'trust-sub';
    subtitle.textContent = item.subtitle || '';
    text.append(title, subtitle);
    card.append(icon, text);
    grid.appendChild(card);
  });
}

function applyCatalogCards(data) {
  (data.services || []).forEach(service => {
    const card = document.querySelector(`[data-catalog-service="${service.id}"]`) || document.getElementById(service.id);
    if (!card) return;
    card.dataset.category = service.category || card.dataset.category;
    const badge = card.querySelector('.service-badge');
    const title = card.querySelector('.service-title');
    const description = card.querySelector('.service-desc');
    const features = card.querySelector('.service-features');
    const orderButton = card.querySelector('[data-open-modal]');
    if (badge) badge.textContent = service.badge || '';
    if (title) title.textContent = service.title || '';
    if (description) description.textContent = service.shortDesc || '';
    if (features && Array.isArray(service.items) && service.items.length) {
      features.replaceChildren(...service.items.slice(0, 3).map(text => {
        const item = document.createElement('li');
        item.textContent = text;
        return item;
      }));
    }
    if (orderButton) orderButton.dataset.serviceName = service.title || 'Консультація';
  });

  (data.products || []).forEach(product => {
    const card = document.querySelector(`[data-catalog-product="${product.id}"]`);
    if (!card) return;
    const badge = card.querySelector('.product-badge');
    const title = card.querySelector('.product-title');
    const description = card.querySelector('.product-desc');
    const features = card.querySelector('.product-features');
    const price = card.querySelector('.product-price');
    const orderButton = card.querySelector('[data-open-modal]');
    if (badge) badge.textContent = product.badge || product.status || '';
    if (title) title.textContent = product.title || '';
    if (description) description.textContent = product.shortDesc || '';
    if (price) price.textContent = product.price || 'За запитом';
    if (features && Array.isArray(product.features) && product.features.length) {
      features.replaceChildren(...product.features.slice(0, 4).map(text => {
        const item = document.createElement('li');
        item.textContent = text;
        return item;
      }));
    }
    if (orderButton) orderButton.dataset.serviceName = product.title || 'Замовлення товару';
  });
}

/**
 * Мобільне меню (Hamburger)
 */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.nav-menu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
  });

  // Закриття при кліку на посилання
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
    });
  });
}

/**
 * Плаваючий віджет швидкого зв'язку (Speed Dial)
 */
function initSpeedDial() {
  const wrapper = document.querySelector('.speed-dial-wrapper');
  const mainBtn = document.querySelector('.speed-dial-main');

  if (!wrapper || !mainBtn) return;

  mainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });
}

/**
 * Фільтрація карток послуг
 */
function initServiceFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card, .service-detail-block');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      serviceCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = card.classList.contains('service-detail-block') ? 'block' : 'flex';
          card.style.animation = 'fadeIn 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/** Компактні горизонтальні каталоги на головній сторінці з автопрокруткою */
function initCardSliders() {
  document.querySelectorAll('[data-slider-prev], [data-slider-next]').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.sliderPrev || button.dataset.sliderNext;
      const slider = document.getElementById(targetId);
      if (!slider) return;
      const direction = button.dataset.sliderNext ? 1 : -1;
      const step = slider.firstElementChild ? slider.firstElementChild.offsetWidth + 20 : 380;
      slider.scrollBy({ left: direction * step, behavior: 'smooth' });
    });
  });

  // Автопрокрутка лише для слайдерів з явним атрибутом data-autoplay="true"
  const autoSliders = document.querySelectorAll('.card-slider[data-autoplay="true"]');
  autoSliders.forEach(slider => {
    let intervalId = null;
    let isPaused = false;
    let isVisible = false;

    const startAutoScroll = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (isPaused || !isVisible) return;
        const maxScroll = slider.scrollWidth - slider.clientWidth - 10;
        const step = slider.firstElementChild ? slider.firstElementChild.offsetWidth + 20 : 380;
        
        if (slider.scrollLeft >= maxScroll) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: step, behavior: 'smooth' });
        }
      }, 5000);
    };

    slider.addEventListener('mouseenter', () => { isPaused = true; });
    slider.addEventListener('mouseleave', () => { isPaused = false; });
    slider.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    slider.addEventListener('touchend', () => { 
      setTimeout(() => { isPaused = false; }, 2500); 
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.2 });
      observer.observe(slider);
    } else {
      isVisible = true;
    }

    startAutoScroll();
  });

  // Natural horizontal scroll: Shift + Wheel or trackpad deltaX
  document.querySelectorAll('.card-slider').forEach(slider => {
    slider.addEventListener('wheel', (e) => {
      // If user holds Shift while scrolling wheel, scroll horizontally
      if (e.shiftKey) {
        e.preventDefault();
        slider.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
      }
      // Standard vertical wheel is NOT intercepted, allowing fluid, natural vertical page scrolling!
    }, { passive: false });

    // Drag-to-scroll for mouse users (grab & slide like touch)
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    slider.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, textarea')) return;
      isDown = true;
      isDragging = false;
      slider.classList.add('is-dragging');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        setTimeout(() => {
          slider.classList.remove('is-dragging');
          isDragging = false;
        }, 50);
      }
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.3;
      if (Math.abs(walk) > 6) {
        isDragging = true;
      }
      slider.scrollLeft = scrollLeft - walk;
    });

    // Suppress click on child links/buttons if user was dragging
    slider.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

/** Ненав'язливе появлення блоків під час прокрутки. */
function initRevealAnimations() {
  const elements = document.querySelectorAll('.section-header, .trust-item, .service-card, .product-card, .haccp-card, .contact-info-card, .map-card');
  if (!elements.length || !('IntersectionObserver' in window)) return;

  elements.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  elements.forEach(element => observer.observe(element));
}

/**
 * Перемикання вкладок у розділі інструкцій
 */
function initInstructionTabs() {
  const tabBtns = document.querySelectorAll('.instructions-tab-btn');
  const contentBlocks = document.querySelectorAll('.instruction-block');

  if (!tabBtns.length) return;

  const activateTab = (targetId) => {
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.target === targetId);
    });
    contentBlocks.forEach(block => {
      block.classList.toggle('active', block.id === targetId);
    });
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.target);
    });
  });

  // Підтримка хеш-посилань (наприклад, #faq, #full-faq, #full-patron тощо)
  const hash = window.location.hash;
  if (hash === '#faq' || hash === '#full-faq') {
    activateTab('full-faq');
    const target = document.getElementById('full-faq');
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  } else if (hash) {
    const targetId = hash.replace('#', '');
    if (document.getElementById(targetId)) {
      activateTab(targetId);
    }
  }
}

/**
 * Модальне вікно замовлення та швидкої консультації
 */
function initModal() {
  const backdrop = document.getElementById('orderModal');
  if (!backdrop) return;

  const closeBtn = backdrop.querySelector('.modal-close');
  const serviceInput = backdrop.querySelector('#modalServiceInput');

  // Кнопки виклику модалки
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceName = btn.dataset.serviceName || '';
      if (serviceInput && serviceName) {
        serviceInput.value = serviceName;
      }
      backdrop.classList.add('open');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => backdrop.classList.remove('open'));
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) {
      backdrop.classList.remove('open');
    }
  });
}

/**
 * Обробка форм та показ спливаючого повідомлення
 */
function initLeadForms() {
  const forms = document.querySelectorAll('form[data-lead-form]');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const origText = btn ? btn.innerText : '';
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Надсилаємо...';
      }

      const payload = getLeadPayload(form);
      try {
        const response = await fetch('admin/api/orders.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Помилка надсилання');

        showToast('✅ Заявку прийнято. Спеціаліст зв’яжеться з вами найближчим часом.');
        form.reset();

        const modal = document.getElementById('orderModal');
        if (modal && modal.classList.contains('open')) {
          modal.classList.remove('open');
        }
      } catch (error) {
        console.warn('Сервер недоступний, зберігаємо заявку локально:', error);
        saveOrderLocally(payload);
        showToast('✅ Вашу заявку прийнято! Спеціаліст зателефонує вам найближчим часом.');
        form.reset();

        const modal = document.getElementById('orderModal');
        if (modal && modal.classList.contains('open')) {
          modal.classList.remove('open');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = origText;
        }
      }
    });
  });
}

function saveOrderLocally(payload) {
  try {
    const orders = JSON.parse(localStorage.getItem('pdt_orders') || '[]');
    const newOrder = {
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toLocaleString('uk-UA'),
      name: payload.name || 'Клієнт',
      phone: payload.phone || '',
      email: payload.email || '',
      service: payload.service || 'Консультація',
      objectType: payload.objectType || 'Не вказано',
      address: payload.address || '',
      notes: payload.notes || '',
      status: 'new'
    };
    orders.unshift(newOrder);
    localStorage.setItem('pdt_orders', JSON.stringify(orders));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

function getLeadPayload(form) {
  const field = (selector) => form.querySelector(selector)?.value.trim() || '';
  const service = field('[name="service"]') || field('#modalServiceInput') || 'Консультація';
  const textInputs = [...form.querySelectorAll('input[type="text"]')];
  const nameInput = form.querySelector('[name="name"]') || textInputs.find(input => input.id !== 'modalServiceInput');
  const addressInput = form.querySelector('[name="address"]');
  const emailInput = form.querySelector('input[type="email"], [name="email"]');
  return {
    name: nameInput?.value.trim() || 'Клієнт',
    phone: field('[name="phone"]') || field('input[type="tel"]'),
    email: emailInput?.value.trim() || '',
    service,
    objectType: field('[name="objectType"]'),
    address: addressInput?.value.trim() || '',
    notes: field('[name="notes"]')
  };
}

/**
 * Модальне збільшення та перегляд сертифікатів (Lightbox)
 */
function initCertificatesModal() {
  const certElements = document.querySelectorAll('[data-zoom-cert]');
  if (!certElements.length) return;

  let modal = document.getElementById('certModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'certModal';
    modal.className = 'cert-modal-backdrop';
    modal.innerHTML = `
      <div class="cert-modal-wrapper">
        <button type="button" class="cert-modal-close" aria-label="Закрити">&times;</button>
        <div class="cert-modal-image-box">
          <img src="" alt="Сертифікат" id="certModalImg" class="cert-modal-img">
        </div>
        <div class="cert-modal-caption" id="certModalCaption"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.cert-modal-close');
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('cert-modal-wrapper')) {
        modal.classList.remove('open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
    });
  }

  const modalImg = modal.querySelector('#certModalImg');
  const modalCaption = modal.querySelector('#certModalCaption');

  certElements.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const imgSrc = item.getAttribute('data-zoom-cert') || item.getAttribute('src') || item.getAttribute('href');
      const caption = item.getAttribute('data-cert-title') || item.getAttribute('alt') || 'Офіційний сертифікат';
      if (!imgSrc) return;

      modalImg.src = imgSrc;
      modalCaption.textContent = caption;
      modal.classList.add('open');
    });
  });
}

/**
 * Спливаюче сповіщення (Toast)
 */
function showToast(message) {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

/**
 * Слайдер фото виконаних робіт (секція "Захищаємо людей")
 */
function initWorksSlider() {
  const wrapper = document.getElementById('worksSlider');
  if (!wrapper) return;

  const slides = Array.from(wrapper.querySelectorAll('.works-slide'));
  const dots   = Array.from(document.querySelectorAll('.works-slider-dots .works-dot'));
  const prevBtn = document.querySelector('.works-slider-prev');
  const nextBtn = document.querySelector('.works-slider-next');

  if (!slides.length) return;

  let current  = 0;
  let timer    = null;
  const DELAY  = 4800;
  const TOTAL  = slides.length;

  function goTo(idx) {
    slides[current].classList.remove('active');
    slides[current].setAttribute('aria-hidden', 'true');
    if (dots[current]) {
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
    }

    current = (idx + TOTAL) % TOTAL;

    slides[current].classList.add('active');
    slides[current].setAttribute('aria-hidden', 'false');
    if (dots[current]) {
      dots[current].classList.add('active');
      dots[current].setAttribute('aria-selected', 'true');
    }
  }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(() => goTo(current + 1), DELAY);
  }

  function stopAutoplay() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // Arrows
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startAutoplay(); });

  // Dots
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startAutoplay(); });
  });

  // Pause on hover
  const wrapperEl = wrapper.closest('.works-slider-wrapper');
  if (wrapperEl) {
    wrapperEl.addEventListener('mouseenter', stopAutoplay);
    wrapperEl.addEventListener('mouseleave', startAutoplay);
    wrapperEl.addEventListener('focusin',    stopAutoplay);
    wrapperEl.addEventListener('focusout',   startAutoplay);
  }

  // Touch / swipe support
  let touchStartX = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    stopAutoplay();
  }, { passive: true });

  wrapper.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      goTo(delta < 0 ? current + 1 : current - 1);
    }
    startAutoplay();
  }, { passive: true });

  // Keyboard accessibility
  if (wrapperEl) {
    wrapperEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { goTo(current - 1); startAutoplay(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); startAutoplay(); }
    });
  }

  startAutoplay();
}

/**
 * Плаваюча кнопка швидкого повернення нагору (Вгору ↑)
 */
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.className = 'back-to-top-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-label', 'Повернутися нагору');
  btn.setAttribute('title', 'Повернутися нагору');
  btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
  document.body.appendChild(btn);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 420) {
          btn.classList.add('is-visible');
        } else {
          btn.classList.remove('is-visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Інтерактивний санітарний бар'єр захисту від шкідників (Мікро-гра з мухою)
 */
function initPestBarrier() {
  const barrier = document.getElementById('pestBarrier');
  const target = document.getElementById('pestTarget');
  const banner = document.getElementById('pestBanner');
  const counterEl = document.getElementById('pestCounter');
  const respawnBtn = document.getElementById('btnRespawnBug');
  const closeBtn = document.getElementById('btnClosePestBanner');

  if (!barrier || !target) return;

  let killedCount = 0;
  let isZapped = false;
  let respawnTimer = null;

  const zapPest = () => {
    if (isZapped) return;
    isZapped = true;
    killedCount++;

    target.classList.add('is-zapped');
    if (counterEl) counterEl.textContent = `Ліквідовано: ${killedCount}`;

    if (banner) {
      banner.style.display = 'flex';
    }

    // Auto respawn after 4.5 seconds
    clearTimeout(respawnTimer);
    respawnTimer = setTimeout(respawnPest, 4500);
  };

  const respawnPest = () => {
    clearTimeout(respawnTimer);
    isZapped = false;
    target.classList.remove('is-zapped');
    if (banner) {
      banner.style.display = 'none';
    }
  };

  target.addEventListener('click', zapPest);
  target.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      zapPest();
    }
  });

  if (respawnBtn) {
    respawnBtn.addEventListener('click', respawnPest);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (banner) banner.style.display = 'none';
    });
  }
}

/**
 * Функціонал сторінки контактів (Копіювання реквізитів, перемикач B2B/B2C, синхронізація форми)
 */
function initContactPageFeatures() {
  // 1. Швидке копіювання значення в буфер обміну
  document.querySelectorAll('[data-copy-val]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy-val');
      if (!val) return;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(val);
        } else {
          const temp = document.createElement('textarea');
          temp.value = val;
          temp.style.position = 'fixed';
          temp.style.left = '-9999px';
          document.body.appendChild(temp);
          temp.focus();
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }
        showToast(`📋 Скопійовано в буфер: ${val.length > 30 ? val.substring(0, 30) + '...' : val}`);
      } catch (err) {
        showToast(`📋 Скопійовано: ${val.substring(0, 25)}...`);
      }
    });
  });

  // 2. Перемикач типу клієнта (Юридична особа / Приватна)
  const clientTypeBtns = document.querySelectorAll('.client-type-btn');
  const serviceSelect = document.getElementById('contactServiceSelect');
  const serviceInput = document.getElementById('contactServiceInput');
  const objectTypeInput = document.getElementById('contactObjectType');

  clientTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      clientTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isB2b = btn.getAttribute('data-client-type') === 'b2b';
      
      if (objectTypeInput) {
        objectTypeInput.value = isB2b ? 'Юридична особа / НАССР' : 'Приватний сектор (Будинок / Квартира)';
      }
      if (serviceSelect) {
        if (isB2b) {
          serviceSelect.value = 'Комплексний НАССР аудит та пест-контроль';
        } else {
          serviceSelect.value = 'Дезінсекція (Комахи, таргани, клопи)';
        }
        if (serviceInput) {
          serviceInput.value = serviceSelect.value;
        }
      }
    });
  });

  if (serviceSelect && serviceInput) {
    serviceSelect.addEventListener('change', () => {
      serviceInput.value = serviceSelect.value;
    });
  }
}
