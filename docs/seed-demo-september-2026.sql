-- =====================================================
-- DAMKARHUB SATRIA — SEED DATA DEMO
-- 8 laporan bulan September 2026 (3 Kebakaran, 3 Penyelamatan, 2 Sosialisasi)
-- Tenant: 06622c4b-2610-427e-9ee4-cce5a80ad1f1 (UPTD Banjar)
-- Owner : petugas@damkarhub.id
--
-- CARA PAKAI: Supabase Dashboard → SQL Editor → Paste → Run
-- CATATAN : kolom status/incident_at/report_received_at/tenant_id
--           untuk integrasi Komando (app SATRIA tetap pakai kolom `data`)
--           Script idempoten: aman dijalankan ulang (ON CONFLICT DO UPDATE)
-- =====================================================

BEGIN;

-- Guard: pastikan akun petugas sudah ada di Authentication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'petugas@damkarhub.id') THEN
    RAISE EXCEPTION 'User petugas@damkarhub.id tidak ditemukan di auth.users. Buat akun dulu di Authentication → Users.';
  END IF;
END $$;

WITH owner AS (
  SELECT id AS oid FROM auth.users WHERE email = 'petugas@damkarhub.id' LIMIT 1
)
INSERT INTO reports (id, module, data, deleted, owner, owner_email, tenant_id, status, incident_at, report_received_at)
VALUES
  ('d4e5f6a7-8b9c-4d1e-af01-000000000001', 'k', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000001", "data_schema_version": "1.0", "tanggal": "2026-09-05", "pukul": "08:15", "tglTerima": "2026-09-05", "jamTerima": "08:15", "jamTiba": "08:23", "jamMulai": "08:25", "tglSelesai": "2026-09-05", "jamSelesai": "09:35", "jenis": "Kebakaran Rumah", "lokasiDetail": "Jl. Merdeka No. 12", "dusun": "", "rtrw": "", "kel": "Banjar", "kec": "Banjar", "kabkota": "Kota Banjar", "koordinat": "-7.3542, 108.3351", "korbanList": [], "pNama": "H. Sulaeman", "pHP": "081234567890", "penyebab": "Korsleting listrik", "objekTerbakar": "Atap Rumah / Plafon", "luasArea": "", "nilaiAset": "500000000", "kerugian": "200000000", "asetSelamat": "300000000", "lRingan": "0", "lBerat": "0", "mnggal": "0", "armada": "Unit Pancar 1", "durasi": "70", "jarak": "3.5", "air": "2", "kronologi": "Warga melaporkan api berasal dari lantai 2 rumah. Petugas tiba 8 menit setelah laporan diterima.", "tindakan": "Pemadaman total dan pendinginan area.", "kendala": ["Akses jalan sempit"], "unsur": "", "regu": "Regu 1", "personil": "Andi Pratama\nBudi Santoso\nCitra Dewi", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-05 08:15:00+07', '2026-09-05 08:15:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000002', 'k', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000002", "data_schema_version": "1.0", "tanggal": "2026-09-12", "pukul": "14:30", "tglTerima": "2026-09-12", "jamTerima": "14:30", "jamTiba": "14:42", "jamMulai": "14:45", "tglSelesai": "2026-09-12", "jamSelesai": "16:30", "jenis": "Kebakaran Ruko / Tempat Usaha", "lokasiDetail": "Jl. Ahmad Yani No. 45", "dusun": "", "rtrw": "", "kel": "Banjar", "kec": "Banjar", "kabkota": "Kota Banjar", "koordinat": "-7.3535, 108.3360", "korbanList": [], "pNama": "Hj. Ratna", "pHP": "081234567891", "penyebab": "Korsleting listrik", "objekTerbakar": "Ruangan Dapur", "luasArea": "", "nilaiAset": "800000000", "kerugian": "500000000", "asetSelamat": "300000000", "lRingan": "0", "lBerat": "0", "mnggal": "0", "armada": "Unit Pancar 1", "durasi": "105", "jarak": "5.2", "air": "3", "kronologi": "Api membesar dari area dapur ruko dan merambat ke lantai 2. Dua unit dikerahkan.", "tindakan": "Pemadaman total, evakuasi barang dagangan, pendinginan.", "kendala": ["Akses jalan sempit", "Angin kencang"], "unsur": "", "regu": "Regu 2", "personil": "Deni Kurniawan\nEko Wahyudi\nFajar Hidayat", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-12 14:30:00+07', '2026-09-12 14:30:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000003', 'k', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000003", "data_schema_version": "1.0", "tanggal": "2026-09-20", "pukul": "16:45", "tglTerima": "2026-09-20", "jamTerima": "16:45", "jamTiba": "17:05", "jamMulai": "17:10", "tglSelesai": "2026-09-20", "jamSelesai": "18:40", "jenis": "Kebakaran Lahan", "lokasiDetail": "Desa Neglasari", "dusun": "", "rtrw": "", "kel": "Neglasari", "kec": "Banjar", "kabkota": "Kota Banjar", "koordinat": "-7.3601, 108.3290", "korbanList": [], "pNama": "Kepala Desa Neglasari", "pHP": "081234567892", "penyebab": "Pembakaran sampah", "objekTerbakar": "Lahan Kosong", "luasArea": "2000 m²", "nilaiAset": "0", "kerugian": "0", "asetSelamat": "0", "lRingan": "0", "lBerat": "0", "mnggal": "0", "armada": "Unit Pancar 1", "durasi": "90", "jarak": "7.8", "air": "4", "kronologi": "Kebakaran lahan kosong seluas kurang lebih 2.000 m². Api berhasil dilokalisir agar tidak merambat ke permukiman.", "tindakan": "Pemadaman dan pembuatan sekat bakar.", "kendala": ["Angin kencang", "Sumber air jauh"], "unsur": "", "regu": "Regu 3", "personil": "Galih Saputra\nHana Puspita\nIrfan Maulana", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-20 16:45:00+07', '2026-09-20 16:45:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000004', 'nk', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000004", "data_schema_version": "1.0", "tanggal": "2026-09-08", "pukul": "10:00", "tglTerima": "2026-09-08", "jamTerima": "10:00", "tglMulai": "2026-09-08", "jamMulai": "10:15", "tglSelesai": "2026-09-08", "jamSelesai": "10:45", "jenis": "Evakuasi Ular", "lokasiDetail": "Rumah warga", "dusun": "", "rtrw": "", "kel": "Banjar", "kec": "Banjar", "kabkota": "Kota Banjar", "koordinat": "-7.3545, 108.3348", "idNama": "Siti Aminah", "idUsia": "45", "idJK": "Wanita", "pHP": "081234567893", "idDusun": "", "idRtrw": "", "idKel": "Banjar", "idKec": "Banjar", "idKabkota": "Kota Banjar", "objek": "Ular Kobra", "lokasiOp": "Kamar mandi rumah warga", "ukuran": "±2 meter", "durasi": "30", "armada": "Unit Rescue", "jarak": "3.2", "air": "0", "kronologi": "Pelapor menemukan ular kobra sepanjang kurang lebih 2 meter di kamar mandi.", "tindakan": "Evakuasi ular menggunakan alat penjepit, ular diamankan ke tempat aman.", "kendala": [], "lRingan": "0", "lBerat": "0", "mnggal": "0", "regu": "Regu 1", "personil": "Andi Pratama\nBudi Santoso\nCitra Dewi", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-08 10:00:00+07', '2026-09-08 10:00:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000005', 'nk', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000005", "data_schema_version": "1.0", "tanggal": "2026-09-15", "pukul": "07:30", "tglTerima": "2026-09-15", "jamTerima": "07:30", "tglMulai": "2026-09-15", "jamMulai": "07:40", "tglSelesai": "2026-09-15", "jamSelesai": "08:30", "jenis": "Evakuasi Manusia", "lokasiDetail": "Jl. Nasional III", "dusun": "", "rtrw": "", "kel": "Langensari", "kec": "Langensari", "kabkota": "Kota Banjar", "koordinat": "-7.3490, 108.3420", "idNama": "Petugas Lantas", "idUsia": "-", "idJK": "-", "pHP": "081234567894", "idDusun": "", "idRtrw": "", "idKel": "Langensari", "idKec": "Langensari", "idKabkota": "Kota Banjar", "objek": "Kecelakaan lalu lintas", "lokasiOp": "Jl. Nasional III Km 4", "ukuran": "2 unit sepeda motor", "durasi": "50", "armada": "Unit Rescue", "jarak": "6.0", "air": "0", "kronologi": "Kecelakaan antara dua sepeda motor. Tiga korban dievakuasi ke RSUD.", "tindakan": "Evakuasi korban, pengamanan lokasi, koordinasi dengan lantas dan medis.", "kendala": ["Kemacetan di lokasi"], "lRingan": "2", "lBerat": "1", "mnggal": "0", "regu": "Regu 2", "personil": "Deni Kurniawan\nEko Wahyudi\nFajar Hidayat", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-15 07:30:00+07', '2026-09-15 07:30:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000006', 'nk', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000006", "data_schema_version": "1.0", "tanggal": "2026-09-25", "pukul": "15:20", "tglTerima": "2026-09-25", "jamTerima": "15:20", "tglMulai": "2026-09-25", "jamMulai": "15:35", "tglSelesai": "2026-09-25", "jamSelesai": "16:10", "jenis": "Evakuasi Sarang Tawon", "lokasiDetail": "Atap rumah warga", "dusun": "", "rtrw": "", "kel": "Mekarsari", "kec": "Banjar", "kabkota": "Kota Banjar", "koordinat": "-7.3570, 108.3310", "idNama": "Bpk. Dedi", "idUsia": "50", "idJK": "Pria", "pHP": "081234567895", "idDusun": "", "idRtrw": "", "idKel": "Mekarsari", "idKec": "Banjar", "idKabkota": "Kota Banjar", "objek": "Sarang tawon", "lokasiOp": "Atap rumah warga", "ukuran": "Diameter ±40 cm", "durasi": "35", "armada": "Unit Rescue", "jarak": "4.1", "air": "0", "kronologi": "Sarang tawon di atap rumah meresahkan warga sekitar.", "tindakan": "Evakuasi sarang tawon malam hari dengan APD lengkap, sarang dimusnahkan.", "kendala": [], "lRingan": "0", "lBerat": "0", "mnggal": "0", "regu": "Regu 3", "personil": "Galih Saputra\nHana Puspita\nIrfan Maulana", "foto1": "", "foto2": "", "keterangan": "Data demo presentasi."}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-25 15:20:00+07', '2026-09-25 15:20:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000007', 'sos', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000007", "data_schema_version": "1.0", "tanggal": "2026-09-10", "pukul": "08:00", "tglSelesai": "2026-09-10", "jamSelesai": "10:00", "tempat": "SMPN 2 Banjar", "rangkaian": "Penyampaian materi bahaya kebakaran\nPraktek simulasi APAR", "kategori": "EDU - Sektor Pendidikan (Sekolah / Kampus)", "pesertaList": [{"nama": "Siswa", "jumlah": "150", "dusun": "", "rtrw": "", "kel": "Banjar", "kec": "Banjar", "kabkota": "Kota Banjar"}], "armada": "Unit Pancar 1", "air": "0", "durasi": "120", "catatanEvaluasi": "Peserta antusias, simulasi APAR berjalan lancar.", "regu": "Regu 1", "personil": "Andi Pratama\nBudi Santoso\nCitra Dewi", "foto1": "", "foto2": ""}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-10 08:00:00+07', '2026-09-10 08:00:00+07'),
  ('d4e5f6a7-8b9c-4d1e-af01-000000000008', 'sos', '{"id": "d4e5f6a7-8b9c-4d1e-af01-000000000008", "data_schema_version": "1.0", "tanggal": "2026-09-22", "pukul": "09:00", "tglSelesai": "2026-09-22", "jamSelesai": "11:00", "tempat": "Dinas Pendidikan Kota Banjar", "rangkaian": "Penyampaian materi pencegahan kebakaran kantor\nPraktek simulasi APAR", "kategori": "PEM - Pemerintahan (Dinas Instansi, Perangkat Desa)", "pesertaList": [{"nama": "Pegawai", "jumlah": "50", "dusun": "", "rtrw": "", "kel": "Banjar", "kec": "Banjar", "kabkota": "Kota Banjar"}], "armada": "Unit Pancar 1", "air": "0", "durasi": "120", "catatanEvaluasi": "Kegiatan berjalan tertib sesuai jadwal.", "regu": "Regu 2", "personil": "Deni Kurniawan\nEko Wahyudi\nFajar Hidayat", "foto1": "", "foto2": ""}'::jsonb, false,
   (SELECT oid FROM owner), 'petugas@damkarhub.id', '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-09-22 09:00:00+07', '2026-09-22 09:00:00+07')
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  deleted = EXCLUDED.deleted,
  owner = EXCLUDED.owner,
  owner_email = EXCLUDED.owner_email,
  tenant_id = EXCLUDED.tenant_id,
  status = EXCLUDED.status,
  incident_at = EXCLUDED.incident_at,
  report_received_at = EXCLUDED.report_received_at;

COMMIT;

-- Verify (expected: 8 baris, 3 k / 3 nk / 2 sos):
-- SELECT module, COUNT(*) FROM reports WHERE tenant_id = '06622c4b-2610-427e-9ee4-cce5a80ad1f1' AND deleted = false GROUP BY module ORDER BY module;
