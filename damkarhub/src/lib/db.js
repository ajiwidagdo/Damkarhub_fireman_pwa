export const DB = {
  _db: null,
  _mode: 'idb',
  init() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window) || !window.indexedDB) { this._mode = 'ls'; this._lsInit(); resolve(); return; }
      let settled = false;
      const fallback = (reason) => {
        if (settled) return;
        settled = true;
        console.warn('Fallback localStorage:', reason);
        this._mode = 'ls'; this._lsInit(); resolve();
      };
      try {
        const req = indexedDB.open(Config.DB_NAME, Config.DB_VERSION);
        const timeout = setTimeout(() => fallback('timeout'), 3000);
        req.onerror = e => { clearTimeout(timeout); fallback(e.target?.error?.message || 'error'); };
        req.onblocked = () => { clearTimeout(timeout); fallback('blocked'); };
        req.onsuccess = e => {
          clearTimeout(timeout);
          if (settled) return;
          settled = true;
          this._db = e.target.result;
          resolve();
        };
        req.onupgradeneeded = e => {
          const db = e.target.result;
          Object.values(Config.STORES).forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath:'id' }); });
        };
      } catch (err) { fallback(err); }
    });
  },
  _tx(store, mode) { return this._db.transaction(store, mode).objectStore(store); },
  _lsKey(store) { return `damkarhub_ls_${store}`; },
  _lsInit() { Object.values(Config.STORES).forEach(s => { if (localStorage.getItem(this._lsKey(s)) === null) localStorage.setItem(this._lsKey(s), '[]'); }); },
  _lsRead(store) { try { return JSON.parse(localStorage.getItem(this._lsKey(store)) || '[]'); } catch { return []; } },
  _lsWrite(store, arr) { localStorage.setItem(this._lsKey(store), JSON.stringify(arr)); },
  put(store, data) {
    if (this._mode === 'ls') return new Promise((res, rej) => {
      try {
        const arr = this._lsRead(store);
        const idx = arr.findIndex(x => x.id === data.id);
        if (idx >= 0) arr[idx] = data; else arr.push(data);
        this._lsWrite(store, arr); res();
      } catch (err) { rej(err); }
    });
    return new Promise((res, rej) => { const r = this._tx(store,'readwrite').put(data); r.onsuccess = res; r.onerror = rej; });
  },
  getAll(store) {
    if (this._mode === 'ls') return new Promise(res => res(this._lsRead(store)));
    return new Promise((res, rej) => { const r = this._tx(store,'readonly').getAll(); r.onsuccess = () => res(r.result); r.onerror = rej; });
  },
  delete(store, id) {
    if (this._mode === 'ls') return new Promise((res, rej) => {
      try { const arr = this._lsRead(store).filter(x => x.id !== id); this._lsWrite(store, arr); res(); } catch (err) { rej(err); }
    });
    return new Promise((res, rej) => { const r = this._tx(store,'readwrite').delete(id); r.onsuccess = res; r.onerror = rej; });
  }
};
globalThis.DB = DB;
