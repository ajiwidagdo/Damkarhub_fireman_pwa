-- =====================================================================
-- DAMKARHUB — Migrasi Multi-Tenant & Keamanan (4 Okt 2026)
-- File: supabase/migrations/20261004-multi-tenant.sql
--
-- CARA PAKAI: jalankan SEKALI di Supabase Dashboard > SQL Editor.
-- IDEMPOTEN: aman dijalankan ulang (kecuali bagian TRUNCATE di akhir).
--
-- ⚠️  WAJIB: backup database dulu via Dashboard > Database > Backups
--     sebelum menjalankan file ini.
--
-- ISI:
--   0. Backup darurat (tabel duplikat, karena free tier tanpa backup manual)
--   1. Tabel tenants (+ seed Kota Banjar)
--   2. Tabel profiles (user → tenant + peran)
--   3. Tabel transfer_log (audit pemindahan laporan)
--   4. Kolom baru di reports (clustering, anon, verifikasi, foto)
--   5. Fungsi helper (my_tenant_id, my_peran, my_provinsi, rate limit)
--   6. RLS baru reports (hierarki: kota → provinsi → nasional)
--   7. RPC: my_reports (anon), transfer_report (pindah wilayah)
--   8. Index
--   9. CLEAN BREAK: hapus data demo lama
--  10. Template profiles untuk 8 user Banjar (isi manual)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) BACKUP DARURAT — duplikat tabel sebelum migrasi.
--     Free tier tidak punya backup manual dashboard; tabel ini jadi
--     jaring pengaman. HAPUS setelah go-live stabil:
--       drop table public.reports_backup_20251005;
--       drop table public.admins_backup_20251005;
-- ---------------------------------------------------------------------
create table if not exists public.reports_backup_20251005 as select * from public.reports;
create table if not exists public.admins_backup_20251005 as select * from public.admins;
create table if not exists public.tenants_backup_20251005 as select * from public.tenants;
-- (tabel eksperimen ber-FK ke tenants ikut aman: hanya constraint-nya yang ikut ter-drop di bawah)
create table if not exists public.account_tenants_backup_20251005 as select * from public.account_tenants;
create table if not exists public.regu_backup_20251005 as select * from public.regu;
create table if not exists public.personil_backup_20251005 as select * from public.personil;

-- ---------------------------------------------------------------------
-- 0b) Tabel tenants LAMA (skema demo: tenant_id/parent_tenant_id/level)
--     tidak kompatibel dengan skema final. Sudah di-backup di atas.
--     CASCADE: ikut melepas FK dari tabel eksperimen (account_tenants,
--     regu, personil, admins, reports) — datanya TIDAK ikut terhapus.
--     DROP agar CREATE di bawah berjalan bersih.
-- ---------------------------------------------------------------------
drop table if exists public.tenants cascade;

-- ---------------------------------------------------------------------
-- 1) Tabel tenants — direktori wilayah (public, dibaca anon juga)
-- ---------------------------------------------------------------------
create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  nama            text not null,
  tipe            text not null check (tipe in ('kota','kabupaten')),
  provinsi        text not null,
  bbox_min_lat    double precision,
  bbox_max_lat    double precision,
  bbox_min_lng    double precision,
  bbox_max_lng    double precision,
  is_active       boolean not null default false,
  emergency_phone text,
  code            text unique, -- kode join (mis. 'DAMKARHUB.BANJAR113'), dipakai SyncConfig.DEFAULT_TENANT_CODE
  created_at      timestamptz not null default now()
);

alter table public.tenants enable row level security;
grant select on public.tenants to anon, authenticated;
drop policy if exists "direktori wilayah publik" on public.tenants;
create policy "direktori wilayah publik" on public.tenants
  for select to anon, authenticated using (true);
-- (tanpa policy insert/update/delete: hanya via SQL Editor)

