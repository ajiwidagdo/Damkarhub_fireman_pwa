# BACKLOG — Damkarhub Fireman

## Post-presentasi: integrasi kolom Komando ke app
- Kolom `reports.tenant_id`, `status`, `incident_at`, `report_received_at` sudah ada di live DB
  (sync `supabase/setup.sql`, 3 Okt 2026) — saat ini TIDAK dipakai aplikasi Fireman.
- App Fireman tetap baca/tulis kolom `data` jsonb (jangan ubah).
- Saat integrasi Komando dimulai, tentukan:
  - format `status` yang dipakai Komando (seed demo memakai `'DONE'`),
  - apakah app perlu mengirim/membaca kolom-kolom tersebut saat sync,
  - RLS policy untuk tenant (saat ini policy berbasis `owner`).

## [BACKLOG] Komando Data Integration
- Trigger: Q1 2027
- Scope:
  - Add columns (nullable): dispatch_id, assigned_regu_id, dispatched_at,
    dispatch_status, handled_by
  - Enable Supabase Realtime
- Effort: 1-2 jam
