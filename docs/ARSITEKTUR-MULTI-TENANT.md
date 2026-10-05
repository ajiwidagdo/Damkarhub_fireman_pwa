# Arsitektur Multi-Tenant & Keamanan — Ekosistem DAMKARHUB

**Status:** Design doc (hasil brainstorming 4 Okt 2026)
**Cakupan:** SUAR (warga) · SATRIA (petugas) · KOMANDO (admin) · Supabase
**Prinsip:** data terisolasi per wilayah, hierarki kabupaten → provinsi → nasional.

---

## 1. Hierarki Tenant & Aturan Visibility

Setiap laporan dicap `tenant_id` kota/kabupaten. Siapa boleh lihat apa ditegakkan di database (RLS), bukan di aplikasi.

| Peran | Boleh lihat |
|---|---|
| Kota/Kabupaten | Hanya laporan `tenant_id` miliknya |
| Provinsi | Semua kota/kabupaten **di provinsinya saja** |
| Nasional | Semua laporan |

Kabupaten A tidak bisa intip B. Provinsi A tidak bisa intip provinsi B. Target pasar awal per kabupaten; provinsi & nasional = lapisan bonus (arsitektur tidak berubah saat mereka onboard).

---

## 2. Skema Database

### 2.1 Tabel `tenants` (BARU)

```sql
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  nama            text not null,              -- 'Kota Banjar'
  tipe            text not null check (tipe in ('kota','kabupaten')),
  provinsi        text not null,              -- 'Jawa Barat'
  bbox_min_lat    double precision,           -- bounding box kasar
  bbox_max_lat    double precision,
  bbox_min_lng    double precision,
  bbox_max_lng    double precision,
  is_active       boolean not null default false,  -- sudah pakai Komando?
  emergency_phone text,                       -- nomor damkar setempat
  code            text unique,                -- kode join (mis. 'DAMKARHUB.BANJAR113')
  created_at      timestamptz not null default now()
);
```

Satu tabel ini menyelesaikan 3 masalah: isolasi data, penentuan wilayah otomatis, direktori telepon darurat.

### 2.2 Tabel `profiles` (BARU) — user → tenant + peran

```sql
create table public.profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),   -- null untuk nasional / admin_provinsi
  provinsi  text,                                 -- diisi untuk admin_provinsi (mis. 'Jawa Barat')
  peran     text not null check (peran in ('petugas','admin_kota','admin_provinsi','nasional')),
  regu      text,                                  -- 'Regu 1' dst (petugas)
  created_at timestamptz not null default now()
);
```

Catatan: tabel `admins` yang ada sekarang otomatis menjadi peran **nasional**.

### 2.3 Perubahan tabel `reports`

```sql
alter table public.reports
  add column if not exists parent_id   text references public.reports(id),  -- clustering
  add column if not exists device_id   text,                                 -- identitas anon SUAR
  add column if not exists tracking_token uuid not null default gen_random_uuid(),
  add column if not exists is_verified boolean not null default false,       -- triase
  add column if not exists verified_by uuid references auth.users(id),
  add column if not exists verified_at timestamptz;
```

`tenant_id` yang sudah ada dipakai ulang (wajib terisi untuk semua laporan baru).

### 2.4 Tabel `transfer_log` (BARU) — audit pemindahan laporan

```sql
create table public.transfer_log (
  id            uuid primary key default gen_random_uuid(),
  report_id     text not null references public.reports(id),
  dari_tenant   uuid not null references public.tenants(id),
  ke_tenant     uuid not null references public.tenants(id),
  alasan        text not null,
  oleh          uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);
```

### 2.5 RLS `reports` (ringkas)

| Peran | SELECT | INSERT |
|---|---|---|
| Anon | Hanya via RPC `my_reports(device_id)` | Ya: tenant valid + rate limit |
| Petugas / admin kota | `tenant_id` = tenant sendiri | Tenant sendiri |
| Admin provinsi | `tenant_id` ∈ tenant se-provinsi | — |
| Nasional | Semua | — |

Anon tidak punya JWT sehingga tidak bisa dibedakan via RLS murni → pola fungsi `SECURITY DEFINER` yang validasi `device_id` sendiri.

---

## 3. Penentuan Tenant Otomatis (SUAR)

