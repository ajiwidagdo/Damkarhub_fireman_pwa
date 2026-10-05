/* ===================== REPORT MODULE — BASE CLASS =====================
   Di-extract dari index.html (blok class ReportModule + registry Mod).
   Logic 100% identik — hanya dipindah. Mengakses global: UI, Helpers,
   DB, Sync, App, Mod (via string onclick), Config.
   ========================================================================= */

class ReportModule {
  constructor(cfg) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.store = cfg.store;
    this.data = [];
    this.cfg = cfg;
    for (const key in cfg) {
      if (typeof cfg[key] === 'function' && !(key in this)) this[key] = cfg[key].bind(this);
    }
  }
  setData(arr) { this.data = arr; }

  _getPrevPeriod(period, month, year) {
    if (period === 'all') return null;
    if (period === 'month') {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) { prevMonth = 11; prevYear = year - 1; }
      return this.data.filter(d => {
        const dt = new Date(d.tanggal + 'T00:00:00');
        if (isNaN(dt.getTime())) return false;
        return dt.getMonth() === prevMonth && dt.getFullYear() === prevYear;
      });
    }
    return this.data.filter(d => {
      const dt = new Date(d.tanggal + 'T00:00:00');
      if (isNaN(dt.getTime())) return false;
      return dt.getFullYear() === year - 1;
    });
  }

  updateDashboard() {
    const p = document.getElementById(`${this.id}_dash_period`).value;
    document.getElementById(`${this.id}_dash_month`).classList.toggle('hidden', p !== 'month');
    document.getElementById(`${this.id}_dash_year`).classList.toggle('hidden', p === 'all');
    const m = parseInt(document.getElementById(`${this.id}_dash_month`).value);
    const y = parseInt(document.getElementById(`${this.id}_dash_year`).value);
    const filtered = p === 'all' ? this.data.slice() : this.data.filter(d => {
      const dt = new Date(d.tanggal + 'T00:00:00');
      if (isNaN(dt.getTime())) return false;
      return p === 'month' ? dt.getMonth() === m && dt.getFullYear() === y : dt.getFullYear() === y;
    });
    const prevFiltered = this._getPrevPeriod(p, m, y);
    const s = this.cfg.computeStats(filtered, prevFiltered);
    const reguRank = {};
    filtered.forEach(d => {
      if (d.regu) d.regu.split('\n').filter(r => r.trim()).forEach(r => {
        const nm = r.trim().toUpperCase();
        reguRank[nm] = (reguRank[nm] || 0) + 1;
      });
    });
    s._reguRank = reguRank;
    this.cfg.renderDashboard(s, filtered, p);
  }

  buildActions(type, id, data) {
    const actions = [
      { label: 'Tinjau Laporan', icon: 'fa-solid fa-eye', onclick: `UI.closeSheet(); Mod.${type}.preview('${id}')` },
      { label: 'Kirim via WhatsApp', icon: 'fa-brands fa-whatsapp', onclick: `UI.closeSheet(); Mod.${type}.shareWA('${id}')` },
      { label: 'Lihat Foto', icon: 'fa-solid fa-image', onclick: `UI.closeSheet(); Mod.${type}.showPhotoById('${id}')` }
    ];
    if (data?.koordinat && String(data.koordinat).trim()) {
      actions.push({ label: 'Buka di Google Maps', icon: 'fa-solid fa-map-location-dot', onclick: `UI.closeSheet(); Helpers.openMaps('${String(data.koordinat).replace(/'/g,"\\'")}')` });
    }
    actions.push(
      { label: 'Edit Laporan', icon: 'fa-solid fa-pen', onclick: `UI.closeSheet(); App.editLaporan('${type}','${id}')` }
    );
    // Hapus hanya untuk admin (RLS juga membatasi di server)
    if (typeof App !== 'undefined' && App.isAdmin && App.isAdmin()) {
      actions.push(
        { label: 'Hapus Laporan', icon: 'fa-solid fa-trash', danger: true, onclick: `UI.closeSheet(); Mod.${type}.delete('${id}')` }
      );
    }
    return actions;
  }

  openRowActions(id) {
    const d = this.data.find(x => x.id === id); if (!d) return;
    Helpers.haptic(8);
    UI.openSheet('Aksi Laporan', this.buildActions(this.id, id, d));
  }

  showPhotoById(id) { const d = this.data.find(x => x.id === id); if (d) UI.showPhoto(d); }

  preview(id) {
    const d = this.data.find(x => x.id === id);
    if (!d) return;
    Helpers.haptic(8);
    const html = this.cfg.buildPreviewHTML(d);
    UI.showPreview(html, this.id, id);
  }

  async save(e) {
    e.preventDefault();
    const personilVal = document.getElementById(`${this.id}_personil`)?.value || '';
    if (!personilVal.trim()) { UI.toast('Pilih minimal 1 personil bertugas!', 'error'); return; }
    const editId = document.getElementById(`${this.id}_editId`).value;
    const id = editId || Helpers.newId();
    const data = this.cfg.collectForm(id);
    const idx = this.data.findIndex(x => x.id === id);
    if (idx > -1) this.data[idx] = data; else this.data.push(data);
    try {
      await DB.put(this.store, data);
      Sync.enqueue(this.id, id, 'upsert');
      Helpers.haptic(30);
      UI.toast(`Laporan ${this.name} Disimpan!`);
      App._populateDates();
      this.cancelEdit();
    } catch {
      UI.toast('Gagal menyimpan!', 'error');
      if (idx === -1) this.data.pop();
    }
  }

  edit(id) {
    const d = this.data.find(x => x.id === id); if (!d) return;
    document.getElementById(`${this.id}_editId`).value = d.id;
    this.cfg.fillForm(d);
    document.getElementById(`${this.id}_form-title`).innerText = `Edit Laporan ${this.name}`;
    App.openInputForm(this.id);
  }

  cancelEdit() {
    document.getElementById(`${this.id}_form`).reset();
    document.getElementById(`${this.id}_editId`).value = '';
    this.cfg.onResetForm?.();
    document.getElementById(`${this.id}_form-title`).innerText = `Input Laporan ${this.name}`;
    App.goBack();
  }

  delete(id) {
    // Guard: hanya admin boleh hapus (RLS server juga membatasi)
    if (typeof App !== 'undefined' && App.isAdmin && !App.isAdmin()) {
      UI.toast('Hanya admin yang dapat menghapus laporan', 'error');
      return;
    }
    UI.confirm(async () => {
      this.data = this.data.filter(x => x.id !== id);
      try {
        await DB.delete(this.store, id);
        Sync.enqueue(this.id, id, 'delete');
        Helpers.haptic([10,50,10]);
        App.renderRiwayat();
        App.renderBeranda();
        App._populateDates();
        this.updateDashboard();
        UI.toast('Laporan Dihapus!');
      } catch { UI.toast('Gagal menghapus!', 'error'); }
    });
  }

  shareWA(id) {
    const d = this.data.find(x => x.id === id); if (!d) return;
    Helpers.haptic(15);
    const text = this.cfg.buildWA(d);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
}
globalThis.ReportModule = ReportModule;

const Mod = {};
globalThis.Mod = Mod;