-- Seed: Kota Banjar, Jawa Barat — tenant produksi pertama.
-- UUID tetap agar konsisten antar environment & converter CSV.
-- bbox = perkiraan kasar, SEMPURNAKAN nanti via survei/GIS.
insert into public.tenants
  (id, nama, tipe, provinsi,
   bbox_min_lat, bbox_max_lat, bbox_min_lng, bbox_max_lng,
   is_active, emergency_phone, code)
values
  ('a499d44d-b620-4fcd-b402-7d8f4823310b',
   'Kota Banjar', 'kota', 'Jawa Barat',
   -7.43, -7.31, 108.47, 108.62,
   true, '113', 'DAMKARHUB.BANJAR113')
on conflict (id) do update set
  nama = excluded.nama, tipe = excluded.tipe, provinsi = excluded.provinsi,
  is_active = excluded.is_active, emergency_phone = excluded.emergency_phone,
  code = excluded.code;

-- ---------------------------------------------------------------------
-- 2a) Fungsi helper (dipindah ke depan: dipakai policy profiles)
-- ---------------------------------------------------------------------
create or replace function public.my_tenant_id()
returns uuid language sql security definer set search_path = public stable as $$
  select tenant_id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.my_peran()
returns text language sql security definer set search_path = public stable as $$
  select peran from public.profiles where user_id = auth.uid();
$$;

create or replace function public.my_provinsi()
returns text language sql security definer set search_path = public stable as $$
  select provinsi from public.profiles where user_id = auth.uid();
$$;

-- Rate limit: maks 3 laporan/jam per user (login) atau per device (anon).
create or replace function public.report_rate_ok(p_device_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if auth.uid() is not null then
    select count(*) into c from public.reports
      where owner = auth.uid() and updated_at > now() - interval '1 hour';
  else
    if p_device_id is null then return false; end if;
    select count(*) into c from public.reports
      where device_id = p_device_id and updated_at > now() - interval '1 hour';
  end if;
  return c < 3;
end $$;

-- ---------------------------------------------------------------------
-- 2) Tabel profiles — user → tenant + peran
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  provinsi  text, -- diisi untuk admin_provinsi, mis. 'Jawa Barat'
  peran     text not null check (peran in ('petugas','admin_kota','admin_provinsi','nasional')),
  regu      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;
drop policy if exists "profil milik sendiri atau admin" on public.profiles;
create policy "profil milik sendiri atau admin" on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "kelola profil oleh admin" on public.profiles;
create policy "kelola profil oleh admin" on public.profiles
  for insert to authenticated with check (public.is_admin());
drop policy if exists "ubah profil oleh admin" on public.profiles;
create policy "ubah profil oleh admin" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Bootstrap awal tetap via SQL Editor (bypass RLS).

-- ---------------------------------------------------------------------
-- 3) Tabel transfer_log — audit pemindahan laporan antar wilayah
-- ---------------------------------------------------------------------
create table if not exists public.transfer_log (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  dari_tenant uuid not null references public.tenants(id),
  ke_tenant   uuid not null references public.tenants(id),
  alasan      text not null,
  oleh        uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.transfer_log enable row level security;
grant select, insert on public.transfer_log to authenticated;
drop policy if exists "baca log transfer sewilayah" on public.transfer_log;
create policy "baca log transfer sewilayah" on public.transfer_log
  for select to authenticated
  using (public.is_admin()
     or dari_tenant = public.my_tenant_id()
     or ke_tenant = public.my_tenant_id());
drop policy if exists "tulis log transfer oleh admin" on public.transfer_log;
create policy "tulis log transfer oleh admin" on public.transfer_log
  for insert to authenticated with check (public.is_admin());
-- (transfer normal lewat RPC transfer_report di bawah)

-- ---------------------------------------------------------------------
-- 4) Kolom baru di reports
-- ---------------------------------------------------------------------
alter table public.reports add column if not exists parent_id      uuid references public.reports(id);
alter table public.reports add column if not exists device_id      text;
alter table public.reports add column if not exists tracking_token uuid not null default gen_random_uuid();
alter table public.reports add column if not exists is_verified   boolean not null default false;
alter table public.reports add column if not exists verified_by   uuid references auth.users(id);
alter table public.reports add column if not exists verified_at   timestamptz;
alter table public.reports add column if not exists photo_urls    text[] not null default '{}';

