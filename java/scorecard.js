/* =====================================================
   scorecard.js — Weekend Birdie scorecard page logic
   Depends on: pb.js (loaded before this file)
   ===================================================== */

let COURSES = [];
let currentCourse = null;
let currentTee = null;

// ── BOOT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setTodayDate();
  restoreSession();
  await loadCourses();

  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'new-round') switchAppTab('new-round');
});

function setTodayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  document.getElementById('round-date').value = `${yyyy}-${mm}-${dd}`;
}

async function loadCourses() {
  try {
    const res  = await fetch('data/courses.json');
    const data = await res.json();
    COURSES = data.courses;
    populateCourseSelect();
  } catch(e) {
    console.warn('Could not load courses.json', e);
  }
}

function populateCourseSelect() {
  const sel    = document.getElementById('course-select');
  const sorted = [...COURSES].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} — ${c.city}`;
    sel.appendChild(opt);
  });
}

// ── COURSE / TEE SELECTORS ────────────────────────
function onCourseChange() {
  const id = parseInt(document.getElementById('course-select').value);
  currentCourse = COURSES.find(c => c.id === id) || null;
  currentTee    = null;

  const teeSel = document.getElementById('tee-select');
  teeSel.innerHTML = '';
  teeSel.disabled  = !currentCourse;

  if (!currentCourse) {
    teeSel.innerHTML = '<option value="">— pick course —</option>';
    clearScorecard();
    return;
  }

  const tees = currentCourse.map.tees;
  Object.entries(tees).forEach(([key, t]) => {
    const opt = document.createElement('option');
    opt.value = key;
    const yds = currentCourse.scorecard.yardage[key]?.men
             || currentCourse.scorecard.yardage[key]?.women
             || '?';
    opt.textContent = `${capitalize(key)} — ${t.rating}/${t.slope} (${yds} yds)`;
    teeSel.appendChild(opt);
  });

  teeSel.selectedIndex = 0;
  onTeeChange();
}

function onTeeChange() {
  const key = document.getElementById('tee-select').value;
  if (!currentCourse || !key) return;
  currentTee = { key, ...currentCourse.map.tees[key] };
  buildScorecard();
}

// ── SCORECARD BUILDER ─────────────────────────────
function buildScorecard() {
  if (!currentCourse || !currentTee) return clearScorecard();

  const holesVal = document.getElementById('holes-select').value;
  const allHoles = currentCourse.scorecard.holes || [];
  let holes;
  if      (holesVal === '9F') holes = allHoles.slice(0, 9);
  else if (holesVal === '9B') holes = allHoles.slice(9, 18);
  else                        holes = allHoles;

  if (!holes.length) {
    document.getElementById('scorecard-container').innerHTML =
      '<p style="color:var(--text-muted);text-align:center;padding:40px">No hole data available for this course yet.</p>';
    return;
  }

  const teeKey = currentTee.key;

  document.getElementById('live-rating').textContent = currentTee.rating || '—';
  document.getElementById('live-slope').textContent  = currentTee.slope  || '—';

  let html = `<div class="sc-table-wrap"><table class="sc-table">
    <thead>
      <tr>
        <th>Hole</th><th>Par</th><th>SI</th><th>Yards</th><th>Score</th><th>+/−</th>
      </tr>
    </thead>
    <tbody id="scorecard-body">`;

  holes.forEach((h, idx) => {
    const yards        = h.yards?.[teeKey] ?? '—';
    const si           = h.stroke_index_men ?? '—';
    const dividerClass = idx === 8 && holes.length === 18 ? ' nine-divider' : '';
    html += `<tr data-hole="${h.hole}" data-par="${h.par}"${dividerClass ? ` class="${dividerClass.trim()}"` : ''}>
      <td>${h.hole}</td>
      <td class="par-cell">${h.par}</td>
      <td class="si-cell">${si}</td>
      <td class="yds-cell">${yards}</td>
      <td><input type="number" min="1" max="20" class="score-input" id="score-${h.hole}"
           placeholder="${h.par}" oninput="onScoreInput(this, ${h.par}, ${h.hole})"></td>
      <td id="rel-${h.hole}" style="color:var(--text-muted);font-size:12px">—</td>
    </tr>`;
  });

  const parTotal = holes.reduce((s, h) => s + h.par, 0);
  const ydsTotal = holes.reduce((s, h) => {
    const y = h.yards?.[teeKey];
    return y ? s + y : s;
  }, 0);

  html += `<tr class="totals-row">
    <td>Total</td>
    <td id="total-par">${parTotal}</td>
    <td>—</td>
    <td>${ydsTotal || '—'}</td>
    <td id="total-score">—</td>
    <td id="total-rel">—</td>
  </tr>`;

  html += `</tbody></table></div>`;
  document.getElementById('scorecard-container').innerHTML = html;
  updateLiveBar();
}

function clearScorecard() {
  document.getElementById('scorecard-container').innerHTML = '';
  document.getElementById('live-gross').textContent  = '—';
  document.getElementById('live-diff').textContent   = '—';
  document.getElementById('live-rating').textContent = '—';
  document.getElementById('live-slope').textContent  = '—';
  document.getElementById('save-btn').disabled = true;
}

// ── SCORE INPUT ───────────────────────────────────
function onScoreInput(input, par, hole) {
  const score = parseInt(input.value);
  input.className = 'score-input';
  const relCell = document.getElementById(`rel-${hole}`);

  if (!isNaN(score) && score > 0) {
    const rel = score - par;
    if      (rel <= -2) input.classList.add('eagle');
    else if (rel === -1) input.classList.add('birdie');
    else if (rel ===  0) input.classList.add('par');
    else if (rel ===  1) input.classList.add('bogey');
    else if (rel ===  2) input.classList.add('double');
    else                 input.classList.add('triple');

    relCell.textContent = rel === 0 ? 'E' : (rel > 0 ? `+${rel}` : rel);
    relCell.style.color = rel < 0 ? 'var(--green-mid)' : rel === 0 ? 'var(--text-muted)' : rel === 1 ? '#8a6200' : '#c0392b';
  } else {
    relCell.textContent = '—';
    relCell.style.color = 'var(--text-muted)';
  }

  updateLiveBar();
}

function updateLiveBar() {
  const rows = document.querySelectorAll('#scorecard-body tr[data-hole]');
  let gross = 0, parTotal = 0, filled = 0;

  rows.forEach(row => {
    const hole  = parseInt(row.dataset.hole);
    const par   = parseInt(row.dataset.par);
    const input = document.getElementById(`score-${hole}`);
    const score = parseInt(input?.value);
    parTotal += par;
    if (!isNaN(score) && score > 0) { gross += score; filled++; }
  });

  document.getElementById('total-par').textContent = parTotal;

  if (filled === 0) {
    document.getElementById('total-score').textContent = '—';
    document.getElementById('total-rel').textContent   = '—';
    document.getElementById('live-gross').textContent  = '—';
    document.getElementById('live-diff').textContent   = '—';
    document.getElementById('save-btn').disabled = true;
    return;
  }

  document.getElementById('total-score').textContent = gross;
  const rel = gross - parTotal;
  document.getElementById('total-rel').textContent  = rel === 0 ? 'E' : (rel > 0 ? `+${rel}` : rel);
  document.getElementById('live-gross').textContent = gross;

  if (filled === rows.length && currentTee?.rating && currentTee?.slope) {
    const diff = ((113 / currentTee.slope) * (gross - currentTee.rating)).toFixed(1);
    document.getElementById('live-diff').textContent = diff;
    document.getElementById('save-btn').disabled = false;
  } else {
    document.getElementById('live-diff').textContent = '—';
    document.getElementById('save-btn').disabled = true;
  }
}

// ── SAVE ROUND ────────────────────────────────────
async function saveRound() {
  if (!currentCourse || !currentTee) return;

  const rows = document.querySelectorAll('#scorecard-body tr[data-hole]');
  let scores = {}, gross = 0;
  rows.forEach(row => {
    const hole  = parseInt(row.dataset.hole);
    const score = parseInt(document.getElementById(`score-${hole}`)?.value);
    scores[hole] = score;
    gross += score || 0;
  });

  const diff     = parseFloat(((113 / currentTee.slope) * (gross - currentTee.rating)).toFixed(1));
  const holesVal = document.getElementById('holes-select').value;
  const dateVal  = document.getElementById('round-date').value;

  const round = {
    date:       dateVal,
    courseId:   currentCourse.id,
    courseName: currentCourse.name,
    city:       currentCourse.city,
    teeKey:     currentTee.key,
    teeColor:   currentTee.color,
    rating:     currentTee.rating,
    slope:      currentTee.slope,
    holes:      holesVal,
    gross,
    diff,
    scores,
    par: parseInt(document.getElementById('total-par').textContent),
  };

  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saving...'; btn.disabled = true;

  try {
    await PB.saveRound(round);
    showToast('Round saved! ⛳');
    resetScorecard();
    await refreshStats();
    setTimeout(() => switchAppTab('history'), 600);
  } catch(err) {
    showToast(err.message || 'Failed to save round.');
    btn.textContent = 'Save round'; btn.disabled = false;
  }
}

function resetScorecard() {
  document.getElementById('course-select').value = '';
  document.getElementById('tee-select').innerHTML = '<option>— pick course —</option>';
  document.getElementById('tee-select').disabled = true;
  currentCourse = null; currentTee = null;
  clearScorecard();
}

// ── HISTORY ───────────────────────────────────────
async function renderHistory() {
  const el = document.getElementById('history-container');
  el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Loading...</p>';
  const rounds = await PB.getRounds();

  if (!rounds.length) {
    el.innerHTML = `<div class="history-empty">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" stroke-width="2"/>
        <path d="M16 12V8a8 8 0 0116 0v4" stroke="currentColor" stroke-width="2"/>
        <circle cx="24" cy="26" r="4" stroke="currentColor" stroke-width="2"/>
      </svg>
      <p>No rounds logged yet. Start by entering a round on the New round tab.</p>
    </div>`;
    return;
  }

  let html = `<table class="history-table">
    <thead><tr>
      <th>Date</th><th>Course</th><th>Tees</th><th>Holes</th><th>Gross</th><th>Differential</th><th></th>
    </tr></thead><tbody>`;

  rounds.forEach(r => {
    const dateStr = r.date
      ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})
      : '—';
    const rel    = r.gross - r.par;
    const relStr = rel === 0 ? 'E' : (rel > 0 ? `+${rel}` : rel);
    html += `<tr>
      <td>${dateStr}</td>
      <td><strong>${r.courseName}</strong><br><span style="color:var(--text-muted);font-size:12px">${r.city}</span></td>
      <td><span class="tee-dot" style="background:${r.teeColor || '#999'}"></span>${capitalize(r.teeKey)}</td>
      <td>${r.holes === '9F' ? 'Front 9' : r.holes === '9B' ? 'Back 9' : '18 holes'}</td>
      <td><strong>${r.gross}</strong> <span style="color:var(--text-muted);font-size:12px">(${relStr})</span></td>
      <td><span class="diff-badge">${r.diff}</span></td>
      <td><button class="delete-btn" onclick="deleteRound('${r.id}')">✕</button></td>
    </tr>`;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;
}

async function deleteRound(id) {
  if (!confirm('Delete this round?')) return;
  try {
    await PB.deleteRound(id);
    await renderHistory();
    await refreshStats();
    await renderHandicap();
    showToast('Round deleted');
  } catch(err) {
    showToast(err.message || 'Failed to delete round.');
  }
}

// ── HANDICAP (WHS) ────────────────────────────────
function calcHandicap(rounds) {
  if (rounds.length < 3) return null;
  const diffs = rounds.map(r => r.diff).sort((a, b) => a - b);
  const n     = rounds.length;
  const count =
    n >= 20 ? 8 : n >= 19 ? 7 : n >= 17 ? 6 : n >= 14 ? 5 :
    n >= 12 ? 4 : n >= 9  ? 3 : n >=  6 ? 2 : 1;
  const best = diffs.slice(0, count);
  const avg  = best.reduce((s, d) => s + d, 0) / best.length;
  return Math.min(+(avg * 0.96).toFixed(1), 54);
}

async function renderHandicap() {
  const rounds  = await PB.getRounds();
  const hcp     = calcHandicap(rounds);

  document.getElementById('hcp-index-big').textContent  = hcp !== null ? hcp : '—';
  document.getElementById('hcp-rounds-note').textContent = rounds.length < 3
    ? `${rounds.length}/3 rounds needed`
    : `Based on ${rounds.length} round${rounds.length !== 1 ? 's' : ''}`;

  const listEl = document.getElementById('hcp-diffs-list');
  if (!rounds.length) {
    listEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No rounds logged yet.</p>';
    return;
  }

  const sorted   = [...rounds].sort((a, b) => a.diff - b.diff);
  const useCount = rounds.length >= 3
    ? Math.max(1, [8,7,6,5,4,3,2,1][[20,19,17,14,12,9,6,3].findIndex(v => rounds.length >= v)])
    : 0;

  listEl.innerHTML = sorted.map((r, i) => {
    const isBest  = i < useCount;
    const dateStr = r.date
      ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'})
      : '';
    return `<div class="hcp-diff-row ${isBest ? 'best' : ''}">
      <div>
        <div style="font-weight:500;font-size:13px">${r.courseName}</div>
        <div class="course-name">${dateStr} · ${capitalize(r.teeKey)} tees</div>
      </div>
      <div class="hcp-diff-val">${isBest ? '★ ' : ''}${r.diff}</div>
    </div>`;
  }).join('');
}

async function refreshStats() {
  const rounds = await PB.getRounds();
  const hcp    = calcHandicap(rounds);

  document.getElementById('qs-hcp').textContent    = hcp !== null ? hcp : '—';
  document.getElementById('qs-rounds').textContent = rounds.length;

  if (rounds.length) {
    const bestDiff = Math.min(...rounds.map(r => r.diff));
    document.getElementById('qs-best').textContent        = bestDiff;
    const last    = rounds[0];
    const dateStr = last.date
      ? new Date(last.date + 'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'})
      : '—';
    document.getElementById('qs-last').textContent        = dateStr;
    document.getElementById('qs-last-course').textContent = last.courseName;
  } else {
    document.getElementById('qs-best').textContent        = '—';
    document.getElementById('qs-last').textContent        = '—';
    document.getElementById('qs-last-course').textContent = '';
  }
}

// ── TAB SWITCHER ──────────────────────────────────
async function switchAppTab(tab) {
  ['new-round', 'history', 'handicap'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    document.getElementById(`panel-${t}`).classList.toggle('active', t === tab);
  });
  if (tab === 'history')  await renderHistory();
  if (tab === 'handicap') await renderHandicap();
  document.getElementById('sc-app').scrollIntoView({behavior:'smooth', block:'start'});
}

// ── AUTH ──────────────────────────────────────────
function restoreSession() {
  if (PB.isLoggedIn()) {
    const user     = PB.getUser();
    const name     = user.name || user.email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    applyLoggedInState(initials, name);
  } else {
    showGate();
  }
}

function applyLoggedInState(initials, name) {
  document.getElementById('avatar-initials').textContent   = initials;
  document.getElementById('profile-avatar').classList.add('visible');
  document.getElementById('btn-login-nav').style.display   = 'none';
  document.getElementById('btn-signup-nav').style.display  = 'none';
  document.getElementById('auth-gate').style.display       = 'none';
  document.getElementById('sc-app').classList.add('visible');
  document.getElementById('user-first-name').textContent   = name.split(' ')[0];
  refreshStats();
}

function showGate() {
  document.getElementById('auth-gate').style.display      = 'flex';
  document.getElementById('sc-app').classList.remove('visible');
  document.getElementById('profile-avatar').classList.remove('visible');
  document.getElementById('btn-login-nav').style.display  = '';
  document.getElementById('btn-signup-nav').style.display = '';
}

function openAuthModal(e, tab) {
  if (e) e.preventDefault();
  document.getElementById('modal-overlay').classList.add('open');
  switchAuthTab(tab === 'signup' ? 'signup' : 'login');
}

function closeAuthModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('Please fill in both fields.'); return; }

  const btn = document.querySelector('#login-form .modal-btn');
  btn.textContent = 'Logging in...'; btn.disabled = true;

  try {
    const user     = await PB.login(email, pass);
    const name     = user.name || email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    closeAuthModal();
    applyLoggedInState(initials, name);
    showToast(`Welcome back, ${name.split(' ')[0]}! ⛳`);
  } catch(err) {
    showToast(err.message || 'Login failed. Check your email and password.');
  } finally {
    btn.textContent = 'Log in'; btn.disabled = false;
  }
}

async function doSignup() {
  const first = document.getElementById('signup-first').value.trim();
  const last  = document.getElementById('signup-last').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  if (!first || !email || !pass) { showToast('Please fill in all required fields.'); return; }
  if (pass.length < 8) { showToast('Password must be at least 8 characters.'); return; }

  const btn = document.querySelector('#signup-form .modal-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;

  try {
    const user     = await PB.signup(first, last, email, pass);
    const name     = user.name || first;
    const initials = (first[0] + (last ? last[0] : '')).toUpperCase();
    closeAuthModal();
    applyLoggedInState(initials, name);
    showToast(`Welcome, ${first}! Let's track some rounds. ⛳`);
  } catch(err) {
    showToast(err.message || 'Signup failed. Try a different email.');
  } finally {
    btn.textContent = 'Create account'; btn.disabled = false;
  }
}

function logout() {
  PB.logout();
  showGate();
  showToast('Logged out successfully.');
}

function toggleProfileDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('#profile-avatar')) {
    document.getElementById('profile-dropdown')?.classList.remove('open');
  }
});

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeAuthModal();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const overlay = document.getElementById('modal-overlay');
  if (!overlay.classList.contains('open')) return;
  if (document.getElementById('login-form').style.display !== 'none') doLogin();
  else doSignup();
});

// ── TOAST ─────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── UTILS ─────────────────────────────────────────
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
