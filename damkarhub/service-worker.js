/* DAMKARHUB Fireman — Service Worker (nama cache diisi otomatis saat `npm run build`) */
const CACHE_NAME = 'damkarhub-v1.2.0';
const RUNTIME_CACHE = 'damkarhub-runtime-v1';

// Aset inti yang di-cache saat install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './tailwind.css',
  './vendor/fontawesome/css/all.min.css',
  './vendor/fontawesome/webfonts/fa-solid-900.woff2',
  './vendor/fontawesome/webfonts/fa-brands-400.woff2',
  './vendor/jspdf.umd.min.js',
  './vendor/jspdf.plugin.autotable.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/hero.webp',
  './assets/truck.webp',
  './assets/typo.webp',
  './assets/quote-l.webp',
  './assets/quote-r.webp',
  './assets/skyflame.webp',
  './assets/embers.webp',
  './assets/flame.webp'
];

// Install: cache aset inti
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      // Simpan satu per satu: bila ada 1 file gagal, sisanya tetap ter-cache (addAll bersifat semua-atau-tidak)
      .then(c => Promise.allSettled(CORE_ASSETS.map(u => c.add(u))).then(rs => {
        const bad = rs.filter(r => r.status === 'rejected').length;
        if (bad) console.warn('Cache: ' + bad + ' aset inti gagal disimpan');
      }))
      .then(() => self.skipWaiting())
  );
});

// Activate: bersihkan cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first untuk aset lokal, network-first untuk sisanya
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip chrome-extension, dsb
  if (!url.protocol.startsWith('http')) return;

  // Jangan pernah cache/intersep request ke Supabase (sinkron data harus selalu langsung ke jaringan)
  if (url.hostname.endsWith('.supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache runtime responses (jsPDF, dll dari CDN)
        if (res && res.status === 200 && (url.origin !== location.origin || CORE_ASSETS.includes(e.request.url))) {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback: kalau request HTML, kembalikan index.html
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

// Message handler (opsional, untuk skipWaiting trigger manual)
self.addEventListener('message', e => {
  if (e.data?.action === 'skipWaiting') self.skipWaiting();
});