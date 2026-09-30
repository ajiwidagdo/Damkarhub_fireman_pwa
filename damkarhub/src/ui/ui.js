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
  
  // Haptic feedback
  Helpers.haptic(isDark ? [15, 30, 15] : 10);
  
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
  checkLainnya(selId, inpId) {
    const sel = document.getElementById(selId), inp = document.getElementById(inpId);
    if (sel.value === 'Lainnya') { inp.classList.remove('hidden'); inp.required = true; inp.focus(); }
    else { inp.classList.add('hidden'); inp.required = false; inp.value = ''; }
  },
  renderStat(elId, obj, total, color, limit = null) {
    const el = document.getElementById(elId); if (!el) return;
    let entries = Object.entries(obj).sort((a,b) => b[1]-a[1]);
    if (limit) entries = entries.slice(0, limit);
    if (!entries.length) { el.innerHTML = '<p class="text-xs text-gray-400">Belum ada data</p>'; return; }
    el.innerHTML = entries.map(([k,v]) => {
      const pct = total === 0 ? 0 : Math.round((v/total)*100);
      return `<div class="mb-2"><div class="flex justify-between text-[11px] mb-1 font-bold text-gray-500 dark:text-gray-400"><span class="truncate">${k}</span><span>${v} (${pct}%)</span></div><div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5"><div class="${color} h-1.5 rounded-full" style="width:${pct}%"></div></div></div>`;
    }).join('');
  },
  renderTimeSlot(elId, data) {
    const el = document.getElementById(elId); if (!el) return;
    const total = Object.values(data).reduce((a,b) => a+b, 0);
    if (total === 0) { el.innerHTML = '<p class="text-xs text-gray-400">Belum ada data</p>'; return; }
    el.innerHTML = Config.TIME_SLOTS.map(slot => {
      const v = data[slot.key] || 0;
      const pct = Math.round((v/total)*100);
      return `<div class="mb-2">
        <div class="flex justify-between text-[11px] mb-1 font-bold text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid ${slot.icon} text-[10px]"></i> ${slot.key} <span class="text-gray-400 font-normal">(${slot.range})</span></span>
          <span>${v} <span class="text-gray-400 font-normal">(${pct}%)</span></span>
        </div>
        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5"><div class="${slot.color} h-1.5 rounded-full transition-all" style="width:${pct}%"></div></div>
      </div>`;
    }).join('') + `<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total: ${total} Giat</div>`;
  },
  renderLeaderboard(elId, obj, total, accentColor = 'text-gray-800 dark:text-white') {
    const el = document.getElementById(elId); if (!el) return;
    let entries = Object.entries(obj).sort((a,b) => b[1]-a[1]).slice(0, 5);
    if (!entries.length) { el.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">Belum ada data</p>'; return; }
    const medals = ['🥇','🥈','🥉'];
    const maxVal = entries[0][1];
    el.innerHTML = entries.map(([k,v], i) => {
      const medal = i < 3 ? medals[i] : `<span class="text-[10px] font-bold text-gray-400 w-5 text-center">#${i+1}</span>`;
      const pct = maxVal === 0 ? 0 : Math.round((v/maxVal)*100);
      const rankCls = i === 0 ? 'bg-amber-50 dark:bg-amber-900/20' : i === 1 ? 'bg-gray-50 dark:bg-gray-700/50' : i === 2 ? 'bg-orange-50 dark:bg-orange-900/10' : '';
      return `<div class="flex items-center gap-2 p-2 rounded-lg ${rankCls}">
        <div class="flex-shrink-0 w-6 text-center text-sm">${medal}</div>
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
