# PANDUAN DUMMY DATA — CSV → SQL

Cara membuat data dummy banyak sekaligus untuk testing/demo, tanpa input manual satu per satu di aplikasi.

## Alur singkat

```
Isi CSV → node scripts/csv-to-sql.mjs → docs/seed-dummy-YYYY-MM-DD.sql → paste ke Supabase SQL Editor → Run
```

## 1. Ambil template CSV

**Dari HP (GitHub mobile):**
1. Buka repo `ajiwidagdo/Damkarhub_fireman_pwa` → folder `docs`
2. Buka file `template-dummy-K.csv` (atau `-NK`, `-SOS`)
3. Tap **⋯** → **Download** (atau copy isi via "Raw")

**Dari laptop:** clone/pull repo seperti biasa.

## 2. Isi data

**Rekomendasi: Google Sheets** (locale-safe, tidak ada masalah koma vs titik-koma)

1. Upload CSV ke Google Drive → buka dengan Google Sheets
2. Isi baris baru di bawah contoh (atau hapus contoh bila tidak dipakai)
3. Download kembali sebagai **CSV** (File → Download → CSV)

**Alternatif: Excel Desktop (Indonesia)**
- Jangan double-click CSV (locale Indonesia pakai `;` sebagai delimiter → kolom berantakan)
- Cara benar: **Data → From Text/CSV** → pilih file → delimiter pilih **Comma (,)** → Load
- Saat save: File → Save As → **CSV UTF-8**

### Aturan format

| Aturan | Contoh |
|---|---|
| Tanggal | `2026-10-05` (YYYY-MM-DD) |
| Jam | `09:00` (HH:MM) |
| Multi-nilai (`kendala`, `personil`, `rangkaian`) | `Akses sempit \| Cuaca panas` (pisah dengan ` \| `) |
| Uang/angka | tanpa titik/koma: `500000000` |
| Kosong | biarkan blank |
| Teks berkoma | otomatis aman bila dibuka via Sheets; di CSV mentah bungkus `"tanda kutip"` |

Field wajib (baris tanpa ini di-skip dengan warning):
- K: `tanggal`, `jenis`
- NK: `tanggal`, `jenis`
- SOS: `tanggal`, `tempat`

## 3. Convert ke SQL

Butuh **Node.js** (v18+). Di terminal, dari root repo:

```bash
node scripts/csv-to-sql.mjs
```

Output:
```
OK: 3 row (1 k / 1 nk / 1 sos) → docs/seed-dummy-2026-10-04.sql
```

File SQL berisi `BEGIN;` → guard akun → `INSERT ... ON CONFLICT (id) DO UPDATE` → `COMMIT;` + verify query. **Idempoten** — aman dijalankan ulang.

Yang dihasilkan per row:
- UUID v4 baru sebagai `id`
- `owner` = UUID `petugas@damkarhub.id` (lookup otomatis via SQL)
- `tenant_id` demo, `status = 'DONE'`, `deleted = false`
- `incident_at` = tanggal+pukul (WIB), `report_received_at` = tglTerima+jamTerima (SOS: tanggal+pukul)
- `data` jsonb mengikuti format `collectForm()` aplikasi (angka = string, `kendala` = array, `personil` newline-separated)

## 4. Jalankan di Supabase

1. Supabase Dashboard → **SQL Editor** → New query
2. Paste isi `docs/seed-dummy-YYYY-MM-DD.sql` → **Run**
3. Un-comment verify query di bawah untuk cek jumlah per modul

## Contoh output SQL (1 row, disingkat)

```sql
INSERT INTO reports (id, module, data, deleted, owner, tenant_id, status, incident_at, report_received_at)
VALUES
  ('a1b2c3d4-...', 'k', '{"id":"a1b2c3d4-...","data_schema_version":"1.0","tanggal":"2026-10-05",...,"kendala":["Akses sempit","Cuaca panas"],...}'::jsonb,
   false, (SELECT oid FROM owner), '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-10-05 09:00:00+07', '2026-10-05 09:00:00+07')
ON CONFLICT (id) DO UPDATE SET ...;
```

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Kolom berantakan di Excel | Buka via Data → From Text/CSV, delimiter = Comma |
| Karakter aneh (Ã© dsb) | Encoding harus **UTF-8**; di Excel pilih "65001: UTF-8" saat import |
| `SKIP baris X: field wajib kosong` | Isi kolom wajib sesuai tabel di atas |
| `User petugas@damkarhub.id tidak ditemukan` | Buat akun dulu di Supabase → Authentication → Users |
| Row contoh ikut ter-convert | Normal — hapus baris contoh di CSV bila tidak diinginkan |
| Google Sheets mengubah `0812...` jadi angka | Format kolom HP sebagai **Plain text** sebelum isi |
