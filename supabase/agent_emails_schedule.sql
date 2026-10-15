-- Run this AFTER:
-- 1. A database backup (or CSV export of agents, pilgrim_agent, travel_agents)
-- 2. supabase/migrations/20261012180000_agent_subscriptions.sql
-- 3. supabase functions deploy agent-emails --project-ref yqabuipymbaylholmmoi
--
-- Store the legacy service_role JWT (the value that starts with eyJ) in Vault.
-- Paste the key only in the SQL editor. Do not commit it.
-- Set the same JWT as the function secret AGENT_EMAILS_KEY. Do not use the
-- sb_secret_ key, and do not include the word Bearer.
--   supabase secrets set AGENT_EMAILS_KEY=<SERVICE_ROLE_KEY> --project-ref yqabuipymbaylholmmoi

select vault.create_secret(
  '<SERVICE_ROLE_KEY>',
  'service_role_key',
  'Bearer token for agent-emails triggers and the daily cron'
);

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'agent-emails-daily') then
    perform cron.unschedule('agent-emails-daily');
  end if;
end $$;

-- 06:00 UTC every day (09:00 in Cairo).
select cron.schedule(
  'agent-emails-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://yqabuipymbaylholmmoi.supabase.co/functions/v1/agent-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select case
          when lower(btrim(decrypted_secret)) like 'bearer %'
            then btrim(substr(btrim(decrypted_secret), 8))
          else btrim(decrypted_secret)
        end
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1
      )
    ),
    body := '{"mode":"daily"}'::jsonb
  );
  $$
);
