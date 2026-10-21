-- Premium emails (30 minutes after sign up, then 3 days, 7 days, 14 days, then monthly; 6 at most).
-- Run this in Supabase → SQL Editor. Then set the secret and deploy the function (see the end).

-- 1. Who got which email, and who said "stop". Only the server reads this table.
create table if not exists public.email_nudges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  step int not null default 0,                  -- how many Premium emails were sent
  last_sent_at timestamptz,
  unsubscribed boolean not null default false,
  token uuid not null default gen_random_uuid() -- for the Unsubscribe link
);
create unique index if not exists email_nudges_token on public.email_nudges (token);
alter table public.email_nudges enable row level security;  -- no policies: apps can't read it

-- 2. Users who should get their next email now.
create or replace function public.premium_nudge_due(max_rows int default 25)
returns table (user_id uuid, email text, full_name text, language text, step int, token uuid)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      u.id,
      u.email::text as email,
      u.created_at,
      coalesce(u.raw_user_meta_data->>'full_name', '') as full_name,
      coalesce(u.raw_user_meta_data->>'language', 'en') as language,
      coalesce(n.step, 0) as step,
      n.last_sent_at,
      coalesce(n.unsubscribed, false) as unsubscribed,
      n.token
    from auth.users u
    left join public.email_nudges n on n.user_id = u.id
    where u.email is not null and u.email <> '' and u.deleted_at is null
  )
  select b.id, b.email, b.full_name, b.language, b.step, b.token
  from base b
  where not b.unsubscribed
    and b.step < 6
    -- already Premium (website or App Store / Google Play): no emails
    and not exists (
      select 1 from public.user_premium p
      where p.user_id = b.id and (p.premium_until >= current_date or p.store_until >= now())
    )
    -- travel agencies get their own emails
    and not exists (select 1 from public.agents a where a.owner_user_id = b.id or a.user_id = b.id)
    and (
      (b.step = 0 and b.created_at <= now() - interval '30 minutes')
      or (b.step = 1 and b.last_sent_at <= now() - interval '3 days')
      or (b.step = 2 and b.last_sent_at <= now() - interval '7 days')
      or (b.step = 3 and b.last_sent_at <= now() - interval '14 days')
      or (b.step >= 4 and b.last_sent_at <= now() - interval '30 days')
    )
  -- newest accounts first, so a new user gets the 30-minute email on time
  order by b.created_at desc
  limit max_rows;
$$;

revoke all on function public.premium_nudge_due(int) from public, anon, authenticated;
grant execute on function public.premium_nudge_due(int) to service_role;

-- 3. Run the email function every 15 minutes.
--    Replace PUT-YOUR-CRON-SECRET-HERE with the same text you set as CRON_SECRET (do not share it).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('premium-nudge-emails')
where exists (select 1 from cron.job where jobname = 'premium-nudge-emails');

select cron.schedule(
  'premium-nudge-emails',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://yqabuipymbaylholmmoi.supabase.co/functions/v1/premium-nudge-emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'PUT-YOUR-CRON-SECRET-HERE'),
    body := '{}'::jsonb
  );
  $$
);

-- Terminal (UmrahConnect folder):
--   openssl rand -hex 32                      (copy the result)
--   npx supabase@latest secrets set CRON_SECRET="the-result" --project-ref yqabuipymbaylholmmoi
--   npx supabase@latest functions deploy premium-nudge-emails --no-verify-jwt --project-ref yqabuipymbaylholmmoi
