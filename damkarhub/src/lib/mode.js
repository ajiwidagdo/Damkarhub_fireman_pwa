/* ===================== MODE SELECTION (ANON / AUTH) =====================
   Di-extract dari index.html (const Mode). Logic 100% identik.
   Dipakai oleh: App.boot (Mode.check), HTML onclick (Mode.upgrade/reset/selectAnon/selectAuth).
   ========================================================================= */

export const Mode = {
  KEY: 'damkarhub_mode',

  get() { return localStorage.getItem(this.KEY) || null; },
  set(m) { localStorage.setItem(this.KEY, m); },
  clear() { localStorage.removeItem(this.KEY); },

  check() {
    const el = document.getElementById('mode-screen');
    if (!el) return false;
    const m = this.get();
    if (!m) {
      el.classList.remove('hidden');
      return false;
    }
    el.classList.add('hidden');
    if (m === 'auth') Sync.init();
    return true;
  },

  selectAnon() {
    this.set('anon');
    document.getElementById('mode-screen').classList.add('hidden');
    this.updateUI();
    if (Sync.updateUI) Sync.updateUI();
    if (window.UI && UI.toast) UI.toast('Mode Tanpa Akun aktif', 'info');
  },

  selectAuth() {
    this.set('auth');
    document.getElementById('mode-screen').classList.add('hidden');
    Sync.init();
    this.updateUI();
    const s = Sync._session && Sync._session();
    if (!s) {
      if (App.switchView) App.switchView('sistem');
      if (window.UI && UI.toast) UI.toast('Silakan login untuk sinkronisasi', 'info');
    }
  },

  // Update tampilan card Mode di Sistem
  updateUI() {
    const st = document.getElementById('modeStatus');
    const upBtn = document.getElementById('modeUpgradeBtn');
    if (!st) return;
    const m = this.get();
    if (m === 'auth') {
      st.textContent = 'Mode Akun aktif. Data laporan disinkronkan ke server pusat.';
      upBtn?.classList.add('hidden');
    } else if (m === 'anon') {
      st.textContent = 'Mode Tanpa Akun aktif. Data tersimpan lokal di perangkat ini saja.';
      upBtn?.classList.remove('hidden');
    } else {
      st.textContent = 'Belum ada mode dipilih.';
      upBtn?.classList.remove('hidden');
    }
  },

  // Upgrade dari anon → auth
  upgrade() {
    if (!confirm('Upgrade ke akun? Data lokal akan ikut disinkronkan ke server setelah login.')) return;
    this.set('auth');
    Sync.init();
    this.updateUI();
    // Scroll + highlight form login
    const login = document.getElementById('syncLoginBox');
    if (login) {
      login.classList.remove('hidden');
      login.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => document.getElementById('sync_email')?.focus(), 500);
    }
    if (window.UI && UI.toast) UI.toast('Silakan login untuk mulai sinkronisasi', 'info');
  },

  reset() {
    if (!confirm('Reset mode? Aplikasi akan kembali ke layar pilihan mode.')) return;
    this.clear();
    location.reload();
  }
};

globalThis.Mode = Mode;
