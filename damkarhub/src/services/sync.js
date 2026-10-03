export const Sync = {
  SESSION_KEY: 'damkarhub_sync_session',
  TENANT_KEY: 'damkarhub_tenant_id',
  _uid() { try { return this._session()?.uid || 'anon'; } catch (e) { return 'anon'; } },
  _cursorKey() { return 'damkarhub_sync_cursor_' + this._uid(); },
  _seededKey() { return 'damkarhub_sync_seeded_' + this._uid(); },
  _ownerId() { try { return this._session()?.uid || null; } catch (e) { return null; } },
  _tenantId() { try { return localStorage.getItem(this.TENANT_KEY) || null; } catch (e) { return null; } },
  // DEFENSIVE (Fix 3): sertakan owner + tenant_id agar lolos RLS
  _row(rid, module, data, deleted) {
    const row = { id: rid, module, data, deleted };
    const owner = this._ownerId();
    if (owner) row.owner = owner;
    const tenant = this._tenantId();
    if (tenant) row.tenant_id = tenant;
    return row;
  },
  _busy: false, _timer: null, _deb: null, _lastError: '', _lastSync: null,

  enabled() { return !!(SyncConfig.URL && SyncConfig.ANON_KEY); },
  _session() { try { return JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null'); } catch { return null; } },
  isLoggedIn() { return !!this._session()?.refresh_token; },

  init() {
    if (this.enabled()) {
      window.addEventListener('online', () => this.schedule(800));
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.schedule(800); });
      this._timer = setInterval(() => { if (document.visibilityState === 'visible') this.run(); }, SyncConfig.INTERVAL_MS);
      if (this.isLoggedIn()) this.schedule(1500);
    }
    this.updateUI();
  },
  schedule(ms = 1500) {
    if (!this.enabled() || !this.isLoggedIn()) return;
    clearTimeout(this._deb);
    this._deb = setTimeout(() => this.run(), ms);
  },

  /* ---------- Auth (REST, tanpa SDK) ---------- */
  _authHeaders() { return { apikey: SyncConfig.ANON_KEY, 'Content-Type': 'application/json' }; },
  _storeSession(j, email) {
    const old = this._session() || {};
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)),
      email: email || j.user?.email || old.email || '',
      uid: j.user?.id || old.uid || ''
    }));
  },
    async joinTenant(code) {
    if (!this.enabled() || !code) return null;
    try {
      const res = await this._req('POST', 'rpc/join_tenant', {
        body: { p_code: code }
      });
      if (!res.ok) {
        const msg = await this._errMsg(res);
        console.warn('Join tenant gagal:', msg);
        return null;
      }
      const tenantId = await res.json();
      try { if (tenantId) localStorage.setItem(this.TENANT_KEY, tenantId); } catch (e) {}
      console.log('✅ Auto-join tenant:', tenantId);
      return tenantId;
    } catch (e) {
      console.warn('Join tenant error:', e);
      return null;
    }
  },
  async login() {
    if (!this.enabled()) return;
    const email = (document.getElementById('sync_email')?.value || '').trim();
    const pass = document.getElementById('sync_password')?.value || '';
    if (!email || !pass) return UI.toast('Isi email dan password.', 'error');
    if (!navigator.onLine) return UI.toast('Login butuh koneksi internet.', 'error');
    try {
      const res = await fetch(`${SyncConfig.URL}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: this._authHeaders(), body: JSON.stringify({ email, password: pass })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        UI.toast(res.status === 400 ? 'Email atau password salah.' : 'Login gagal: ' + (j.msg || j.error_description || res.status), 'error');
        return;
      }
            this._storeSession(j, email);
      const pw = document.getElementById('sync_password'); if (pw) pw.value = '';
      Helpers.haptic([20, 50, 20]);
      
      // Auto-join tenant (Fase 1 single-tenant)
      if (SyncConfig.DEFAULT_TENANT_CODE) {
        await this.joinTenant(SyncConfig.DEFAULT_TENANT_CODE);
      }
      
      await this._seed();
      this.updateUI();
      this.run({ manual: true });
    } catch { UI.toast('Tidak bisa terhubung ke server.', 'error'); }
  },
  logout() {
    if (!confirm('Keluar dari sinkronisasi? Data di perangkat ini tetap aman.')) return;
    localStorage.removeItem(this.SESSION_KEY);
    this._lastError = '';
    this.updateUI();
  },
  async _token(force = false) {
    const s = this._session(); if (!s) return null;
    if (!force && s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    const res = await fetch(`${SyncConfig.URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: this._authHeaders(), body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      if ([400, 401, 403].includes(res.status)) {
        localStorage.removeItem(this.SESSION_KEY);
        this._lastError = 'Sesi berakhir. Silakan login ulang.';
        return null;
      }
      throw new Error('Gagal memperbarui sesi (' + res.status + ')');
    }
    this._storeSession(j);
    return j.access_token;
  },
  async _req(method, path, { body, prefer } = {}) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this._token(attempt > 0);
      if (!token) throw new Error(this._lastError || 'Belum login');
      const headers = { apikey: SyncConfig.ANON_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(`${SyncConfig.URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      if (res.status === 401 && attempt === 0) continue;
      return res;
    }
  },
  async _errMsg(res) {
    try { const j = await res.json(); return j.message || j.msg || j.error_description || ('HTTP ' + res.status); }
    catch { return 'HTTP ' + res.status; }
  },

  /* ---------- Antrean kirim (outbox) ---------- */
  async enqueue(module, rid, op) {
    if (!this.enabled()) return;
    try { await DB.put(Config.STORES.sync, { id: module + ':' + rid, module, rid, op, ts: Date.now() }); }
    catch (e) { console.warn('Sync enqueue gagal', e); }
    this.updateUI();
    this.schedule();
  },
  async _seed() {
    if (localStorage.getItem(this._seededKey())) return;
    for (const m of ['k', 'nk', 'sos']) {
      for (const d of Mod[m].data) {
        await DB.put(Config.STORES.sync, { id: m + ':' + d.id, module: m, rid: d.id, op: 'upsert', ts: Date.now() });
      }
    }
    localStorage.setItem(this._seededKey(), '1');
  },
  async _ack(it) {
    const cur = (await DB.getAll(Config.STORES.sync)).find(x => x.id === it.id);
    if (cur && cur.ts === it.ts) await DB.delete(Config.STORES.sync, it.id);
  },
  async _markFail(it, msg) {
    const cur = (await DB.getAll(Config.STORES.sync)).find(x => x.id === it.id);
    if (cur && cur.ts === it.ts) await DB.put(Config.STORES.sync, { ...cur, err: msg, fails: (cur.fails || 0) + 1 });
  },

  async run(opts = {}) {
    if (!this.enabled() || this._busy) return;
    if (!this.isLoggedIn()) { this.updateUI(); return; }
    if (!navigator.onLine) {
      if (opts.manual) UI.toast('Tidak ada koneksi. Data tetap aman di perangkat.', 'info');
      this._lastError = 'Menunggu koneksi internet…';
      this.updateUI(); return;
    }
    this._busy = true; this._lastError = ''; this.updateUI();
    try {
      const p = await this._push();
      const pulled = await this._pull();
      this._lastSync = new Date();
      if (p.failed) this._lastError = 'Sebagian laporan ditolak server (lihat konsol / hubungi admin).';
      if (opts.manual && (typeof App === 'undefined' || !App.settings || App.settings.notif_sync !== false)) {
        UI.toast(`Sinkron selesai — ${p.sent} terkirim, ${pulled} diterima${p.failed ? ', ' + p.failed + ' ditolak' : ''}`, p.failed ? 'error' : 'success');
      }
    } catch (e) {
      this._lastError = (e instanceof TypeError) ? 'Menunggu koneksi internet…' : (e.message || String(e));
      if (opts.manual) UI.toast('Sinkron gagal: ' + this._lastError, 'error');
    } finally {
      this._busy = false; this.updateUI();
    }
  },

  /* ---------- Kirim ke server ---------- */
  async _push() {
    const q = (await DB.getAll(Config.STORES.sync)).sort((a, b) => a.ts - b.ts);
    const items = [];
    for (const it of q) {
      if (it.op === 'delete') { items.push({ it, row: this._row(it.rid, it.module, {}, true) }); continue; }
      let d = Mod[it.module]?.data.find(x => x.id === it.rid);
      if (!d) {
        // DEFENSIVE: coba muat ulang dari IndexedDB sebelum menyerah
        try {
          const all = await DB.getAll(Config.STORES[it.module]);
          const fromDb = (all || []).find(x => x.id === it.rid);
          if (fromDb && Mod[it.module]) Mod[it.module].data.push(fromDb);
        } catch (e) {}
        d = Mod[it.module]?.data.find(x => x.id === it.rid);
      }
      if (!d) {
        // DEFENSIVE: JANGAN ack — pertahankan outbox, tandai agar terlihat
        console.warn('Sync: outbox orphan dipertahankan, laporan tidak ditemukan:', it.id);
        await this._markFail(it, 'Laporan tidak ditemukan di perangkat — outbox dipertahankan');
        continue;
      }
      items.push({ it, row: this._row(it.rid, it.module, d, false) });
    }
    let sent = 0, failed = 0;
    for (let i = 0; i < items.length; i += SyncConfig.CHUNK) {
      const r = await this._pushGroup(items.slice(i, i + SyncConfig.CHUNK));
      sent += r.sent; failed += r.failed;
    }
    return { sent, failed };
  },
  async _pushGroup(chunk) {
    const res = await this._req('POST', 'reports?on_conflict=id', {
      body: chunk.map(x => x.row), prefer: 'resolution=merge-duplicates,return=minimal'
    });
    if (res.ok) { for (const x of chunk) await this._ack(x.it); return { sent: chunk.length, failed: 0 }; }
    if (res.status >= 500 || res.status === 429 || res.status === 401) throw new Error(await this._errMsg(res));
    if (chunk.length > 1) {
      let s = 0, f = 0;
      for (const x of chunk) { const r = await this._pushGroup([x]); s += r.sent; f += r.failed; }
      return { sent: s, failed: f };
    }
    const msg = await this._errMsg(res);
    console.warn('Sync: laporan ditolak', chunk[0].row.id, msg);
    await this._markFail(chunk[0].it, msg);
    return { sent: 0, failed: 1 };
  },

  /* ---------- Tarik dari server ---------- */
  async _pull() {
    let cursor = localStorage.getItem(this._cursorKey()) || '1970-01-01T00:00:00+00:00';
    const pending = new Set((await DB.getAll(Config.STORES.sync)).map(x => x.id));
    let changed = 0, guard = 0;
    while (guard++ < 500) {
      const path = `reports?select=id,module,data,deleted,updated_at&updated_at=gte.${encodeURIComponent(cursor)}&order=updated_at.asc,id.asc&limit=${SyncConfig.PAGE}`;
      const res = await this._req('GET', path);
      if (!res.ok) throw new Error(await this._errMsg(res));
      const rows = await res.json();
      if (!rows.length) break;
      for (const r of rows) changed += await this._applyRow(r, pending);
      const last = rows[rows.length - 1].updated_at;
      const advanced = last !== cursor;
      cursor = last;
      localStorage.setItem(this._cursorKey(), cursor);
      if (rows.length < SyncConfig.PAGE || !advanced) break;
    }
    if (changed > 0) this._refreshUI();
    return changed;
  },
  async _applyRow(r, pending) {
    const store = Config.STORES[r.module], mod = Mod[r.module];
    if (!store || !mod) return 0;
    if (pending.has(r.module + ':' + r.id)) return 0;   // perubahan lokal belum terkirim → lokal menang
    const idx = mod.data.findIndex(x => x.id === r.id);
    if (r.deleted) {
      if (idx < 0) return 0;
      mod.data.splice(idx, 1); await DB.delete(store, r.id); return 1;
    }
    const d = r.data;
    if (!d || !d.id) return 0;
    if (idx > -1) { if (this._eq(mod.data[idx], d)) return 0; mod.data[idx] = d; }
    else mod.data.push(d);
    await DB.put(store, d);
    return 1;
  },
  _eq(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => this._eq(a[k], b[k]));
  },
  _refreshUI() {
    try {
      App._populateDates(); App.renderBeranda(); App.renderRiwayat();
      ['k', 'nk', 'sos'].forEach(m => Mod[m].updateDashboard());
    } catch (e) { console.warn('Refresh UI setelah sinkron gagal', e); }
  },

  /* ---------- Tampilan kartu di tab Sistem ---------- */
  async updateUI() {
    const st = document.getElementById('syncStatus'); if (!st) return;
    const login = document.getElementById('syncLoginBox'), act = document.getElementById('syncActionBox');
    if (!this.enabled()) {
      st.textContent = 'Belum dikonfigurasi. Aplikasi berjalan lokal (data hanya tersimpan di perangkat ini).';
      login?.classList.add('hidden'); act?.classList.add('hidden'); return;
    }
    const s = this._session();
    if (!s) {
      st.textContent = this._lastError || 'Belum masuk. Login agar laporan otomatis terkirim ke server pusat.';
      login?.classList.remove('hidden'); act?.classList.add('hidden'); return;
    }
    let pending = 0;
    try { pending = (await DB.getAll(Config.STORES.sync)).length; } catch {}
    const lines = ['Masuk sebagai ' + (s.email || 'petugas')];
    lines.push(this._busy ? 'Sedang sinkron…' : (pending ? pending + ' laporan menunggu terkirim' : 'Semua laporan sudah tersinkron'));
    if (this._lastSync && !this._busy) lines.push('Terakhir: ' + this._lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    if (this._lastError) lines.push('⚠ ' + this._lastError);
    st.textContent = lines.join('\n');
    login?.classList.add('hidden'); act?.classList.remove('hidden');
  }
};
globalThis.Sync = Sync;
