// ─── LOADER ───
(function () {
  const loader = document.getElementById('loader');
  const fill   = document.querySelector('.loader-bar-fill');
  const count  = document.getElementById('loaderCount');

  let progress = 0;
  const duration = 1800; // ms total
  const interval = 30;   // tick every 30ms
  const steps = duration / interval;

  const timer = setInterval(() => {
    // Ease-out curve: fast start, slow end
    const remaining = 100 - progress;
    const increment = Math.max(0.4, remaining * 0.055);
    progress = Math.min(100, progress + increment);

    fill.style.width  = progress + '%';
    count.textContent = Math.floor(progress);

    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('page-ready');
      }, 300);
    }
  }, interval);
})();

// ─── DARK MODE TOGGLE ───
const html = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');
const icon = document.getElementById('themeIcon');
const label = document.getElementById('themeLabel');

function setTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  icon.textContent = dark ? '☀' : '☾';
  label.textContent = dark ? 'Light' : 'Dark';
}

// Start dark
setTheme(true);

toggleBtn.addEventListener('click', function () {
  const isDark = html.getAttribute('data-theme') === 'dark';
  setTheme(!isDark);
});

// ─── NAVBAR SCROLL ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function () {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ─── HAMBURGER / MOBILE MENU ───
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', function () {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}
