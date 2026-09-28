document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initBurgerMenu();
  initSlider();
  initCatalog();
});

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;

  const savedTheme =
    localStorage.getItem("fjord_theme") || localStorage.getItem("nordic_theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const initialTheme = savedTheme
    ? savedTheme
    : systemPrefersDark
      ? "dark"
      : "light";

  applyTheme(initialTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentTheme = root.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem("fjord_theme", newTheme);
    });
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }
}

function initBurgerMenu() {
  const burgerBtn = document.getElementById("burger-btn");
  const nav = document.getElementById("main-nav");
  const body = document.body;

  if (!burgerBtn || !nav) return;

  function toggleMenu(forceClose = false) {
    const isOpened = forceClose ? false : !nav.classList.contains("open");

    burgerBtn.classList.toggle("active", isOpened);
    nav.classList.toggle("open", isOpened);
    burgerBtn.setAttribute("aria-expanded", String(isOpened));
    body.classList.toggle("scroll-locked", isOpened);
  }

  burgerBtn.addEventListener("click", () => toggleMenu());

  nav.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", () => toggleMenu(true));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      toggleMenu(true);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && nav.classList.contains("open")) {
      toggleMenu(true);
    }
  });
}

function initSlider() {
  const track = document.querySelector(".slider-track");
  const slides = document.querySelectorAll(".slide-card");
  const prevBtn = document.querySelector(".slider-btn--prev");
  const nextBtn = document.querySelector(".slider-btn--next");
  const dots = document.querySelectorAll(".slider-dot");

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  function moveToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });
  }

  if (nextBtn)
    nextBtn.addEventListener("click", () => moveToSlide(currentIndex + 1));
  if (prevBtn)
    prevBtn.addEventListener("click", () => moveToSlide(currentIndex - 1));

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => moveToSlide(i));
  });

  let touchStartX = 0;
  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );

  track.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) moveToSlide(currentIndex + 1);
      else moveToSlide(currentIndex - 1);
    }
  });
}

function initCatalog() {
  const grid = document.getElementById("catalog-grid");
  const tabs = document.querySelectorAll(".tab-btn");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const moreContainer = document.getElementById("catalog-more-container");

  if (!grid || typeof PRODUCTS === "undefined") return;

  let currentCategory = "filter";
  let isExpanded = false;

  function getLimit() {
    return window.innerWidth <= 768 ? 4 : 8;
  }

  function renderCards() {
    const filtered = PRODUCTS.filter(
      (item) => item.category === currentCategory,
    );
    const limit = getLimit();
    const visibleProducts = isExpanded ? filtered : filtered.slice(0, limit);

    grid.innerHTML = visibleProducts
      .map(
        (product) => `
      <article class="product-card" data-id="${product.id}" tabindex="0" role="button" aria-label="${product.name}">
        <div class="product-card__thumb">
          <span class="product-card__tag">${product.tag}</span>
          <img src="${product.image}" alt="${product.name}" class="product-card__img" loading="lazy">
        </div>
        <div class="product-card__body">
          <span class="product-card__sub">${product.origin}</span>
          <h2 class="product-card__title">${product.name}</h2>
          <p class="product-card__desc">${product.description}</p>
          <div class="product-card__footer">
            <span class="product-card__price">$${product.price.toFixed(2)}</span>
            <button class="btn btn--outline" type="button">В корзину</button>
          </div>
        </div>
      </article>
    `,
      )
      .join("");

    if (moreContainer && loadMoreBtn) {
      if (!isExpanded && filtered.length > limit) {
        moreContainer.style.display = "flex";
      } else {
        moreContainer.style.display = "none";
      }
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      currentCategory = tab.dataset.category;
      isExpanded = false;
      renderCards();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      isExpanded = true;
      renderCards();
    });
  }

  window.addEventListener("resize", () => {
    if (!isExpanded) {
      renderCards();
    }
  });

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const productId = card.dataset.id;
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product) openModal(product);
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const card = e.target.closest(".product-card");
      if (!card) return;
      const product = PRODUCTS.find((p) => p.id === card.dataset.id);
      if (product) openModal(product);
    }
  });

  renderCards();
  initModalListeners();
}

let activeModalProduct = null;
let selectedSizeIndex = 0;
let selectedGrindIndex = 0;

function openModal(product) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalBody = document.getElementById("modal-body");
  if (!modalOverlay || !modalBody) return;

  activeModalProduct = product;
  selectedSizeIndex = 0;
  selectedGrindIndex = 0;

  renderModalContent();

  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("scroll-locked");
}

function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (!modalOverlay || !modalOverlay.classList.contains("open")) return;

  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("scroll-locked");
  activeModalProduct = null;
}

function renderModalContent() {
  const modalBody = document.getElementById("modal-body");
  if (!modalBody || !activeModalProduct) return;

  const p = activeModalProduct;
  const currentPrice =
    p.price +
    p.sizes[selectedSizeIndex].extra +
    p.grinds[selectedGrindIndex].extra;

  modalBody.innerHTML = `
    <div class="modal-preview">
      <img src="${p.image}" alt="${p.name}" class="modal-preview__img">
    </div>
    <div class="modal-info">
      <span class="product-card__sub">${p.origin}</span>
      <h3 class="modal-title">${p.name}</h3>
      <p class="modal-desc">${p.description}</p>
      
      <div class="modal-options-block">
        <span class="modal-label">Размер / Вес упаковки:</span>
        <div class="modal-pills" id="modal-sizes">
          ${p.sizes
            .map(
              (s, idx) => `
            <button class="pill-btn ${idx === selectedSizeIndex ? "active" : ""}" type="button" data-type="size" data-index="${idx}">
              ${s.name}
            </button>
          `,
            )
            .join("")}
        </div>
      </div>

      <div class="modal-options-block">
        <span class="modal-label">Помол / Комплектация:</span>
        <div class="modal-pills" id="modal-grinds">
          ${p.grinds
            .map(
              (g, idx) => `
            <button class="pill-btn ${idx === selectedGrindIndex ? "active" : ""}" type="button" data-type="grind" data-index="${idx}">
              ${g.name}
            </button>
          `,
            )
            .join("")}
        </div>
      </div>

      <div class="modal-total">
        <span class="modal-total__label">Итоговая стоимость:</span>
        <span class="modal-total__price" id="modal-price">$${currentPrice.toFixed(2)}</span>
      </div>
    </div>
  `;
}

function initModalListeners() {
  const modalOverlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  const modalBody = document.getElementById("modal-body");

  if (!modalOverlay) return;

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
      closeModal();
    }
  });

  if (modalBody) {
    modalBody.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn || !activeModalProduct) return;

      const type = btn.dataset.type;
      const idx = parseInt(btn.dataset.index, 10);

      if (type === "size") {
        selectedSizeIndex = idx;
      } else if (type === "grind") {
        selectedGrindIndex = idx;
      }

      renderModalContent();
    });
  }
}
