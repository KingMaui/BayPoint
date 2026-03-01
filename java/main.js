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

// Start light
setTheme(false);

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
