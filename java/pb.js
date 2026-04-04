/* =====================================================
   pb.js — Weekend Birdie PocketBase client
   Handles all auth and data operations.
   Swap localStorage → real PocketBase API.
   ===================================================== */

const PB_URL = 'https://pb.weekendbirdie.com';

// ── TOKEN STORAGE ─────────────────────────────────────
// Stores auth token + user info in localStorage
// (just the token, not round data)
const PB = {

  // ── AUTH ────────────────────────────────────────────

  async signup(first, last, email, password) {
    const name = first + (last ? ' ' + last : '');
    const res = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        passwordConfirm: password,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Signup failed');

    // Auto login after signup
    return await PB.login(email, password);
  },

  async login(email, password) {
    const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    // Save token + user
    localStorage.setItem('pb_token', data.token);
    localStorage.setItem('pb_user', JSON.stringify(data.record));
    return data.record;
  },

  logout() {
    localStorage.removeItem('pb_token');
    localStorage.removeItem('pb_user');
  },

  getToken() {
    return localStorage.getItem('pb_token') || null;
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('pb_user'));
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!PB.getToken() && !!PB.getUser();
  },

  // ── ROUNDS ──────────────────────────────────────────

  async saveRound(round) {
    const token = PB.getToken();
    const user  = PB.getUser();
    if (!token || !user) throw new Error('Not logged in');

    const res = await fetch(`${PB_URL}/api/collections/rounds/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        user:        user.id,
        course_id:   round.courseId,
        course_name: round.courseName,
        city:        round.city,
        tee_key:     round.teeKey,
        tee_color:   round.teeColor,
        rating:      round.rating,
        slope:       round.slope,
        gross:       round.gross,
        diff:        round.diff,
        holes:       round.holes,
        date_played: round.date,
        par:         round.par,
        scores:      round.scores,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save round');
    return data;
  },

  async getRounds() {
    const token = PB.getToken();
    const user  = PB.getUser();
    if (!token || !user) return [];

    const res = await fetch(
      `${PB_URL}/api/collections/rounds/records?filter=(user='${user.id}')&sort=-date_played&perPage=200`,
      { headers: { 'Authorization': token } }
    );
    const data = await res.json();
    if (!res.ok) return [];

    // Normalize to match existing round shape used in the UI
    return data.items.map(r => ({
      id:         r.id,
      date:       r.date_played,
      courseId:   r.course_id,
      courseName: r.course_name,
      city:       r.city,
      teeKey:     r.tee_key,
      teeColor:   r.tee_color,
      rating:     r.rating,
      slope:      r.slope,
      gross:      r.gross,
      diff:       r.diff,
      holes:      r.holes,
      par:        r.par,
      scores:     r.scores,
    }));
  },

  async deleteRound(id) {
    const token = PB.getToken();
    if (!token) throw new Error('Not logged in');

    const res = await fetch(`${PB_URL}/api/collections/rounds/records/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token },
    });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to delete round');
    }
    return true;
  },
};
