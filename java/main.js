// ─── DARK MODE ───
const themeToggle = document.getElementById('themeToggle');
const icon = themeToggle.querySelector('.icon');
const label = themeToggle.querySelector('.label');

// Load saved preference, fallback to system preference
const saved = localStorage.getItem('bp-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialDark = saved ? saved === 'dark' : prefersDark;

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  icon.textContent = dark ? '☀' : '☾';
  label.textContent = dark ? 'Light' : 'Dark';
  localStorage.setItem('bp-theme', dark ? 'dark' : 'light');
}

applyTheme(initialDark);

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
});

// ─── NAVBAR SCROLL ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ─── HAMBURGER / MOBILE MENU ───
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}
