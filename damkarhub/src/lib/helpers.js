export const Helpers = {
  plainKategori(str) { return (str || '').replace(/^[A-Z]+\s-\s/, ''); },
  shortKategori(str) { return Helpers.plainKategori(str).replace(/\s*\(.*\)\s*$/, ''); },
  haptic(ms = 10) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e){} },
  calcRT(terima, tiba) {
    if (!terima || !tiba) return 0;
    const t1 = new Date('1970-01-01T' + terima + 'Z');
    const t2 = new Date('1970-01-01T' + tiba + 'Z');
    if (t2 < t1) t2.setDate(t2.getDate() + 1);
    return Math.round((t2 - t1) / 60000);
  },
  calcDuration(startDate, startTime, endDate, endTime) {
    if (!startDate || !startTime || !endTime) return 0;
    const sDate = startDate;
    const eDate = endDate || startDate;
    const t1 = new Date(`${sDate}T${startTime}:00`);
    const t2 = new Date(`${eDate}T${endTime}:00`);
    if (isNaN(t1) || isNaN(t2)) return 0;
    let diff = Math.round((t2 - t1) / 60000);
    if (diff < 0) diff += 24 * 60;
    return diff;
  },
  calcDelta(current, previous) {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }
    return Math.round(((current - previous) / previous) * 100);
  },
  autoFillDurasi(prefix) {
    let startDate = '', startTime = '', endDate = '', endTime = '';
    if (prefix === 'k') {
  startDate = document.getElementById('k_tglTerima').value || document.getElementById('k_tanggal').value;
  startTime = document.getElementById('k_jamMulai')?.value || document.getElementById('k_jamTiba')?.value || document.getElementById('k_jamTerima')?.value || '';
  endDate = document.getElementById('k_tglSelesai').value;
  endTime = document.getElementById('k_jamSelesai').value;
  const rtStart = document.getElementById('k_jamTerima')?.value;
  const rtEnd = document.getElementById('k_jamMulai')?.value || document.getElementById('k_jamTiba')?.value;
  const rt = Helpers.calcRT(rtStart, rtEnd);
  const rtField = document.getElementById('k_responTime');
  if (rtField) rtField.value = rt > 0 ? rt : '';
} else if (prefix === 'nk') {
  const tglMulaiEl = document.getElementById('nk_tglMulai');
  const jamMulaiEl = document.getElementById('nk_jamMulai');
  const tglHariEl = document.getElementById('nk_tanggal');
  const tglSelesaiEl = document.getElementById('nk_tglSelesai');
  startDate = (tglMulaiEl?.value) || (tglHariEl?.value) || '';
  startTime = (jamMulaiEl?.value) || '';
  endDate = (tglSelesaiEl?.value) || startDate;
  endTime = document.getElementById('nk_jamSelesai')?.value || '';
} else if (prefix === 'sos') {
      startDate = document.getElementById('sos_tanggal').value;
      startTime = document.getElementById('sos_pukul').value;
      endDate = document.getElementById('sos_tglSelesai').value;
      endTime = document.getElementById('sos_jamSelesai').value;
    }
    if (startDate && startTime && endTime) {
      const durasi = Helpers.calcDuration(startDate, startTime, endDate, endTime);
      if (durasi > 0 && durasi < 10080) {
        const durasiInput = document.getElementById(`${prefix}_durasi`);
        if (durasiInput) {
          durasiInput.value = durasi;
          durasiInput.classList.add('ring-2', 'ring-green-400');
          setTimeout(() => durasiInput.classList.remove('ring-2', 'ring-green-400'), 1500);
          Helpers.haptic(15);
        }
      }
    }
  },
  /* Parse koordinat dari 2 format:
       A: "-7.1234, 108.4567" (raw, dari tombol GPS)
       B: URL Google Maps — "?q=lat,lng" atau "@lat,lng[,zoom]"
     Return {lat, lng} (string) atau null. */
  parseKoordinat(str) {
    const s = (str || '').trim();
    if (!s) return null;
    let m = s.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (m) return { lat: m[1], lng: m[2] };
    m = s.match(/[?@]q?=?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: m[1], lng: m[2] };
    return null;
  },
  /* Normalisasi field kendala (K/NK) ke array.
     Data baru: array. Data lama: string ('Nihil'/kosong -> [], teks bebas -> [teks]). */
  kendalaList(v) {
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    if (typeof v === 'string') { const s = v.trim(); return (!s || s === 'Nihil') ? [] : [s]; }
    return [];
  },
  /* Nilai efektif catatan SOS (konsolidasi 1 field): catatanEvaluasi -> keterangan lama
     -> kendala lama (selain 'Nihil'). Data lama tidak dimutasi; fallback hanya saat dibaca. */
  sosCatatan(d) {
    if (!d) return '';
    if (d.catatanEvaluasi && String(d.catatanEvaluasi).trim()) return d.catatanEvaluasi;
    if (d.keterangan && String(d.keterangan).trim()) return d.keterangan;
    return Helpers.kendalaList(d.kendala).join(', ');
  },
  autoFillJarak(prefix) {
    const input = document.getElementById(`${prefix}_koordinat`);
    const parsed = Helpers.parseKoordinat(input?.value);
    if (!parsed) { UI.toast('Format koordinat tidak dikenali', 'error'); return; }
    const koor = `${parsed.lat}, ${parsed.lng}`;
    if (input && input.value.trim() !== koor) input.value = koor; // normalize "lat, lng"
    if (!App.settings.kantor) return;
    const dist = Helpers.calcDist(App.settings.kantor, koor);
    if (dist !== null) {
      const jarakField = document.getElementById(`${prefix}_jarak`);
      if (jarakField) {
        jarakField.value = dist;
        jarakField.classList.add('ring-2', 'ring-green-400');
        setTimeout(() => jarakField.classList.remove('ring-2', 'ring-green-400'), 1200);
      }
    }
  },
  getTimeSlot(pukul) {
    if (!pukul) return null;
    const h = parseInt(pukul.split(':')[0]);
    if (isNaN(h)) return null;
    if (h >= 0 && h < 6) return 'Dini Hari';
    if (h >= 6 && h < 11) return 'Pagi';
    if (h >= 11 && h < 15) return 'Siang';
    if (h >= 15 && h < 18) return 'Sore';
    return 'Malam';
  },
  newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
},
  autoFillMulai(prefix) {
  if (prefix !== 'k') return;
  const jamTibaEl = document.getElementById('k_jamTiba');
  const jamMulaiEl = document.getElementById('k_jamMulai');
  if (!jamTibaEl?.value || !jamMulaiEl) return;
  const [h, m] = jamTibaEl.value.split(':').map(Number);
  const total = h * 60 + m + 2.5;
  const newH = Math.floor(total / 60) % 24;
  const newM = Math.floor(total % 60);
  jamMulaiEl.value = String(newH).padStart(2, '0') + ':' + String(newM).padStart(2, '0');
},
  recordTime(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.value = `${hh}:${mm}`;
    Helpers.haptic(10);
    UI.toast(`⏰ Waktu dicatat: ${hh}:${mm}`, 'success');
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  recordDate(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    el.value = `${yyyy}-${mm}-${dd}`;
    Helpers.haptic(10);
    UI.toast(`📅 Tanggal dicatat: ${dd}/${mm}/${yyyy}`, 'success');
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },
  openMaps(coords) {
    if (!coords || !coords.trim()) return UI.toast('Koordinat tidak tersedia.', 'error');
    const clean = coords.replace(/\s/g, '');
    Helpers.haptic(10);
    window.open(`https://maps.google.com/?q=${encodeURIComponent(clean)}`, '_blank');
  },
  speechState: { rec: null, btn: null, textareaId: null },
  _nativeSpeech() {
    try { return !!(window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.SpeechRecognition); } catch { return false; }
  },
  _speechBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle('mic-active', on);
    btn.innerHTML = on ? '<i class="fa-solid fa-stop mr-1"></i>Stop' : '<i class="fa-solid fa-microphone mr-1"></i>Suara';
  },
  /* Speech-to-text native (Capacitor: @capacitor-community/speech-recognition).
     Dipakai otomatis hanya saat berjalan di dalam APK Capacitor; di PWA/browser tetap Web Speech API. */
  async _startSpeechNative(textareaId, btn) {
    const SR = window.Capacitor.Plugins.SpeechRecognition;
    if (this.speechState.rec) { this.speechState.rec.stop(); return; }
    if (this._speechStarting) return;
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    this._speechStarting = true;
    let handles = [];
    try {
      const av = await SR.available();
      if (!av?.available) { UI.toast('Pengenalan suara tidak tersedia di perangkat ini.', 'error'); return; }
      let perm = await SR.checkPermissions();
      if (perm?.speechRecognition !== 'granted') perm = await SR.requestPermissions();
      if (perm?.speechRecognition !== 'granted') { UI.toast('Izin mikrofon ditolak.', 'error'); return; }

      const initial = textarea.value;
      let committed = '', current = '', userStopped = false, ended = false, emptyRuns = 0;
      const join = (a, b) => (a && b) ? a + ' ' + b : (a || b);
      const render = () => { textarea.value = join(join(initial, committed), current); };
      const finish = async () => {
        if (ended) return; ended = true;
        for (const h of handles) { try { await h.remove(); } catch {} }
        handles = [];
        this.speechState = { rec: null, btn: null, textareaId: null };
        this._speechBtn(btn, false);
      };
      const fail = (msg) => { userStopped = true; UI.toast(msg, 'error'); finish(); };
      const listen = async () => {
        if (ended || userStopped) return;
        try {
          const r = await SR.start({ language: 'id-ID', maxResults: 1, partialResults: true, popup: false });
          if (r?.matches?.[0]) { current = r.matches[0]; render(); }
        } catch (e) {
          if (ended || userStopped) return;
          if (++emptyRuns >= 2) fail('Gagal merekam suara.'); else setTimeout(listen, 300);
        }
      };

      handles.push(await SR.addListener('partialResults', d => {
        if (ended || !d?.matches?.[0]) return;
        current = d.matches[0]; emptyRuns = 0; render();
      }));
      handles.push(await SR.addListener('listeningState', d => {
        if (d?.status !== 'stopped' || ended) return;
        const heard = current.trim();
        committed = join(committed, heard); current = ''; render();
        if (userStopped) { finish(); return; }
        if (!heard && ++emptyRuns >= 2) { fail('Tidak ada suara terdeteksi.'); return; }
        // Android berhenti sendiri saat hening → sambung lagi supaya terasa kontinu
        setTimeout(listen, 250);
      }));

      this.speechState = { rec: { stop: () => { userStopped = true; try { SR.stop(); } catch {} setTimeout(finish, 800); } }, btn, textareaId };
      this._speechBtn(btn, true);
      UI.toast('🎤 Mendengarkan... Bicara sekarang', 'info');
      Helpers.haptic(20);
      await listen();
    } catch (e) {
      console.error(e);
      UI.toast('Gagal memulai mikrofon.', 'error');
      this.speechState = { rec: null, btn: null, textareaId: null };
      this._speechBtn(btn, false);
    } finally {
      this._speechStarting = false;
    }
  },
  startSpeech(textareaId, btn) {
    if (this._nativeSpeech()) return this._startSpeechNative(textareaId, btn);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { UI.toast('Browser tidak mendukung fitur suara. Gunakan Chrome terbaru.', 'error'); return; }
    if (this.speechState.rec) { this.speechState.rec.stop(); return; }
    const rec = new SR();
    rec.lang = 'id-ID';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    const initialValue = textarea.value;

    rec.onstart = () => {
      this.speechState = { rec, btn, textareaId };
      if (btn) {
        btn.classList.add('mic-active');
        btn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i>Stop';
      }
      UI.toast('🎤 Mendengarkan... Bicara sekarang', 'info');
      Helpers.haptic(20);
    };
    rec.onresult = (event) => {
  // Android Chrome: event.results bertambah incremental (bukan replace).
  // Setiap result berisi transcript yang makin lengkap.
  // Solusi: ambil yang PALING PANJANG = transcript paling lengkap.
  let best = '';
  for (let i = 0; i < event.results.length; i++) {
    const t = (event.results[i][0].transcript || '').trim();
    if (t.length > best.length) best = t;
  }
  if (!best) return;
  const cleaned = best.replace(/\s+/g, ' ');
  const composed = initialValue
    ? initialValue + (initialValue.endsWith(' ') ? '' : ' ') + cleaned
    : cleaned;
  textarea.value = composed;
};
    rec.onerror = (event) => {
      let msg = 'Gagal merekam suara.';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') msg = 'Izin mikrofon ditolak.';
      else if (event.error === 'no-speech') msg = 'Tidak ada suara terdeteksi.';
      else if (event.error === 'audio-capture') msg = 'Mikrofon tidak ditemukan.';
      else if (event.error === 'network') msg = 'Masalah jaringan.';
      UI.toast(msg, 'error');
    };
    rec.onend = () => {
      this.speechState = { rec: null, btn: null, textareaId: null };
      if (btn) {
        btn.classList.remove('mic-active');
        btn.innerHTML = '<i class="fa-solid fa-microphone mr-1"></i>Suara';
      }
    };
    try { rec.start(); } catch(e) { console.error(e); UI.toast('Gagal memulai mikrofon.', 'error'); }
  },
  /* Suntik tombol mic (speech-to-text) ke semua text input & textarea di form
     laporan K/NK/SOS. Exclude: number/tel/date/time/email/password (via selector),
     readonly, id *_koordinat/*_durasi/*_jarak/*_responTime, dan field yang sudah
     punya tombol mic. Idempoten: aman dipanggil ulang. */
  injectMicButtons() {
    const BTN_CLS = 'text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold border border-blue-200 dark:border-blue-800 active:scale-95 shrink-0';
    const EXCLUDE_ID = /_(koordinat|durasi|jarak|responTime)$/;
    ['k_form', 'nk_form', 'sos_form'].forEach(fid => {
      const form = document.getElementById(fid);
      if (!form) return;
      form.querySelectorAll('input[type="text"], textarea').forEach(el => {
        if (!el.id || el.readOnly || EXCLUDE_ID.test(el.id)) return;
        const wrap = el.parentElement;
        if (!wrap || wrap.querySelector('button[onclick*="startSpeech"]')) return; // sudah ada mic
        const btn = `<button type="button" onclick="Helpers.startSpeech('${el.id}', this)" class="${BTN_CLS}"><i class="fa-solid fa-microphone mr-1"></i>Suara</button>`;
        const label = [...wrap.children].find(c => c.tagName === 'LABEL');
        if (label) {
          const header = document.createElement('div');
          header.className = 'flex justify-between items-center mb-1';
          label.classList.add('mb-0');
          wrap.insertBefore(header, el);
          header.appendChild(label);
          header.insertAdjacentHTML('beforeend', btn);
        } else {
          el.insertAdjacentHTML('afterend', ' ' + btn);
        }
      });
    });
  },
  dayName(s) { if (!s) return '-'; const d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? '-' : Config.DAYS[d.getDay()]; },
  formatDate(s) {
    if (!s) return '-';
    const d = new Date(s + 'T00:00:00');
    if (isNaN(d.getTime())) return s;
    return `${String(d.getDate()).padStart(2,'0')} ${Config.MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  },
  monthName(i) { return Config.MONTHS[parseInt(i)] || ''; },
  formatAddress(dusun, rtrw, kel, kec, kabkota) {
    return [dusun && `Lingk/Dusun ${dusun}`, rtrw && `RT/RW ${rtrw}`, kel && `Kel/Desa ${kel}`, kec && `Kec. ${kec}`, kabkota && `${kabkota}`].filter(Boolean).join(', ') || '-';
  },
  // Foto → kompres → upload Cloudinary (URL). Offline/gagal → base64 lokal (pending).
  compressImage(input, hiddenId) {
    if (!input.files?.[0]) return;
    const file = input.files[0];
    const hidden = document.getElementById(hiddenId);
    if (!hidden) return;
    hidden.value = ''; hidden.dataset.cloud = '';
    UI.toast('Memproses foto…', 'info');
    Cloudinary.compressToBlob(file).then(blob => {
      // fallback base64 dari blob terkompres (untuk mode offline)
      const r = new FileReader();
      r.onload = e => {
        const b64 = e.target.result;
        // coba upload; gagal → simpan base64 lokal sebagai pending
        const tenantId = (typeof Sync !== 'undefined' && Sync._tenantId) ? Sync._tenantId() : null;
        Cloudinary.uploadFoto(blob, tenantId).then(url => {
          hidden.value = url; hidden.dataset.cloud = '1';
          Helpers.haptic(15);
          UI.toast('Foto terupload ✓', 'success');
        }).catch(() => {
          hidden.value = b64; hidden.dataset.cloud = '0';
          Helpers.haptic(15);
          UI.toast('Foto tersimpan lokal — diupload saat online', 'info');
        });
      };
      r.readAsDataURL(blob);
    }).catch(() => UI.toast('Foto gagal diproses.', 'error'));
  },
  calcDist(c1, c2) {
    try {
      const [lat1,lon1] = c1.split(',').map(s => parseFloat(s.trim()));
      const [lat2,lon2] = c2.split(',').map(s => parseFloat(s.trim()));
      if ([lat1,lon1,lat2,lon2].some(isNaN)) return null;
      const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
    } catch { return null; }
  },
  getLoc(prefix) {
    if (!navigator.geolocation) return UI.toast('Browser tidak mendukung GPS.', 'error');
    if (!App.settings.kantor) {
      UI.toast('⚠️ Set koordinat Kantor dulu di menu Sistem!', 'error');
      setTimeout(() => { if (confirm('Buka halaman Sistem sekarang?')) App.switchView('sistem'); }, 800);
      return;
    }
    UI.toast('📡 Mengambil lokasi GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        document.getElementById(`${prefix}_koordinat`).value = coords;
        const dist = this.calcDist(App.settings.kantor, coords);
        const jarakField = document.getElementById(`${prefix}_jarak`);
        if (dist !== null && jarakField) {
          jarakField.value = dist;
          jarakField.classList.add('ring-2', 'ring-green-400');
          setTimeout(() => jarakField.classList.remove('ring-2', 'ring-green-400'), 1800);
          UI.toast(`✅ Jarak dari kantor: ${dist} km`, 'success');
        } else UI.toast('Lokasi didapat.', 'info');
      },
      err => {
        let msg = 'Gagal akses GPS.';
        if (err.code === 1) msg = 'Izin lokasi ditolak.';
        else if (err.code === 2) msg = 'GPS tidak aktif.';
        else if (err.code === 3) msg = 'Timeout GPS.';
        UI.toast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  },
  getLocKantor() {
    if (!navigator.geolocation) return UI.toast('Browser tidak mendukung GPS.', 'error');
    UI.toast('📡 Mengambil lokasi Kantor...', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        document.getElementById('set_kantor').value = coords;
        UI.toast(`✅ Koordinat kantor diset: ${coords}`);
      },
      err => { UI.toast('Gagal akses lokasi!', 'error'); },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  }
};

globalThis.Helpers = Helpers;

/* ---------- setSelectOrOther → di-extract dari index.html ---------- */
export function setSelectOrOther(selId, inputId, value) {
  const sel = document.getElementById(selId), inp = document.getElementById(inputId);
  if (!sel) return;
  if (Array.from(sel.options).some(o => o.value === value)) { sel.value = value; if (inp) { inp.classList.add('hidden'); inp.value = ''; } }
  else { sel.value = 'Lainnya'; if (inp) { inp.value = value || ''; inp.classList.remove('hidden'); } }
}

globalThis.setSelectOrOther = setSelectOrOther;
