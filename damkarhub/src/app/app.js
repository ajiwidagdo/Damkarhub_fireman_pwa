/* ===================== APP — KONTROLER UTAMA =====================
   Di-extract dari index.html (blok const App + boot + PWA + shortcut).
   Logic 100% identik — hanya dipindah. Mengakses global: Config, DB,
   UI, Helpers, Sync, Mode, Mod, renderLayouts.
   ========================================================================= */

const App = {
  currentView: 'beranda',
  currentDashTab: 'k',
  currentExportTab: 'k',
  currentInputTab: 'k',
  currentRiwayatFilter: 'all',
  _viewHistory: [],
  settings: { ...Config.DEFAULT_SETTINGS },
  personil: [],
  regu: [],
  _pFilter: 'all',
  _previewType: null,
  _previewId: null,

  _defaultRegu() {
    return [
      { id:'regu-a',   nama:'Regu A',   urutan:1 },
      { id:'regu-b',   nama:'Regu B',   urutan:2 },
      { id:'regu-c',   nama:'Regu C',   urutan:3 },
      { id:'regu-non', nama:'Non Regu', urutan:4 }
    ];
  },

  _defaultSettings() {
    return {
      instansi:'', daerah:'', kantor:'', pimpinan:'',
      petugas_nama:'', petugas_hp:'', petugas_jabatan:'',
      petugas_dispatch_active:true,
      notif_backup:true, notif_sync:true,
      notif_sound:true, notif_vibration:true,
      lastBackup:0
    };
  },

  /* ---------- Settings per-user (Issue authfix #1) ---------- */
  _settingsId() {
    try { const uid = (typeof Sync !== 'undefined' && Sync._session()?.uid) || 'anon'; return 'user:' + uid; }
    catch (e) { return 'user:anon'; }
  },
  async _loadSettings() {
    const id = this._settingsId();
    let rec = null;
    try {
      const all = await DB.getAll(Config.STORES.settings);
      rec = all.find(x => x.id === id) || null;
      if (!rec) {
        // Migrasi sekali: record 'global' lama → milik user pertama yang login
        const g = all.find(x => x.id === 'global');
        if (g && id !== 'user:anon') {
          rec = { ...g, id };
          try {
            await DB.put(Config.STORES.settings, rec);
            await DB.delete(Config.STORES.settings, 'global');
          } catch (e) {}
        }
      }
    } catch (e) {}
    this.settings = { ...this._defaultSettings(), ...(rec || {}), id };
  },
  async _persistSettings() {
    this.settings = { ...this.settings, id: this._settingsId() };
    await DB.put(Config.STORES.settings, this.settings);
  },
  // Dipanggil saat user login/berganti/keluar
  async _onUserChanged() {
    await this._loadSettings();
    try { this._loadSettingsToForm(); } catch (e) {}
    try { this._renderDispatchCard(); } catch (e) {}
    try { this.renderBeranda(); } catch (e) {}
  },

  async boot() {
    try {
      try {
        await DB.init();
      } catch (e) {
        // DEFENSIVE: jangan boot dengan data kosong — tampilkan blocking warning
        this._showStorageError();
        return;
      }
      await this._migrateLegacy();
      const [k, nk, sos, personil, regu] = await Promise.all([
        DB.getAll(Config.STORES.k), DB.getAll(Config.STORES.nk), DB.getAll(Config.STORES.sos),
        DB.getAll(Config.STORES.personil), DB.getAll(Config.STORES.regu)
      ]);
      Mod.k.setData(k); Mod.nk.setData(nk); Mod.sos.setData(sos);
      await this._loadSettings();
      this.personil = personil || [];
      if (!regu || regu.length === 0) {
        this.regu = this._defaultRegu();
        for (const r of this.regu) await DB.put(Config.STORES.regu, r);
      } else this.regu = regu.sort((a,b) => (a.urutan || 0) - (b.urutan || 0));

      UI.initTheme();
      this._initFireToggle();
      renderLayouts();
      this._populateDates(); // isi opsi bulan/tahun filter (dashboard + export)
      this._loadSettingsToForm();
      this._checkBackupReminder();
      Mod.k.addKorban();
      Mod.sos.addPeserta();
      App.renderReguChips('k'); App.renderPersonnelChips('k');
      App.renderReguChips('nk'); App.renderPersonnelChips('nk');
      App.renderReguChips('sos'); App.renderPersonnelChips('sos');
      App.renderKategoriChips();
      App.renderKendalaChips('k'); App.renderKendalaChips('nk');
      this._attachFormValidation();
      this._setupBackButton();
      this.switchView('beranda');
      this.renderBeranda();
      // Auth wajib: guard sesi → tampilkan login screen bila belum login
      await Auth.guard();
    } catch (err) {
      console.error('Boot error:', err);
      UI.toast('Gagal memuat aplikasi: ' + (err?.message || err), 'error');
    }
  },

  async _migrateLegacy() {
    const map = { damkar_k:'kebakaran', damkar_nk:'non_kebakaran', damkar_sos:'sosialisasi' };
    let migrated = false;
    for (const [lsKey, store] of Object.entries(map)) {
      const raw = localStorage.getItem(lsKey);
      if (!raw) continue;
      try {
        for (const d of JSON.parse(raw)) await DB.put(store, d);
        localStorage.removeItem(lsKey); migrated = true;
      } catch (e) { console.error('Migration error', e); }
    }
    const legacy = localStorage.getItem('damkarSettings');
    if (legacy) {
      try { const s = JSON.parse(legacy); s.id = 'global'; await DB.put(Config.STORES.settings, s); localStorage.removeItem('damkarSettings'); } catch {}
    }
    if (migrated) UI.toast('Data lama berhasil dipindahkan!');
  },

  _populateDates() {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const allData = [...Mod.k.data, ...Mod.nk.data, ...Mod.sos.data];
    const dataYears = new Set([y, y-1, y-2]);
    allData.forEach(d => {
      if (d.tanggal) {
        const yr = parseInt(String(d.tanggal).slice(0,4));
        if (!isNaN(yr) && yr > 1900 && yr < 2200) dataYears.add(yr);
      }
    });
    const years = Array.from(dataYears).sort((a,b) => b - a);
    const yearOpts = years.map(yr => `<option value="${yr}" ${yr === y ? 'selected' : ''}>${yr}</option>`).join('');
    const monthOpts = Config.MONTHS_SHORT.map((mn,i) => `<option value="${i}" ${i===m?'selected':''}>${mn}</option>`).join('');
    ['k','nk','sos'].forEach(p => {
      const dM = document.getElementById(`${p}_dash_month`); if (dM) dM.innerHTML = monthOpts;
      const dY = document.getElementById(`${p}_dash_year`);
      if (dY) {
        const prevVal = dY.value;
        dY.innerHTML = yearOpts;
        if (prevVal && years.includes(parseInt(prevVal))) dY.value = prevVal;
      }
      const eY = document.getElementById(`${p}_ex_year`); if (eY) eY.innerHTML = yearOpts;
      const eM = document.getElementById(`${p}_ex_month`); if (eM) eM.value = m;
    });
  },

  _showStorageError() {
    try {
      document.body.classList.add('auth-locked'); // sembunyikan app shell
      document.getElementById('storage-error-screen')?.classList.remove('hidden');
    } catch (e) {}
  },

  _loadSettingsToForm() {
    const s = this.settings || {};
    document.getElementById('set_instansi').value = s.instansi || '';
    document.getElementById('set_daerah').value = s.daerah || '';
    document.getElementById('set_kantor').value = s.kantor || '';
    document.getElementById('set_pimpinan').value = s.pimpinan || '';
    document.getElementById('set_petugas_nama').value = s.petugas_nama || '';
    document.getElementById('set_petugas_hp').value = s.petugas_hp || '';
    document.getElementById('set_petugas_jabatan').value = s.petugas_jabatan || '';
    const setTgl = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('aria-checked', val !== false ? 'true' : 'false'); };
    setTgl('set_dispatch_active', s.petugas_dispatch_active);
    setTgl('set_notif_backup', s.notif_backup);
    setTgl('set_notif_sync', s.notif_sync);
    setTgl('set_notif_sound', s.notif_sound);
    setTgl('set_notif_vibration', s.notif_vibration);
  },

  _attachFormValidation() {
    ['k_form','nk_form','sos_form'].forEach(id => {
      const frm = document.getElementById(id);
      if (!frm) return;
      frm.addEventListener('invalid', e => {
        e.preventDefault();
        const field = e.target;
        const lbl = field.closest('div')?.querySelector('label') || field.previousElementSibling;
        let fieldName = lbl?.innerText || 'Kolom';
        UI.toast(`Wajib: ${fieldName.replace(/\(.*\)/g,'').trim()}`, 'error');
        field.scrollIntoView({ behavior:'smooth', block:'center' });
        setTimeout(() => field.focus(), 300);
      }, true);
    });
  },

  _setupBackButton() {
    window.addEventListener('popstate', e => {
      if (e.state?.view) this.switchView(e.state.view, false);
      else this.switchView('beranda', false);
    });
    history.replaceState({ view:'beranda' }, '', '');
  },

  goBack() {
    if (this._viewHistory.length > 0) {
      const prev = this._viewHistory.pop();
      this.switchView(prev, false);
    } else this.switchView('beranda', false);
  },

  navTap(view) {
    try {
      // haptic sudah di switchView (satu titik)
      const s = this.settings || {};
      if (s.notif_sound !== false) UI.beep();
    } catch(e){}
    this.switchView(view);
  },
  openAccountSettings() {
    try {
      // haptic sudah di switchView (satu titik)
      const s = this.settings || {};
      if (s.notif_sound !== false) UI.beep();
    } catch(e){}
    this.switchView('sistem');
    UI.switchSistemTab('akun');
  },
  switchView(view, pushHistory = true) {    if (pushHistory && view !== this.currentView) {
      Helpers.haptic(10); // haptic navigasi — satu titik untuk semua view
      this._viewHistory.push(this.currentView);
      history.pushState({ view }, '', '');
    }
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    this.currentView = view;
    UI.updateStatusBar(view, view === 'dashboard' ? this.currentDashTab : null);
    if (view === 'beranda') this.renderBeranda();
    if (view === 'dashboard') this.refreshDashboard();
    if (view === 'riwayat') this.renderRiwayat();
    if (view === 'sistem') this.renderSistem();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openFab() {
    Helpers.haptic(10);
    try { const s = this.settings || {}; if (s.notif_sound !== false) UI.beep(); } catch(e){}
    const content = `
      <div class="p-4 pt-2 space-y-2.5">
        <button onclick="UI.closeSheet(); App.openInputForm('k')" class="opt-card opt-k">
          <div class="opt-ic" style="background:linear-gradient(140deg,#ff6b5b,#dc2626 55%,#a51818)"><i class="fa-solid fa-fire"></i></div>
          <div class="flex-1 min-w-0 relative z-10"><p class="font-black text-[15px] text-red-700 dark:text-white">Laporan Kebakaran</p><p class="text-[11.5px] leading-snug text-red-900/70 dark:text-white/70">Kebakaran rumah, ruko, lahan, dll</p></div>
          <span class="opt-go"><i class="fa-solid fa-chevron-right"></i></span>
        </button>
        <button onclick="UI.closeSheet(); App.openInputForm('nk')" class="opt-card opt-nk">
          <div class="opt-ic" style="background:linear-gradient(140deg,#fcd34d,#f59e0b 55%,#c26a05)"><i class="fa-solid fa-life-ring"></i></div>
          <div class="flex-1 min-w-0 relative z-10"><p class="font-black text-[15px] text-amber-700 dark:text-white">Laporan Penyelamatan</p><p class="text-[11.5px] leading-snug text-amber-900/70 dark:text-white/70">Evakuasi, penyelamatan, rescue</p></div>
          <span class="opt-go"><i class="fa-solid fa-chevron-right"></i></span>
        </button>
        <button onclick="UI.closeSheet(); App.openInputForm('sos')" class="opt-card opt-sos">
          <div class="opt-ic" style="background:linear-gradient(140deg,#5eead4,#10b981 55%,#047857)"><i class="fa-solid fa-users-viewfinder"></i></div>
          <div class="flex-1 min-w-0 relative z-10"><p class="font-black text-[15px] text-emerald-700 dark:text-white">Laporan Sosialisasi</p><p class="text-[11.5px] leading-snug text-emerald-900/70 dark:text-white/70">Edukasi, pelatihan, simulasi</p></div>
          <span class="opt-go"><i class="fa-solid fa-chevron-right"></i></span>
        </button>
      </div>`;
    UI.openSheet('Buat Laporan Baru', content);
  },

  openInputForm(mod) {
    this.currentInputTab = mod;
    document.querySelectorAll('#view-input .input-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${mod}-input`).classList.remove('hidden');
    UI.updateStatusBar('input', mod);
    if (this.currentView !== 'input') {
      this._viewHistory.push(this.currentView);
      history.pushState({ view:'input' }, '', '');
    }
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-input').classList.remove('hidden');
    this.currentView = 'input';
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (globalThis.UI) { UI.syncPickers(); if (UI.syncDisclosures) UI.syncDisclosures(); if (UI.syncDateTimes) UI.syncDateTimes(); }
  },

  editLaporan(mod, id) { Mod[mod].edit(id); },

  switchDashTab(mod) {
    Helpers.haptic(10);
    this.currentDashTab = mod;
    document.querySelectorAll('.dash-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${mod}-dashboard`).classList.remove('hidden');
    document.querySelectorAll('#view-dashboard .module-tab').forEach(el => el.classList.remove('active','nk-active','sos-active'));
    const tab = document.getElementById(`dashtab-${mod}`);
    tab.classList.add('active');
    if (mod === 'nk') tab.classList.add('nk-active');
    if (mod === 'sos') tab.classList.add('sos-active');
    UI.updateStatusBar('dashboard', mod);
    Helpers.haptic(6);
    this.refreshDashboard();
  },

  refreshDashboard() {
    Mod.k.updateDashboard(); Mod.nk.updateDashboard(); Mod.sos.updateDashboard();
  },

  switchExportTab(mod) {
    Helpers.haptic(10);
    this.currentExportTab = mod;
    // direct children saja — inner .export-panel (hasil Builders.exportPanel) tidak ikut ke-hidden
    document.querySelectorAll('#view-export > .export-panel').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${mod}-export`).classList.remove('hidden');
    document.querySelectorAll('#view-export .module-tab').forEach(el => el.classList.remove('active','nk-active','sos-active'));
    const tab = document.getElementById(`extab-${mod}`);
    tab.classList.add('active');
    if (mod === 'nk') tab.classList.add('nk-active');
    if (mod === 'sos') tab.classList.add('sos-active');
  },

  saveExportCols(prefix) {
    const cbs = document.querySelectorAll(`.export-col-cb[data-prefix="${prefix}"]`);
    const checked = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
    try { localStorage.setItem('export_cols_' + prefix, JSON.stringify(checked)); } catch {}
  },

  toggleAllExportCols(prefix, checkAll) {
    const cbs = document.querySelectorAll(`.export-col-cb[data-prefix="${prefix}"]`);
    cbs.forEach(cb => cb.checked = checkAll);
    this.saveExportCols(prefix);
    Helpers.haptic(10);
  },

  updateExFilters(prefix) {
    const p = document.getElementById(`${prefix}_ex_period`).value;
    document.getElementById(`${prefix}_ex_year`).classList.toggle('hidden', p === 'all');
    document.getElementById(`${prefix}_ex_month`).classList.toggle('hidden', p !== 'month');
  },

  // Hitung baris yang akan diekspor (mirror filter Export.generate — read-only)
  _exportRowCount(prefix) {
    try {
      const m = (typeof Mod !== 'undefined' && Mod[prefix]) || null;
      if (!m) return 0;
      const p = document.getElementById(`${prefix}_ex_period`)?.value || 'all';
      const mIdx = parseInt(document.getElementById(`${prefix}_ex_month`)?.value);
      const y = parseInt(document.getElementById(`${prefix}_ex_year`)?.value);
      if (p === 'all') return m.data.length;
      if (isNaN(mIdx) || isNaN(y)) return 0;
      return m.data.filter(d => {
        const dt = new Date(d.tanggal + 'T00:00:00');
        if (isNaN(dt.getTime())) return false;
        return p === 'month' ? dt.getMonth() === mIdx && dt.getFullYear() === y : dt.getFullYear() === y;
      }).length;
    } catch(e){ return 0; }
  },

  // Preview jumlah baris (display-only) + enable/disable tombol export
  updateExportCount(prefix) {
    try {
      const n = this._exportRowCount(prefix);
      const el = document.getElementById(`${prefix}_ex_count`);
      if (!el) return;
      const btns = [document.getElementById(`${prefix}_ex_btn_csv`), document.getElementById(`${prefix}_ex_btn_pdf`)].filter(Boolean);
      if (n > 0) {
        el.classList.remove('zero');
        el.innerHTML = `<i class="fa-solid fa-chart-column"></i><span>${n} laporan siap diekspor</span>`;
        btns.forEach(b => { b.disabled = false; b.classList.remove('opacity-40','pointer-events-none'); });
      } else {
        el.classList.add('zero');
        el.innerHTML = `<i class="fa-solid fa-chart-column"></i><span>Tidak ada laporan untuk periode ini</span><button type="button" onclick="App.openInputForm('${prefix}')" class="ex-cta">Buat Laporan</button>`;
        btns.forEach(b => { b.disabled = true; b.classList.add('opacity-40','pointer-events-none'); });
      }
    } catch(e){}
  },

  // Wrapper export: haptic + loading toast + panggil Export.generate (export.js TIDAK disentuh)
  exportWithFeedback(prefix, kind) {
    try {
      Helpers.haptic(12);
      const n = this._exportRowCount(prefix);
      if (!n) { UI.toast('Tidak ada laporan untuk periode ini', 'error'); return; }
      UI.toast(kind === 'pdf' ? 'Menyiapkan PDF…' : 'Menyiapkan CSV…', 'info');
      if (typeof Export !== 'undefined' && Export.generate) {
        // generate() async (lazy-load jsPDF) — tangkap rejection agar tidak unhandled
        Promise.resolve(Export.generate(prefix, kind)).catch(e => console.error('[export]', e));
      }
    } catch(e){}
  },

  renderBeranda() {
    this._renderDispatchCard();
    const now = new Date();
    document.getElementById('beranda-date').innerText = Helpers.dayName(now.toISOString().slice(0,10)) + ', ' + Helpers.formatDate(now.toISOString().slice(0,10));
    const all = [...Mod.k.data, ...Mod.nk.data, ...Mod.sos.data];
    const todayStr = now.toISOString().slice(0,10);
    const monthStr = todayStr.slice(0, 7);
    const todayCount = all.filter(d => d.tanggal === todayStr).length;
    const monthCount = all.filter(d => d.tanggal && d.tanggal.startsWith(monthStr)).length;
    document.getElementById('beranda-today-count').innerText = todayCount;
    document.getElementById('beranda-month-count').innerText = monthCount;
    document.getElementById('beranda-total-count').innerText = all.length;
    const sorted = all.slice().sort((a,b) => new Date(b.tanggal + 'T' + (b.pukul||'00:00')) - new Date(a.tanggal + 'T' + (a.pukul||'00:00')));
    const recentGiat = sorted[0];
    let giatHtml = '';
    if (recentGiat) {
      const typeInfo = this._detectType(recentGiat);
      giatHtml = `<div onclick="App.openRiwayatItem('${typeInfo.type}','${recentGiat.id}')" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-3 cursor-pointer active:scale-[.99]">
        <div class="riwayat-badge ${typeInfo.bg}"><i class="${typeInfo.icon}"></i></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-black uppercase tracking-widest ${typeInfo.textColor}">${typeInfo.label}</span>
            <span class="text-[10px] text-gray-400">${recentGiat.tanggal} ${recentGiat.pukul||''}</span>
          </div>
          <p class="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">${recentGiat.jenis || recentGiat.tempat || '-'}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${recentGiat.lokasiDetail || recentGiat.tempat || '-'}</p>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-xs mt-1"></i>
      </div>`;
    } else {
      giatHtml = `<div class="dash-empty"><span class="dash-empty-ic"><i class="fa-solid fa-inbox"></i></span><p class="dash-empty-tx">Belum ada aktivitas</p><button type="button" onclick="App.openFab()" class="dash-empty-btn">Buat Laporan</button></div>`;
    }
    document.getElementById('beranda-recent-giat').innerHTML = giatHtml;
    const recent5 = sorted.slice(0, 5);
    const listEl = document.getElementById('beranda-recent-list');
    if (!recent5.length) {
      listEl.innerHTML = `<div class="dash-empty"><span class="dash-empty-ic"><i class="fa-solid fa-folder-open"></i></span><p class="dash-empty-tx">Belum ada laporan</p><button type="button" onclick="App.openFab()" class="dash-empty-btn">Buat Laporan</button></div>`;
    } else {
      listEl.innerHTML = recent5.map(d => {
        const t = this._detectType(d);
        return `<div onclick="App.openRiwayatItem('${t.type}','${d.id}')" class="riwayat-item">
          <div class="riwayat-badge ${t.bg}"><i class="${t.icon}"></i></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-0.5">
              <span class="text-[10px] font-black uppercase tracking-widest ${t.textColor}">${t.label}</span>
              <span class="text-[10px] text-gray-400 flex-shrink-0">${d.tanggal}</span>
            </div>
            <p class="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">${d.jenis || d.tempat || '-'}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate"><i class="fa-solid fa-location-dot mr-1"></i>${d.lokasiDetail || d.tempat || '-'}</p>
          </div>
          <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-xs"></i>
        </div>`;
      }).join('');
    }
  },

  _detectType(d) {
    if (Mod.k.data.some(x => x.id === d.id)) return { type:'k', label:'Kebakaran', icon:'fa-solid fa-fire', bg:'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', textColor:'text-red-600 dark:text-red-400' };
    if (Mod.nk.data.some(x => x.id === d.id)) return { type:'nk', label:'Penyelamatan', icon:'fa-solid fa-life-ring', bg:'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', textColor:'text-amber-600 dark:text-amber-400' };
    return { type:'sos', label:'Sosialisasi', icon:'fa-solid fa-bullhorn', bg:'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', textColor:'text-emerald-600 dark:text-emerald-400' };
  },

  openRiwayatItem(type, id) {
    Helpers.haptic(8);
    const d = Mod[type].data.find(x => x.id === id);
    UI.openSheet('Aksi Laporan', Mod[type].buildActions(type, id, d));
  },

  setRiwayatFilter(f) {
    this.currentRiwayatFilter = f;
    document.querySelectorAll('#view-riwayat .filter-pill').forEach(el => el.classList.toggle('active', el.dataset.filter === f));
    Helpers.haptic(6);
    this.renderRiwayat();
  },

  renderRiwayat() {
    const search = (document.getElementById('riwayat_search').value || '').toLowerCase();
    let all = [];
    if (this.currentRiwayatFilter === 'all' || this.currentRiwayatFilter === 'k') all = all.concat(Mod.k.data.map(d => ({...d, _type:'k'})));
    if (this.currentRiwayatFilter === 'all' || this.currentRiwayatFilter === 'nk') all = all.concat(Mod.nk.data.map(d => ({...d, _type:'nk'})));
    if (this.currentRiwayatFilter === 'all' || this.currentRiwayatFilter === 'sos') all = all.concat(Mod.sos.data.map(d => ({...d, _type:'sos'})));
    if (search) all = all.filter(d => [d.tanggal, d.jenis, d.tempat, d.lokasiDetail, d.kel, d.idNama, d.pNama].some(v => v && v.toLowerCase().includes(search)));
    all.sort((a,b) => new Date(b.tanggal + 'T' + (b.pukul||'00:00')) - new Date(a.tanggal + 'T' + (a.pukul||'00:00')));
    const listEl = document.getElementById('riwayat_list');
    const emptyEl = document.getElementById('riwayat_empty');
    if (!all.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = all.map((d, idx) => {
      const t = this._detectType(d);
      const hasMap = d.koordinat && String(d.koordinat).trim();
      return `<div class="riwayat-item dash-anim" style="animation-delay:${Math.min(idx, 7) * 55}ms" onclick="App.openRiwayatItem('${t.type}','${d.id}')">
        <div class="riwayat-badge ${t.bg}"><i class="${t.icon}"></i></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-0.5">
            <span class="text-[10px] font-black uppercase tracking-widest ${t.textColor}">${t.label}</span>
            <span class="text-[10px] text-gray-400 flex-shrink-0">${d.tanggal} ${d.pukul || ''}</span>
          </div>
          <p class="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">${d.jenis || d.tempat || '-'}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate"><i class="fa-solid fa-location-dot mr-1"></i>${d.lokasiDetail || d.tempat || '-'}</p>
        </div>
        ${hasMap ? `<button onclick="event.stopPropagation(); Helpers.openMaps('${String(d.koordinat).replace(/'/g,"\\'")}')" class="p-2 text-blue-500 active:scale-90"><i class="fa-solid fa-map-location-dot"></i></button>` : ''}
        <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-xs"></i>
      </div>`;
    }).join('');
  },

renderSistem() {
    this._loadSettingsToForm();
    this.renderReguList();
    this.renderPersonilFilter();
    this.renderPersonilList();
  },

  renderReguList() {
    const el = document.getElementById('regu-list');
    if (!el) return;
    if (!this.regu.length) { el.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">Belum ada regu.</p>'; return; }
    const counts = {};
    this.personil.forEach(p => { counts[p.regu] = (counts[p.regu] || 0) + 1; });
    el.innerHTML = this.regu.map(r => `
      <div class="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">${(r.nama || '?').slice(-1)}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate">${r.nama}</p>
          <p class="text-[10px] text-gray-400">${counts[r.id] || 0} personil</p>
        </div>
        <button onclick="App.editRegu('${r.id}')" class="p-2 text-amber-600 dark:text-amber-400 active:scale-90"><i class="fa-solid fa-pen text-sm"></i></button>
        <button onclick="App.deleteRegu('${r.id}')" class="p-2 text-red-600 dark:text-red-400 active:scale-90"><i class="fa-solid fa-trash text-sm"></i></button>
      </div>`).join('');
  },

  editRegu(id = null) {
    const r = id ? this.regu.find(x => x.id === id) : null;
    const content = `<div class="p-5 pt-2 space-y-4">
      <div><label class="field-label">Nama Regu</label><input type="text" id="regu_nama_input" value="${r ? r.nama : ''}" placeholder="Cth: Regu D" class="w-full" maxlength="30"></div>
      <div class="flex gap-3 pt-2">
        <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl">Batal</button>
        <button onclick="App.saveRegu('${id || ''}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl">Simpan</button>
      </div></div>`;
    UI.openSheet(r ? 'Edit Regu' : 'Tambah Regu', content);
    setTimeout(() => document.getElementById('regu_nama_input')?.focus(), 350);
  },

  async saveRegu(id) {
    const nama = (document.getElementById('regu_nama_input')?.value || '').trim();
    if (!nama) return UI.toast('Nama regu wajib diisi', 'error');
    if (!id) {
      const r = { id:'regu-' + Date.now(), nama, urutan: this.regu.length + 1 };
      await DB.put(Config.STORES.regu, r); this.regu.push(r);
    } else {
      const r = this.regu.find(x => x.id === id); if (!r) return;
      r.nama = nama; await DB.put(Config.STORES.regu, r);
    }
    UI.closeSheet(); Helpers.haptic(20); UI.toast('Regu disimpan!');
    this.renderReguList(); this.renderPersonilFilter();
  },

  deleteRegu(id) {
    const counts = this.personil.filter(p => p.regu === id).length;
    if (counts > 0) return UI.toast(`Tidak bisa hapus: masih ada ${counts} personil`, 'error');
    UI.confirm(async () => {
      this.regu = this.regu.filter(x => x.id !== id);
      await DB.delete(Config.STORES.regu, id);
      Helpers.haptic([10,50,10]); UI.toast('Regu dihapus');
      this.renderReguList(); this.renderPersonilFilter();
    });
  },

  setPersonilFilter(f) {
    this._pFilter = f;
    document.querySelectorAll('[data-pfilter]').forEach(el => el.classList.toggle('active', el.dataset.pfilter === f));
    this.renderPersonilList();
  },

  renderPersonilFilter() {
    const el = document.getElementById('personil-filter-regu');
    if (!el) return;
    el.innerHTML = this.regu.map(r => `<button type="button" onclick="App.setPersonilFilter('${r.id}')" data-pfilter="${r.id}" class="filter-pill">${r.nama}</button>`).join('');
    if (this._pFilter !== 'all') document.querySelectorAll('[data-pfilter]').forEach(x => x.classList.toggle('active', x.dataset.pfilter === this._pFilter));
  },

  renderPersonilList() {
    const el = document.getElementById('personil-list');
    const empty = document.getElementById('personil-empty');
    if (!el) return;
    const search = (document.getElementById('personil_search')?.value || '').toLowerCase();
    let list = [...this.personil];
    if (this._pFilter !== 'all') list = list.filter(p => p.regu === this._pFilter);
    if (search) list = list.filter(p => p.nama.toLowerCase().includes(search));
    list.sort((a,b) => a.nama.localeCompare(b.nama));
    if (!list.length) { el.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    el.innerHTML = list.map(p => {
      const regu = this.regu.find(r => r.id === p.regu);
      return `<div class="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
        <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">${(p.nama || '?').charAt(0).toUpperCase()}</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate">${p.nama}</p>
          <p class="text-[10px] text-gray-400">${regu?.nama || 'Tanpa Regu'}</p>
        </div>
        <button onclick="App.editPersonil('${p.id}')" class="p-2 text-amber-600 dark:text-amber-400 active:scale-90"><i class="fa-solid fa-pen text-sm"></i></button>
        <button onclick="App.deletePersonil('${p.id}')" class="p-2 text-red-600 dark:text-red-400 active:scale-90"><i class="fa-solid fa-trash text-sm"></i></button>
      </div>`;
    }).join('');
  },

  editPersonil(id = null) {
    const p = id ? this.personil.find(x => x.id === id) : null;
    const reguOpts = this.regu.map(r => `<option value="${r.id}" ${p && p.regu === r.id ? 'selected' : ''}>${r.nama}</option>`).join('');
    const content = `<div class="p-5 pt-2 space-y-4">
      <div><label class="field-label">Nama Lengkap</label><input type="text" id="personil_nama_input" value="${p ? p.nama : ''}" placeholder="Cth: Budi Santoso" class="w-full" maxlength="50"></div>
      <div><label class="field-label">Regu</label><select id="personil_regu_input" class="w-full">${reguOpts}</select></div>
      <div class="flex gap-3 pt-2">
        <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl">Batal</button>
        <button onclick="App.savePersonil('${id || ''}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl">Simpan</button>
      </div></div>`;
    UI.openSheet(p ? 'Edit Personil' : 'Tambah Personil', content);
    setTimeout(() => document.getElementById('personil_nama_input')?.focus(), 350);
  },

  async savePersonil(id) {
    const nama = (document.getElementById('personil_nama_input')?.value || '').trim();
    const regu = document.getElementById('personil_regu_input')?.value || '';
    if (!nama) return UI.toast('Nama wajib diisi', 'error');
    if (!regu) return UI.toast('Regu wajib dipilih', 'error');
    if (!id) {
      const p = { id:'p-' + Date.now() + '-' + Math.random().toString(36).slice(2,7), nama, regu, aktif:true };
      await DB.put(Config.STORES.personil, p); this.personil.push(p);
    } else {
      const p = this.personil.find(x => x.id === id); if (!p) return;
      p.nama = nama; p.regu = regu;
      await DB.put(Config.STORES.personil, p);
    }
    UI.closeSheet(); Helpers.haptic(20); UI.toast('Personil disimpan!');
    this.renderReguList(); this.renderPersonilList();
  },

  deletePersonil(id) {
    UI.confirm(async () => {
      this.personil = this.personil.filter(x => x.id !== id);
      await DB.delete(Config.STORES.personil, id);
      Helpers.haptic([10,50,10]); UI.toast('Personil dihapus');
      this.renderReguList(); this.renderPersonilList();
    });
  },

  openReguSelector(prefix) {
    const selected = (document.getElementById(`${prefix}_regu`).value || '').split('\n').filter(x=>x.trim());
    const listHtml = this.regu.map(r => {
      const isChecked = selected.includes(r.nama);
      return `<label class="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 active:bg-gray-50 dark:active:bg-gray-700 transition">
          <input type="checkbox" class="regu-cb cb-custom mr-3" value="${r.nama}" ${isChecked?'checked':''}>
          <div class="flex-1"><p class="text-sm font-bold text-gray-800 dark:text-gray-200">${r.nama}</p></div>
       </label>`;
    }).join('');
    const content = `<div class="p-4 space-y-2">
       <p class="text-xs text-gray-500 mb-2">Centang regu yang bertugas. Bisa pilih lebih dari satu.</p>
       <div class="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">${listHtml || '<p class="p-4 text-center text-xs text-gray-400">Belum ada data regu.</p>'}</div>
       <div class="flex gap-2 pt-2">
          <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 font-bold py-3 rounded-xl">Batal</button>
          <button onclick="App.applyReguSelection('${prefix}')" class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">Terapkan</button>
       </div></div>`;
    UI.openSheet('Pilih Regu Bertugas', content);
  },

  applyReguSelection(prefix) {
    const cbs = document.querySelectorAll('.regu-cb:checked');
    const names = Array.from(cbs).map(cb => cb.value);
    document.getElementById(`${prefix}_regu`).value = names.join('\n');
    this.renderReguChips(prefix);
    UI.closeSheet(); Helpers.haptic(15);
  },

  renderReguChips(prefix) {
    const el = document.getElementById(`${prefix}_regu_chips`);
    if (!el) return;
    const val = document.getElementById(`${prefix}_regu`)?.value || '';
    const names = val ? val.split('\n').filter(x=>x.trim()) : [];
    if (!names.length) { el.innerHTML = '<span class="text-[10px] text-gray-400 italic">Belum ada regu dipilih</span>'; return; }
    el.innerHTML = names.map(name => `
       <span class="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">
          ${name}
          <button type="button" onclick="App.removeReguChip('${prefix}', '${name}')" class="text-indigo-400 hover:text-indigo-600"><i class="fa-solid fa-times"></i></button>
       </span>`).join('');
  },

  removeReguChip(prefix, name) {
    const el = document.getElementById(`${prefix}_regu`);
    const names = el.value.split('\n').filter(x=>x.trim());
    el.value = names.filter(n => n !== name).join('\n');
    this.renderReguChips(prefix);
  },

  openPersonnelSelector(prefix) {
    const selectedNames = (document.getElementById(`${prefix}_personil`).value || '').split('\n').filter(x=>x.trim());
    const selectedRegus = (document.getElementById(`${prefix}_regu`)?.value || '').split('\n').filter(x=>x.trim());
    const selectedReguIds = selectedRegus.map(nm => this.regu.find(r => r.nama === nm)?.id).filter(Boolean);
    const listHtml = this.personil.filter(p => !selectedReguIds.length || selectedReguIds.includes(p.regu)).map(p => {
      const regu = this.regu.find(r => r.id === p.regu);
      const isChecked = selectedNames.includes(p.nama);
      return `<label class="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 active:bg-gray-50 dark:active:bg-gray-700 transition">
          <input type="checkbox" class="personil-cb cb-custom mr-3" value="${p.nama}" ${isChecked?'checked':''}>
          <div class="flex-1">
            <p class="text-sm font-bold text-gray-800 dark:text-gray-200">${p.nama}</p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400">${regu?.nama || 'Tanpa Regu'}</p>
          </div></label>`;
    }).join('');
    const content = `<div class="p-4 space-y-2">
       <p class="text-xs text-gray-500 mb-2">Centang personil yang bertugas. Daftar otomatis terfilter berdasarkan regu yang dipilih di form.</p>
       <div class="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">${listHtml || '<p class="p-4 text-center text-xs text-gray-400">Belum ada data personil untuk regu ini.</p>'}</div>
       <div class="flex gap-2 pt-2">
          <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 font-bold py-3 rounded-xl">Batal</button>
          <button onclick="App.applyPersonnelSelection('${prefix}')" class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">Terapkan</button>
       </div></div>`;
    UI.openSheet('Pilih Personil Bertugas', content);
  },

  applyPersonnelSelection(prefix) {
    const cbs = document.querySelectorAll('.personil-cb:checked');
    const names = Array.from(cbs).map(cb => cb.value);
    document.getElementById(`${prefix}_personil`).value = names.join('\n');
    this.renderPersonnelChips(prefix);
    UI.closeSheet(); Helpers.haptic(15);
  },

  renderPersonnelChips(prefix) {
    const el = document.getElementById(`${prefix}_personil_chips`);
    if (!el) return;
    const val = document.getElementById(`${prefix}_personil`)?.value || '';
    const names = val ? val.split('\n').filter(x=>x.trim()) : [];
    if (!names.length) { el.innerHTML = '<span class="text-[10px] text-gray-400 italic">Belum ada personil dipilih</span>'; return; }
    el.innerHTML = names.map(name => `
       <span class="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">
          ${name}
          <button type="button" onclick="App.removePersonnelChip('${prefix}', '${name}')" class="text-indigo-400 hover:text-indigo-600"><i class="fa-solid fa-times"></i></button>
       </span>`).join('');
  },

  removePersonnelChip(prefix, name) {
    const el = document.getElementById(`${prefix}_personil`);
    const names = el.value.split('\n').filter(x=>x.trim());
    el.value = names.filter(n => n !== name).join('\n');
    this.renderPersonnelChips(prefix);
  },

  openKategoriSelector() {
    const selected = (document.getElementById('sos_kategori').value || '').split('\n').filter(x=>x.trim());
    const listHtml = Config.KATEGORI_OPTIONS.map(k => {
      const isChecked = selected.includes(k);
      return `<label class="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 active:bg-gray-50 dark:active:bg-gray-700 transition">
          <input type="checkbox" class="kategori-cb cb-custom mr-3" value="${k}" ${isChecked?'checked':''}>
          <div class="flex-1"><p class="text-sm font-bold text-gray-800 dark:text-gray-200">${Helpers.plainKategori(k)}</p></div>
       </label>`;
    }).join('');
    const content = `<div class="p-4 space-y-2">
       <p class="text-xs text-gray-500 mb-2">Centang sasaran edukasi. Bisa pilih lebih dari satu.</p>
       <div class="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">${listHtml}</div>
       <div class="flex gap-2 pt-2">
          <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 font-bold py-3 rounded-xl">Batal</button>
          <button onclick="App.applyKategoriSelection()" class="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl">Terapkan</button>
       </div></div>`;
    UI.openSheet('Pilih Sasaran Edukasi', content);
  },

  applyKategoriSelection() {
    const cbs = document.querySelectorAll('.kategori-cb:checked');
    const names = Array.from(cbs).map(cb => cb.value);
    document.getElementById('sos_kategori').value = names.join('\n');
    this.renderKategoriChips();
    UI.closeSheet(); Helpers.haptic(15);
  },

  renderKategoriChips() {
    const el = document.getElementById('sos_kategori_chips');
    if (!el) return;
    const val = document.getElementById('sos_kategori')?.value || '';
    const names = val ? val.split('\n').filter(x=>x.trim()) : [];
    if (!names.length) { el.innerHTML = '<span class="text-[10px] text-gray-400 italic">Belum ada sasaran dipilih</span>'; return; }
    el.innerHTML = names.map(name => `
       <span class="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md">
          ${Helpers.plainKategori(name)}
          <button type="button" onclick="App.removeKategoriChip('${name}')" class="text-emerald-400 hover:text-emerald-600"><i class="fa-solid fa-times"></i></button>
       </span>`).join('');
  },

  removeKategoriChip(name) {
    const el = document.getElementById('sos_kategori');
    const names = el.value.split('\n').filter(x=>x.trim());
    el.value = names.filter(n => n !== name).join('\n');
    this.renderKategoriChips();
  },

  openKendalaSelector(prefix) {
    const selected = (document.getElementById(`${prefix}_kendala`).value || '').split('\n').filter(x=>x.trim());
    const lainnyaEntry = selected.find(x => x.startsWith('Lainnya:'));
    const lainnyaText = lainnyaEntry ? lainnyaEntry.slice('Lainnya:'.length).trim().replace(/"/g, '&quot;') : '';
    const listHtml = Config.KENDALA_OPTIONS.map(k => {
      const isChecked = k === 'Lainnya' ? (selected.includes('Lainnya') || !!lainnyaEntry) : selected.includes(k);
      const onchange = k === 'Lainnya' ? ` onchange="document.getElementById('kendala_lainnya_text').disabled = !this.checked"` : '';
      return `<label class="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 active:bg-gray-50 dark:active:bg-gray-700 transition">
          <input type="checkbox" class="kendala-cb cb-custom mr-3" value="${k}" ${isChecked?'checked':''}${onchange}>
          <div class="flex-1"><p class="text-sm font-bold text-gray-800 dark:text-gray-200">${k}</p></div>
       </label>`;
    }).join('');
    const content = `<div class="p-4 space-y-2">
       <p class="text-xs text-gray-500 mb-2">Centang kendala yang ditemui di lapangan. Bisa pilih lebih dari satu.</p>
       <div class="max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">${listHtml}</div>
       <div>
          <label class="field-label">Kendala Lainnya</label>
          <input type="text" id="kendala_lainnya_text" placeholder="Tulis kendala lain..." value="${lainnyaText}" ${lainnyaEntry || selected.includes('Lainnya') ? '' : 'disabled'}>
       </div>
       <div class="flex gap-2 pt-2">
          <button onclick="UI.closeSheet()" class="flex-1 bg-gray-100 dark:bg-gray-700 font-bold py-3 rounded-xl">Batal</button>
          <button onclick="App.applyKendalaSelection('${prefix}')" class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">Terapkan</button>
       </div></div>`;
    UI.openSheet('Pilih Kendala', content);
  },

  applyKendalaSelection(prefix) {
    const cbs = document.querySelectorAll('.kendala-cb:checked');
    const names = Array.from(cbs).map(cb => cb.value);
    const li = names.indexOf('Lainnya');
    if (li > -1) {
      const t = (document.getElementById('kendala_lainnya_text')?.value || '').trim();
      if (t) names[li] = `Lainnya: ${t}`;
    }
    document.getElementById(`${prefix}_kendala`).value = names.join('\n');
    this.renderKendalaChips(prefix);
    UI.closeSheet(); Helpers.haptic(15);
  },

  renderKendalaChips(prefix) {
    const el = document.getElementById(`${prefix}_kendala_chips`);
    if (!el) return;
    const val = document.getElementById(`${prefix}_kendala`)?.value || '';
    const names = val ? val.split('\n').filter(x=>x.trim()) : [];
    if (!names.length) { el.innerHTML = '<span class="text-[10px] text-gray-400 italic">Tidak ada kendala (Nihil)</span>'; return; }
    el.innerHTML = names.map((name, i) => `
       <span class="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">
          ${name}
          <button type="button" onclick="App.removeKendalaChip('${prefix}', ${i})" class="text-indigo-400 hover:text-indigo-600"><i class="fa-solid fa-times"></i></button>
       </span>`).join('');
  },

  removeKendalaChip(prefix, idx) {
    const el = document.getElementById(`${prefix}_kendala`);
    const names = el.value.split('\n').filter(x=>x.trim());
    names.splice(idx, 1);
    el.value = names.join('\n');
    this.renderKendalaChips(prefix);
  },

  // Fire Toggle FX: animasi + suara + hint (logic theme tetap milik UI.toggleDark)
  _initFireToggle() {
    try {
      const btn = document.querySelector('.brand-toggle');
      const mark = btn?.querySelector('.brand-mark');
      if (!btn || !mark) return;
      let cleanupT = null;
      btn.addEventListener('click', () => {
        // UI.toggleDark (inline onclick) sudah jalan duluan — baca state terbaru
        setTimeout(() => {
          const isDark = document.documentElement.classList.contains('dark');
          if (cleanupT) clearTimeout(cleanupT);
          mark.classList.remove('puff', 'ignite');
          void mark.offsetWidth; // reflow: one-shot animation bisa di-restart
          if (isDark) {
            mark.classList.add('puff');
            Helpers.haptic(20); // extinguish: lembut
            this._fireSound('extinguish');
          } else {
            mark.classList.add('ignite');
            Helpers.haptic([10, 40, 10]); // ignite: double-tap
            this._fireSound('ignite');
          }
          cleanupT = setTimeout(() => mark.classList.remove('puff', 'ignite'), 700);
        }, 40);
      });
      // First-time hint — sekali saja
      if (!localStorage.getItem('damkarhub_fire_toggle_hint_shown')) {
        const hint = document.getElementById('fire-hint');
        if (hint) {
          const showT = setTimeout(() => hint.classList.remove('hidden'), 6200);
          const dismiss = () => {
            clearTimeout(showT);
            hint.classList.add('hidden');
            try { localStorage.setItem('damkarhub_fire_toggle_hint_shown', '1'); } catch(e){}
          };
          setTimeout(dismiss, 11000);
          btn.addEventListener('click', dismiss, { once:true });
        }
      }
    } catch(e){}
  },

  // WebAudio: crackle (ignite) / whoosh (extinguish) — hormati pengaturan Suara
  _fireSound(kind) {
    try {
      const s = this.settings || {};
      if (s.notif_sound === false) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const dur = kind === 'ignite' ? 0.32 : 0.45;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      if (kind === 'ignite') {
        for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(Math.random(), 3.2);
      } else {
        let last = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random()*2-1; last = (last + 0.025*w) / 1.025; d[i] = last * 3.4; }
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.Q.value = 0.9;
      f.frequency.value = kind === 'ignite' ? 2600 : 750;
      const g = ctx.createGain();
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.035);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start();
      src.onended = () => { try { ctx.close(); } catch(e){} };
    } catch(e){}
  },

  refreshReguSelects() {},

  showAbout() {
    Helpers.haptic(8);
    const ver = (typeof Config !== 'undefined' && Config.APP_VERSION) || '1.3.0';
    const card = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4';
    const content = `<div class="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 space-y-3">
      <div class="${card}">
        <div class="flex items-center gap-3">
          <div style="width:48px;height:48px;flex-shrink:0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.15);"><img src="icons/icon-192.png" alt="SATRIA" style="width:100%;height:100%;object-fit:cover;display:block;"></div>
          <div class="min-w-0">
            <p class="font-black text-gray-800 dark:text-white leading-tight">DAMKARHUB <span class="text-red-600 dark:text-red-400 italic">SATRIA</span></p>
            <p class="text-[11px] text-gray-400">Satuan Responder Insiden Api</p>
            <p class="text-[11px] text-gray-400 italic">"Siap bergerak di setiap insiden"</p>
            <span class="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">v${ver}</span>
          </div>
        </div>
      </div>

      <div class="${card}">
        <p class="section-title !mb-2 !text-[11px]"><i class="fa-solid fa-list-check mr-1.5 text-red-500"></i>Fungsi Utama</p>
        <ul class="space-y-1.5 text-[13px]">
          <li class="flex gap-2"><i class="fa-solid fa-check text-emerald-500 mt-1 text-[10px]"></i><span>Catat laporan Kebakaran, Penyelamatan, dan Sosialisasi dalam format baku</span></li>
          <li class="flex gap-2"><i class="fa-solid fa-check text-emerald-500 mt-1 text-[10px]"></i><span>Hitung otomatis waktu respons, durasi, dan nilai aset terselamatkan</span></li>
          <li class="flex gap-2"><i class="fa-solid fa-check text-emerald-500 mt-1 text-[10px]"></i><span>Susun teks laporan siap salin ke WhatsApp pimpinan</span></li>
          <li class="flex gap-2"><i class="fa-solid fa-check text-emerald-500 mt-1 text-[10px]"></i><span>Tetap bisa dipakai tanpa sinyal — data tersimpan aman di perangkat</span></li>
          <li class="flex gap-2"><i class="fa-solid fa-check text-emerald-500 mt-1 text-[10px]"></i><span>Dashboard kinerja dan ekspor data untuk evaluasi</span></li>
        </ul>
      </div>

      <div class="${card}">
        <p class="section-title !mb-2 !text-[11px]"><i class="fa-solid fa-circle-question mr-1.5 text-red-500"></i>Kenapa Dibuat</p>
        <p class="text-[13px] leading-relaxed">Pelaporan kejadian selama ini ditulis manual di sela kesibukan bertugas — format tidak seragam antar petugas, rawan tertunda sampai ke pimpinan, sinyal di lokasi tidak selalu stabil, dan data tersebar sehingga sulit direkap. DAMKARHUB SATRIA dibuat agar pencatatan lebih cepat, rapi, dan konsisten, langsung dari lokasi kejadian.</p>
      </div>

      <div class="bg-amber-50 dark:bg-amber-900/20 p-3.5 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/40">
        <p class="font-bold text-amber-800 dark:text-amber-300 mb-1"><i class="fa-solid fa-flask mr-1"></i> Status: Tahap Uji Coba</p>
        <p class="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">SATRIA adalah satu dari tiga aplikasi yang saling terhubung — bersama <strong>DAMKARHUB Komando</strong> dan <strong>DAMKARHUB SUAR</strong>. Selama tahap uji coba, sebagian alur (seperti penugasan otomatis dari Komando) belum aktif sampai ketiganya terhubung penuh.</p>
      </div>

      <div class="${card}">
        <p class="section-title !mb-2 !text-[11px]"><i class="fa-solid fa-circle-info mr-1.5 text-red-500"></i>Info</p>
        <dl class="text-[13px] space-y-1.5">
          <div class="flex justify-between gap-3"><dt class="text-gray-400 font-semibold">Pengembang</dt><dd class="font-bold text-gray-700 dark:text-gray-200 text-right">AJI WIDAGDO</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-400 font-semibold">Kontak</dt><dd class="text-right"><a href="mailto:ajiwidagdo7@gmail.com" class="text-red-600 dark:text-red-400 font-medium">damkarhub@gmail.com</a></dd></div>
          <div class="flex justify-between gap-3"><dt class="text-gray-400 font-semibold">Versi</dt><dd class="font-bold text-gray-700 dark:text-gray-200">v${ver}</dd></div>
        </dl>
      </div>

      <p class="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">© 2026 DAMKARHUB</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 italic text-center">Motto: Pantang Pulang Sebelum Api Padam <i class="fa-solid fa-fire text-red-500"></i></p>
    </div>`;
UI.openSheet('Tentang Aplikasi', content);
  },

  async saveSettings(e) {
    e.preventDefault();
    this.settings = {
      ...this.settings,
      instansi: document.getElementById('set_instansi').value,
      daerah: document.getElementById('set_daerah').value,
      kantor: document.getElementById('set_kantor').value,
      pimpinan: document.getElementById('set_pimpinan').value
    };
    try { await this._persistSettings(); Helpers.haptic(20); UI.toast('Pengaturan disimpan!'); }
    catch { UI.toast('Gagal simpan', 'error'); }
  },

  async saveAccount(e) {
    e.preventDefault();
    this.settings = {
      ...this.settings,
      petugas_nama: document.getElementById('set_petugas_nama').value.trim(),
      petugas_hp: document.getElementById('set_petugas_hp').value.trim(),
      petugas_jabatan: document.getElementById('set_petugas_jabatan').value.trim()
    };
    try { await this._persistSettings(); Helpers.haptic(20); UI.toast('Pengaturan akun disimpan!'); }
    catch { UI.toast('Gagal simpan', 'error'); }
  },

  async toggleSetting(btn, key) {
    const on = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    this.settings = { ...this.settings, [key]: on };
    try { await this._persistSettings(); }
    catch { UI.toast('Gagal simpan', 'error'); }
  },

  /* Dispatch toggle di Beranda (Issue authfix #4) */
  async toggleDispatch(btn) {
    await this.toggleSetting(btn, 'petugas_dispatch_active');
    const on = this.settings?.petugas_dispatch_active !== false;
    Helpers.haptic(on ? [10, 30, 10] : [30]); // ON: "siap" · OFF: tegas
    this._renderDispatchCard();
  },
  _renderDispatchCard() {
    const on = this.settings?.petugas_dispatch_active !== false;
    const t = document.getElementById('beranda_dispatch_toggle');
    if (t) t.setAttribute('aria-checked', on ? 'true' : 'false');
    const st = document.getElementById('beranda_dispatch_status');
    if (st) st.textContent = on ? 'Siap terima tugas' : 'Tidak menerima tugas';
  },

  /* Detail sync via bottom sheet (dari badge Beranda) */
  showSyncDetail() {
    Helpers.haptic(8);
    const s = (typeof Sync !== 'undefined' && Sync._session()) ? Sync._session() : null;
    const t = document.getElementById('syncBadgeTitle')?.textContent || '-';
    const sub = document.getElementById('syncBadgeSub')?.textContent || '';
    let action;
    if (typeof Sync === 'undefined' || !Sync.enabled()) {
      action = '<p class="text-xs text-gray-400">Sinkronisasi belum dikonfigurasi di perangkat ini. Aplikasi berjalan lokal.</p>';
    } else if (!s) {
      action = '<button type="button" onclick="UI.closeSheet();Auth.showLogin()" class="w-full bg-red-600 text-white font-bold py-3 rounded-xl active:scale-[.98]"><i class="fa-solid fa-right-to-bracket mr-1"></i> Masuk Akun</button>';
    } else {
      action = '<button type="button" onclick="UI.closeSheet();Sync.run({manual:true})" class="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 active:scale-[.98]"><i class="fa-solid fa-rotate mr-1"></i> Sinkron Sekarang</button>';
    }
    UI.openSheet('Status Sinkron',
      '<div class="text-left space-y-2 text-[13px] mb-4">'
      + '<div class="flex justify-between gap-3"><span class="text-gray-400">Status</span><span class="font-bold text-gray-800 dark:text-gray-100 text-right">' + t + '</span></div>'
      + (sub ? '<div class="flex justify-between gap-3"><span class="text-gray-400">Info</span><span class="font-bold text-gray-800 dark:text-gray-100 text-right truncate max-w-[60%]">' + sub + '</span></div>' : '')
      + '</div>' + action);
  },

  _checkBackupReminder() {
    try {
      const s = this.settings || {};
      if (s.notif_backup === false) return;
      const days = (Date.now() - (s.lastBackup || 0)) / 86400000;
      if (days > 7) setTimeout(() => UI.toast('Sudah >7 hari tanpa backup. Waktunya backup data!', 'info'), 2500);
    } catch(e){}
  },

  backupJSON() {
    const bk = {
      s: this.settings,
      k: Mod.k.data,
      nk: Mod.nk.data,
      sos: Mod.sos.data,
      regu: this.regu,
      personil: this.personil,
      _exported: new Date().toISOString(),
      _version: 2
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bk));
    const a = document.createElement('a');
    a.href = dataStr; a.download = `Damkarhub_Backup_${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    try { this.settings = { ...this.settings, lastBackup: Date.now() }; this._persistSettings().catch(()=>{}); } catch(e){}
    UI.toast('File backup diunduh! (Termasuk regu & personil)');
  },

  async restoreJSON(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.k && !data.nk && !data.sos && !data.regu && !data.personil) return UI.toast('Format file tidak valid!', 'error');
        UI.toast('Memproses data...', 'info');
        let added = 0, updated = 0, addedR = 0, updatedR = 0, addedP = 0, updatedP = 0;

        const merge = async (incoming, mod, store) => {
          if (!incoming) return;
          for (const item of incoming) {
            const idx = mod.data.findIndex(x => x.id === item.id);
            if (idx > -1) { mod.data[idx] = item; updated++; } else { mod.data.push(item); added++; }
            await DB.put(store, item);
            await Sync.enqueue(mod.id, item.id, 'upsert');
          }
        };
        await merge(data.k, Mod.k, Config.STORES.k);
        await merge(data.nk, Mod.nk, Config.STORES.nk);
        await merge(data.sos, Mod.sos, Config.STORES.sos);

        if (data.regu && Array.isArray(data.regu)) {
          for (const r of data.regu) {
            const idx = this.regu.findIndex(x => x.id === r.id);
            if (idx > -1) { this.regu[idx] = r; updatedR++; } else { this.regu.push(r); addedR++; }
            await DB.put(Config.STORES.regu, r);
          }
        }
        if (data.personil && Array.isArray(data.personil)) {
          for (const p of data.personil) {
            const idx = this.personil.findIndex(x => x.id === p.id);
            if (idx > -1) { this.personil[idx] = p; updatedP++; } else { this.personil.push(p); addedP++; }
            await DB.put(Config.STORES.personil, p);
          }
        }
        if (data.s) {
          this.settings = data.s;
          await DB.put(Config.STORES.settings, data.s);
          this._loadSettingsToForm();
        }

        UI.toast(`Merge selesai! Laporan: ${added} baru/${updated} update. Regu: ${addedR}/${updatedR}. Personil: ${addedP}/${updatedP}.`);
        this._populateDates();
        this.renderBeranda();
        this.renderRiwayat();
        this.renderSistem();
        this.refreshDashboard();
      } catch (err) {
        console.error(err);
        UI.toast('Gagal baca file!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
};

window.addEventListener('DOMContentLoaded', () => App.boot());

/* ===================== PWA: SPLASH + SERVICE WORKER ===================== */
// Splash ignite sequence (±3.8s) lalu fade out — logic utuh, tanpa suara (butuh gesture)
try { document.getElementById('splash-ver').textContent = 'v' + (Config.APP_VERSION || ''); } catch(e){}
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 700);
  }
}, 3800);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('✅ Service Worker registered:', reg.scope))
      .catch(err => console.warn('⚠️ Service Worker gagal:', err));
  });
}


// Handle PWA shortcut actions (dari long-press icon di home screen)
(function handleShortcut() {
  const params = new URLSearchParams(location.search);
  const action = params.get('action');
  if (!action) return;
  setTimeout(() => {
    if (action === 'new-k') App.openInputForm('k');
    else if (action === 'new-nk') App.openInputForm('nk');
    else if (action === 'riwayat') App.switchView('riwayat');
    history.replaceState({ view:'beranda' }, '', './index.html');
  }, 1600);
})();

globalThis.Config = Config;

globalThis.App = App;
