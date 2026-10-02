/* ===================== MODUL NK — LAPORAN PENYELAMATAN =====================
   Di-extract dari index.html (blok Mod.nk = new ReportModule({...})).
   Logic 100% identik — hanya dipindah. Mengakses global: ReportModule,
   Config, Helpers, UI, App, PreviewBuilder, setSelectOrOther, Mod.
   ========================================================================= */

export const ModNkcfg = {
  id:'nk', name:'Penyelamatan', store: Config.STORES.nk,
  computeStats(filtered, prevFiltered) {
    const s = { total:filtered.length, jarak:0, totalDurasi:0, air:0, jenis:{}, personilRank:{}, timeSlot:{'Dini Hari':0,'Pagi':0,'Siang':0,'Sore':0,'Malam':0}, kel:{}, kec:{}, kab:{}, prev:null };
    filtered.forEach(d => {
      s.jarak += parseFloat(d.jarak) || 0;
      s.air += parseFloat(d.air) || 0;
      s.totalDurasi += parseInt(d.durasi) || 0;
      const up = v => (v || 'Tanpa Keterangan').toUpperCase();
      s.jenis[up(d.jenis)] = (s.jenis[up(d.jenis)] || 0) + 1;
      s.kel[up(d.kel)] = (s.kel[up(d.kel)] || 0) + 1;
      s.kec[up(d.kec)] = (s.kec[up(d.kec)] || 0) + 1;
      s.kab[up(d.kabkota)] = (s.kab[up(d.kabkota)] || 0) + 1;
      const slot = Helpers.getTimeSlot(d.pukul);
      if (slot) s.timeSlot[slot]++;
      if (d.personil) d.personil.split('\n').filter(p => p.trim()).forEach(p => {
        const nm = p.trim(); s.personilRank[nm] = (s.personilRank[nm] || 0) + 1;
      });
    });
    if (prevFiltered) s.prev = { total: prevFiltered.length };
    return s;
  },
  renderDashboard(s, filtered, period) {
    const totalDelta = s.prev ? Helpers.calcDelta(s.total, s.prev.total) : null;
    document.getElementById('nk_dash_total').innerHTML = s.total + (period !== 'all' && s.prev ? UI.formatComparison(totalDelta) : '');
    document.getElementById('nk_dash_jarak').innerHTML = s.jarak.toFixed(1).replace(/\.0$/,'') + ' <span class="text-xs">Km</span>';
    document.getElementById('nk_dash_durasi').innerHTML = s.totalDurasi.toLocaleString('id-ID') + ' <span class="text-xs">Mnt</span>';
    document.getElementById('nk_dash_air').innerHTML = s.air.toFixed(1).replace(/\.0$/,'') + ' <span class="text-xs">T</span>';
    UI.renderStat('nk_statJenis', s.jenis, s.total, 'bg-amber-500', 5);
    UI.renderStat('nk_statKelurahan', s.kel, s.total, 'bg-indigo-500', 5);
    UI.renderStat('nk_statKecamatan', s.kec, s.total, 'bg-blue-500', 5);
    UI.renderStat('nk_statKabKota', s.kab, s.total, 'bg-purple-500', 5);
    UI.renderTimeSlot('nk_statTimeSlot', s.timeSlot);
    UI.renderLeaderboard('nk_statReguRank', s._reguRank || {}, s.total, 'text-amber-700 dark:text-amber-400');
    UI.renderLeaderboard('nk_statPersonilRank', s.personilRank, null, 'text-amber-700 dark:text-amber-400');
  },
  autofillIdentitasAlamat() {
    const pairs = [['nk_dusun','nk_idDusun'],['nk_rtrw','nk_idRtrw'],['nk_kel','nk_idKel'],['nk_kec','nk_idKec'],['nk_kabkota','nk_idKabkota']];
    pairs.forEach(([src, dst]) => {
      const s = document.getElementById(src), d = document.getElementById(dst);
      if (s && d && !(d.value || '').trim() && (s.value || '').trim()) d.value = s.value;
    });
  },
  collectForm(id) {
    const jenis = document.getElementById('nk_jenis').value === 'Lainnya' ? document.getElementById('nk_jenis_lainnya').value : document.getElementById('nk_jenis').value;
    const gv = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    return { id, tanggal: gv('nk_tanggal'), pukul: gv('nk_pukul'), tglTerima: gv('nk_tanggal'), jamTerima: gv('nk_pukul'), tglMulai: gv('nk_tglMulai'), jamMulai: gv('nk_jamMulai'), tglSelesai: gv('nk_tglSelesai'), jamSelesai: gv('nk_jamSelesai'),
      jenis, lokasiDetail:gv('nk_lokasiDetail'), dusun:gv('nk_dusun'), rtrw:gv('nk_rtrw'), kel:gv('nk_kel'), kec:gv('nk_kec'), kabkota:gv('nk_kabkota'), koordinat:gv('nk_koordinat'),
      idNama:gv('nk_idNama'), idUsia:gv('nk_idUsia'), idJK:gv('nk_idJK'), pHP:gv('nk_pHP'),
      idDusun:gv('nk_idDusun'), idRtrw:gv('nk_idRtrw'), idKel:gv('nk_idKel'), idKec:gv('nk_idKec'), idKabkota:gv('nk_idKabkota'),
      objek:gv('nk_objek'), lokasiOp:gv('nk_lokasiOp'), ukuran:gv('nk_ukuran'),
      durasi:gv('nk_durasi'), armada:gv('nk_armada'), jarak:gv('nk_jarak'), air:gv('nk_air'),
      kronologi:gv('nk_kronologi'), tindakan:gv('nk_tindakan'), kendala:(gv('nk_kendala') || '').split('\n').map(s => s.trim()).filter(Boolean),
      lRingan:gv('nk_lRingan') || 0, lBerat:gv('nk_lBerat') || 0, mnggal:gv('nk_mnggal') || 0,
      regu:gv('nk_regu'), personil:gv('nk_personil'),
      foto1:gv('nk_foto1_b64'), foto2:gv('nk_foto2_b64'), keterangan:gv('nk_keterangan') };
  },
  fillForm(d) {
    const sv = (id,v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    sv('nk_tanggal',d.tanggal || d.tglTerima); sv('nk_pukul',d.pukul || d.jamTerima); sv('nk_tglMulai',d.tglMulai || d.tglTerima || d.tanggal); sv('nk_jamMulai',d.jamMulai); sv('nk_tglSelesai',d.tglSelesai); sv('nk_jamSelesai',d.jamSelesai);
    setSelectOrOther('nk_jenis','nk_jenis_lainnya', d.jenis);
    sv('nk_lokasiDetail',d.lokasiDetail); sv('nk_dusun',d.dusun); sv('nk_rtrw',d.rtrw); sv('nk_kel',d.kel); sv('nk_kec',d.kec); sv('nk_kabkota',d.kabkota); sv('nk_koordinat',d.koordinat);
    sv('nk_idNama',d.idNama); sv('nk_idUsia',d.idUsia); sv('nk_idJK',d.idJK || '-'); sv('nk_pHP',d.pHP);
    sv('nk_idDusun',d.idDusun); sv('nk_idRtrw',d.idRtrw); sv('nk_idKel',d.idKel); sv('nk_idKec',d.idKec); sv('nk_idKabkota',d.idKabkota);
    sv('nk_objek',d.objek); sv('nk_lokasiOp',d.lokasiOp); sv('nk_ukuran',d.ukuran);
    sv('nk_durasi',d.durasi); sv('nk_armada',d.armada); sv('nk_jarak',d.jarak); sv('nk_air',d.air);
    sv('nk_kronologi',d.kronologi); sv('nk_tindakan',d.tindakan); sv('nk_kendala', Helpers.kendalaList(d.kendala).join('\n')); sv('nk_keterangan',d.keterangan);
    sv('nk_lRingan',d.lRingan); sv('nk_lBerat',d.lBerat); sv('nk_mnggal',d.mnggal);
    sv('nk_regu',d.regu || ''); sv('nk_personil',d.personil);
    document.getElementById('nk_foto1_b64').value = d.foto1 || '';
    document.getElementById('nk_foto2_b64').value = d.foto2 || '';
    this.autofillIdentitasAlamat();
    App.renderReguChips('nk');
    App.renderPersonnelChips('nk');
    App.renderKendalaChips('nk');
  },
  onResetForm() {
    document.getElementById('nk_jenis_lainnya').classList.add('hidden');
    document.getElementById('nk_foto1_b64').value = '';
    document.getElementById('nk_foto2_b64').value = '';
    App.renderReguChips('nk');
    App.renderPersonnelChips('nk');
    App.renderKendalaChips('nk');
  },
  buildPreviewHTML(d) {
    const P = PreviewBuilder;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const tglTerimaIndo = d.tglTerima ? Helpers.formatDate(d.tglTerima) : tglIndo;
    const alamat = Helpers.formatAddress(d.idDusun, d.idRtrw, d.idKel, d.idKec, d.idKabkota);
    const alamatLokasi = Helpers.formatAddress(d.dusun, d.rtrw, d.kel, d.kec, d.kabkota);
    const reguStr = d.regu ? d.regu.split('\n').filter(r=>r.trim()).join(', ') : '-';
    const personilList = d.personil ? d.personil.split('\n').filter(p=>p.trim()) : [];
    const koorRow = d.koordinat ? P.row('Koordinat', `${d.koordinat} <button onclick="Helpers.openMaps('${String(d.koordinat).replace(/'/g,"\\'")}')" class="ml-1 text-blue-500 text-[10px] font-bold underline">Buka Maps</button>`) : '';
    const mulaiStr = d.jamMulai ? `${d.tglMulai ? Helpers.formatDate(d.tglMulai) : (d.tglTerima ? Helpers.formatDate(d.tglTerima) : tglIndo)} ${d.jamMulai} WIB` : '-';
    const selesaiStr = d.jamSelesai ? `${d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : (d.tglMulai ? Helpers.formatDate(d.tglMulai) : tglIndo)} ${d.jamSelesai} WIB` : '-';
    return P.header('LAPORAN PENYELAMATAN', '🆘', 'from-amber-500 to-orange-600 shadow-amber-500/20') +
      P.section('A. Identitas Laporan', 'fa-file-lines',
        P.row('Hari/Tgl', `${hari}, ${tglIndo}`) + P.row('Pukul', `${d.pukul || '-'} WIB`) + P.row('Jenis', d.jenis || '-'), 'text-amber-600') +
      P.section('B. Waktu Penanganan', 'fa-stopwatch',
        P.row('Lapor Diterima', `${tglTerimaIndo} ${d.jamTerima || '-'} WIB`) +
        P.row('Mulai', mulaiStr) + P.row('Selesai', selesaiStr) + P.row('Durasi', `${d.durasi || 0} Menit`), 'text-amber-600') +
      P.section('C. Lokasi', 'fa-location-dot',
        P.row('Patokan', d.lokasiDetail || '-') + P.row('Alamat', alamatLokasi) + koorRow, 'text-amber-600') +
      P.section('D. Kronologi', 'fa-book',
        `<p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">${d.kronologi || '-'}</p>`, 'text-amber-600') +
      P.section('E. Identitas Pelapor', 'fa-user',
        P.row('Nama', d.idNama || '-') + P.row('Usia', d.idUsia ? `${d.idUsia} Tahun` : '-') +
        P.row('J. Kel.', d.idJK || '-') + P.row('Kontak', d.pHP || '-') + P.row('Alamat', alamat), 'text-amber-600') +
      P.section('F. Objek Penanganan', 'fa-bullseye',
        P.row('Objek', d.objek || '-') + P.row('Lokasi', d.lokasiOp || d.lokasiDetail || '-') + P.row('Ukuran', d.ukuran || '-'), 'text-amber-600') +
      P.section('G. Operasional', 'fa-truck-medical',
        P.row('Armada', d.armada || '-') + P.row('Air', `${d.air || 0} Tangki`) + P.row('Jarak', `${d.jarak || 0} Km`) +
        P.row('Tindakan', d.tindakan || '-') + P.row('Kendala', Helpers.kendalaList(d.kendala).join(', ') || 'Nihil'), 'text-amber-600') +
      P.section('H. Korban Jiwa', 'fa-heart-pulse',
        P.row('Luka Ringan', `${d.lRingan || 0} orang`) + P.row('Luka Berat', `${d.lBerat || 0} orang`) + P.row('Meninggal', `${d.mnggal || 0} orang`), 'text-amber-600') +
      P.section('I. Personil Bertugas', 'fa-people-group',
        P.row('Regu', reguStr) + (personilList.length ? `<div class="mt-2 flex flex-wrap gap-1">${personilList.map(p => `<span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">${p}</span>`).join('')}</div>` : ''), 'text-amber-600');
  },
  buildWA(d) {
    const S = App.settings;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const tglTerimaIndo = d.tglTerima ? Helpers.formatDate(d.tglTerima) : tglIndo;
    const jamTerimaStr = d.jamTerima ? `Pukul ${d.jamTerima} WIB` : '';
    const alamat = Helpers.formatAddress(d.idDusun, d.idRtrw, d.idKel, d.idKec, d.idKabkota);
    const personil = d.personil ? d.personil.split('\n').filter(p => p.trim()).map(p => `  • ${p.trim()}`).join('\n') : '  -';
    const reguStr = d.regu ? d.regu.split('\n').filter(r => r.trim()).join(', ') : '-';
    const koor = d.koordinat ? `\n• Koord : ${d.koordinat}\n• Maps : https://maps.google.com/?q=${d.koordinat.replace(/\s/g,'')}` : '';
    const addressee = S.pimpinan ? `Yth.\n${S.pimpinan}\n\n` : '';
    const tglSelesaiStr = d.tglSelesai ? `• Selesai : ${Helpers.formatDate(d.tglSelesai)} ${d.jamSelesai || '-'} WIB\n` : `• Selesai : ${d.jamSelesai || '-'} WIB\n`;
    let wa = ` *LAPORAN NON KEBAKARAN*
_${S.instansi || ''}_ — _${S.daerah || ''}_
━━━━━━━━━━━━━━━━━━━

${addressee}Mohon izin melaporkan kegiatan *${d.jenis || '-'}* sebagai berikut :

 *A. WAKTU TERIMA LAPORAN*
• Hari/Tgl : ${hari}, ${tglTerimaIndo}
• Pukul : ${d.pukul || '-'} WIB

 *B. LOKASI*
• Nama Tempat : ${d.lokasiDetail || '-'}${koor}

 *C. KRONOLOGI*
${d.kronologi || '-'}

 *D. PELAPOR*
• Nama : ${d.idNama || '-'}
• Usia : ${d.idUsia ? d.idUsia + ' Tahun' : '-'}
• J. Kel. : ${d.idJK || '-'}
• Kontak : ${d.pHP || '-'}
• Alamat : ${alamat}

 *E. DETAIL PENANGANAN*
• Objek : ${d.objek || '-'}
• Lokasi objek : ${d.lokasiOp || d.lokasiDetail || '-'}
• Ukuran/Spesifikasi : ${d.ukuran || '-'}
• Mulai Penanganan : ${d.jamMulai ? (d.tglMulai ? Helpers.formatDate(d.tglMulai) : tglIndo) + ' ' + d.jamMulai : '-'} WIB
${tglSelesaiStr}• Durasi Penanganan : ${d.durasi || 0} Menit
• Jarak ke lokasi : ${d.jarak || 0} Km  
• Armada : ${d.armada || '-'}${parseFloat(d.air) > 0 ? `
• Suplai Air : ${d.air} Tangki` : ''}
• Tindakan : ${d.tindakan || '-'}
• Kendala : ${Helpers.kendalaList(d.kendala).join(', ') || 'Nihil'}${d.keterangan ? `\n• Keterangan Lain : ${d.keterangan}` : ''}
• Korban Jiwa : LR ${d.lRingan || 0}, LB ${d.lBerat || 0}, MD ${d.mnggal || 0}

 *F. PERSONIL YANG BERTUGAS*
${reguStr}
${personil}

━━━━━━━━━━━━━━━━━━━
Demikian yang dapat kami laporkan. 
Terima kasih.
`;
    return wa;
  }
};

globalThis.Mod = globalThis.Mod || {};
globalThis.Mod.nk = new ReportModule(ModNkcfg);
