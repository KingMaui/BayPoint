/* =====================================================
   Weekend Birdie — main.js
   Auth: PocketBase (pb.js must load before this)
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  restoreSession();
  initModalClose();
  if (document.getElementById('world-map-container')) initWorldMap();
});

/* ── NAV SCROLL ─────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ── MODAL ───────────────────────────────────────── */
function openModal(e, tab) {
  if (e) e.preventDefault();
  document.getElementById('modal-overlay').classList.add('open');
  switchTab(tab === 'signup' ? 'signup' : 'login');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function initModalClose() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (!overlay.classList.contains('open')) return;
    const loginForm = document.getElementById('login-form');
    if (loginForm && loginForm.style.display !== 'none') doLogin();
    else doSignup();
  });
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
}

/* ── AUTH — PocketBase ───────────────────────────── */
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showNavToast('Please fill in both fields.'); return; }

  const btn = document.querySelector('#login-form .modal-btn');
  btn.textContent = 'Logging in...'; btn.disabled = true;

  try {
    const user     = await PB.login(email, pass);
    const name     = user.name || email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    closeModal();
    applyLoggedInState(initials, name);
    showNavToast('Welcome back, ' + name.split(' ')[0] + '! ⛳');
  } catch(err) {
    showNavToast(err.message || 'Login failed. Check your email and password.');
  } finally {
    btn.textContent = 'Log in'; btn.disabled = false;
  }
}

async function doSignup() {
  const first = document.getElementById('signup-first').value.trim();
  const last  = document.getElementById('signup-last').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  if (!first || !email || !pass) { showNavToast('Please fill in all required fields.'); return; }
  if (pass.length < 8) { showNavToast('Password must be at least 8 characters.'); return; }

  const btn = document.querySelector('#signup-form .modal-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;

  try {
    const user     = await PB.signup(first, last, email, pass);
    const name     = user.name || first;
    const initials = (first[0] + (last ? last[0] : '')).toUpperCase();
    closeModal();
    applyLoggedInState(initials, name);
    showNavToast('Welcome, ' + first + '! ⛳');
  } catch(err) {
    showNavToast(err.message || 'Signup failed. That email may already be in use.');
  } finally {
    btn.textContent = 'Create account'; btn.disabled = false;
  }
}

function applyLoggedInState(initials, name) {
  const el = id => document.getElementById(id);
  if (el('avatar-initials')) el('avatar-initials').textContent = initials;
  if (el('profile-avatar'))  el('profile-avatar').classList.add('visible');
  if (el('btn-login-nav'))   el('btn-login-nav').style.display  = 'none';
  if (el('btn-signup-nav'))  el('btn-signup-nav').style.display = 'none';
}

function logout() {
  PB.logout();
  const el = id => document.getElementById(id);
  if (el('profile-avatar')) el('profile-avatar').classList.remove('visible');
  if (el('btn-login-nav'))  el('btn-login-nav').style.display  = '';
  if (el('btn-signup-nav')) el('btn-signup-nav').style.display = '';
  if (el('profile-dropdown')) el('profile-dropdown').classList.remove('open');
}

function toggleProfileDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('open');
}

function restoreSession() {
  document.addEventListener('click', e => {
    const avatar = document.getElementById('profile-avatar');
    if (avatar && !avatar.contains(e.target)) {
      document.getElementById('profile-dropdown')?.classList.remove('open');
    }
  });
  if (PB.isLoggedIn()) {
    const user     = PB.getUser();
    const name     = user.name || user.email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    applyLoggedInState(initials, name);
  }
}

/* ── TOAST ───────────────────────────────────────── */
let _toastTimer;
function showNavToast(msg) {
  let t = document.getElementById('nav-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'nav-toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--green-deep);color:#fff;padding:14px 24px;border-radius:10px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:500;z-index:9999;transition:transform 0.3s ease,opacity 0.3s ease;opacity:0;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => {
    t.style.transform = 'translateX(-50%) translateY(0)';
    t.style.opacity   = '1';
  });
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.style.transform = 'translateX(-50%) translateY(80px)';
    t.style.opacity   = '0';
  }, 3000);
}

