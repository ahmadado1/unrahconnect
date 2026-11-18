-- Everything a user expects to get back after reinstalling or on a new phone.
-- The app already saves these to the account, but some tables were never created in the
-- database (the app then silently kept them only on the phone). Safe to run more than once:
-- existing tables and data are kept.

-- Quran: where you stopped reading ("Continue reading" chips)
create table if not exists public.quran_last_read (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entries jsonb not null default '[]'::jsonb,
  registration_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Quran: last ayah reached in each surah
create table if not exists public.quran_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_number integer not null,
  surah_name text,
  surah_arabic text,
  verse_number integer not null default 1,
  updated_at timestamptz not null default now()
);
do $$ begin
  create unique index if not exists quran_progress_user_surah on public.quran_progress (user_id, surah_number);
exception when others then raise notice 'quran_progress: duplicate rows, unique index not added';
end $$;

-- Quran: bookmarked ayahs
create table if not exists public.quran_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_number integer not null,
  surah_name text,
  surah_arabic text,
  verse_number integer not null,
  verse_text text,
  verse_translation text,
  created_at timestamptz not null default now()
);
create index if not exists quran_bookmarks_user on public.quran_bookmarks (user_id);

-- Quran: reading goals (Premium)
create table if not exists public.quran_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal jsonb,
  updated_at timestamptz not null default now()
);

-- Favourites (hotels, places) and Umrah / Hajj steps done
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  item_type text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.umrah_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phase_id text not null,
  created_at timestamptz not null default now()
);

-- Each user reads and writes only their own rows
do $$
declare t text;
begin
  foreach t in array array['quran_last_read','quran_progress','quran_bookmarks','quran_goals','favorites','umrah_progress'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Own rows" on public.%I', t);
    execute format('create policy "Own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Quick check after running: how many rows each backup table has
select 'user_settings' as t, count(*) from public.user_settings
union all select 'quran_last_read', count(*) from public.quran_last_read
union all select 'quran_progress', count(*) from public.quran_progress
union all select 'quran_bookmarks', count(*) from public.quran_bookmarks
union all select 'quran_goals', count(*) from public.quran_goals
union all select 'favorites', count(*) from public.favorites
union all select 'umrah_progress', count(*) from public.umrah_progress;
