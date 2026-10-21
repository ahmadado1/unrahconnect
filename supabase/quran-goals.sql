-- Quran reading goals (Premium), saved on the account so they survive a new phone.
-- The app works without this table too (the goal is also saved on the phone).
create table if not exists public.quran_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal jsonb,
  updated_at timestamptz not null default now()
);
alter table public.quran_goals enable row level security;

drop policy if exists "Own goal read" on public.quran_goals;
create policy "Own goal read" on public.quran_goals for select using (auth.uid() = user_id);
drop policy if exists "Own goal insert" on public.quran_goals;
create policy "Own goal insert" on public.quran_goals for insert with check (auth.uid() = user_id);
drop policy if exists "Own goal update" on public.quran_goals;
create policy "Own goal update" on public.quran_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
