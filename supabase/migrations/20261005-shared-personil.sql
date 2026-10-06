-- ============================================================================
-- MIGRASI: Personil & Regu shared per-tenant + audit laporan
-- Tanggal: 5 Okt 2026
-- Keputusan TAMPAN:
--   - Personil/regu: 1 data bersama per tenant, semua anggota bisa baca+tulis
--   - Laporan: semua bisa lihat+edit, hapus hanya admin
--   - Edit tracking: updated_by + updated_at otomatis via trigger
--   - Histori: report_history via trigger (siap tampil di KOMANDO)
-- ============================================================================

-- ---------------------------------------------------------------------
-- 1) Tabel regu (shared per tenant) — dibuat dulu karena personil ber-FK ke sini
-- ---------------------------------------------------------------------
create table if not exists public.regu (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nama        text not null,
  urutan      int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_regu_tenant on public.regu(tenant_id);

alter table public.regu enable row level security;
grant select, insert, update, delete on public.regu to authenticated;

drop policy if exists "regu se-tenant baca" on public.regu;
create policy "regu se-tenant baca" on public.regu
  for select to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "regu se-tenant tulis" on public.regu;
create policy "regu se-tenant tulis" on public.regu
  for insert to authenticated
  with check (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "regu se-tenant ubah" on public.regu;
create policy "regu se-tenant ubah" on public.regu
  for update to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id())
  with check (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "regu se-tenant hapus" on public.regu;
create policy "regu se-tenant hapus" on public.regu
  for delete to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id());

-- ---------------------------------------------------------------------
-- 2) Tabel personil (shared per tenant)
-- ---------------------------------------------------------------------
create table if not exists public.personil (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nama        text not null,
  regu_id     uuid references public.regu(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_personil_tenant on public.personil(tenant_id);

alter table public.personil enable row level security;
grant select, insert, update, delete on public.personil to authenticated;

drop policy if exists "personil se-tenant baca" on public.personil;
create policy "personil se-tenant baca" on public.personil
  for select to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "personil se-tenant tulis" on public.personil;
create policy "personil se-tenant tulis" on public.personil
  for insert to authenticated
  with check (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "personil se-tenant ubah" on public.personil;
create policy "personil se-tenant ubah" on public.personil
  for update to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id())
  with check (public.is_admin() or tenant_id = public.my_tenant_id());

drop policy if exists "personil se-tenant hapus" on public.personil;
create policy "personil se-tenant hapus" on public.personil
  for delete to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id());

-- ---------------------------------------------------------------------
-- 3) Kolom audit di reports
-- ---------------------------------------------------------------------
alter table public.reports
  add column if not exists updated_by uuid references auth.users(id);
alter table public.reports
  add column if not exists updated_at timestamptz not null default now();

-- Trigger: isi updated_by + updated_at otomatis dari JWT (tidak bisa diakali client)
create or replace function public.set_report_audit()
returns trigger as $$
begin
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_report_audit on public.reports;
create trigger trg_report_audit
  before update on public.reports
  for each row execute function public.set_report_audit();

-- ---------------------------------------------------------------------
-- 4) Tabel report_history (versi lama, siap tampil di KOMANDO)
-- ---------------------------------------------------------------------
create table if not exists public.report_history (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  data        jsonb,
  photo_urls  text[],
  status      text,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_report_history_report on public.report_history(report_id);
create index if not exists idx_report_history_tenant on public.report_history(tenant_id);

alter table public.report_history enable row level security;
grant select on public.report_history to authenticated;
-- Histori hanya dibaca (ditulis via trigger); tidak ada insert/update/delete dari client

drop policy if exists "histori se-tenant baca" on public.report_history;
create policy "histori se-tenant baca" on public.report_history
  for select to authenticated
  using (public.is_admin() or tenant_id = public.my_tenant_id());

-- Trigger: simpan snapshot OLD sebelum setiap UPDATE yang mengubah isi
create or replace function public.log_report_history()
returns trigger as $$
begin
  if OLD.data is distinct from NEW.data
     or OLD.photo_urls is distinct from NEW.photo_urls
     or OLD.status is distinct from NEW.status
     or OLD.deleted is distinct from NEW.deleted then
    insert into public.report_history
      (report_id, tenant_id, data, photo_urls, status, updated_by, updated_at)
    values
      (OLD.id, OLD.tenant_id, OLD.data, OLD.photo_urls, OLD.status,
       OLD.updated_by, OLD.updated_at);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_report_history on public.reports;
create trigger trg_report_history
  before update on public.reports
  for each row execute function public.log_report_history();

-- ---------------------------------------------------------------------
-- 5) Hapus (soft delete) hanya admin — via trigger (OLD/NEW tersedia)
--    RLS WITH CHECK tidak bisa referensi OLD, jadi pakai trigger.
-- ---------------------------------------------------------------------
create or replace function public.check_delete_admin()
returns trigger as $$
begin
  if OLD.deleted is distinct from NEW.deleted and not public.is_admin() then
    raise exception 'Hanya admin yang dapat menghapus/mengembalikan laporan';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_check_delete_admin on public.reports;
create trigger trg_check_delete_admin
  before update on public.reports
  for each row
  when (OLD.deleted is distinct from NEW.deleted)
  execute function public.check_delete_admin();
-- (Policy "ubah sesuai wilayah" tetap seperti semula — tidak diubah)

-- ---------------------------------------------------------------------
-- 6) Template: set 2 akun admin Banjar
--    Ganti 'EMAIL_ADMIN_1' dan 'EMAIL_ADMIN_2' dengan email asli,
--    lalu jalankan bagian ini di SQL Editor.
-- ---------------------------------------------------------------------
-- update public.profiles set peran = 'admin'
-- where user_id in (
--   select id from auth.users where email in ('EMAIL_ADMIN_1', 'EMAIL_ADMIN_2')
-- );

-- ---------------------------------------------------------------------
-- Verifikasi setelah run:
--   select * from public.personil limit 1;   -- tabel ada
--   select * from public.regu limit 1;       -- tabel ada
--   select * from public.report_history limit 1; -- tabel ada
--   select trigger_name from information_schema.triggers
--     where event_object_table in ('reports'); -- 3 trigger aktif
--     (trg_report_audit, trg_report_history, trg_check_delete_admin)
-- ============================================================================
