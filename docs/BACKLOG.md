# BACKLOG — Damkarhub SATRIA

## [🔴 HIGH] Rotate JWT Secret (anon + service_role)
- Trigger: Sebelum Play Store publish
- Alasan: Service_role exposed ke Muse AI (temporary) untuk debug. Perlu rotate sebelum production.
- Scope: Create Standby Key → Promote → Update config.js → Push → Test → Revoke legacy
- Estimasi: 30-60 menit

## Post-presentasi: integrasi kolom Komando ke app
- Kolom `reports.tenant_id`, `status`, `incident_at`, `report_received_at` sudah ada di live DB
  (sync `supabase/setup.sql`, 3 Okt 2026).
- Sejak syncfix2 (4 Okt 2026) app SATRIA MENGIRIM saat push: `owner` (uid sesi),
  `tenant_id`, `status='DONE'`, `incident_at` (tanggal+pukul WIB),
  `report_received_at` (tglTerima+jamTerima, fallback tglMulai/SOS tanggal — WIB).
- App SATRIA tetap baca/tulis kolom `data` jsonb (jangan ubah).
- Saat integrasi Komando dimulai, tentukan:
  - RLS policy untuk tenant (saat ini policy berbasis `owner`).

## [BACKLOG] Komando Data Integration
- Trigger: Q1 2027
- Scope:
  - Add columns (nullable): dispatch_id, assigned_regu_id, dispatched_at,
    dispatch_status, handled_by
  - Enable Supabase Realtime
- Effort: 1-2 jam
