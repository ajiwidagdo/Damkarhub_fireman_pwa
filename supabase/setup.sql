-- =====================================================================
-- DAMKARHUB — Setup Supabase (jalankan SEKALI di SQL Editor)
-- =====================================================================

-- 1) Daftar admin (yang boleh melihat & mengubah SEMUA laporan)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 2) Tabel laporan (satu tabel untuk kebakaran/non-kebakaran/sosialisasi)
create table if not exists public.reports (
  id          text primary key,                       -- ID dari aplikasi (unik antar perangkat)
  module      text not null check (module in ('k','nk','sos')),
  data        jsonb not null default '{}'::jsonb,     -- isi laporan lengkap
  deleted     boolean not null default false,         -- hapus lunak, agar penghapusan ikut tersebar
  owner       uuid not null default auth.uid() references auth.users(id),
  owner_email text default (auth.jwt() ->> 'email'),  -- memudahkan admin melihat siapa pembuat laporan
  updated_at  timestamptz not null default now()
);
create index if not exists reports_updated_at_idx on public.reports (updated_at);
create index if not exists reports_owner_idx      on public.reports (owner);

-- 3) Waktu update selalu dari server (bukan jam HP) supaya sinkron akurat
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists reports_touch on public.reports;
create trigger reports_touch
  before insert or update on public.reports
  for each row execute function public.touch_updated_at();

-- 4) Fungsi cek admin
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 5) Keamanan (Row Level Security)
alter table public.reports enable row level security;
alter table public.admins  enable row level security;   -- tanpa policy: hanya bisa diatur lewat SQL Editor

revoke all on public.reports from anon;
revoke all on public.admins  from anon, authenticated;
grant select, insert, update on public.reports to authenticated;   -- tidak ada DELETE: hapus = deleted=true

drop policy if exists "baca milik sendiri atau admin" on public.reports;
create policy "baca milik sendiri atau admin" on public.reports
  for select to authenticated
  using (owner = auth.uid() or public.is_admin());

drop policy if exists "tambah atas nama sendiri" on public.reports;
create policy "tambah atas nama sendiri" on public.reports
  for insert to authenticated
  with check (owner = auth.uid());

drop policy if exists "ubah milik sendiri atau admin" on public.reports;
create policy "ubah milik sendiri atau admin" on public.reports
  for update to authenticated
  using (owner = auth.uid() or public.is_admin())
  with check (owner = auth.uid() or public.is_admin());

-- 6) Jadikan akun tertentu sebagai admin (ganti email, jalankan SETELAH akun dibuat di Authentication → Users)
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'admin@contoh.go.id';
