-- Phone push tokens (Expo), so agencies can send announcements as notifications to their pilgrims.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text,
  language text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "Own push tokens" on public.push_tokens;
create policy "Own push tokens"
  on public.push_tokens for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Announcements: remember when the push was sent (only once per announcement).
alter table public.agent_announcements add column if not exists pushed_at timestamptz;
