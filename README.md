# 🔥 DAMKARHUB Fireman

> **Pantang Pulang Sebelum Api Padam**

Aplikasi PWA (Progressive Web App) untuk pencatatan laporan petugas pemadam kebakaran dan penyelamatan. Dirancang ringan, offline-first, dan dapat di-install di home screen HP seperti aplikasi native.

![Version](https://img.shields.io/badge/version-1.0-red)
![Status](https://img.shields.io/badge/status-uji%20coba-orange)
![PWA](https://img.shields.io/badge/PWA-ready-blue)
![License](https://img.shields.io/badge/license-proprietary-red)

---

## 📱 Fitur Utama

### 📋 Tiga Modul Laporan
- **🔥 Laporan Kebakaran** — Detail kejadian, korban, penyebab, kerugian, aset terselamatkan
- **🆘 Laporan Penyelamatan** — Evakuasi, rescue, penyelamatan non-kebakaran
- **📢 Laporan Sosialisasi** — Edukasi, pelatihan, simulasi ke sekolah/instansi/masyarakat

### 📊 Dashboard Statistik
- KPI dinamis per periode (bulan ini / tahun ini / semua)
- Perbandingan otomatis dengan periode sebelumnya (naik/turun %)
- Leaderboard regu & personil teraktif
- Rasio waktu pelayanan (dini hari / pagi / siang / sore / malam)
- Statistik wilayah (kab/kota, kecamatan, kel/desa)

### ⚡ Fitur Cerdas
- 🎤 **Speech to Text** — Input catatan via suara (Web Speech API)
- ⏰ **Tombol Rekam Waktu** — Catat waktu sekarang dengan 1 tap
- 📍 **Auto-distance** — Hitung jarak otomatis dari koordinat kantor ke lokasi
- 🗺️ **Preview Maps** — Buka lokasi ke Google Maps langsung
- 📸 **Foto Terkompresi** — Ambil foto dari kamera/galeri, otomatis kompresi
- 📋 **Tinjau Laporan** — Preview rapi sebelum kirim/salin
- 📤 **Export PDF/Excel** — Cetak laporan formal atau spreadsheet

### 💾 Data & Sinkronisasi
- **Offline-first** — Input laporan tanpa internet
- **IndexedDB storage** — Data tersimpan lokal di HP
- **Backup/Restore JSON** — Merge data dari perangkat lain
- **Manajemen Regu & Personil** — Multi-select, terintegrasi di setiap laporan

### 🔐 Keamanan
- **Access Gate** — Kode undangan untuk akses terbatas
- **Copyright & DevTools Detection** — Proteksi dasar dari modifikasi
- **Proprietary** — Kode dilindungi hak cipta

---

## 🚀 Instalasi PWA

### Untuk Petugas
1. Buka link aplikasi di Chrome Android
2. Menu (⋮) → **"Tambahkan ke layar utama"** / **"Install app"**
3. Icon DAMKARHUB akan muncul di home screen
4. Buka seperti aplikasi biasa (fullscreen, no address bar)

### Untuk Developer
```bash
# Clone repository
git clone https://github.com/[username]/damkarhub-fireman.git

# Buka di Live Server (VS Code)
# Atau
python -m http.server 8000