-- Laporan anon (SUAR tanpa login): owner boleh null.
alter table public.reports alter column owner drop not null;

-- ---------------------------------------------------------------------
-- 6) RLS baru untuk reports — hierarki kota → provinsi → nasional
-- ---------------------------------------------------------------------
revoke all on public.reports from anon;
grant select, insert, update on public.reports to authenticated;
grant insert on public.reports to anon;  -- SUAR anon: insert saja, via policy ketat

drop policy if exists "baca milik sendiri atau admin" on public.reports;
drop policy if exists "tambah atas nama sendiri" on public.reports;
drop policy if exists "ubah milik sendiri atau admin" on public.reports;

-- SELECT: nasional > provinsi (se-provinsi) > kota (tenant sendiri)
drop policy if exists "baca sesuai wilayah" on public.reports;
create policy "baca sesuai wilayah" on public.reports
  for select to authenticated
  using (
    public.is_admin()
    or tenant_id = public.my_tenant_id()
    or (public.my_peran() = 'admin_provinsi'
        and tenant_id in (select id from public.tenants
                          where provinsi = public.my_provinsi()))
  );

-- INSERT (login): tenant wajib = tenant sendiri (atau admin bebas)
drop policy if exists "tambah di wilayah sendiri" on public.reports;
create policy "tambah di wilayah sendiri" on public.reports
  for insert to authenticated
  with check (
    public.is_admin()
    or (owner = auth.uid() and tenant_id = public.my_tenant_id())
  );

-- INSERT (anon SUAR): tenant harus valid + device_id + lolos rate limit
drop policy if exists "tambah anon tervalidasi" on public.reports;
create policy "tambah anon tervalidasi" on public.reports
  for insert to anon
  with check (
    owner is null
    and tenant_id in (select id from public.tenants)
    and device_id is not null
    and public.report_rate_ok(device_id)
  );

-- UPDATE: yang boleh baca boleh ubah (transfer beda tenant lewat RPC)
drop policy if exists "ubah sesuai wilayah" on public.reports;
create policy "ubah sesuai wilayah" on public.reports
  for update to authenticated
  using (
    public.is_admin()
    or tenant_id = public.my_tenant_id()
    or (public.my_peran() = 'admin_provinsi'
        and tenant_id in (select id from public.tenants
                          where provinsi = public.my_provinsi()))
  )
  with check (
    public.is_admin()
    or tenant_id = public.my_tenant_id()
    or (public.my_peran() = 'admin_provinsi'
        and tenant_id in (select id from public.tenants
                          where provinsi = public.my_provinsi()))
  );

-- ---------------------------------------------------------------------
-- 7) RPC
-- ---------------------------------------------------------------------
-- 7a) Anon baca laporannya sendiri via device_id (bypass RLS, aman).
create or replace function public.my_reports(p_device_id text)
returns setof public.reports
language sql security definer set search_path = public stable as $$
  select * from public.reports
   where device_id = p_device_id and deleted = false
   order by updated_at desc;
$$;
revoke all on function public.my_reports(text) from public;
grant execute on function public.my_reports(text) to anon, authenticated;

