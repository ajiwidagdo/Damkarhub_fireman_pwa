/* ===================== MODUL K — LAPORAN KEBAKARAN =====================
   Di-extract dari index.html (blok Mod.k = new ReportModule({...})).
   Logic 100% identik — hanya dipindah. Mengakses global: ReportModule,
   Config, Helpers, UI, App, PreviewBuilder, setSelectOrOther, Mod.
   ========================================================================= */

const ModKcfg = {
  id:'k', name:'Kebakaran', store: Config.STORES.k,
  computeStats(filtered, prevFiltered) {
    const s = { total:filtered.length, kerugian:0, nilaiAset:0, asetSelamat:0, totalRT:0, cntRT:0, air:0, jarak:0, jenis:{}, penyebab:{}, personilRank:{}, timeSlot:{'Dini Hari':0,'Pagi':0,'Siang':0,'Sore':0,'Malam':0}, korban:{'LUKA RINGAN':0,'LUKA BERAT':0,'MENINGGAL':0}, kel:{}, kec:{}, kab:{}, prev:null };
    filtered.forEach(d => {
      s.kerugian += parseFloat(d.kerugian) || 0;
      s.nilaiAset += parseFloat(d.nilaiAset) || 0;
      s.asetSelamat += parseFloat(d.asetSelamat) || 0;
      s.air += parseFloat(d.air) || 0;
      s.jarak += parseFloat(d.jarak) || 0;
      const rt = Helpers.calcRT(d.jamTerima, d.jamMulai || d.jamTiba);
      if (rt > 0 && rt < 300) { s.totalRT += rt; s.cntRT++; }
      const up = v => (v || 'Tanpa Keterangan').toUpperCase();
      s.jenis[up(d.jenis)] = (s.jenis[up(d.jenis)] || 0) + 1;
      s.penyebab[up(d.penyebab)] = (s.penyebab[up(d.penyebab)] || 0) + 1;
      s.korban['LUKA RINGAN'] += parseInt(d.lRingan) || 0;
      s.korban['LUKA BERAT'] += parseInt(d.lBerat) || 0;
      s.korban['MENINGGAL'] += parseInt(d.mnggal) || 0;
      s.kel[up(d.kel)] = (s.kel[up(d.kel)] || 0) + 1;
      s.kec[up(d.kec)] = (s.kec[up(d.kec)] || 0) + 1;
      s.kab[up(d.kabkota)] = (s.kab[up(d.kabkota)] || 0) + 1;
      const slot = Helpers.getTimeSlot(d.pukul);
      if (slot) s.timeSlot[slot]++;
      if (d.personil) d.personil.split('\n').filter(p => p.trim()).forEach(p => {
        const nm = p.trim(); s.personilRank[nm] = (s.personilRank[nm] || 0) + 1;
      });
    });
    if (prevFiltered) {
      let prevTotalRT = 0, prevCntRT = 0;
      prevFiltered.forEach(d => {
        const rt = Helpers.calcRT(d.jamTerima, d.jamMulai || d.jamTiba);
        if (rt > 0 && rt < 300) { prevTotalRT += rt; prevCntRT++; }
      });
      s.prev = { total: prevFiltered.length, rataRT: prevCntRT ? Math.round(prevTotalRT/prevCntRT) : 0 };
    }
    return s;
  },
  renderDashboard(s, filtered, period) {
    const totalDelta = s.prev ? Helpers.calcDelta(s.total, s.prev.total) : null;
    document.getElementById('k_dash_total').innerHTML = s.total + (period !== 'all' && s.prev ? UI.formatComparison(totalDelta) : '');
    document.getElementById('k_dash_kerugian').innerText = 'Rp ' + s.kerugian.toLocaleString('id-ID');
    document.getElementById('k_dash_nilaiaset').innerHTML = 'Rp ' + s.nilaiAset.toLocaleString('id-ID');
    document.getElementById('k_dash_asetselamat').innerHTML = 'Rp ' + s.asetSelamat.toLocaleString('id-ID');
    const rataRT = s.cntRT ? Math.round(s.totalRT/s.cntRT) : 0;
    const prevRataRT = s.prev ? s.prev.rataRT : 0;
    const rtDelta = s.prev ? Helpers.calcDelta(rataRT, prevRataRT) : null;
    document.getElementById('k_dash_responsetime').innerHTML = rataRT + ' <span class="text-xs">Mnt</span>' + (period !== 'all' && s.prev ? UI.formatComparison(rtDelta, true) : '');
    document.getElementById('k_dash_air').innerHTML = s.air.toFixed(1).replace(/\.0$/,'') + ' <span class="text-xs">T</span>';
    document.getElementById('k_dash_jarak').innerHTML = s.jarak.toFixed(1).replace(/\.0$/,'') + ' <span class="text-xs">Km</span>';
    const totK = s.korban['LUKA RINGAN'] + s.korban['LUKA BERAT'] + s.korban['MENINGGAL'];
    UI.renderStat('k_statJenis', s.jenis, s.total, 'bg-red-500', 5);
    UI.renderStat('k_statPenyebab', s.penyebab, s.total, 'bg-orange-500', 5);
    UI.renderStat('k_statKorban', s.korban, totK, 'bg-rose-500');
    UI.renderStat('k_statKelurahan', s.kel, s.total, 'bg-indigo-500', 5);
    UI.renderStat('k_statKecamatan', s.kec, s.total, 'bg-blue-500', 5);
    UI.renderStat('k_statKabKota', s.kab, s.total, 'bg-purple-500', 5);
    UI.renderTimeSlot('k_statTimeSlot', s.timeSlot);
    UI.renderLeaderboard('k_statReguRank', s._reguRank || {}, s.total, 'text-red-700 dark:text-red-400');
    UI.renderLeaderboard('k_statPersonilRank', s.personilRank, null, 'text-red-700 dark:text-red-400');
  },
  addKorban(data = null) {
    const c = document.getElementById('k_korbanListContainer');
    const div = document.createElement('div');
    div.className = "bg-red-50/50 dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-gray-700 relative";
    div.innerHTML = `
      <button type="button" onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center shadow-sm z-10 active:scale-90"><i class="fa-solid fa-times"></i></button>
      <div class="flex justify-between items-center mb-3">
        <p class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">Data Korban / Pemilik</p>
        <button type="button" onclick="Mod.k._copyLokasiToKorban(this)" class="text-[10px] text-blue-500 font-bold bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm border border-blue-200 dark:border-gray-600 active:scale-95">Samakan Lokasi</button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-2">
        <div><label class="field-label">Nama</label><input type="text" enterkeyhint="next" class="k_kNama" value="${data?.nama || ''}" placeholder="Nama pemilik/korban"></div>
        <div><label class="field-label">NIK (Opsional)</label><input type="text" enterkeyhint="next" class="k_kNIK" value="${data?.nik || ''}" placeholder="16 digit" maxlength="16" inputmode="numeric"></div>
      </div>
      <div data-disclosure class="disclosure">
      <button type="button" class="disclosure-head" onclick="UI.toggleDisclosure(this)"><i class="fa-solid fa-plus disc-ic"></i> Detail Usia & Alamat</button>
      <div class="disclosure-body">
      <div class="grid grid-cols-2 gap-3 mb-2">
        <div><label class="field-label">Usia (Thn)</label><input type="number" class="k_kUsia num-compact" value="${data?.usia || ''}"></div>
        <div>
          <label class="field-label">Jenis Kelamin</label>
          <select class="k_kJK"><option value="-" ${data?.jk==='-'?'selected':''}>-</option><option ${data?.jk==='Pria'?'selected':''}>Pria</option><option ${data?.jk==='Wanita'?'selected':''}>Wanita</option></select>
        </div>
      </div>
      <label class="field-label mt-2">Alamat Korban</label>
      <div class="grid grid-cols-2 gap-2 mb-2">
        <input type="text" enterkeyhint="next" class="k_kDusun" placeholder="Lingk/Dusun" value="${data?.dusun || ''}">
        <input type="text" enterkeyhint="next" class="k_kRtrw" placeholder="RT/RW" value="${data?.rtrw || ''}">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input type="text" enterkeyhint="next" class="k_kKel" placeholder="Kel/Desa" value="${data?.kel || ''}">
        <input type="text" enterkeyhint="next" class="k_kKec" placeholder="Kecamatan" value="${data?.kec || ''}">
        <input type="text" enterkeyhint="next" class="k_kKabkota col-span-2" placeholder="Kab/Kota" value="${data?.kabkota || ''}">
      </div>
      </div>
      </div>`;
    c.appendChild(div);
  },
  calcAsetTerselamatkan() {
    const nilai = parseFloat(document.getElementById('k_nilaiAset')?.value) || 0;
    const kerugian = parseFloat(document.getElementById('k_kerugian')?.value) || 0;
    const selamat = Math.max(0, nilai - kerugian);
    const field = document.getElementById('k_asetSelamat');
    if (field) field.value = selamat || '';
  },
  _copyLokasiToKorban(btn) {
    const p = btn.closest('div.bg-red-50\\/50, div.dark\\:bg-gray-800');
    p.querySelector('.k_kDusun').value = document.getElementById('k_dusun').value;
    p.querySelector('.k_kRtrw').value = document.getElementById('k_rtrw').value;
    p.querySelector('.k_kKel').value = document.getElementById('k_kel').value;
    p.querySelector('.k_kKec').value = document.getElementById('k_kec').value;
    p.querySelector('.k_kKabkota').value = document.getElementById('k_kabkota').value;
    Helpers.haptic(8);
  },
  collectForm(id) {
    const jenis = document.getElementById('k_jenisKebakaran').value === 'Lainnya' ? document.getElementById('k_jenis_lainnya').value : document.getElementById('k_jenisKebakaran').value;
    const penyebab = document.getElementById('k_penyebab').value === 'Lainnya' ? document.getElementById('k_penyebab_lainnya').value : document.getElementById('k_penyebab').value;
    const objek = document.getElementById('k_objekTerbakar').value === 'Lainnya' ? document.getElementById('k_objek_lainnya').value : document.getElementById('k_objekTerbakar').value;
    const korbanList = [...document.getElementById('k_korbanListContainer').children].map(c => ({
      nama:c.querySelector('.k_kNama').value, nik:c.querySelector('.k_kNIK')?.value || '', usia:c.querySelector('.k_kUsia').value, jk:c.querySelector('.k_kJK').value,
      dusun:c.querySelector('.k_kDusun').value, rtrw:c.querySelector('.k_kRtrw').value, kel:c.querySelector('.k_kKel').value, kec:c.querySelector('.k_kKec').value, kabkota:c.querySelector('.k_kKabkota').value
    }));
    const gv = id => document.getElementById(id).value;
    return { id, tanggal:gv('k_tanggal'), pukul:gv('k_pukul'), tglTerima:gv('k_tglTerima'), jamTerima:gv('k_jamTerima'), jamTiba:gv('k_jamTiba'), jamMulai:gv('k_jamMulai'), tglSelesai:gv('k_tglSelesai'), jamSelesai:gv('k_jamSelesai'),
      jenis, lokasiDetail:gv('k_lokasiDetail'), dusun:gv('k_dusun'), rtrw:gv('k_rtrw'), kel:gv('k_kel'), kec:gv('k_kec'), kabkota:gv('k_kabkota'), koordinat:gv('k_koordinat'),
      korbanList, pNama:gv('k_pNama'), pHP:gv('k_pHP'),
      penyebab, objekTerbakar:objek, luasArea:gv('k_luasArea'),
      nilaiAset:gv('k_nilaiAset') || 0, kerugian:gv('k_kerugian') || 0, asetSelamat:gv('k_asetSelamat') || 0,
      lRingan:gv('k_lRingan') || 0, lBerat:gv('k_lBerat') || 0, mnggal:gv('k_mnggal') || 0,
      armada:gv('k_armada'), durasi:gv('k_durasi'), jarak:gv('k_jarak'), air:gv('k_air'),
      kronologi:gv('k_kronologi'), tindakan:gv('k_tindakan'), kendala:(gv('k_kendala') || '').split('\n').map(s => s.trim()).filter(Boolean), unsur:gv('k_unsur'),
      regu:gv('k_regu'), personil:gv('k_personil'),
      foto1:gv('k_foto1_b64'), foto2:gv('k_foto2_b64'), keterangan:gv('k_keterangan') };
  },
  fillForm(d) {
    const sv = (id,v) => document.getElementById(id).value = v ?? '';
    sv('k_tanggal',d.tanggal); sv('k_pukul',d.pukul); sv('k_tglTerima',d.tglTerima || d.tanggal); sv('k_jamTerima',d.jamTerima); sv('k_jamTiba',d.jamTiba); sv('k_jamMulai',d.jamMulai); sv('k_tglSelesai',d.tglSelesai); sv('k_jamSelesai',d.jamSelesai);
    setSelectOrOther('k_jenisKebakaran','k_jenis_lainnya', d.jenis);
    sv('k_lokasiDetail',d.lokasiDetail); sv('k_dusun',d.dusun); sv('k_rtrw',d.rtrw); sv('k_kel',d.kel); sv('k_kec',d.kec); sv('k_kabkota',d.kabkota); sv('k_koordinat',d.koordinat);
    document.getElementById('k_korbanListContainer').innerHTML = '';
    (d.korbanList?.length ? d.korbanList : [null]).forEach(k => Mod.k.addKorban(k));
    sv('k_pNama',d.pNama); sv('k_pHP',d.pHP);
    setSelectOrOther('k_penyebab','k_penyebab_lainnya', d.penyebab);
    setSelectOrOther('k_objekTerbakar','k_objek_lainnya', d.objekTerbakar);
    sv('k_luasArea',d.luasArea); sv('k_nilaiAset',d.nilaiAset); sv('k_kerugian',d.kerugian); sv('k_asetSelamat',d.asetSelamat); sv('k_lRingan',d.lRingan); sv('k_lBerat',d.lBerat); sv('k_mnggal',d.mnggal);
    sv('k_armada',d.armada); sv('k_durasi',d.durasi); sv('k_jarak',d.jarak); sv('k_air',d.air);
    sv('k_kronologi',d.kronologi); sv('k_tindakan',d.tindakan); sv('k_kendala', Helpers.kendalaList(d.kendala).join('\n')); sv('k_unsur',d.unsur); sv('k_keterangan',d.keterangan);
    sv('k_regu',d.regu || ''); sv('k_personil',d.personil);
    document.getElementById('k_foto1_b64').value = d.foto1 || '';
    document.getElementById('k_foto2_b64').value = d.foto2 || '';
    App.renderReguChips('k');
    App.renderPersonnelChips('k');
    App.renderKendalaChips('k');
  },
  onResetForm() {
    ['k_jenis_lainnya','k_penyebab_lainnya','k_objek_lainnya'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('k_korbanListContainer').innerHTML = '';
    Mod.k.addKorban();
    document.getElementById('k_foto1_b64').value = '';
    document.getElementById('k_foto2_b64').value = '';
    App.renderReguChips('k');
    App.renderPersonnelChips('k');
    App.renderKendalaChips('k');
  },
  buildPreviewHTML(d) {
    const P = PreviewBuilder;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const tglTerimaIndo = d.tglTerima ? Helpers.formatDate(d.tglTerima) : tglIndo;
    const rt = Helpers.calcRT(d.jamTerima, d.jamMulai || d.jamTiba);
    const alamat = Helpers.formatAddress(d.dusun, d.rtrw, d.kel, d.kec, d.kabkota);
    const kerugian = 'Rp ' + (parseFloat(d.kerugian)||0).toLocaleString('id-ID');
    const reguStr = d.regu ? d.regu.split('\n').filter(r=>r.trim()).join(', ') : '-';
    const personilList = d.personil ? d.personil.split('\n').filter(p=>p.trim()) : [];
    const unsurList = d.unsur ? d.unsur.split('\n').filter(u=>u.trim()) : [];
    const korbanList = d.korbanList || [];
    const koorRow = d.koordinat ? P.row('Koordinat', `${d.koordinat} <button onclick="Helpers.openMaps('${String(d.koordinat).replace(/'/g,"\\'")}')" class="ml-1 text-blue-500 text-[10px] font-bold underline">Buka Maps</button>`) : '';
    const korbanHtml = korbanList.length ? korbanList.map((k, i) => `
      <div class="bg-red-50/50 dark:bg-gray-700/50 rounded-lg p-2.5 mt-2">
        <p class="text-xs font-bold text-gray-800 dark:text-gray-200">${i+1}. ${k.nama || '-'} <span class="font-normal text-gray-500">(${k.usia || '-'} th, ${k.jk || '-'})</span></p>
        ${k.nik ? `<p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">NIK: ${k.nik}</p>` : ''}
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${Helpers.formatAddress(k.dusun, k.rtrw, k.kel, k.kec, k.kabkota)}</p>
      </div>`).join('') : '<p class="text-xs text-gray-400 italic">Tidak ada data korban</p>';

    return P.header('LAPORAN KEBAKARAN', '🔥', 'from-red-600 to-red-800 shadow-red-600/20') +
      P.section('A. Identitas Laporan', 'fa-file-lines',
        P.row('Hari/Tgl', `${hari}, ${tglIndo}`) + P.row('Pukul', `${d.pukul || '-'} WIB`) + P.row('Jenis', d.jenis || '-'), 'text-red-600') +
      P.section('B. Waktu Respon', 'fa-stopwatch',
        P.row('Diterima', `${tglTerimaIndo} ${d.jamTerima || '-'} WIB`) + P.row('Tiba', `${d.jamTiba || '-'} WIB`) + P.row('Mulai', `${d.jamMulai || d.jamTiba || '-'} WIB`) +
        P.row('Selesai', d.tglSelesai ? `${Helpers.formatDate(d.tglSelesai)} ${d.jamSelesai || '-'} WIB` : `${d.jamSelesai || '-'} WIB`) +
        P.row('Respon', `${rt > 0 ? rt + ' Menit' : '-'}`) + P.row('Durasi', `${d.durasi || 0} Menit`), 'text-red-600') +
      P.section('C. Lokasi Kejadian', 'fa-location-dot',
        P.row('Patokan', d.lokasiDetail || '-') + P.row('Alamat', alamat) + koorRow, 'text-red-600') +
      P.section('D. Penyebab & Dampak', 'fa-fire',
        P.row('Penyebab', d.penyebab || '-') + P.row('Objek', d.objekTerbakar || '-') + P.row('Luas', d.luasArea || '-') +
        P.row('Nilai Aset', 'Rp ' + (parseFloat(d.nilaiAset)||0).toLocaleString('id-ID')) +
        P.row('Taksiran Kerugian', 'Rp ' + (parseFloat(d.kerugian)||0).toLocaleString('id-ID')) +
        P.row('Aset Terselamatkan', 'Rp ' + (parseFloat(d.asetSelamat)||0).toLocaleString('id-ID')), 'text-red-600') +
      P.section('E. Korban Jiwa', 'fa-heart-pulse',
        P.row('Luka Ringan', `${d.lRingan || 0} orang`) + P.row('Luka Berat', `${d.lBerat || 0} orang`) + P.row('Meninggal', `${d.mnggal || 0} orang`), 'text-red-600') +
      P.section('F. Pemilik / Korban', 'fa-user', korbanHtml, 'text-red-600') +
      P.section('G. Pelapor', 'fa-bullhorn',
        P.row('Nama', d.pNama || '-') + P.row('Kontak', d.pHP || '-'), 'text-red-600') +
      P.section('H. Operasional', 'fa-truck-medical',
        P.row('Armada', d.armada || '-') + P.row('Air', `${d.air || 0} Tangki`) + P.row('Tindakan', d.tindakan || '-') + P.row('Kendala', Helpers.kendalaList(d.kendala).join(', ') || 'Nihil'), 'text-red-600') +
      P.section('I. Personil Bertugas', 'fa-people-group',
        P.row('Regu', reguStr) + (personilList.length ? `<div class="mt-2 flex flex-wrap gap-1">${personilList.map(p => `<span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">${p}</span>`).join('')}</div>` : ''), 'text-red-600') +
      (unsurList.length ? P.section('J. Unsur Terlibat', 'fa-handshake', `<div class="flex flex-wrap gap-1">${unsurList.map(u => `<span class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-1 rounded-md">${u}</span>`).join('')}</div>`, 'text-red-600') : '');
  },
  buildWA(d) {
    const S = App.settings;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const tglTerimaIndo = d.tglTerima ? Helpers.formatDate(d.tglTerima) : tglIndo;
    const jamTerimaStr = d.jamTerima ? `Pukul ${d.jamTerima} WIB` : '';
    const rt = Helpers.calcRT(d.jamTerima, d.jamMulai || d.jamTiba);
    const rtStr = rt > 0 ? rt + ' Menit' : '-';
    const alamat = Helpers.formatAddress(d.dusun, d.rtrw, d.kel, d.kec, d.kabkota);
    let korban = '\n  -';
    if (d.korbanList?.length) {
      korban = '\n' + d.korbanList.map((k,i) => {
        const a = Helpers.formatAddress(k.dusun,k.rtrw,k.kel,k.kec,k.kabkota);
        return `${i+1}. ${k.nama || '-'}${k.nik ? ' (NIK: ' + k.nik + ')' : ''} (${k.usia || '-'} th, ${k.jk || '-'})\n   ${a}`;
      }).join('\n');
    }
    const personil = d.personil ? d.personil.split('\n').filter(p => p.trim()).map(p => `  • ${p.trim()}`).join('\n') : '  -';
    const reguStr = d.regu ? d.regu.split('\n').filter(r => r.trim()).join(', ') : '-';
    const unsur = d.unsur ? d.unsur.split('\n').filter(u => u.trim()).map(u => `  • ${u.trim()}`).join('\n') : '  -';
    const koor = d.koordinat ? `\n• Koord : ${d.koordinat}\n• Maps : https://maps.google.com/?q=${d.koordinat.replace(/\s/g,'')}` : '';
    const kerugian = 'Rp ' + (parseFloat(d.kerugian)||0).toLocaleString('id-ID');
    const addressee = S.pimpinan ? `Yth.\n${S.pimpinan}\n\n` : '';
    const tglMulaiStr = d.jamMulai ? `Mulai    : ${d.tglMulai ? Helpers.formatDate(d.tglMulai) : tglIndo} ${d.jamMulai} WIB\n` : '';
    const tglSelesaiStr = d.jamSelesai ? `• Selesai : ${d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : (d.tglMulai ? Helpers.formatDate(d.tglMulai) : tglIndo)} ${d.jamSelesai} WIB\n` : '';
    const penyebabLine = (d.penyebab === 'Belum Diketahui') ? `Penyebab : ${d.penyebab}` : `Penyebab : Dugaan sementara karena ${d.penyebab || '-'}`;
    let wa = ` *LAPORAN KEBAKARAN*
_${S.instansi || ''}_ — _${S.daerah || ''}_
━━━━━━━━━━━━━━━━━━━

${addressee} Mohon izin melaporkan kejadian *${d.jenis || '-'}* sebagai berikut :

 *A. WAKTU KEJADIAN*
• Hari/Tgl : ${hari}, ${tglIndo}
• Pukul : ${d.pukul || '-'} WIB

 *B. WAKTU RESPON*
• Laporan Diterima : ${tglTerimaIndo} ${d.jamTerima || '-'} WIB
• Tiba di Lokasi : ${d.jamTiba || '-'} WIB
• Mulai Penanganan : ${d.jamMulai || d.jamTiba || '-'} WIB
${tglSelesaiStr}• Respon Time : *${rtStr}*
• Durasi penanganan : ${d.durasi || 0} Menit
• Jarak ke lokasi : ${d.jarak || 0} Km

 *C. LOKASI KEJADIAN*
• Nama Tempat : ${d.lokasiDetail || '-'}${koor}

 *D. KRONOLOGI*
${d.kronologi || '-'}

 *E. PENYEBAB & DAMPAK*
• ${penyebabLine}
• Objek Terbakar : ${d.objekTerbakar || '-'}
• Luas Area : ${d.luasArea || '-'}
• Taksiran Kerugian : *Rp ${(parseFloat(d.kerugian)||0).toLocaleString('id-ID')}*
• Nilai Aset : Rp ${(parseFloat(d.nilaiAset)||0).toLocaleString('id-ID')}
• Aset Terselamatkan : Rp ${(parseFloat(d.asetSelamat)||0).toLocaleString('id-ID')}
• Korban Jiwa : LR ${d.lRingan || 0}, LB ${d.lBerat || 0}, MD ${d.mnggal || 0}

 *F. PEMILIK ASET / KORBAN*${korban}

 *G. PELAPOR*
• Nama : ${d.pNama || '-'}
• Kontak : ${d.pHP || '+62'}

 *H. DETAIL PENANGANAN*
• Armada : ${d.armada || '-'}${parseFloat(d.air) > 0 ? `
• Suplai Air : ${d.air} Tangki` : ''}
• Tindakan : ${d.tindakan || '-'}
• Kendala : ${Helpers.kendalaList(d.kendala).join(', ') || 'Nihil'}${d.keterangan ? `\n• Keterangan Lain : ${d.keterangan}` : ''}

 *I. PERSONIL YANG BERTUGAS*
${reguStr}
${personil}

 *J. UNSUR TERLIBAT*
${unsur}

━━━━━━━━━━━━━━━━━━━
 Demikian yang dapat kami laporkan. 
 Terima kasih.
`;
    return wa;
  }
};

const ModK = new ReportModule(ModKcfg);
export { ModK };

globalThis.Mod = globalThis.Mod || {};
globalThis.Mod.k = ModK;
