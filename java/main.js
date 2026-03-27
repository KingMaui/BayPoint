document.addEventListener('DOMContentLoaded', function () {

  // ─── LOADER ───
  const loader = document.getElementById('loader');
  const fill   = document.querySelector('.loader-bar-fill');
  const count  = document.getElementById('loaderCount');

  if (loader && fill && count) {
    let progress = 0;

    const timer = setInterval(function () {
      const remaining = 100 - progress;
      const increment = Math.max(0.4, remaining * 0.055);
      progress = Math.min(100, progress + increment);

      fill.style.width  = progress + '%';
      count.textContent = Math.floor(progress);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(function () {
          loader.classList.add('hidden');
          document.body.classList.add('page-ready');
        }, 300);
      }
    }, 30);
  }

  // ─── DARK MODE TOGGLE ───
  const html      = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const icon      = document.getElementById('themeIcon');
  const label     = document.getElementById('themeLabel');

  function setTheme(dark) {
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (icon)  icon.textContent  = dark ? '☀' : '☾';
    if (label) label.textContent = dark ? 'Light' : 'Dark';
  }

  setTheme(true);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      setTheme(html.getAttribute('data-theme') !== 'dark');
    });
  }

  // ─── NAVBAR SCROLL ───
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ─── HAMBURGER / MOBILE MENU ───
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  window.closeMenu = function () {
    if (hamburger)  hamburger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    const msi = document.getElementById('mobileServicesItem');
    if (msi) msi.classList.remove('open');
  };

  // ─── DESKTOP SERVICES DROPDOWN ───
  const servicesNavItem = document.getElementById('servicesNavItem');
  const servicesToggle  = document.getElementById('servicesToggle');

  function closeDropdown() {
    if (servicesNavItem) servicesNavItem.classList.remove('open');
    if (servicesToggle)  servicesToggle.setAttribute('aria-expanded', 'false');
  }

  if (servicesToggle && servicesNavItem) {
    servicesToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = servicesNavItem.classList.toggle('open');
      servicesToggle.setAttribute('aria-expanded', String(isOpen));
    });

    servicesNavItem.querySelectorAll('.services-dropdown a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeDropdown();
        const target = document.getElementById('services');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.addEventListener('click', function (e) {
      if (!servicesNavItem.contains(e.target)) closeDropdown();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDropdown();
    });
  }

  // ─── MOBILE SERVICES SUB-MENU ───
  const mobileServicesToggle = document.getElementById('mobileServicesToggle');
  const mobileServicesItem   = document.getElementById('mobileServicesItem');

  if (mobileServicesToggle && mobileServicesItem) {
    mobileServicesToggle.addEventListener('click', function () {
      mobileServicesItem.classList.toggle('open');
    });

    mobileServicesItem.querySelectorAll('.mobile-sub-links a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.closeMenu();
        const target = document.getElementById('services');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

});
