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
  const msi = document.getElementById('mobileServicesItem');
  if (msi) msi.classList.remove('open');
}

// ─── DESKTOP SERVICES DROPDOWN ───
const servicesNavItem = document.getElementById('servicesNavItem');
const servicesToggle  = document.getElementById('servicesToggle');

if (servicesToggle && servicesNavItem) {
  servicesToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = servicesNavItem.classList.toggle('open');
    servicesToggle.setAttribute('aria-expanded', isOpen);
  });

  servicesNavItem.querySelectorAll('.services-dropdown a').forEach(function (link) {
    link.addEventListener('click', function () {
      servicesNavItem.classList.remove('open');
      servicesToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!servicesNavItem.contains(e.target)) {
      servicesNavItem.classList.remove('open');
      servicesToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      servicesNavItem.classList.remove('open');
      servicesToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ─── MOBILE SERVICES SUB-MENU ───
const mobileServicesToggle = document.getElementById('mobileServicesToggle');
const mobileServicesItem   = document.getElementById('mobileServicesItem');

if (mobileServicesToggle && mobileServicesItem) {
  mobileServicesToggle.addEventListener('click', function () {
    mobileServicesItem.classList.toggle('open');
  });
}

function scrollToService() {
  if (servicesNavItem) servicesNavItem.classList.remove('open');
}