-- 7b) Transfer laporan antar wilayah + audit otomatis.
create or replace function public.transfer_report(
  p_report_id uuid, p_ke_tenant uuid, p_alasan text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_dari uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'wajib login'; end if;
  select tenant_id into v_dari from public.reports where id = p_report_id;
  if not found then raise exception 'laporan tidak ditemukan'; end if;
  if not (public.is_admin()
      or v_dari = public.my_tenant_id()
      or (public.my_peran() = 'admin_provinsi'
          and v_dari in (select id from public.tenants
                         where provinsi = public.my_provinsi()))) then
    raise exception 'tidak berhak memindahkan laporan ini';
  end if;
  if not exists (select 1 from public.tenants where id = p_ke_tenant) then
    raise exception 'tenant tujuan tidak valid';
  end if;
  if p_alasan is null or length(trim(p_alasan)) < 3 then
    raise exception 'alasan wajib diisi';
  end if;
  update public.reports set tenant_id = p_ke_tenant where id = p_report_id;
  insert into public.transfer_log (report_id, dari_tenant, ke_tenant, alasan, oleh)
    values (p_report_id, v_dari, p_ke_tenant, trim(p_alasan), v_uid);
end $$;
revoke all on function public.transfer_report(uuid, uuid, text) from public;
grant execute on function public.transfer_report(uuid, uuid, text) to authenticated;

-- 7c) join_tenant: user masuk via kode → dapat tenant_id + auto-provision profiles.
--     Dipakai SATRIA saat login (SyncConfig.DEFAULT_TENANT_CODE).
--     Tidak menimpa profiles yang sudah ada (admin aman).
create or replace function public.join_tenant(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'wajib login'; end if;
  select id into v_id from public.tenants where code = p_code and is_active = true;
  if not found then raise exception 'kode tenant tidak valid'; end if;
  insert into public.profiles (user_id, tenant_id, peran)
    values (auth.uid(), v_id, 'petugas')
    on conflict (user_id) do nothing;
  return v_id;
end $$;
revoke all on function public.join_tenant(text) from public;
grant execute on function public.join_tenant(text) to authenticated;

-- ---------------------------------------------------------------------
-- 8) Index
-- ---------------------------------------------------------------------
create index if not exists reports_parent_idx   on public.reports (parent_id);
create index if not exists reports_device_idx   on public.reports (device_id);
create index if not exists reports_tracking_idx on public.reports (tracking_token);
create index if not exists profiles_tenant_idx  on public.profiles (tenant_id);

-- ---------------------------------------------------------------------
-- 9) CLEAN BREAK — hapus data demo lama (disetujui Ayuk 4 Okt 2026:
--    SATRIA belum resmi digunakan, data + foto lama boleh hilang)
-- ---------------------------------------------------------------------
delete from public.reports;

-- ---------------------------------------------------------------------
-- 10) VERIFIKASI — jalankan SELECT ini setelah migrasi
-- ---------------------------------------------------------------------
-- select * from public.tenants;                       -- harus ada Kota Banjar
-- select count(*) from public.reports;                -- harus 0 (clean break)
-- select * from public.profiles;                      -- isi via template di bawah

-- ---------------------------------------------------------------------
-- 11) TEMPLATE profiles — 8 user Banjar (2 admin + 6 petugas).
--     Ganti email, jalankan SETELAH user dibuat di Authentication > Users.
-- ---------------------------------------------------------------------
-- -- Admin/operator (2 akun):
-- insert into public.profiles (user_id, tenant_id, peran)
--   select id, 'a499d44d-b620-4fcd-b402-7d8f4823310b', 'admin_kota'
--   from auth.users where email in ('admin1@damkar-banjar.go.id','admin2@damkar-banjar.go.id')
-- on conflict (user_id) do update set
--   tenant_id = excluded.tenant_id, peran = excluded.peran;
--
-- -- Petugas (3 regu x 2 orang):
-- insert into public.profiles (user_id, tenant_id, peran, regu)
--   select id, 'a499d44d-b620-4fcd-b402-7d8f4823310b', 'petugas', 'Regu 1'
--   from auth.users where email in ('regu1a@...','regu1b@...');
-- -- (ulangi untuk Regu 2, Regu 3)
