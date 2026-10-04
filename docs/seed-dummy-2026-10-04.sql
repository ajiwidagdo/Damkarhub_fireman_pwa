-- =====================================================
-- DAMKARHUB FIREMAN — SEED DUMMY DATA (dari CSV)
-- Dibuat: 2026-10-04 via scripts/csv-to-sql.mjs
-- 1 Kebakaran, 1 Penyelamatan, 1 Sosialisasi
-- Tenant: 06622c4b-2610-427e-9ee4-cce5a80ad1f1
-- Owner : petugas@damkarhub.id
--
-- CARA PAKAI: Supabase Dashboard → SQL Editor → Paste → Run
-- CATATAN : idempoten (ON CONFLICT DO UPDATE) — aman dijalankan ulang
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
INSERT INTO reports (id, module, data, deleted, owner, tenant_id, status, incident_at, report_received_at)
VALUES
  ('807a532e-0a6a-410c-92f0-4c8af6464aa6', 'k', '{"id":"807a532e-0a6a-410c-92f0-4c8af6464aa6","data_schema_version":"1.0","tanggal":"2026-10-05","pukul":"09:00","tglTerima":"2026-10-05","jamTerima":"09:00","jamTiba":"09:08","jamMulai":"09:10","tglSelesai":"2026-10-05","jamSelesai":"10:20","jenis":"Kebakaran Rumah","lokasiDetail":"Jl. Merdeka No. 12","dusun":"","rtrw":"","kel":"Banjar","kec":"Banjar","kabkota":"Kota Banjar","koordinat":"-7.3542, 108.3351","korbanList":[],"pNama":"H. Sulaeman","pHP":"081234567890","penyebab":"Korsleting listrik","objekTerbakar":"Atap Rumah / Plafon","luasArea":"","nilaiAset":"500000000","kerugian":"200000000","asetSelamat":"300000000","lRingan":"0","lBerat":"0","mnggal":"0","armada":"Unit Pancar 1","durasi":"70","jarak":"3.5","air":"2","kronologi":"Warga melaporkan api berasal dari lantai 2 rumah. Petugas tiba 8 menit setelah laporan diterima.","tindakan":"Pemadaman total dan pendinginan area.","kendala":["Akses jalan sempit","Cuaca panas"],"unsur":"","regu":"Regu 1","personil":"Andi Pratama\nBudi Santoso\nCitra Dewi","foto1":"","foto2":"","keterangan":"Data dummy"}'::jsonb, false,
   (SELECT oid FROM owner), '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-10-05 09:00:00+07', '2026-10-05 09:00:00+07'),
  ('ec64fd85-0e36-41da-b970-12b694e3e332', 'nk', '{"id":"ec64fd85-0e36-41da-b970-12b694e3e332","data_schema_version":"1.0","tanggal":"2026-10-06","pukul":"10:00","tglTerima":"2026-10-06","jamTerima":"10:00","tglMulai":"2026-10-06","jamMulai":"10:15","tglSelesai":"2026-10-06","jamSelesai":"10:45","jenis":"Evakuasi Ular","lokasiDetail":"Rumah warga","dusun":"","rtrw":"","kel":"Banjar","kec":"Banjar","kabkota":"Kota Banjar","koordinat":"-7.3545, 108.3348","idNama":"Siti Aminah","idUsia":"45","idJK":"Wanita","pHP":"081234567893","idDusun":"","idRtrw":"","idKel":"","idKec":"","idKabkota":"","objek":"Ular Kobra","lokasiOp":"Kamar mandi rumah warga","ukuran":"±2 meter","durasi":"30","armada":"Unit Rescue","jarak":"3.2","air":"0","kronologi":"Pelapor menemukan ular kobra sepanjang kurang lebih 2 meter di kamar mandi.","tindakan":"Evakuasi ular menggunakan alat penjepit. Ular diamankan ke tempat aman.","kendala":[],"lRingan":"0","lBerat":"0","mnggal":"0","unsur":"Regu 1","regu":"Andi Pratama | Budi Santoso | Citra Dewi","personil":"Data dummy","foto1":"","foto2":"","keterangan":""}'::jsonb, false,
   (SELECT oid FROM owner), '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-10-06 10:00:00+07', '2026-10-06 10:00:00+07'),
  ('407b4e77-53a2-41f1-bcd0-850e02d83769', 'sos', '{"id":"407b4e77-53a2-41f1-bcd0-850e02d83769","data_schema_version":"1.0","tanggal":"2026-10-07","pukul":"08:00","tglSelesai":"2026-10-07","jamSelesai":"10:00","tempat":"SMPN 2 Banjar","rangkaian":"Penyampaian materi bahaya kebakaran\nPraktek simulasi APAR","kategori":"EDU - Sektor Pendidikan (Sekolah / Kampus)","pesertaList":[{"nama":"Siswa","jumlah":"150","dusun":"","rtrw":"","kel":"","kec":"","kabkota":""}],"armada":"Unit Pancar 1","air":"0","durasi":"120","catatanEvaluasi":"Peserta antusias, simulasi APAR berjalan lancar.","regu":"Regu 1","personil":"Andi Pratama\nBudi Santoso\nCitra Dewi","foto1":"","foto2":""}'::jsonb, false,
   (SELECT oid FROM owner), '06622c4b-2610-427e-9ee4-cce5a80ad1f1', 'DONE',
   '2026-10-07 08:00:00+07', '2026-10-07 08:00:00+07')
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  deleted = EXCLUDED.deleted,
  owner = EXCLUDED.owner,
  tenant_id = EXCLUDED.tenant_id,
  status = EXCLUDED.status,
  incident_at = EXCLUDED.incident_at,
  report_received_at = EXCLUDED.report_received_at;

COMMIT;

-- Verify (expected: k=1 / nk=1 / sos=1)
-- SELECT module, COUNT(*) FROM reports
-- WHERE tenant_id = '06622c4b-2610-427e-9ee4-cce5a80ad1f1' AND deleted = false
-- GROUP BY module ORDER BY module;
