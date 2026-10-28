-- =============================================================
--  Travellers Family Annual Trip 2 — one-time database setup for Supabase
--  1) BEFORE running: replace  CHANGE-ME-family-key  (line 21)
--     with your own secret family trip key, e.g.  kedar-otrip-4821
--  2) Paste this whole file into Supabase → SQL Editor → Run
-- =============================================================

create table if not exists public.records (
  id          text primary key,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb,
  updated_at  bigint not null default 0,        -- set by the phone (last edit wins)
  deleted     boolean not null default false,
  server_at   timestamptz not null default clock_timestamp()
);
create index if not exists records_server_at_idx on public.records (server_at);

-- The family trip key. Only requests that send this key can read or write.
create or replace function public.trip_key_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-trip-key', '') = 'CHANGE-ME-family-key'
$$;

-- Used by the app to check the key you typed
create or replace function public.check_trip_key() returns boolean
language sql stable security definer set search_path = public as $$
  select public.trip_key_ok()
$$;

-- Keep the newest edit if two phones change the same item; stamp server time for syncing
create or replace function public.records_touch() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;   -- an older edit arrived late: ignore it
  end if;
  new.server_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
for each row execute function public.records_touch();

-- Row level security: nobody without the trip key can see anything
alter table public.records enable row level security;
drop policy if exists "family can read"   on public.records;
drop policy if exists "family can insert" on public.records;
drop policy if exists "family can update" on public.records;
create policy "family can read"   on public.records for select to anon, authenticated using (public.trip_key_ok());
create policy "family can insert" on public.records for insert to anon, authenticated with check (public.trip_key_ok());
create policy "family can update" on public.records for update to anon, authenticated using (public.trip_key_ok()) with check (public.trip_key_ok());

grant select, insert, update on public.records to anon, authenticated;
grant execute on function public.check_trip_key() to anon, authenticated;
grant execute on function public.trip_key_ok() to anon, authenticated;
