/* ===================== RENDER LAYOUTS (render awal layout dashboard & form) =====================
   Di-extract dari index.html (function renderLayouts, 112 baris). Logic 100% identik.
   Dipanggil oleh: App.init/boot saat startup (setelah DOMContentLoaded).
   Global: Builders (dipakai saat fungsi dipanggil).
   ========================================================================= */
export function renderLayouts() {
  const kpiRow = (icon, boxCls, valCls, label, id) => `
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-8 h-8 shrink-0 rounded-lg ${boxCls} flex items-center justify-center text-sm"><i class="${icon}"></i></span>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">${label}</p>
        </div>
        <p id="${id}" class="text-sm font-black ${valCls} whitespace-nowrap">Rp 0</p>
      </div>`;
  document.getElementById('k_dash_cards').innerHTML = `
    <div class="kpi-compact grid grid-cols-2 gap-2.5 mb-3">
      ${Builders.dashCard({ icon:'fa-solid fa-fire-flame-curved', iconColor:'text-red-600', label:'Total Kebakaran', value:0, compact:true }).replace('<h3 ', '<h3 id="k_dash_total" ')}
      ${Builders.dashCard({ icon:'fa-solid fa-stopwatch', iconColor:'text-emerald-500', label:'Respon Time', value:'0 <span class="text-xs">Mnt</span>', compact:true }).replace('<h3 ', '<h3 id="k_dash_responsetime" ')}
      ${Builders.dashCard({ icon:'fa-solid fa-droplet', iconColor:'text-cyan-500', label:'Air', value:'0 <span class="text-xs">T</span>', valueClass:'text-cyan-600 dark:text-cyan-400', compact:true }).replace('<h3 ', '<h3 id="k_dash_air" ')}
      ${Builders.dashCard({ icon:'fa-solid fa-route', iconColor:'text-indigo-500', label:'Jarak Tempuh', value:'0 <span class="text-xs">Km</span>', valueClass:'text-indigo-600 dark:text-indigo-400', compact:true }).replace('<h3 ', '<h3 id="k_dash_jarak" ')}
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-5 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-700">
      ${kpiRow('fa-solid fa-building', 'bg-purple-50 dark:bg-purple-900/20 text-purple-500', 'text-purple-600 dark:text-purple-400', 'Nilai Aset', 'k_dash_nilaiaset')}
      ${kpiRow('fa-solid fa-rupiah-sign', 'bg-orange-50 dark:bg-orange-900/20 text-orange-500', 'text-orange-600 dark:text-orange-400', 'Taksiran Kerugian', 'k_dash_kerugian')}
      ${kpiRow('fa-solid fa-shield-heart', 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500', 'text-emerald-600 dark:text-emerald-400', 'Aset Terselamatkan', 'k_dash_asetselamat')}
    </div>`;
  document.getElementById('k_dash_stats').innerHTML = `<div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-fire text-red-500 mr-2"></i> Jenis Kebakaran</h3><div id="k_statJenis" class="space-y-3"></div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-plug-circle-exclamation text-orange-500 mr-2"></i> Penyebab</h3><div id="k_statPenyebab" class="space-y-3"></div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-map-location-dot text-indigo-500 mr-2"></i> Wilayah</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><p class="text-[10px] font-bold text-purple-500 mb-2">Kab/Kota</p><div id="k_statKabKota" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-blue-500 mb-2">Kecamatan</p><div id="k_statKecamatan" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-indigo-500 mb-2">Kel/Desa</p><div id="k_statKelurahan" class="space-y-2"></div></div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-notes-medical text-rose-500 mr-2"></i> Korban</h3><div id="k_statKorban" class="space-y-3"></div>
    </div>
    ${Builders.timeSlotAndLeaderboard('k')}
    <div class="h-24"></div>
  </div>`;

  document.getElementById('nk_dash_cards').innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
    ${Builders.dashCard({ icon:'fa-solid fa-life-ring', iconColor:'text-amber-500', label:'Total', value:0 }).replace('<h3 ', '<h3 id="nk_dash_total" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-route', iconColor:'text-cyan-500', label:'Mobilitas', value:'0 <span class="text-xs">Km</span>', valueClass:'text-cyan-600 dark:text-cyan-400' }).replace('<h3 ', '<h3 id="nk_dash_jarak" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-clock', iconColor:'text-emerald-500', label:'Total Durasi', value:'0 <span class="text-xs">Mnt</span>', valueClass:'text-emerald-600 dark:text-emerald-400' }).replace('<h3 ', '<h3 id="nk_dash_durasi" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-droplet', iconColor:'text-blue-500', label:'Air', value:'0 <span class="text-xs">T</span>', valueClass:'text-blue-600 dark:text-blue-400' }).replace('<h3 ', '<h3 id="nk_dash_air" ')}
  </div>`;
  document.getElementById('nk_dash_stats').innerHTML = `<div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-chart-bar text-amber-500 mr-2"></i> Jenis Penyelamatan</h3><div id="nk_statJenis" class="space-y-3"></div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-map text-blue-500 mr-2"></i> Wilayah</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><p class="text-[10px] font-bold text-purple-500 mb-2">Kab/Kota</p><div id="nk_statKabKota" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-blue-500 mb-2">Kecamatan</p><div id="nk_statKecamatan" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-indigo-500 mb-2">Kel/Desa</p><div id="nk_statKelurahan" class="space-y-2"></div></div>
      </div>
    </div>
    ${Builders.timeSlotAndLeaderboard('nk')}
    <div class="h-24"></div>
  </div>`;

  document.getElementById('sos_dash_cards').innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
    ${Builders.dashCard({ icon:'fa-solid fa-chalkboard-user', iconColor:'text-emerald-500', label:'Total Giat', value:0 }).replace('<h3 ', '<h3 id="sos_dash_total" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-users-rectangle', iconColor:'text-blue-500', label:'Peserta', value:0 }).replace('<h3 ', '<h3 id="sos_dash_peserta" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-clock', iconColor:'text-amber-500', label:'Total Durasi', value:'0 <span class="text-xs">Mnt</span>', valueClass:'text-amber-600 dark:text-amber-400' }).replace('<h3 ', '<h3 id="sos_dash_durasi" ')}
    ${Builders.dashCard({ icon:'fa-solid fa-droplet', iconColor:'text-cyan-500', label:'Air', value:'0 <span class="text-xs">T</span>', valueClass:'text-cyan-600 dark:text-cyan-400' }).replace('<h3 ', '<h3 id="sos_dash_air" ')}
  </div>`;
  document.getElementById('sos_dash_stats').innerHTML = `<div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-layer-group text-emerald-500 mr-2"></i> Sasaran Edukasi</h3><div id="sos_statKategori" class="space-y-3"></div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-map-location-dot text-indigo-500 mr-2"></i> Wilayah</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><p class="text-[10px] font-bold text-purple-500 mb-2">Kab/Kota</p><div id="sos_statKabKota" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-blue-500 mb-2">Kecamatan</p><div id="sos_statKecamatan" class="space-y-2"></div></div>
        <div><p class="text-[10px] font-bold text-indigo-500 mb-2">Kel/Desa</p><div id="sos_statKelurahan" class="space-y-2"></div></div>
      </div>
    </div>
    ${Builders.timeSlotAndLeaderboard('sos')}
    <div class="h-24"></div>
  </div>`;

  document.getElementById('k_operasional_inputs').innerHTML = Builders.operasionalInputs('k');
  document.getElementById('k_kendala_inputs').innerHTML = Builders.kendalaInputs('k');
  document.getElementById('k_casualty_inputs').innerHTML = Builders.casualtyInputs('k');
  document.getElementById('k_regu_inputs').innerHTML = Builders.reguInputs('k');
  document.getElementById('k_photo_inputs').innerHTML = Builders.photoInputs('k', 'Foto Api (1)', 'Foto Selesai (2)');
  document.getElementById('k_waktu_inputs').innerHTML = Builders.koordinatInputs('k') + Builders.durasiJarakInputs('k');

  document.getElementById('nk_operasional_inputs').innerHTML = Builders.operasionalInputs('nk', { armadaRequired:false });
  document.getElementById('nk_kendala_inputs').innerHTML = Builders.kendalaInputs('nk');
  document.getElementById('nk_casualty_inputs').innerHTML = Builders.casualtyInputs('nk');
  document.getElementById('nk_regu_inputs').innerHTML = Builders.reguInputs('nk');
  document.getElementById('nk_photo_inputs').innerHTML = Builders.photoInputs('nk', 'Foto Proses (1)', 'Foto Selesai (2)');
  document.getElementById('nk_waktu_inputs').innerHTML = Builders.koordinatInputs('nk') + Builders.durasiJarakInputs('nk');

  document.getElementById('sos_operasional_inputs').innerHTML = `<div class="grid grid-cols-2 gap-3 mb-3">
    ${Builders.inputText('sos_armada', 'Armada', '2 Unit Pancar')}
    <div><label class="field-label text-blue-500 dark:text-blue-400">Air (Tangki)</label><input type="number" step="0.1" id="sos_air" value="0"></div>
  </div>`;
  document.getElementById('sos_waktu_inputs').innerHTML = Builders.durasiJarakInputs('sos', { includeJarak: false });
  document.getElementById('sos_regu_inputs').innerHTML = Builders.reguInputs('sos');
  document.getElementById('sos_photo_inputs').innerHTML = Builders.photoInputs('sos', 'Foto Proses (1)', 'Foto Bersama (2)');

  document.getElementById('k_export_panel').innerHTML = Builders.exportPanel('k', ['Tanggal','Jam Mulai','Tgl Selesai','Jam Selesai','Jenis Kejadian','Lokasi Detail','Penyebab','Objek','Nilai Aset','Taksiran Kerugian','Aset Terselamatkan','Korban Jiwa','Data Korban','NIK Korban','Alamat Korban','Respon Time','Jarak Tempuh','Armada & Air','Regu','Kendala','Keterangan']);
  document.getElementById('nk_export_panel').innerHTML = Builders.exportPanel('nk', ['Tanggal','Jam Mulai','Tgl Selesai','Jam Selesai','Jenis Giat','Lokasi Detail','Data Pelapor','Alamat Pelapor','Objek','Durasi','Jarak','Armada','Air','Korban','Kendala','Regu','Keterangan']);
  document.getElementById('sos_export_panel').innerHTML = Builders.exportPanel('sos', ['Tanggal','Jam Mulai','Tgl Selesai','Jam Selesai','Tempat','Sasaran Edukasi','Nama Instansi','Alamat Instansi','Jumlah Peserta','Durasi','Armada & Air','Regu','Keterangan']);

  // Suntik tombol mic ke text input/textarea form laporan (idempoten)
  Helpers.injectMicButtons();
  if (globalThis.UI) { UI.syncPickers(); if (UI.syncDisclosures) UI.syncDisclosures(); }
}

globalThis.renderLayouts = renderLayouts;
