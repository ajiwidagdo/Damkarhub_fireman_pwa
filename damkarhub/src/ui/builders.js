export const Builders = {
  dashCard({ icon, iconColor, label, value, valueClass = 'text-gray-800 dark:text-white', size = 'lg', compact = false }) {
    if (compact) return `<div class="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
      <div class="absolute bottom-0 right-0 p-1.5 opacity-10"><i class="${icon} text-4xl ${iconColor}"></i></div>
      <p class="text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-wider leading-tight min-h-[22px] relative z-10">${label}</p>
      <h3 class="text-lg md:text-xl font-black ${valueClass} relative z-10">${value}</h3>
    </div>`;
    return `<div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
      <div class="absolute top-0 right-0 p-3 opacity-10"><i class="${icon} text-5xl ${iconColor}"></i></div>
      <p class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-widest relative z-10">${label}</p>
      <h3 class="${size === 'lg' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} font-black ${valueClass} relative z-10">${value}</h3>
    </div>`;
  },
  inputNum(id, label, value, attrs='') { return `<div><label class="field-label">${label}</label><input type="number" id="${id}" value="${value}" ${attrs}></div>`; },
  inputText(id, label, ph='', attrs='') { return `<div><label class="field-label">${label}</label><input type="text" enterkeyhint="next" id="${id}" placeholder="${ph}" ${attrs}></div>`; },
  operasionalInputs(prefix, { armadaRequired=true, includeAir=true } = {}) {
    return `<div class="grid grid-cols-3 gap-3 mb-3 keep-3col">
      <div class="col-span-2"><label class="field-label">Armada</label><div class="flex items-center gap-2"><input type="text" enterkeyhint="next" id="${prefix}_armada" placeholder="1 Unit Pancar" class="flex-1 min-w-0" ${armadaRequired ? 'required' : ''}><button type="button" class="btn-mic" onclick="Helpers.startSpeech('${prefix}_armada', this)" aria-label="Isi dengan suara" title="Isi dengan suara"><i class="fa-solid fa-microphone"></i></button></div></div>
      ${includeAir ? `<div><label class="field-label text-blue-500 dark:text-blue-400">Air (Tangki)</label><div class="flex items-center gap-2"><input type="number" step="0.1" id="${prefix}_air" class="num-compact"></div></div>` : ''}
    </div>`;
  },

  durasiJarakCells(prefix, { includeJarak=true, durasiRequired=true } = {}) {
    return `<div><label class="field-label">Durasi</label><div class="flex items-center gap-2"><input type="number" id="${prefix}_durasi" value="" class="num-compact" ${durasiRequired ? 'required' : ''}><span class="unit-suffix">Mnt</span></div></div>
      ${includeJarak ? `<div><label class="field-label">Jarak</label><div class="flex items-center gap-2"><input type="number" step="0.1" id="${prefix}_jarak" class="num-compact"><span class="unit-suffix">Km</span></div></div>` : ''}`;
  },

  durasiJarakInputs(prefix, { includeJarak=true, durasiRequired=true } = {}) {
    return `<div class="grid grid-cols-2 gap-3 mb-3">${this.durasiJarakCells(prefix, { includeJarak, durasiRequired })}</div>`;
  },

  koordinatInputs(prefix) {
    return `<div class="mb-3">
      <label class="field-label">Koordinat Gmaps</label>
      <div class="flex gap-2 items-center">
        <input type="text" enterkeyhint="next" id="${prefix}_koordinat" placeholder="-7.xxxx, 108.xxxx" oninput="Helpers.autoFillJarak('${prefix}')">
        <button type="button" onclick="Helpers.getLoc('${prefix}')" class="icon-ghost" title="Rekam koordinat saat ini" aria-label="Rekam koordinat saat ini"><i class="fa-solid fa-location-crosshairs"></i></button>
      </div>
    </div>`;
  },

  casualtyInputs(prefix) {
    return `<div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg grid grid-cols-3 gap-2">
      ${this.inputNum(`${prefix}_lRingan`, 'LUKA RINGAN', 0)}
      ${this.inputNum(`${prefix}_lBerat`, 'LUKA BERAT', 0)}
      <div><label class="field-label text-red-500 dark:text-red-400">MENINGGAL</label><input type="number" id="${prefix}_mnggal" value="0" class="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"></div>
    </div>`;
  },
  reguInputs(prefix) {
    return `<div class="grid grid-cols-2 gap-3 mb-3">
      <div>
        <div class="flex justify-between items-center mb-1">
          <label class="field-label mb-0">Regu Piket</label>
          <button type="button" onclick="App.openReguSelector('${prefix}')" class="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold border border-indigo-200 dark:border-indigo-800 active:scale-95"><i class="fa-solid fa-users mr-1"></i>Pilih</button>
        </div>
        <div id="${prefix}_regu_chips" class="flex flex-wrap gap-1.5 min-h-[42px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"></div>
        <input type="hidden" id="${prefix}_regu">
      </div>
      <div>
        <div class="flex justify-between items-center mb-1">
          <label class="field-label mb-0">Personil</label>
          <button type="button" onclick="App.openPersonnelSelector('${prefix}')" class="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold border border-indigo-200 dark:border-indigo-800 active:scale-95"><i class="fa-solid fa-user-plus mr-1"></i>Pilih</button>
        </div>
        <div id="${prefix}_personil_chips" class="flex flex-wrap gap-1.5 min-h-[42px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"></div>
        <input type="hidden" id="${prefix}_personil" required>
      </div>
    </div>`;
  },
  kendalaInputs(prefix) {
    return `<div class="mb-3">
      <div class="flex justify-between items-center mb-1">
        <label class="field-label mb-0">Kendala</label>
        <button type="button" onclick="App.openKendalaSelector('${prefix}')" class="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold border border-indigo-200 dark:border-indigo-800 active:scale-95"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Pilih Kendala</button>
      </div>
      <div id="${prefix}_kendala_chips" class="flex flex-wrap gap-1.5 min-h-[42px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"></div>
      <input type="hidden" id="${prefix}_kendala">
    </div>`;
  },
  photoInputs(prefix) {
    const tile = 'block w-full text-[11px] text-center text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-3 cursor-pointer active:scale-95 transition';
    return `<div><label class="field-label">Foto</label>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="${tile}">
          <i class="fa-solid fa-camera mr-1"></i> Ambil Foto
          <input type="file" accept="image/*" class="hidden" onchange="Helpers.compressImage(this, '${prefix}_foto1_b64')">
        </label>
        <input type="hidden" id="${prefix}_foto1_b64">
      </div>
      <div><label class="${tile}">
          <i class="fa-solid fa-camera mr-1"></i> Ambil Foto
          <input type="file" accept="image/*" class="hidden" onchange="Helpers.compressImage(this, '${prefix}_foto2_b64')">
        </label>
        <input type="hidden" id="${prefix}_foto2_b64">
      </div>
    </div></div>`;
  },
  exportPanel(prefix, columns) {
    const saved = (() => { try { return JSON.parse(localStorage.getItem('export_cols_' + prefix) || 'null'); } catch { return null; } })();
    const defaults = (Config.DEFAULT_EXPORT_COLS && Config.DEFAULT_EXPORT_COLS[prefix]) || columns;
    const isChecked = (c) => saved ? saved.includes(c) : defaults.includes(c);
    const colChecks = columns.map(c => `<label class="flex items-center text-xs dark:text-gray-300 py-1"><input type="checkbox" value="${c}" ${isChecked(c) ? 'checked' : ''} class="mr-2 cb-custom export-col-cb" data-prefix="${prefix}" onchange="App.saveExportCols('${prefix}')"> ${c}</label>`).join('');
    const monthOpts = Config.MONTHS.map((m,i) => `<option value="${i}">${m}</option>`).join('');
    return `<div class="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-sm font-bold mb-3">1. Pilih Periode</h3>
      <div class="flex flex-wrap gap-2 mb-5">
        <select id="${prefix}_ex_period" class="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-xs bg-gray-50 dark:bg-gray-700 font-bold" onchange="App.updateExFilters('${prefix}')"><option value="month">Bulan</option><option value="year">Tahun</option><option value="all">Semua</option></select>
        <select id="${prefix}_ex_month" class="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-xs bg-gray-50 dark:bg-gray-700 font-bold">${monthOpts}</select>
        <select id="${prefix}_ex_year" class="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5 text-xs bg-gray-50 dark:bg-gray-700 font-bold"></select>
      </div>
      <div class="flex items-center justify-between mb-3 border-t border-gray-100 dark:border-gray-700 pt-4">
        <h3 class="text-sm font-bold">2. Pilih Kolom Data</h3>
        <div class="flex gap-1.5">
          <button type="button" onclick="App.toggleAllExportCols('${prefix}', true)" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:scale-95">✓ Semua</button>
          <button type="button" onclick="App.toggleAllExportCols('${prefix}', false)" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 active:scale-95">✕ Hapus</button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5" id="${prefix}_col_checks">${colChecks}</div>
      <div class="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
        <button onclick="Export.generate('${prefix}','excel')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl active:scale-[.98]"><i class="fa-solid fa-file-excel mr-2"></i> Unduh Excel (CSV)</button>
        <button onclick="Export.generate('${prefix}','pdf')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl active:scale-[.98]"><i class="fa-solid fa-file-pdf mr-2"></i> Cetak PDF (A4)</button>
      </div>
    </div>`;
  },
  timeSlotAndLeaderboard(prefix) {
    return `<div class="space-y-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-clock text-blue-500 mr-2"></i> Rasio Waktu Pelayanan</h3>
        <div id="${prefix}_statTimeSlot" class="space-y-3"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-trophy text-amber-500 mr-2"></i> Leaderboard Regu</h3>
          <div id="${prefix}_statReguRank" class="space-y-2"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-medal text-indigo-500 mr-2"></i> Leaderboard Personil</h3>
          <div id="${prefix}_statPersonilRank" class="space-y-2"></div>
        </div>
      </div>
    </div>`;
  },
};
globalThis.Builders = Builders;