Warga **tidak** diminta tahu batas administrasi. Alur:

1. Warga pin lokasi kejadian di peta.
2. App cocokkan koordinat ke `bbox` tiap tenant (offline-capable, tanpa layanan peta).
3. Ketemu 1 → tampilkan konfirmasi: *"Laporan ini akan dikirim ke **Kab. A**"* + alamat/desa (yang warga kenal) + tombol *"salah? ubah"*.
4. Ketemu >1 (perbatasan) atau 0 → tampilkan 2 kandidat terdekat, warga pilih.
5. Default awal = domisili saat daftar, tapi selalu bisa dikoreksi di langkah ini.

---

## 4. Transfer Laporan Antar Wilayah

**Model: teruskan (forward)** — seperti forward email; pengirim tidak perlu melihat data penerima.

- Operator kab. B melihat laporan nyasar → **"Teruskan ke…"** → pilih kabupaten dari direktori → isi alasan → konfirmasi.
- Sistem: ubah `tenant_id`, tulis `transfer_log`, notifikasi operator penerima.
- Berfungsi **tanpa provinsi** (target pasar awal). Provinsi = lapisan supervisi bonus.
- **Edge case:** transfer saat status "petugas jalan" → wajib konfirmasi eksplisit + notifikasi recall otomatis ke petugas.
- **Anti-dumping:** alasan wajib + audit log; tahap terima/tolak di sisi penerima dipertimbangkan fase 2.
- Tracking warga tidak terdampak (mengikuti ID laporan, bukan tenant).

---

## 5. Wilayah Belum Terhubung (Fallback)

Tenant dengan `is_active = false`:

1. **Sebelum kirim**, SUAR jujur ke warga: *"Kab. A belum terhubung digital. Laporanmu tetap dicatat, tapi untuk bantuan cepat hubungi:"* + nomor damkar setempat / 113 besar-besar.
2. Laporan tetap masuk antrean tenant tersebut (visible saat mereka onboard).
3. Transfer ke wilayah non-aktif: tetap dicatat di audit; aksi real = koordinasi telepon manual, atau opsi kebijakan **"bantuan lintas wilayah"**.
4. **Bonus bisnis:** data laporan di wilayah non-aktif = amunisi sales ("47 laporan bulan lalu tidak tertangani digital").

Tidak ada laporan yang hilang — hanya beda jalur: digital jika terhubung, telepon + catat jika belum.

---

## 6. Clustering Laporan Duplikat

Satu kejadian dilapor banyak warga → cluster otomatis:

- **Kunci cluster:** tenant sama + jenis sama + jarak < 500 m + selisih < 2 jam (tunable per tenant).
- **Implementasi:** saat insert, cari induk terbuka yang cocok → isi `parent_id`; tidak ada → jadi induk baru.
- **SUAR (cegah dari sumber):** *"Laporan serupa sudah ada di lokasi ini — ikut pantau?"*
- **KOMANDO (koreksi):** tombol **"Gabungkan"** manual; kartu cluster tampil "N laporan warga".
- Status mengikuti induk; survei tetap per pelapor.

---

## 7. Anti Laporan Palsu (4 lapis)

1. **Rate limit server-side:** maks 3 laporan/jam per akun (anon: per `device_id`). Ditolak di DB.
2. **Triase wajib:** laporan baru = `is_verified = false`. Operator verifikasi 1 tap sebelum dispatch.
3. **Reputasi (fase 2):** riwayat palsu → antrean verifikasi ketat otomatis; track record bersih → fast-track.
4. **Sanitas GPS:** pin di luar bbox tenant yang diklaim → flag "perlu verifikasi".

MVP: lapis 1 + 2 + 4.

---

## 8. Anon + RLS (pola implementasi)

- Tiap install SUAR generate `device_id` (UUID, simpan lokal); tiap laporan bawa `device_id`.
- **INSERT (anon):** policy `WITH CHECK` — tenant ada di `tenants` + lolos rate limit via fungsi.
- **SELECT (anon):** tidak direct ke tabel. Via RPC `my_reports(p_device_id)` (`SECURITY DEFINER`) yang mengembalikan hanya baris milik device tersebut.
- **User terdaftar:** RLS normal via `auth.uid()` → `profiles`.

---

## 9. Penyimpanan Foto — Cloudinary (keputusan 4 Okt 2026)

