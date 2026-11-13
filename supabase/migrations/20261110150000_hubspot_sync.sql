-- HubSpot sync: every 15 minutes, send changed agencies to HubSpot (Edge Function hubspot-sync).
-- Run in Supabase SQL editor. Safe to run twice.

-- 1. Remembers each agency's HubSpot records and a fingerprint of what was last sent.
create table if not exists public.hubspot_sync (
  agent_id uuid primary key references public.agents (id) on delete cascade,
  company_id text,
  contact_id text,
  deal_id text,
  hash text,
  synced_at timestamptz
);
alter table public.hubspot_sync enable row level security; -- no policies: server only

-- 2. A private key so only our own scheduled job can start the sync.
--    Created once; shown at the end of this script so you can copy it into
--    Supabase > Edge Functions > Secrets as HUBSPOT_SYNC_KEY.
create extension if not exists pg_net;
create extension if not exists pg_cron;
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'hubspot_sync_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'hubspot_sync_key');
  end if;
end $$;

-- 3. Function the schedule calls: posts to the Edge Function with the key.
create or replace function public.run_hubspot_sync()
returns bigint
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $$
declare
  key text;
  request_id bigint;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'hubspot_sync_key' limit 1;
  select net.http_post(
    url := 'https://yqabuipymbaylholmmoi.supabase.co/functions/v1/hubspot-sync',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-key', key),
    timeout_milliseconds := 60000
  ) into request_id;
  return request_id;
end;
$$;
revoke all on function public.run_hubspot_sync() from public, anon, authenticated;

-- 4. Every 15 minutes.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'hubspot-sync') then
    perform cron.unschedule('hubspot-sync');
  end if;
  perform cron.schedule('hubspot-sync', '*/15 * * * *', 'select public.run_hubspot_sync()');
end $$;

-- 5. Show the key to copy into the HUBSPOT_SYNC_KEY secret.
select decrypted_secret as copy_this_into_HUBSPOT_SYNC_KEY
from vault.decrypted_secrets where name = 'hubspot_sync_key';
