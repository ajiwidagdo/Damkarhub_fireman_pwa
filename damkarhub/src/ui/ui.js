/* ===================== UI (helper tampilan: toast, modal, sheet, preview) =====================
   Di-extract dari index.html (const UI, L1099-1306). Logic 100% identik.
   Baris wiring btnConfirmOk (dulu inline L1307) dipindah ke sini: module scripts
   bersifat deferred, wiring inline saat parse akan error karena UI belum ada.
   Dipakai oleh: atribut onclick di HTML, renderLayouts, Mod.*, App, Export.
   Global: Helpers, Config, App, Mod.
   ========================================================================= */
export const UI = {
  toggleDark() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Animasi rotate pada logo
  const btn = document.querySelector('.brand-toggle');
  if (btn) {
    btn.classList.add('rotating');
    setTimeout(() => btn.classList.remove('rotating'), 500);
  }
  
  // Haptic feedback — dipindah ke App._initFireToggle: [10,40,10] ignite / 20 extinguish
  
  // Update badge
  const badge = document.getElementById('theme-badge');
  if (badge) badge.textContent = isDark ? '🌙' : '☀️';
  
  this.updateThemeIcon();
},
  initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    this.updateThemeIcon();
  },
  updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  const badge = document.getElementById('theme-badge');
  if (badge) badge.textContent = isDark ? '🌙' : '☀️';
},
showComingSoon(feature) {
  Helpers.haptic(10);
  UI.toast(`✨ ${feature} — Segera Hadir`, 'info');
},
  updateStatusBar(view, mod) {
    const color = (mod && Config.THEME_COLORS[mod]) || Config.THEME_COLORS[view] || '#dc2626';
    document.getElementById('meta-theme').setAttribute('content', color);
  },
  toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    const styles = { success:'bg-gray-900 dark:bg-white text-white dark:text-gray-900', error:'bg-red-600 text-white', info:'bg-gray-800 dark:bg-gray-700 text-white border border-white/10' };
    const icons = { success:'fa-solid fa-check-circle text-green-400', error:'fa-solid fa-circle-exclamation', info:'fa-solid fa-info-circle text-amber-400' };
    t.className = `fixed top-5 left-1/2 transform -translate-x-1/2 transition-all duration-300 px-6 py-3 rounded-full shadow-2xl z-[80] flex items-center gap-2 pointer-events-none text-sm font-bold w-max max-w-[90vw] ${styles[type]||styles.success}`;
    document.getElementById('toast-icon').className = icons[type] || icons.success;
    t.classList.remove('-translate-y-20','opacity-0');
    setTimeout(() => t.classList.add('-translate-y-20','opacity-0'), 3000);
    // Notifikasi suara & getar sesuai Pengaturan Notifikasi
    try {
      const s = (typeof App !== 'undefined' && App.settings) || {};
      if (s.notif_sound !== false) UI.beep();
      if (s.notif_vibration !== false && navigator.vibrate) navigator.vibrate(15);
    } catch(e){}
  },
  beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.start(); o.stop(ctx.currentTime + 0.18);
      o.onended = () => { try { ctx.close(); } catch(e){} };
    } catch(e){}
  },
  switchSistemTab(tab) {
    document.querySelectorAll('[data-chipnav="sistem"] .chip-nav-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.stab === tab);
    });
    document.querySelectorAll('.sys-panel').forEach(p => {
      p.classList.toggle('hidden', p.dataset.spanel !== tab);
    });
    const active = document.querySelector(`[data-chipnav="sistem"] .chip-nav-btn[data-stab="${tab}"]`);
    try { active?.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' }); } catch(e){}
    this._sistemTab = tab;
  },
  _confirmCb: null,
  confirm(cb) {
    this._confirmCb = cb;
    const m = document.getElementById('confirmModal'), b = document.getElementById('confirmBox');
    m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); b.classList.remove('scale-95'); }, 10);
  },
  closeConfirm() {
    const m = document.getElementById('confirmModal'), b = document.getElementById('confirmBox');
    m.classList.add('opacity-0'); b.classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
    this._confirmCb = null;
  },
  openSheet(title, contentOrActions) {
    const back = document.getElementById('sheetBackdrop'), panel = document.getElementById('sheetPanel');
    document.getElementById('sheetTitle').innerText = title;
    if (typeof contentOrActions === 'string') {
      document.getElementById('sheetContent').innerHTML = contentOrActions;
    } else {
      document.getElementById('sheetContent').innerHTML = contentOrActions.map(a =>
        `<button onclick="${a.onclick}" class="sheet-action ${a.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}">
          <i class="${a.icon} w-5 text-center ${a.danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}"></i>
          <span>${a.label}</span>
        </button>`).join('');
    }
    back.classList.remove('hidden'); panel.classList.remove('hidden');
    requestAnimationFrame(() => { back.classList.add('show'); panel.classList.add('sheet-enter'); });
  },
  closeSheet() {
    const back = document.getElementById('sheetBackdrop'), panel = document.getElementById('sheetPanel');
    back.classList.remove('show'); panel.classList.remove('sheet-enter');
    setTimeout(() => { back.classList.add('hidden'); panel.classList.add('hidden'); }, 250);
  },
  HELP: {
    'k-s1': { title: 'Waktu & Jenis Kejadian', body: `<p><b>Nama lengkap field:</b> Tanggal Kejadian, Pukul Kejadian, Tanggal Lapor Diterima, Jam Lapor Diterima, Jam Tiba di Lokasi, Jam Penanganan Dimulai, Tanggal Penanganan Selesai, Jam Penanganan Selesai.</p><p><b>Respon Time</b> — Otomatis: Jam Lapor Diterima → Jam Penanganan Dimulai (dalam menit).</p><p>Jam Penanganan Dimulai otomatis +2,5 menit dari Jam Tiba (dapat diedit). Tgl Selesai hanya jika penanganan lintas hari.</p><p><b>Tombol kalender/jam di kanan box input</b> mengisi tanggal/jam saat ini; ketuk box bila ingin memilih tanggal/jam manual.</p><p><b>Jenis Kejadian</b> — pilih "Lainnya" bila jenisnya spesifik. <b>Koordinat Gmaps</b> untuk menghitung Jarak otomatis; <b>Durasi</b> terhitung otomatis dari rantai waktu.</p>` },
    'k-s2': { title: 'Lokasi Kejadian', body: `<p><b>Tempat/Patokan</b> — patokan lokasi kejadian (cth: di Kompleks Perum Pepabri).</p><p><b>Dusun</b> = Lingkungan/Dusun. Dilengkapi RT/RW, Kel/Desa, Kecamatan, dan Kab/Kota.</p>` },
    'k-s3': { title: 'Data Pemilik / Korban & Pelapor', body: `<p>Semua data pemilik/korban boleh dikosongkan bila belum diketahui di lapangan. Jangan diisi rekaan.</p><p><b>Nama</b> korban/pemilik — kosongkan bila belum diketahui. <b>NIK (Opsional)</b> — 16 digit.</p><p><b>Detail Usia & Alamat:</b> Usia (Thn), Jenis Kelamin, Alamat Lengkap Korban (Dusun, RT/RW, Kel/Desa, Kecamatan, Kab/Kota).</p><p><b>Data Pelapor:</b> Nama Pelapor dan Nomor Kontak wajib diisi.</p>` },
    'k-s4': { title: 'Penyebab & Dampak', body: `<p><b>Dugaan Penyebab</b> dan <b>Objek Terbakar</b> — pilih "Lainnya" bila tidak ada di daftar. <b>Luas Area</b> cth: 80 m².</p><p><b>Nilai Ekonomi:</b> Nilai Aset Keseluruhan (Rp), Taksiran Kerugian (Rp), Aset Terselamatkan (Rp).</p><p>Aset Terselamatkan otomatis = Nilai Aset − Taksiran Kerugian.</p><p><b>Korban:</b> Luka Ringan, Luka Berat, Meninggal.</p>` },
    'k-s5': { title: 'Operasional & Regu', body: `<p><b>Armada</b> (cth: 1 Unit Pancar) dan <b>Air (Tangki)</b> dalam ton.</p><p><b>Kronologi Singkat</b> dan <b>Tindakan</b> — bisa diisi lewat tombol Suara — ketuk mikrofon, ucapkan, teks tertulis otomatis.</p><p><b>Unsur yang Terlibat</b> — pisahkan tiap unsur dengan Enter.</p><p><b>Regu Piket</b> dan <b>Personil Bertugas</b> — ketuk Pilih. <b>Keterangan Lain</b> opsional. Foto — ketuk Ambil Foto (maks 2 foto).</p>` },
    'nk-s1': { title: 'Waktu & Jenis Kegiatan', body: `<p><b>Nama lengkap field:</b> Tanggal Lapor Diterima, Jam Lapor Diterima, Penanganan Dimulai (= Tanggal mulai ditangani & Jam mulai ditangani), Penanganan Selesai (= Tanggal selesai ditangani & Jam selesai ditangani).</p><p><b>Tombol kalender/jam di kanan box input</b> mengisi tanggal/jam saat ini; ketuk box bila ingin memilih tanggal/jam manual.</p><p><b>Jenis Kegiatan</b> — pilih "Lainnya" bila kegiatannya spesifik. <b>Koordinat Gmaps</b> untuk menghitung Jarak otomatis; <b>Durasi</b> terhitung otomatis dari waktu mulai–selesai.</p>` },
    'nk-s2': { title: 'Lokasi Kejadian', body: `<p><b>Patokan Lokasi</b> — patokan lokasi kejadian (cth: Rumah Warga).</p><p><b>Dusun</b> = Lingkungan/Dusun. Dilengkapi RT/RW, Kel/Desa, Kecamatan, dan Kab/Kota.</p>` },
    'nk-s3': { title: 'Identitas Pelapor', body: `<p><b>Nama</b>, <b>Usia (Thn)</b>, <b>Jenis Kelamin</b>, dan <b>No HP Pelapor</b>.</p><p><b>Alamat Lengkap:</b> Dusun, RT/RW, Kel/Desa, Kecamatan, Kab/Kota — terisi otomatis dari Lokasi Kejadian bila masih kosong, tetap bisa diedit manual.</p>` },
    'nk-s4': { title: 'Operasional & Penanganan', body: `<p><b>Objek / Satwa</b> (cth: 1 Ekor Ular Cobra), <b>Detail Lokasi</b> (cth: Di dalam Rumah), <b>Ukuran / Spesifikasi</b> (cth: Panjang ± 30 cm).</p><p><b>Armada</b> dan <b>Air (Tangki)</b> dalam ton. <b>Kronologi Singkat</b> dan <b>Tindakan</b> — bisa diisi lewat tombol Suara — ketuk mikrofon, ucapkan, teks tertulis otomatis.</p><p><b>Kendala</b> — ketuk Pilih Kendala. Korban: Luka Ringan, Luka Berat, Meninggal. <b>Regu Piket</b> dan <b>Personil Bertugas</b> — ketuk Pilih. <b>Keterangan Lain</b> opsional. Foto — ketuk Ambil Foto (maks 2 foto).</p>` },
    'sos-s1': { title: 'Waktu & Rangkaian', body: `<p><b>Tgl Pelaksanaan</b>, <b>Pukul</b>, <b>Tgl Selesai</b>, dan <b>Jam Selesai</b>.</p><p><b>Tombol kalender/jam di kanan box input</b> mengisi tanggal/jam saat ini; ketuk box bila ingin memilih tanggal/jam manual. <b>Durasi</b> terhitung otomatis.</p><p><b>Tempat Kegiatan</b> — lokasi sosialisasi dilaksanakan.</p><p><b>Rangkaian Kegiatan</b> — satu kegiatan per baris (tekan Enter).</p>` },
    'sos-s2': { title: 'Data Peserta / Instansi', body: `<p><b>Sasaran Edukasi</b> — ketuk Pilih untuk menentukan kategori sasaran.</p><p><b>Nama Instansi / Sekolah</b>, <b>Jml. Peserta</b>, dan <b>Alamat Lengkap</b> (Dusun, RT/RW, Kel/Desa, Kecamatan, Kab/Kota) untuk tiap peserta/instansi.</p>` },
    'sos-s3': { title: 'Operasional & Personil', body: `<p><b>Armada</b> (cth: 2 Unit Pancar) dan <b>Air (Tangki)</b> dalam ton.</p><p><b>Regu Piket</b> dan <b>Personil Bertugas</b> — ketuk Pilih. Foto — ketuk Ambil Foto (maks 2 foto).</p><p><b>Keterangan Lain</b> = Catatan Evaluasi — feedback program (opsional).</p>` }
  },
  openHelp(key) {
    const h = this.HELP[key]; if (!h) return;
    this.openSheet('Bantuan — ' + h.title, `<div class="px-5 pb-4 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 space-y-2">${h.body}</div>`);
  },
  showPhoto(d) {
    let h = '';
    if (d.foto1) h += `<div class="mb-6 w-full"><p class="text-[10px] font-bold text-gray-400 mb-2 tracking-widest uppercase">Foto 1</p><img src="${d.foto1}" class="w-full h-auto rounded-xl shadow-lg border border-gray-700"></div>`;
    if (d.foto2) h += `<div class="mb-6 w-full"><p class="text-[10px] font-bold text-gray-400 mb-2 tracking-widest uppercase">Foto 2</p><img src="${d.foto2}" class="w-full h-auto rounded-xl shadow-lg border border-gray-700"></div>`;
    document.getElementById('photoModalContent').innerHTML = h || '<p class="text-white text-center">Tidak ada foto terlampir.</p>';
    const m = document.getElementById('photoModal');
    m.classList.remove('hidden'); setTimeout(() => m.classList.remove('opacity-0'), 10);
  },
  closePhoto() {
    const m = document.getElementById('photoModal');
    m.classList.add('opacity-0'); setTimeout(() => m.classList.add('hidden'), 300);
  },
  showPreview(htmlContent, type, id) {
    App._previewType = type;
    App._previewId = id;
    document.getElementById('previewContent').innerHTML = htmlContent;
    const m = document.getElementById('previewModal');
    m.classList.remove('hidden');
    setTimeout(() => m.classList.remove('opacity-0'), 10);
    m.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    Helpers.haptic(10);
  },
  closePreview() {
    const m = document.getElementById('previewModal');
    m.classList.add('opacity-0');
    setTimeout(() => { m.classList.add('hidden'); document.body.style.overflow = ''; }, 300);
  },
  previewCopyText() {
    const type = App._previewType;
    const id = App._previewId;
    const data = Mod[type].data.find(x => x.id === id);
    if (!data) return;
    const text = Mod[type].cfg.buildWA(data);
    const onSuccess = () => {
      this.closePreview();
      Helpers.haptic([20, 50, 20]);
      UI.toast('✅ Teks disalin! Buka WhatsApp & tempel.', 'success');
    };
    const onFallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        onSuccess();
      } catch (e) {
        UI.toast('Gagal menyalin. Coba tekan lama di teks.', 'error');
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(onFallback);
    } else {
      onFallback();
    }
  },
  openPicker(selId, title) {
    const sel = document.getElementById(selId); if (!sel) return;
    this.syncPickers();
    const rows = Array.from(sel.options).map((o, i) => ({ o, i }))
      .filter(({ o }) => o.value !== '')
      .map(({ o, i }) => {
        const active = i === (sel.selectedIndex >= 0 ? sel.selectedIndex : -1);
        return `<button type="button" onclick="UI.pickOption('${selId}', ${i})" class="picker-opt ${active ? 'picker-opt-active' : ''}"><span class="picker-radio ${active ? 'picker-radio-on' : ''}"></span><span class="flex-1">${(o.textContent || '').trim()}</span>${active ? '<i class="fa-solid fa-check text-emerald-500"></i>' : ''}</button>`;
      }).join('');
    this.openSheet(title, rows);
  },
  pickOption(selId, idx) {
    const sel = document.getElementById(selId); if (!sel) return;
    sel.selectedIndex = idx;
    sel.setAttribute('data-picked', '1');
    const Evt = (sel.ownerDocument && sel.ownerDocument.defaultView && sel.ownerDocument.defaultView.Event) || Event;
    sel.dispatchEvent(new Evt('change', { bubbles: true }));
    this.closeSheet();
    this.syncPickers();
  },
  toggleDisclosure(btn) {
    const d = btn.closest('[data-disclosure]'); if (!d) return;
    d.classList.toggle('open');
    const body = d.querySelector('.disclosure-body');
    if (body) body.classList.toggle('hidden', !d.classList.contains('open'));
  },
  syncDisclosures(root) {
    (root || document).querySelectorAll('[data-disclosure]').forEach(d => {
      const body = d.querySelector('.disclosure-body'); if (!body) return;
      const has = Array.from(body.querySelectorAll('input, textarea, select')).some(el => {
        if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
        return (el.value || '').trim() !== '';
      });
      d.classList.toggle('open', has);
      body.classList.toggle('hidden', !has);
    });
  },
  syncPickers(root) {
    (root || document).querySelectorAll('select.picker-native').forEach(sel => {
      const wrap = sel.closest('.picker-wrap'); if (!wrap) return;
      const val = wrap.querySelector('.picker-value');
      const idx = sel.selectedIndex >= 0 ? sel.selectedIndex : 0;
      const empty = !sel.value;
      if (val) {
        val.textContent = empty ? 'Tekan di sini' : (sel.options[idx] ? (sel.options[idx].textContent || '').trim() : '');
        val.classList.toggle('picker-empty', empty);
      }
    });
  },
  syncDateTime(input) {
    if (!input) return;
    const wrap = input.closest('.dt-wrap'); if (!wrap) return;
    wrap.classList.toggle('is-empty', !input.value);
  },
  syncDateTimes(root) {
    (root || document).querySelectorAll('input[type="date"], input[type="time"]').forEach(inp => this.syncDateTime(inp));
  },
  checkLainnya(selId, inpId) {
    const sel = document.getElementById(selId), inp = document.getElementById(inpId);
    if (sel.value === 'Lainnya') { inp.classList.remove('hidden'); inp.required = true; inp.focus(); }
    else { inp.classList.add('hidden'); inp.required = false; inp.value = ''; }
  },
  _dashEmpty(prefix) {
    return `<div class="dash-empty"><span class="dash-empty-ic"><i class="fa-solid fa-folder-open"></i></span><p class="dash-empty-tx">Belum ada data</p><button type="button" onclick="App.openInputForm('${prefix}')" class="dash-empty-btn">Buat Laporan</button></div>`;
  },
  renderStat(elId, obj, total, color, limit = null) {
    const el = document.getElementById(elId); if (!el) return;
    let entries = Object.entries(obj).sort((a,b) => b[1]-a[1]);
    if (limit) entries = entries.slice(0, limit);
    if (!entries.length) { el.innerHTML = this._dashEmpty(elId.split('_')[0]); return; }
    el.innerHTML = entries.map(([k,v], i) => {
      const pct = total === 0 ? 0 : Math.round((v/total)*100);
      return `<div class="mb-2 dash-anim" style="animation-delay:${Math.min(i*35,350)}ms"><div class="flex justify-between text-[11px] mb-1 font-bold text-gray-500 dark:text-gray-400"><span class="truncate">${k}</span><span>${v} (${pct}%)</span></div><div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2"><div class="${color} h-2 rounded-full" style="width:${pct}%"></div></div></div>`;
    }).join('');
  },
  renderTimeSlot(elId, data) {
    const el = document.getElementById(elId); if (!el) return;
    const total = Object.values(data).reduce((a,b) => a+b, 0);
    if (total === 0) { el.innerHTML = this._dashEmpty(elId.split('_')[0]); return; }
    el.innerHTML = Config.TIME_SLOTS.map((slot, i) => {
      const v = data[slot.key] || 0;
      const pct = Math.round((v/total)*100);
      return `<div class="mb-2 dash-anim" style="animation-delay:${Math.min(i*35,350)}ms">
        <div class="flex justify-between text-[11px] mb-1 font-bold text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid ${slot.icon} text-[10px]"></i> ${slot.key} <span class="text-gray-400 font-normal">(${slot.range})</span></span>
          <span>${v} <span class="text-gray-400 font-normal">(${pct}%)</span></span>
        </div>
        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2"><div class="${slot.color} h-2 rounded-full transition-all" style="width:${pct}%"></div></div>
      </div>`;
    }).join('') + `<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total: ${total} Giat</div>`;
  },
  renderLeaderboard(elId, obj, total, accentColor = 'text-gray-800 dark:text-white') {
    const el = document.getElementById(elId); if (!el) return;
    let entries = Object.entries(obj).sort((a,b) => b[1]-a[1]).slice(0, 5);
    if (!entries.length) { el.innerHTML = this._dashEmpty(elId.split('_')[0]); return; }
    const maxVal = entries[0][1];
    el.innerHTML = entries.map(([k,v], i) => {
      const pct = maxVal === 0 ? 0 : Math.round((v/maxVal)*100);
      const badgeBg = i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-gray-100 dark:bg-gray-700';
      const badgeTx = i < 3 ? 'text-white' : 'text-gray-500 dark:text-gray-300';
      return `<div class="flex items-center gap-2 p-2 rounded-lg dash-anim" style="animation-delay:${Math.min(i*35,350)}ms">
        <span class="w-6 h-6 rounded-full ${badgeBg} ${badgeTx} text-[10px] font-black flex items-center justify-center shrink-0">${i+1}</span>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-0.5">
            <p class="text-xs font-bold truncate ${accentColor}">${k}</p>
            <p class="text-xs font-black ${accentColor} flex-shrink-0">${v}</p>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1"><div class="bg-gradient-to-r from-red-500 to-amber-500 h-1 rounded-full" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    }).join('');
  },
  formatComparison(delta, invert = false) {
    if (delta === null || delta === undefined) return '';
    const isUp = delta > 0;
    const isFlat = delta === 0;
    const good = invert ? !isUp : isUp;
    const color = isFlat ? 'text-gray-400 dark:text-gray-500' : good ? 'text-emerald-500' : 'text-red-500';
    const icon = isFlat ? 'fa-minus' : isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const sign = isUp ? '+' : '';
    return `<span class="inline-flex items-center gap-0.5 text-[10px] font-bold ml-2 ${color}"><i class="fa-solid ${icon} text-[8px]"></i>${sign}${delta}%</span>`;
  }
};

globalThis.UI = UI;

/* Wiring tombol konfirmasi (pindahan dari index.html) */
document.getElementById('btnConfirmOk').onclick = () => { const cb = UI._confirmCb; UI.closeConfirm(); if (cb) cb(); };

/* Sinkron overlay "Tekan di sini" field tanggal/jam: delegasi change/input, didaftarkan sekali */
if (!globalThis.__dtSyncWired) {
  globalThis.__dtSyncWired = true;
  const _dtSyncHandler = e => { const t = e.target; if (t && (t.type === 'date' || t.type === 'time')) UI.syncDateTime(t); };
  document.addEventListener('change', _dtSyncHandler);
  document.addEventListener('input', _dtSyncHandler);
}
