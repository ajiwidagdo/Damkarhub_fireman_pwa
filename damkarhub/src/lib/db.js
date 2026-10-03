/* ===================== DB — IndexedDB (tanpa silent fallback) =====================
   DEFENSIVE (3 Okt 2026): dulu gagal buka IDB → diam-diam pakai localStorage
   kosong → aplikasi melihat "semesta kosong" (laporan seolah hilang + outbox
   kosong + divergensi dua semesta data). Sekarang: retry 3x, gagal → reject
   agar boot menampilkan blocking warning, bukan data kosong.
   ========================================================================= */
export const DB = {
  _db: null,
  init() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) {
        reject(new Error('Perangkat tidak mendukung IndexedDB'));
        return;
      }
      let attempt = 0;
      const tryOpen = () => {
        attempt++;
        const fail = (reason) => {
          if (attempt < 3) {
            console.warn(`DB init gagal (${reason}) — retry ${attempt}/3…`);
            setTimeout(tryOpen, 800);
          } else {
            reject(new Error('Penyimpanan lokal gagal dibuka (' + reason + ')'));
          }
        };
        try {
          const req = indexedDB.open(Config.DB_NAME, Config.DB_VERSION);
          const timeout = setTimeout(() => {
            try { req.onerror = req.onsuccess = req.onblocked = req.onupgradeneeded = null; } catch (e) {}
            fail('timeout');
          }, 4000);
          req.onerror = e => { clearTimeout(timeout); fail(e.target?.error?.message || 'error'); };
          req.onblocked = () => { clearTimeout(timeout); fail('blocked — tutup tab/aplikasi lain'); };
          req.onsuccess = e => { clearTimeout(timeout); this._db = e.target.result; resolve(); };
          req.onupgradeneeded = e => {
            const db = e.target.result;
            Object.values(Config.STORES).forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); });
          };
        } catch (err) { fail(String((err && err.message) || err)); }
      };
      tryOpen();
    });
  },
  _tx(store, mode) { return this._db.transaction(store, mode).objectStore(store); },
  put(store, data) {
    return new Promise((res, rej) => { const r = this._tx(store, 'readwrite').put(data); r.onsuccess = res; r.onerror = rej; });
  },
  getAll(store) {
    return new Promise((res, rej) => { const r = this._tx(store, 'readonly').getAll(); r.onsuccess = () => res(r.result); r.onerror = rej; });
  },
  delete(store, id) {
    return new Promise((res, rej) => { const r = this._tx(store, 'readwrite').delete(id); r.onsuccess = res; r.onerror = rej; });
  }
};
globalThis.DB = DB;
