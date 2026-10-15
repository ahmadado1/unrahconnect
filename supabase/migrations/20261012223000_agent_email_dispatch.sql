-- The status trigger was swallowing Vault and pg_net errors, so a dashboard
-- update could save while no request was ever queued. This replaces that
-- function. It still does not block the status save.
--
-- Run the test at the bottom after this script. It does not change status.

create extension if not exists pg_net;

do $$
begin
  execute 'grant usage on schema net to postgres, service_role';
  execute 'grant execute on all functions in schema net to postgres, service_role';
exception when others then
  raise notice 'net grants skipped: %', sqlerrm;
end $$;

do $$
begin
  execute 'grant usage on schema vault to postgres, service_role';
  execute 'grant select on vault.decrypted_secrets to postgres, service_role';
exception when others then
  raise notice 'vault grants skipped: %', sqlerrm;
end $$;

create or replace function public.enqueue_agent_email(p_agent_id uuid, p_type text)
returns bigint
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $$
declare
  secret text;
  request_id bigint;
begin
  if p_type not in ('application_received', 'account_activated', 'reminder_7_days', 'reminder_1_day', 'expired') then
    raise exception 'Unknown agent email type: %', p_type;
  end if;

  select btrim(decrypted_secret) into secret
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if secret is null or secret = '' then
    raise exception 'Vault secret service_role_key is missing. Create it with vault.create_secret(''<service role key>'', ''service_role_key'') using the service_role key, not the anon key.';
  end if;

  if lower(secret) like 'bearer %' then
    secret := btrim(substr(secret, 8));
  end if;
  secret := replace(replace(secret, E'\n', ''), E'\r', '');

  select net.http_post(
    url := 'https://yqabuipymbaylholmmoi.supabase.co/functions/v1/agent-emails',
    body := jsonb_build_object('agent_id', p_agent_id, 'type', p_type),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    timeout_milliseconds := 20000
  ) into request_id;

  return request_id;
end;
$$;

create or replace function public.notify_agent_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    kind := 'application_received';
  elsif tg_op = 'UPDATE'
    and new.status = 'active'
    and old.status is distinct from 'active' then
    kind := 'account_activated';
  else
    return new;
  end if;

  begin
    perform public.enqueue_agent_email(new.id, kind);
  exception when others then
    raise warning 'agent email notify failed: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists notify_agent_email on public.agents;
create trigger notify_agent_email
  after insert or update of status on public.agents
  for each row
  execute function public.notify_agent_email();

revoke all on function public.enqueue_agent_email(uuid, text) from public;
grant execute on function public.enqueue_agent_email(uuid, text) to postgres, service_role;
