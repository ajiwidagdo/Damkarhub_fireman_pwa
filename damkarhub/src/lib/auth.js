/* ===================== AUTH — Login Screen =====================
   Menggantikan Mode Selection (dihapus 3 Okt 2026). Auth wajib.
   - Login / Register / Forgot Password via Supabase Auth REST
   - Login engine tetap Sync.login() (via hidden fields sync_email/sync_password)
     → objek Sync TIDAK diubah
   - Session: localStorage 'damkarhub_sync_session' (milik Sync)
   - Migrasi data anon: B1 — semua data lokal di-push saat login pertama
     (via Sync._seed yang sudah ada; konfirmasi UI di Auth.login)
   ========================================================================= */

export const Auth = {
  /* ---------- navigasi antar form ---------- */
  _show(box) {
    ['login-form-box', 'register-form-box', 'forgot-form-box'].forEach(id => {
      document.getElementById(id)?.classList.toggle('hidden', id !== box);
    });
    document.getElementById('login-switch-login')?.classList.toggle('hidden', box !== 'login-form-box');
    document.getElementById('login-switch-register')?.classList.toggle('hidden', box === 'login-form-box');
  },
  showLogin() { this._show('login-form-box'); },
  showRegister() { this._show('register-form-box'); },
  showForgot() { this._show('forgot-form-box'); },

  togglePw(inputId, btn) {
    const el = document.getElementById(inputId); if (!el) return;
    const show = el.type === 'password';
    el.type = show ? 'text' : 'password';
    const ic = btn.querySelector('i'); if (ic) ic.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
  },

  /* Fire toggle di login — reuse .brand-mark + UI.toggleDark */
  fireTap() {
    try {
      UI.toggleDark();
      const mark = document.querySelector('#login-fire .brand-mark');
      if (mark) {
        setTimeout(() => {
          const isDark = document.documentElement.classList.contains('dark');
          mark.classList.remove('puff', 'ignite'); void mark.offsetWidth;
          mark.classList.add(isDark ? 'puff' : 'ignite');
          Helpers.haptic(15);
          setTimeout(() => mark.classList.remove('puff', 'ignite'), 700);
        }, 40);
      }
    } catch (e) {}
  },

  /* ---------- guard sesi saat boot ---------- */
  async guard() {
    if (Sync.isLoggedIn()) {
      try { await Sync._token(); } catch (e) {} // refresh diam-diam bila kedaluwarsa
      if (!Sync.isLoggedIn()) return this.requireLogin('Sesi berakhir. Silakan login ulang.');
      Sync.init();
      try { await App._onUserChanged(); } catch (e) {}
      this._syncAccountUI();
      return true;
    }
    return this.requireLogin();
  },

  requireLogin(msg) {
    document.body.classList.add('auth-locked');
    document.getElementById('login-screen')?.classList.remove('hidden');
    this.showLogin();
    if (msg) setTimeout(() => { try { UI.toast(msg, 'info'); } catch (e) {} }, 700);
    return false;
  },

  async onLoginSuccess() {
    document.body.classList.remove('auth-locked');
    document.getElementById('login-screen')?.classList.add('hidden');
    try { await App._onUserChanged(); } catch (e) {}
    this._syncAccountUI();
    if (App.switchView) App.switchView('beranda');
  },

  _syncAccountUI() {
    try {
      const s = Sync._session();
      const el = document.getElementById('akun_email');
      if (el) el.textContent = s?.email ? 'Masuk sebagai ' + s.email : '';
    } catch (e) {}
  },

  _localCount() {
    try { return (Mod.k.data.length || 0) + (Mod.nk.data.length || 0) + (Mod.sos.data.length || 0); }
    catch (e) { return 0; }
  },

  _setLoading(btnId, loading, label) {
    const b = document.getElementById(btnId); if (!b) return;
    b.disabled = loading;
    b.classList.toggle('opacity-60', loading);
    b.classList.toggle('pointer-events-none', loading);
    if (loading) { b.dataset.label = b.innerHTML; b.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>' + label; }
    else if (b.dataset.label) { b.innerHTML = b.dataset.label; delete b.dataset.label; }
  },

  /* ---------- LOGIN (engine: Sync.login via hidden fields) ---------- */
  async login() {
    const email = (document.getElementById('login_email')?.value || '').trim();
    const pass = document.getElementById('login_password')?.value || '';
    if (!email || !pass) { UI.toast('Isi email dan password.', 'error'); return; }
    if (!navigator.onLine) { UI.toast('Login butuh koneksi internet.', 'error'); return; }
    // Migrasi B1: konfirmasi sebelum login pertama
    const n = this._localCount();
    const first = !localStorage.getItem(Sync._seededKey());
    if (n > 0 && first) {
      if (!confirm(`Ditemukan ${n} laporan di perangkat ini. Setelah masuk, semuanya akan disinkronkan ke akun Anda. Lanjutkan?`)) return;
    }
    this._setLoading('login_btn', true, 'Masuk…');
    try {
      document.getElementById('sync_email').value = email;
      document.getElementById('sync_password').value = pass;
      await Sync.login();
    } finally {
      this._setLoading('login_btn', false);
    }
    if (Sync.isLoggedIn()) {
      this.onLoginSuccess();
      UI.toast(n > 0 && first ? `${n} laporan lokal disinkronkan ke akun Anda.` : 'Selamat datang kembali!', 'info');
    }
  },

  /* ---------- REGISTER ---------- */
  async register() {
    const nama = (document.getElementById('reg_nama')?.value || '').trim();
    const email = (document.getElementById('reg_email')?.value || '').trim();
    const p1 = document.getElementById('reg_password')?.value || '';
    const p2 = document.getElementById('reg_password2')?.value || '';
    if (!nama) return UI.toast('Isi nama lengkap.', 'error');
    if (!email || !/.+@.+\..+/.test(email)) return UI.toast('Email tidak valid.', 'error');
    if (p1.length < 6) return UI.toast('Password minimal 6 karakter.', 'error');
    if (p1 !== p2) return UI.toast('Konfirmasi password tidak sama.', 'error');
    if (!navigator.onLine) return UI.toast('Pendaftaran butuh koneksi internet.', 'error');
    this._setLoading('reg_btn', true, 'Mendaftar…');
    try {
      const res = await fetch(`${SyncConfig.URL}/auth/v1/signup`, {
        method: 'POST', headers: Sync._authHeaders(),
        body: JSON.stringify({ email, password: p1, data: { nama } })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        UI.toast(j.msg || j.error_description || ('Pendaftaran gagal (' + res.status + ')'), 'error');
        return;
      }
      const sess = j.session;
      if (sess && (sess.access_token || sess.refresh_token)) {
        // Auto-confirm aktif → langsung masuk
        Sync._storeSession({ ...sess, user: j.user }, email);
        if (SyncConfig.DEFAULT_TENANT_CODE) { try { await Sync.joinTenant(SyncConfig.DEFAULT_TENANT_CODE); } catch (e) {} }
        await Sync._seed();
        Sync.updateUI(); Sync.run({ manual: true });
        this.onLoginSuccess();
        UI.toast('Akun dibuat. Selamat datang, ' + nama + '!', 'info');
      } else {
        UI.toast('Pendaftaran berhasil! Cek email untuk verifikasi, lalu masuk.', 'info');
        this.showLogin();
      }
    } catch (e) { UI.toast('Tidak bisa terhubung ke server.', 'error'); }
    finally { this._setLoading('reg_btn', false); }
  },

  /* ---------- FORGOT PASSWORD ---------- */
  async forgot() {
    const email = (document.getElementById('forgot_email')?.value || '').trim();
    if (!email || !/.+@.+\..+/.test(email)) return UI.toast('Isi email yang valid.', 'error');
    if (!navigator.onLine) return UI.toast('Butuh koneksi internet.', 'error');
    this._setLoading('forgot_btn', true, 'Mengirim…');
    try {
      const res = await fetch(`${SyncConfig.URL}/auth/v1/recover`, {
        method: 'POST', headers: Sync._authHeaders(), body: JSON.stringify({ email })
      });
      if (!res.ok) { UI.toast('Gagal mengirim. Coba lagi.', 'error'); return; }
      UI.toast('Tautan reset dikirim ke email Anda.', 'info');
      this.showLogin();
    } catch (e) { UI.toast('Tidak bisa terhubung ke server.', 'error'); }
    finally { this._setLoading('forgot_btn', false); }
  },

  /* ---------- LOGOUT (dari tab Akun) ---------- */
  async logout() {
    if (!confirm('Keluar dari akun? Data di perangkat ini tetap aman.')) return;
    try {
      localStorage.removeItem(Sync.SESSION_KEY);
      Sync._lastError = '';
      if (Sync.updateUI) Sync.updateUI();
      Helpers.haptic(15);
    } catch (e) {}
    try { await App._onUserChanged(); } catch (e) {} // kembali ke defaults
    const p = document.getElementById('login_password'); if (p) p.value = '';
    this._syncAccountUI();
    this.requireLogin('Anda telah keluar.');
  }
};

globalThis.Auth = Auth;
