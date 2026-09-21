
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initBurgerState();
});

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;


  const savedTheme = localStorage.getItem("nordic_theme");
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
      localStorage.setItem("nordic_theme", newTheme);
    });
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }
}


function initBurgerState() {
  const burgerBtn = document.querySelector(".burger-btn");
  if (!burgerBtn) return;

  burgerBtn.addEventListener("click", () => {
    const isExpanded = burgerBtn.getAttribute("aria-expanded") === "true";
    burgerBtn.setAttribute("aria-expanded", String(!isExpanded));
  });
}
