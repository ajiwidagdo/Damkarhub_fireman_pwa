/* ===================== EXPORT (ekspor laporan ke CSV & PDF) =====================
   Di-extract dari index.html (const Export, 173 baris). Logic 100% identik.
   Dipakai oleh: tombol di panel ekspor (Builders.exportPanel) via onclick
   "Export.generate('<prefix>','excel'|'pdf'") — di-resolve saat runtime.
   Global: Mod, Helpers, UI, window.jspdf (CDN/vendor).
   ========================================================================= */
export const Export = {
  generate(module, type) {
    const m = Mod[module];
    const p = document.getElementById(`${module}_ex_period`).value;
    const mIdx = parseInt(document.getElementById(`${module}_ex_month`).value);
    const y = parseInt(document.getElementById(`${module}_ex_year`).value);
    let filtered = m.data.slice();
    let periodText = 'SELURUH DATA';
    if (p !== 'all') {
      filtered = filtered.filter(d => {
        const dt = new Date(d.tanggal + 'T00:00:00');
        if (isNaN(dt.getTime())) return false;
        return p === 'month' ? dt.getMonth() === mIdx && dt.getFullYear() === y : dt.getFullYear() === y;
      });
      periodText = p === 'month' ? `BULAN ${Helpers.monthName(mIdx).toUpperCase()} TAHUN ${y}` : `TAHUN ${y}`;
    }
    if (!filtered.length) return UI.toast('Tidak ada data pada periode ini.', 'error');
    filtered.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));
    const checkboxes = document.querySelectorAll(`#${module}_col_checks input[type="checkbox"]:checked`);
    if (!checkboxes.length) return UI.toast('Pilih minimal 1 kolom!', 'error');
    const selectedCols = Array.from(checkboxes).map(cb => cb.value);
    const { head, rows } = this._buildTable(module, filtered, selectedCols);
    const title = module === 'k' ? 'DATA KEBAKARAN' : module === 'nk' ? 'DATA NON KEBAKARAN' : 'DATA SOSIALISASI';
    const fileName = `Laporan_${module.toUpperCase()}_${Date.now()}`;
    if (type === 'excel') this._toCSV(title, periodText, head, rows, fileName);
    else this._toPDF(title, periodText, head, rows, fileName);
  },
  _buildTable(module, filtered, cols) {
    if (module === 'k') return this._buildK(filtered, cols);
    if (module === 'nk') return this._buildNK(filtered, cols);
    return this._buildSOS(filtered, cols);
  },
  _buildK(filtered, cols) {
    const head = ['No'];
    cols.forEach(c => {
      const map = { 'Tanggal':'Tanggal','Jam Mulai':'Jam Mulai','Tgl Selesai':'Tgl Selesai','Jam Selesai':'Jam Selesai','Jenis Kejadian':'Jenis Kejadian','Lokasi Detail':['Lokasi','Kel/Desa','Kecamatan'],'Penyebab':'Penyebab','Objek':['Objek','Luas Area'],'Nilai Aset':'Nilai Aset','Taksiran Kerugian':'Taksiran Kerugian','Aset Terselamatkan':'Aset Terselamatkan','Korban Jiwa':['L.Ringan','L.Berat','Meninggal'],'Data Korban':'Nama Pemilik/Korban','NIK Korban':'NIK','Alamat Korban':'Alamat','Respon Time':'Respon (Mnt)','Jarak Tempuh':'Jarak (Km)','Armada & Air':['Armada','Air (T)'],'Regu':'Regu','Keterangan':'Keterangan' }[c];
      head.push(...(Array.isArray(map) ? map : [map]));
    });
    const rows = []; let idx = 1;
    filtered.forEach(d => {
      const kList = d.korbanList?.length ? d.korbanList : [null];
      kList.forEach((k, i) => {
        const r = [i === 0 ? idx : ''];
        cols.forEach(c => {
          const first = i === 0;
          switch (c) {
            case 'Tanggal': r.push(first ? Helpers.formatDate(d.tanggal) : ''); break;
            case 'Jam Mulai': r.push(first ? d.pukul : ''); break;
            case 'Tgl Selesai': r.push(first ? (d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : '-') : ''); break;
            case 'Jam Selesai': r.push(first ? (d.jamSelesai || '-') : ''); break;
            case 'Jenis Kejadian': r.push(first ? (d.jenis || '-') : ''); break;
            case 'Lokasi Detail': first ? r.push(d.lokasiDetail || '-', d.kel || '-', d.kec || '-') : r.push('','',''); break;
            case 'Penyebab': r.push(first ? (d.penyebab || '-') : ''); break;
            case 'Objek': first ? r.push(d.objekTerbakar || '-', d.luasArea || '-') : r.push('',''); break;
            case 'Nilai Aset': r.push(first ? (d.nilaiAset ? parseInt(d.nilaiAset).toLocaleString('id-ID') : '0') : ''); break;
            case 'Taksiran Kerugian': r.push(first ? (d.kerugian ? parseInt(d.kerugian).toLocaleString('id-ID') : '0') : ''); break;
            case 'Aset Terselamatkan': r.push(first ? (d.asetSelamat ? parseInt(d.asetSelamat).toLocaleString('id-ID') : '0') : ''); break;
            case 'Korban Jiwa': first ? r.push(d.lRingan || '0', d.lBerat || '0', d.mnggal || '0') : r.push('','',''); break;
            case 'Data Korban': r.push(k?.nama || '-'); break;
            case 'NIK Korban': r.push(k?.nik || '-'); break;
            case 'Alamat Korban': r.push(k ? Helpers.formatAddress(k.dusun, k.rtrw, k.kel, k.kec, k.kabkota) : '-'); break;
            case 'Respon Time': r.push(first ? Helpers.calcRT(d.jamTerima, d.jamMulai || d.jamTiba) : ''); break;
            case 'Jarak Tempuh': r.push(first ? (d.jarak || '0') : ''); break;
            case 'Armada & Air': first ? r.push(d.armada || '-', d.air || '0') : r.push('',''); break;
            case 'Regu': r.push(first ? (d.regu ? d.regu.split('\n').join(', ') : '-') : ''); break;
            case 'Keterangan': r.push(''); break;
          }
        });
        rows.push(r);
      });
      idx++;
    });
    return { head, rows };
  },
  _buildNK(filtered, cols) {
    const head = ['No'];
    cols.forEach(c => {
      const map = { 'Tanggal':'Tanggal','Jam Mulai':'Jam Mulai','Tgl Selesai':'Tgl Selesai','Jam Selesai':'Jam Selesai','Jenis Giat':'Jenis Kegiatan','Lokasi Detail':['Lokasi','Kel/Desa','Kecamatan'],'Data Pelapor':'Nama Pelapor','Alamat Pelapor':'Alamat','Objek':'Objek','Durasi & Jarak':['Durasi (Mnt)','Jarak (Km)'],'Armada & Air':['Armada','Air (T)'],'Korban':['L.Ringan','L.Berat','Meninggal'],'Regu':'Regu','Keterangan':'Keterangan' }[c];
      head.push(...(Array.isArray(map) ? map : [map]));
    });
    const rows = []; let idx = 1;
    filtered.forEach(d => {
      const r = [idx];
      const alamat = Helpers.formatAddress(d.idDusun, d.idRtrw, d.idKel, d.idKec, d.idKabkota);
      cols.forEach(c => {
        switch (c) {
          case 'Tanggal': r.push(Helpers.formatDate(d.tanggal)); break;
          case 'Jam Mulai': r.push(d.pukul); break;
          case 'Tgl Selesai': r.push(d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : '-'); break;
          case 'Jam Selesai': r.push(d.jamSelesai || '-'); break;
          case 'Jenis Giat': r.push(d.jenis || '-'); break;
          case 'Lokasi Detail': r.push(d.lokasiDetail || '-', d.kel || '-', d.kec || '-'); break;
          case 'Data Pelapor': r.push(d.idNama || '-'); break;
          case 'Alamat Pelapor': r.push(alamat); break;
          case 'Objek': r.push(d.objek || '-'); break;
          case 'Durasi & Jarak': r.push(d.durasi || '0', d.jarak || '0'); break;
          case 'Armada & Air': r.push(d.armada || '-', d.air || '0'); break;
          case 'Korban': r.push(d.lRingan || '0', d.lBerat || '0', d.mnggal || '0'); break;
          case 'Regu': r.push(d.regu ? d.regu.split('\n').join(', ') : '-'); break;
          case 'Keterangan': r.push(''); break;
        }
      });
      rows.push(r);
      idx++;
    });
    return { head, rows };
  },
  _buildSOS(filtered, cols) {
    const head = ['No'];
    cols.forEach(c => {
      const map = { 'Tanggal':'Tanggal','Jam Mulai':'Jam Mulai','Tgl Selesai':'Tgl Selesai','Jam Selesai':'Jam Selesai','Tempat':'Tempat','Sasaran Edukasi':'Sasaran Edukasi','Nama Instansi':'Nama Instansi','Alamat Instansi':'Alamat','Jumlah Peserta':'Jml Peserta','Durasi':'Durasi (Mnt)','Armada & Air':['Armada','Air (T)'],'Regu':'Regu','Keterangan':'Keterangan' }[c];
      head.push(...(Array.isArray(map) ? map : [map]));
    });
    const rows = []; let idx = 1;
    filtered.forEach(d => {
      const pList = d.pesertaList?.length ? d.pesertaList : [null];
      pList.forEach((p, i) => {
        const r = [i === 0 ? idx : ''];
        const first = i === 0;
        const kategoriStr = d.kategori ? d.kategori.split('\n').filter(k=>k.trim()).map(Helpers.plainKategori).join(', ') : '-';
        cols.forEach(c => {
          switch (c) {
            case 'Tanggal': r.push(first ? Helpers.formatDate(d.tanggal) : ''); break;
            case 'Jam Mulai': r.push(first ? d.pukul : ''); break;
            case 'Tgl Selesai': r.push(first ? (d.tglSelesai ? Helpers.formatDate(d.tglSelesai) : '-') : ''); break;
            case 'Jam Selesai': r.push(first ? (d.jamSelesai || '-') : ''); break;
            case 'Tempat': r.push(first ? (d.tempat || '-') : ''); break;
            case 'Sasaran Edukasi': r.push(first ? kategoriStr : ''); break;
            case 'Nama Instansi': r.push(p?.nama || '-'); break;
            case 'Alamat Instansi': r.push(p ? Helpers.formatAddress(p.dusun, p.rtrw, p.kel, p.kec, p.kabkota) : '-'); break;
            case 'Jumlah Peserta': r.push(p?.jumlah || '0'); break;
            case 'Durasi': r.push(first ? (d.durasi || '0') : ''); break;
            case 'Armada & Air': first ? r.push(d.armada || '-', d.air || '0') : r.push('',''); break;
            case 'Regu': r.push(first ? (d.regu ? d.regu.split('\n').join(', ') : '-') : ''); break;
            case 'Keterangan': r.push(''); break;
          }
        });
        rows.push(r);
      });
      idx++;
    });
    return { head, rows };
  },
  _toCSV(title, periodText, head, rows, fileName) {
    let csv = "data:text/csv;charset=utf-8,";
    csv += `"${title}"\n"${periodText}"\n\n`;
    csv += head.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(r => { csv += r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",") + "\n"; });
    const a = document.createElement('a');
    a.href = encodeURI(csv); a.download = fileName + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Berhasil Ekspor Excel (CSV)!');
  },
  _toPDF(title, periodText, head, rows, fileName) {
    if (!window.jspdf) return UI.toast('Library PDF belum siap.', 'info');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    doc.setFontSize(11); doc.text(periodText, doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.autoTable({
      startY: 30,
      head: [head],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [239, 246, 255] }
    });
    doc.save(fileName + '.pdf');
    UI.toast('Berhasil Cetak PDF!');
  }
};

globalThis.Export = Export;