/* ── CONTACT FORM ────────────────────────────────── */
function submitContact(e) {
  e.preventDefault();
  showNavToast("Message sent! We'll be in touch soon.");
  e.target.reset();
}

/* ── WORLD MAP (D3) ──────────────────────────────── */
const LIVE_COUNTRY_IDS   = new Set(['840']);
const COMING_COUNTRY_IDS = new Set(['826','372','036','554','276','250','724','356','392']);

function initWorldMap() {
  const container = document.getElementById('world-map-container');
  if (!container) return;
  if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
    setTimeout(initWorldMap, 100); return;
  }
  const width  = container.clientWidth  || 640;
  const height = container.clientHeight || 340;
  const svg = d3.select('#world-map-svg')
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  const projection = d3.geoNaturalEarth1()
    .scale(width / 6.2).translate([width / 2, height / 1.85]);
  const path    = d3.geoPath().projection(projection);
  const tooltip = d3.select('#map-tooltip');

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries);
      const borders   = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
      svg.append('path').datum(d3.geoGraticule()()).attr('d', path)
        .attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', '0.5');
      svg.selectAll('.country').data(countries.features).enter().append('path')
        .attr('class', 'country').attr('d', path)
        .attr('fill', d => {
          const id = String(d.id);
          if (LIVE_COUNTRY_IDS.has(id))   return 'rgba(99,153,34,0.72)';
          if (COMING_COUNTRY_IDS.has(id)) return 'rgba(201,168,76,0.28)';
          return 'rgba(255,255,255,0.1)';
        })
        .attr('stroke', d => {
          const id = String(d.id);
          if (LIVE_COUNTRY_IDS.has(id))   return 'rgba(99,153,34,0.9)';
          if (COMING_COUNTRY_IDS.has(id)) return 'rgba(201,168,76,0.5)';
          return 'rgba(255,255,255,0.18)';
        })
        .attr('stroke-width', d => LIVE_COUNTRY_IDS.has(String(d.id)) ? '0.8' : '0.4')
        .style('cursor', d => (LIVE_COUNTRY_IDS.has(String(d.id)) || COMING_COUNTRY_IDS.has(String(d.id))) ? 'pointer' : 'default')
        .on('mouseenter', function(event, d) {
          const id = String(d.id);
          if (!LIVE_COUNTRY_IDS.has(id) && !COMING_COUNTRY_IDS.has(id)) return;
          const isLive = LIVE_COUNTRY_IDS.has(id);
          tooltip.style('display', 'block').html('<span style="font-size:11px;font-weight:500;color:' + (isLive ? '#C0DD97' : 'rgba(201,168,76,0.8)') + '">' + (isLive ? 'Courses available' : 'Coming soon') + '</span>');
          d3.select(this).attr('fill', isLive ? 'rgba(99,153,34,0.95)' : 'rgba(201,168,76,0.5)');
        })
        .on('mousemove', function(event) {
          const rect = container.getBoundingClientRect();
          tooltip.style('left', (event.clientX - rect.left + 12) + 'px').style('top', (event.clientY - rect.top - 32) + 'px');
        })
        .on('mouseleave', function(event, d) {
          const id = String(d.id);
          tooltip.style('display', 'none');
          d3.select(this).attr('fill', LIVE_COUNTRY_IDS.has(id) ? 'rgba(99,153,34,0.72)' : COMING_COUNTRY_IDS.has(id) ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.1)');
        });
      svg.append('path').datum(borders).attr('d', path).attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.12)').attr('stroke-width', '0.3');
      const [caX, caY] = projection([-119.5, 36.8]);
      svg.append('text').attr('x', caX).attr('y', caY).attr('text-anchor', 'middle')
        .attr('font-family', 'DM Sans, sans-serif').attr('font-size', '7')
        .attr('fill', 'rgba(192,221,151,0.9)').attr('letter-spacing', '0.1em')
        .attr('pointer-events', 'none').text('LIVE NOW');
    })
    .catch(() => {
      svg.append('text').attr('x', width / 2).attr('y', height / 2)
        .attr('text-anchor', 'middle').attr('font-size', '13')
        .attr('fill', 'rgba(255,255,255,0.4)').text('Map unavailable');
    });
}
