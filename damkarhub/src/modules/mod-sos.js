/* ===================== MODUL SOS — LAPORAN SOSIALISASI =====================
   Di-extract dari index.html (blok Mod.sos = new ReportModule({...})).
   Logic 100% identik — hanya dipindah. Mengakses global: ReportModule,
   Config, Helpers, UI, App, PreviewBuilder, Mod.
   ========================================================================= */

export const ModSoscfg = {
  id:'sos', name:'Sosialisasi', store: Config.STORES.sos,
  computeStats(filtered, prevFiltered) {
    const s = { total:filtered.length, peserta:0, air:0, totalDurasi:0, kategori:{}, personilRank:{}, timeSlot:{'Dini Hari':0,'Pagi':0,'Siang':0,'Sore':0,'Malam':0}, kel:{}, kec:{}, kab:{}, prev:null };
    filtered.forEach(d => {
      s.air += parseFloat(d.air) || 0;
      s.totalDurasi += parseInt(d.durasi) || 0;
      (d.pesertaList || []).forEach(p => {
        s.peserta += parseInt(p.jumlah) || 0;
        const up = v => (v || 'Tanpa Keterangan').toUpperCase();
        s.kel[up(p.kel)] = (s.kel[up(p.kel)] || 0) + 1;
        s.kec[up(p.kec)] = (s.kec[up(p.kec)] || 0) + 1;
        s.kab[up(p.kabkota)] = (s.kab[up(p.kabkota)] || 0) + 1;
      });
      const kats = (d.kategori || '').split('\n').filter(k => k.trim());
      kats.forEach(kat => {
        const up = Helpers.shortKategori(kat).toUpperCase();
        s.kategori[up] = (s.kategori[up] || 0) + 1;
      });
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
    document.getElementById('sos_dash_total').innerHTML = s.total + (period !== 'all' && s.prev ? UI.formatComparison(totalDelta) : '');
    document.getElementById('sos_dash_peserta').innerText = s.peserta;
    document.getElementById('sos_dash_durasi').innerHTML = s.totalDurasi.toLocaleString('id-ID') + ' <span class="text-xs">Mnt</span>';
    document.getElementById('sos_dash_air').innerHTML = s.air.toFixed(1).replace(/\.0$/,'') + ' <span class="text-xs">T</span>';
    UI.renderStat('sos_statKategori', s.kategori, s.total, 'bg-emerald-500');
    UI.renderStat('sos_statKelurahan', s.kel, s.peserta, 'bg-indigo-500', 5);
    UI.renderStat('sos_statKecamatan', s.kec, s.peserta, 'bg-blue-500', 5);
    UI.renderStat('sos_statKabKota', s.kab, s.peserta, 'bg-purple-500', 5);
    UI.renderTimeSlot('sos_statTimeSlot', s.timeSlot);
    UI.renderLeaderboard('sos_statReguRank', s._reguRank || {}, s.total, 'text-emerald-700 dark:text-emerald-400');
    UI.renderLeaderboard('sos_statPersonilRank', s.personilRank, null, 'text-emerald-700 dark:text-emerald-400');
  },
  addPeserta(data = null) {
    const c = document.getElementById('sos_pesertaListContainer');
    this._micSeq = (this._micSeq || 0) + 1;
    const uid = 'spm' + this._micSeq + Date.now().toString(36);
    const div = document.createElement('div');
    div.className = "peserta-item bg-emerald-50/50 dark:bg-gray-800 p-4 rounded-xl border border-emerald-100 dark:border-gray-700 relative";
    div.innerHTML = `
      <button type="button" onclick="this.closest('.peserta-item').remove()" class="absolute -top-2 -left-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center shadow-sm z-10 active:scale-90" aria-label="Hapus kartu"><i class="fa-solid fa-times"></i></button>
      <button type="button" onclick="Mod.sos.addPeserta()" class="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center shadow-sm z-10 active:scale-90" aria-label="Tambah peserta"><i class="fa-solid fa-plus"></i></button>
      <div class="mb-3">
        <p class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Data Peserta / Instansi</p>
      </div>
      <div class="grid grid-cols-3 gap-3 mb-2">
        <div class="col-span-2"><label class="field-label">Nama Instansi</label><input type="text" enterkeyhint="next" class="sos_pNama" value="${data?.nama || ''}" required></div>
        <div><label class="field-label">Jml. Peserta</label><input type="number" class="sos_pJumlah num-compact" value="${data?.jumlah || ''}" required></div>
      </div>
      <label class="field-label mt-2">Alamat Lengkap</label>
      <div class="mb-2"><div class="flex items-center gap-2"><input type="text" enterkeyhint="next" id="${uid}_dusun" class="sos_pDusun flex-1 min-w-0" placeholder="Lingk/Dusun" value="${data?.dusun || ''}"><button type="button" onclick="Helpers.startSpeech('${uid}_dusun', this)" class="btn-mic" aria-label="Isi dengan suara" title="Isi dengan suara"><i class="fa-solid fa-microphone"></i></button></div></div>
      <div class="grid grid-cols-3 gap-3 mb-2">
        <div><input type="text" enterkeyhint="next" class="sos_pRtrw" placeholder="RT/RW" value="${data?.rtrw || ''}"></div>
        <div class="col-span-2"><div class="flex items-center gap-2"><input type="text" enterkeyhint="next" id="${uid}_kel" class="sos_pKel flex-1 min-w-0" placeholder="Kel/Desa" value="${data?.kel || ''}"><button type="button" onclick="Helpers.startSpeech('${uid}_kel', this)" class="btn-mic" aria-label="Isi dengan suara" title="Isi dengan suara"><i class="fa-solid fa-microphone"></i></button></div></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="flex items-center gap-2"><input type="text" enterkeyhint="next" id="${uid}_kec" class="sos_pKec flex-1 min-w-0" placeholder="Kecamatan" value="${data?.kec || ''}"><button type="button" onclick="Helpers.startSpeech('${uid}_kec', this)" class="btn-mic" aria-label="Isi dengan suara" title="Isi dengan suara"><i class="fa-solid fa-microphone"></i></button></div></div>
        <div><div class="flex items-center gap-2"><input type="text" enterkeyhint="next" id="${uid}_kabkota" class="sos_pKabkota flex-1 min-w-0" placeholder="Kab/Kota" value="${data?.kabkota || ''}"><button type="button" onclick="Helpers.startSpeech('${uid}_kabkota', this)" class="btn-mic" aria-label="Isi dengan suara" title="Isi dengan suara"><i class="fa-solid fa-microphone"></i></button></div></div>
      </div>`;
    c.appendChild(div);
  },
  collectForm(id) {
    const kategori = (document.getElementById('sos_kategori').value || '').split('\n').filter(k => k.trim()).join('\n');
    const pesertaList = [...document.getElementById('sos_pesertaListContainer').children].map(c => ({
      nama:c.querySelector('.sos_pNama').value, jumlah:c.querySelector('.sos_pJumlah').value,
      dusun:c.querySelector('.sos_pDusun').value, rtrw:c.querySelector('.sos_pRtrw').value, kel:c.querySelector('.sos_pKel').value, kec:c.querySelector('.sos_pKec').value, kabkota:c.querySelector('.sos_pKabkota').value
    }));
    const gv = id => document.getElementById(id).value;
    return { id, tanggal:gv('sos_tanggal'), pukul:gv('sos_pukul'), tglSelesai:gv('sos_tglSelesai'), jamSelesai:gv('sos_jamSelesai'), tempat:gv('sos_tempat'), rangkaian:gv('sos_rangkaian'),
      kategori, pesertaList,
      armada:gv('sos_armada'), air:gv('sos_air'), durasi:gv('sos_durasi'), catatanEvaluasi:gv('sos_catatanEvaluasi'),
      regu:gv('sos_regu'), personil:gv('sos_personil'),
      foto1:gv('sos_foto1_b64'), foto2:gv('sos_foto2_b64') };
  },
  fillForm(d) {
    const sv = (id,v) => document.getElementById(id).value = v ?? '';
    sv('sos_tanggal',d.tanggal); sv('sos_pukul',d.pukul); sv('sos_tglSelesai',d.tglSelesai); sv('sos_jamSelesai',d.jamSelesai); sv('sos_tempat',d.tempat); sv('sos_rangkaian',d.rangkaian); sv('sos_catatanEvaluasi', Helpers.sosCatatan(d));
    sv('sos_kategori',d.kategori || '');
    document.getElementById('sos_pesertaListContainer').innerHTML = '';
    (d.pesertaList?.length ? d.pesertaList : [null]).forEach(p => Mod.sos.addPeserta(p));
    sv('sos_armada',d.armada); sv('sos_air',d.air); sv('sos_durasi',d.durasi);
    sv('sos_regu',d.regu || ''); sv('sos_personil',d.personil);
    document.getElementById('sos_foto1_b64').value = d.foto1 || '';
    document.getElementById('sos_foto2_b64').value = d.foto2 || '';
    App.renderKategoriChips();
    App.renderReguChips('sos');
    App.renderPersonnelChips('sos');
  },
  onResetForm() {
    document.getElementById('sos_kategori').value = '';
    document.getElementById('sos_pesertaListContainer').innerHTML = '';
    Mod.sos.addPeserta();
    document.getElementById('sos_foto1_b64').value = '';
    document.getElementById('sos_foto2_b64').value = '';
    App.renderKategoriChips();
    App.renderReguChips('sos');
    App.renderPersonnelChips('sos');
  },
  buildPreviewHTML(d) {
    const P = PreviewBuilder;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const jumlahInstansi = d.pesertaList?.length || 0;
    const totalPeserta = (d.pesertaList || []).reduce((s, p) => s + (parseInt(p.jumlah) || 0), 0);
    const reguStr = d.regu ? d.regu.split('\n').filter(r=>r.trim()).join(', ') : '-';
    const kategoriStr = d.kategori ? d.kategori.split('\n').filter(k=>k.trim()).map(Helpers.plainKategori).join(', ') : '-';
    const personilList = d.personil ? d.personil.split('\n').filter(p=>p.trim()) : [];
    const selesaiStr = d.jamSelesai ? `${d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : tglIndo} ${d.jamSelesai} WIB` : '-';
    const rangkaianList = d.rangkaian ? d.rangkaian.split('\n').filter(r => r.trim()) : [];
    const pesertaHtml = (d.pesertaList?.length) ? d.pesertaList.map((p, i) => `
      <div class="bg-emerald-50/50 dark:bg-gray-700/50 rounded-lg p-2.5 mt-2">
        <div class="flex justify-between items-start gap-2">
          <p class="text-xs font-bold text-gray-800 dark:text-gray-200">${i+1}. ${p.nama || '-'}</p>
          <span class="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0">${p.jumlah || 0} org</span>
        </div>
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${Helpers.formatAddress(p.dusun, p.rtrw, p.kel, p.kec, p.kabkota)}</p>
      </div>`).join('') : '<p class="text-xs text-gray-400 italic">Tidak ada data peserta</p>';

    return P.header('LAPORAN SOSIALISASI', '📢', 'from-emerald-500 to-teal-700 shadow-emerald-500/20') +
      P.section('A. Identitas Kegiatan', 'fa-file-lines',
        P.row('Hari/Tgl', `${hari}, ${tglIndo}`) + P.row('Pukul', `${d.pukul || '-'} WIB`) +
        P.row('Selesai', selesaiStr) + P.row('Durasi', `${d.durasi || 0} Menit`) + P.row('Sasaran Edukasi', kategoriStr), 'text-emerald-600') +
      P.section('B. Tempat', 'fa-location-dot', P.row('Lokasi', d.tempat || '-'), 'text-emerald-600') +
      P.section('C. Rangkaian Kegiatan', 'fa-list-check',
        (rangkaianList.length ? `<ol class="text-sm text-gray-800 dark:text-gray-200 space-y-1">${rangkaianList.map(r => `<li class="flex gap-2"><span class="text-emerald-500 font-bold">•</span><span>${r.replace(/^-\s*/, '')}</span></li>`).join('')}</ol>` : '<p class="text-xs text-gray-400 italic">-</p>') + (Helpers.sosCatatan(d) ? P.row('Keterangan Lain', Helpers.sosCatatan(d)) : ''), 'text-emerald-600') +
      P.section('D. Data Peserta', 'fa-users',
        `<div class="flex gap-2 mb-2">
          <span class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">${jumlahInstansi} Instansi</span>
          <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">${totalPeserta} Total Orang</span>
        </div>${pesertaHtml}`, 'text-emerald-600') +
      P.section('E. Operasional', 'fa-truck-medical',
        P.row('Armada', d.armada || '-') + P.row('Air', `${d.air || 0} Tangki`), 'text-emerald-600') +
      P.section('F. Personil Bertugas', 'fa-people-group',
        P.row('Regu', reguStr) + (personilList.length ? `<div class="mt-2 flex flex-wrap gap-1">${personilList.map(p => `<span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">${p}</span>`).join('')}</div>` : ''), 'text-emerald-600');
  },
  buildWA(d) {
    const S = App.settings;
    const hari = Helpers.dayName(d.tanggal);
    const tglIndo = Helpers.formatDate(d.tanggal);
    const jumlahInstansi = d.pesertaList?.length || 0;
    const totalPeserta = (d.pesertaList || []).reduce((sum, p) => sum + (parseInt(p.jumlah) || 0), 0);
    let peserta = '\n  -';
    if (d.pesertaList?.length) {
      peserta = '\n' + d.pesertaList.map((p,i) => {
        const a = Helpers.formatAddress(p.dusun,p.rtrw,p.kel,p.kec,p.kabkota);
        return `${i+1}. ${p.nama || '-'}\n   ${a}\n   ${p.jumlah || 0} Orang`;
      }).join('\n');
    }
    const rangkaianList = d.rangkaian ? d.rangkaian.split('\n').filter(r => r.trim()).map(r => r.trim().startsWith('-') ? r.trim() : `  • ${r.trim()}`).join('\n') : '  -';
    const personil = d.personil ? d.personil.split('\n').filter(p => p.trim()).map(p => `  • ${p.trim()}`).join('\n') : '  -';
    const reguStr = d.regu ? d.regu.split('\n').filter(r => r.trim()).join(', ') : '-';
    const addressee = S.pimpinan ? `Yth.\n${S.pimpinan}\n\n` : '';
    const tglSelesaiStr = d.tglSelesai ? `• Selesai : ${Helpers.formatDate(d.tglSelesai)} ${d.jamSelesai || '-'} WIB\n` : `• Selesai : ${d.jamSelesai || '-'} WIB\n`;
    const kategoriStr = d.kategori ? d.kategori.split('\n').filter(k=>k.trim()).map(Helpers.plainKategori).join(', ') : '-';
    let wa = ` *LAPORAN SOSIALISASI*
_${S.instansi || ''}_ — _${S.daerah || ''}_
━━━━━━━━━━━━━━━━━━━

${addressee} Mohon izin melaporkan kegiatan *Sosialisasi* sebagai berikut :

 *A. WAKTU*
• Hari/Tgl : ${hari}, ${tglIndo}
• Pukul : ${d.pukul || '-'} WIB
${tglSelesaiStr}• Durasi : ${d.durasi || 0} Menit${parseFloat(d.air) > 0 ? `
• Suplai Air : ${d.air} Tangki` : ''}

 *B. TEMPAT*
${d.tempat || '-'}

 *C. RANGKAIAN KEGIATAN*
${rangkaianList}${Helpers.sosCatatan(d) ? `\nKeterangan Lain : ${Helpers.sosCatatan(d)}` : ''}

 *D. SASARAN EDUKASI*
${kategoriStr}
${totalPeserta} Orang

 *E. DATA PESERTA*${peserta}

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
globalThis.Mod.sos = new ReportModule(ModSoscfg);