**Keputusan:** foto disimpan di Cloudinary, bukan Supabase. Supabase hanya simpan URL string di `photo_urls text[]` — DB bersih, hanya data laporan.

**Alasan:** free tier puluhan GB (usage ~belasan MB/bulan, sangat aman); thumbnail via transform URL tanpa code tambahan; media terpisah dari DB.

**Alur (offline-first):**
1. Foto diambil → kompres client-side → antre di IndexedDB
2. Online → upload ke Cloudinary (unsigned preset; folder `damkarhub/{tenant_id}/{report_id}/`; batas: image only, maks 5 MB)
3. URL masuk `photo_urls`; report di-push ke Supabase

**Thumbnail gratis (tanpa code canvas):**
```
.../w_300/foto.jpg   → list/riwayat
.../w_1200/foto.jpg  → detail laporan
```

**Dampak SATRIA:** rewrite alur foto (hapus base64 dari JSONB), sync 2 tahap (upload foto → push report), view baca URL, export PDF fetch URL. Estimasi 1–2 hari. SUAR (baru) langsung pakai pola ini dari awal.

**Data lama: CLEAN BREAK.** SATRIA belum resmi digunakan → data + foto lama boleh hilang. Tidak ada dual support, tidak ada migrasi foto lama. Skema baru tanpa backward compatibility.

---

## 10. Backlog / Belum Didesain Detail

- Retensi & PII: berapa lama data warga disimpan; maskir PII di export CSV/PDF.
- Pemeliharaan bbox: proses update batas wilayah berkala.
- Verifikasi berkala direktori nomor telepon darurat.
- Definisi operasional peran "nasional" (siapa operatornya).
- Acceptance step transfer fase 2 (terima/tolak).

---

## 11. Estimasi

| Pekerjaan | Estimasi |
|---|---|
| Tabel `tenants` + `profiles` + `transfer_log` + RLS | 1 hari |
| Setup Cloudinary (preset + folder + panduan) | 0,5 hari |
| SATRIA: rewrite foto → Cloudinary | 1–2 hari |
| Clustering (DB + SUAR prompt + Komando gabung) | 1–2 hari |
| Anti-prank MVP (rate limit + triase + sanitas) | 1 hari |
| Anon RLS (policy + RPC + device_id) | 0,5–1 hari |
| Transfer UI Komando + audit | 0,5 hari |
| **Total** | **~5–7 hari** |

Paralel dengan seed data real Banjar (independen).

---

## 12. Strategi Anti Lock-in / Portabilitas (keputusan 4 Okt 2026)

**Prinsip:** escape hatch murah > abstraksi mahal.

**Database — Postgres murni.** `pg_dump` kapan pun → restore ke Postgres mana pun (self-host, VPS, RDS, Neon). Asuransi nyata = **backup terjadwal** (cron mingguan) disimpan di luar Supabase, bukan abstraksi code.

**Auth — catatan skala.** Saat ini 8 user internal (undang ulang = 10 menit, non-issue). Jika tumbuh ke 1000+:
- Password hash Supabase = **bcrypt → exportable** (`auth.users`) dan dapat diimpor ke sebagian besar sistem auth. Bukan dead-end.
- Tabel `profiles` di schema `public` = direktori user yang portable; **email sebagai join key stabil** antar sistem.
- Hindari fitur auth eksotis GoTrue; pakai email/password + OAuth standar saja.
- Hati-hati MFA: secret TOTP sulit dimigrasi → user mungkin perlu re-enroll saat pindah provider. Dokumentasikan sejak awal.
- Runbook migrasi auth: export users → import hash → re-link `profiles` via email → user re-login (sesi lama hangus, acceptable).

**Foto (Cloudinary).** `photo_urls` = URL penuh → migrasi = download massal via Admin API → upload ke provider baru → update kolom via script sekali jalan. Folder `damkarhub/{tenant_id}/{report_id}/` membuat bulk download terstruktur. Thumbnail via **satu helper** `photoUrl(url, size)` — ganti provider = ubah 1 fungsi, bukan 50 file.

**Disiplin code.** Satu lapisan data-access per app (SATRIA: modul `Sync`; SUAR/KOMANDO wajib ikut). Tidak perlu abstraksi multi-backend generik — over-engineering.
