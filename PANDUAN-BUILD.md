# Panduan Build & Deploy DAMKARHUB Fireman (tanpa PC)

Sejak versi ini, aset CDN (Tailwind, FontAwesome, jsPDF) **tidak lagi diambil dari internet**.
Semuanya dibuat otomatis saat *build* dan ikut ter-cache untuk offline.

## Struktur
- `index.html` = sumber yang kamu edit. Boleh tetap dibuka langsung untuk uji cepat (memakai CDN).
- `npm run build` → membuat folder `dist/` berisi versi produksi (aset lokal). Folder ini yang di-deploy.

## Deploy dari HP (GitHub + Vercel)
1. Buat repo **privat** di GitHub. Unggah **isi** folder `damkarhub/` (bukan folder luarnya) ke akar repo:
   `index.html`, `package.json`, `vercel.json`, `tailwind.config.js`, `scripts/`, `icons/`, `assets/` (gambar tema), `manifest.json`, `service-worker.js`.
2. Di Vercel: **Add New → Project → Import** repo itu. `vercel.json` sudah berisi perintah build
   (`npm run build`) dan folder output (`dist`), jadi tidak perlu diatur lagi.
3. Setiap kali kamu mengubah file di GitHub, Vercel membangun ulang otomatis. Nama cache service worker
   ikut berganti sendiri, jadi tidak perlu lagi menaikkan versi manual.

## Cek setelah deploy pertama
- Buka situs, lalu matikan internet → muat ulang: tampilan dan ikon harus tetap muncul, dan PDF tetap bisa dibuat.
- Periksa tampilan di HP dalam mode terang dan gelap (tombol bulan/matahari di header). Bila ada yang bergeser, kabari saya.

## Bila build gagal
Log Vercel memuat baris berawalan `✗`. Yang paling mungkin: paket npm tidak terpasang atau nama berkas
di dalam paket berbeda dari yang diharapkan (skrip menyebut berkas yang dicari).

## Catatan
- Kelas Tailwind yang **dirakit dari potongan teks** (mis. `'bg-' + warna`) tidak terdeteksi build.
  Tulis kelas lengkap dalam kode, atau tambahkan `safelist` di `tailwind.config.js`.
- Untuk Capacitor nanti, `webDir` cukup diarahkan ke `dist`.
