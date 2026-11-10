-- Cloud backup of each user's app settings (favourite reciters, Quran listening spot, fonts,
-- prayer tracker, prayer alert choices, my duas, tasbih, trip plan, ...).
-- One row per user: data = { "<setting name>": { "v": <saved value>, "t": <time changed, ms> } }.
-- After reinstalling or on a new phone, the app restores them when the user logs in.
-- Each user can only read and write their own row. Safe to run twice.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Own settings read" on public.user_settings;
create policy "Own settings read" on public.user_settings
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Own settings insert" on public.user_settings;
create policy "Own settings insert" on public.user_settings
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Own settings update" on public.user_settings;
create policy "Own settings update" on public.user_settings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
