# Panduan Sinkronisasi Pusat DAMKARHUB (Supabase)

Cara kerja: laporan **selalu disimpan dulu di HP** (tetap bisa dipakai offline), lalu otomatis
dikirim ke server saat ada sinyal. Petugas hanya melihat laporannya sendiri; **admin melihat semua**.

## A. Siapkan Supabase (± 15 menit, gratis)
1. Daftar di https://supabase.com → **New project** (pilih region *Singapore*). Catat password database.
2. Menu **SQL Editor** → **New query** → tempel isi `supabase/setup.sql` → **Run**.
3. Menu **Authentication → Sign In / Providers → Email**:
   - matikan **Allow new users to sign up** (supaya orang luar tidak bisa mendaftar sendiri),
   - matikan **Confirm email** bila ada (akun dibuat manual oleh admin).
4. Menu **Authentication → Users → Add user → Create new user**: buat satu akun per petugas
   (email + password, centang *Auto Confirm User*).
5. Jadikan akun admin: di **SQL Editor** jalankan
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@contoh.go.id';
   ```

## B. Sambungkan ke aplikasi
1. Supabase → **Project Settings → API**. Salin **Project URL** dan **anon public key**.
2. Buka `damkarhub/index.html`, cari `const SyncConfig = {` lalu isi:
   ```js
   URL: 'https://xxxxxxxx.supabase.co',
   ANON_KEY: 'eyJ...kunci-anon-public...',
   ```
   (Kunci *anon public* memang aman di sisi aplikasi; data dilindungi aturan RLS di server.
   **Jangan pernah** memakai kunci `service_role` di aplikasi.)
3. Deploy ulang (Vercel/Cloudflare Pages). Buka aplikasi **online sekali** agar versi baru ter-cache.

## C. Cara pakai petugas
- Menu **Sistem → Sinkronisasi Pusat** → login dengan email & password dari admin → **Masuk & Sinkron**.
- Laporan lama di HP otomatis dikirim satu kali saat login pertama.
- Setelahnya sinkron otomatis: setiap simpan/hapus laporan, saat kembali online, saat aplikasi dibuka,
  dan tiap 2 menit selama aplikasi terbuka. Tombol **Sinkron Sekarang** untuk manual.
- Admin cukup login di aplikasi yang sama: semua laporan petugas masuk ke Riwayat, Dashboard, dan Export.

## D. Batasan yang perlu diketahui
- **1 HP = 1 petugas.** Jangan bergantian login di HP yang sama.
- Sinkron berjalan **saat aplikasi terbuka** (belum ada sinkron di latar belakang).
- Yang tersinkron: laporan Kebakaran, Non-Kebakaran, Sosialisasi. **Regu, personil, dan pengaturan
  belum** (masih lokal per HP).
- Foto ikut tersimpan di dalam data laporan (± 100–200 KB per laporan). Kuota gratis DB 500 MB
  cukup untuk ribuan laporan; bila mendekati penuh, pindahkan foto ke Supabase Storage.
- Bila laporan yang sama diedit di dua HP sebelum sempat sinkron, yang tersimpan terakhir di server yang menang.
- Setahu saya, project Supabase gratis akan di-*pause* bila tidak ada aktivitas sekitar 1 minggu;
  bisa diaktifkan lagi dari dashboard.
- Data memuat NIK korban: gunakan password kuat, batasi jumlah admin, dan aktifkan backup berkala.
