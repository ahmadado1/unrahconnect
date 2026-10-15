-- Let the Supabase dashboard and the database owner edit subscription fields.
-- The previous trigger treated those sessions as a normal app user, because
-- auth.uid() is null there, and wrote the old values back.
--
-- Edit these columns on public.agents (there is one stored column for each):
--   plan         trial, basic, or pro
--                featured is saved as pro, listed is saved as basic
--   verified     true or false
--   status       pending, active, expired, or suspended
--   paid_until   date, or empty
--   agent_code   the code pilgrims enter
-- referral_code is the old name of agent_code. Editing either one updates the other.
-- Do not edit the active_agents or own_agents views. Their plan value is calculated.

create or replace function public.agent_subscription_fields_unlocked()
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  jwt_role text;
  sess text;
begin
  jwt_role := nullif(current_setting('request.jwt.claim.role', true), '');
  sess := session_user;

  if sess in ('postgres', 'supabase_admin', 'service_role')
     or jwt_role = 'service_role' then
    return true;
  end if;

  if public.is_admin() then
    return true;
  end if;

  -- Dashboard and SQL editor: no app user, and not an anon/authenticated request.
  if auth.uid() is null
     and coalesce(jwt_role, sess) not in ('anon', 'authenticated')
     and sess not in ('anon', 'authenticated') then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.agents_sync_legacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unlocked boolean := public.agent_subscription_fields_unlocked();
  agent_edited boolean := false;
  referral_edited boolean := false;
begin
  if tg_op = 'INSERT' and not unlocked then
    new.status := 'pending';
    new.verified := false;
    new.paid_until := null;
  elsif tg_op = 'UPDATE' and not unlocked then
    new.status := old.status;
    new.plan := old.plan;
    new.verified := old.verified;
    new.paid_until := old.paid_until;
  end if;

  -- One plan column. Keep the store app's words, and accept the new words.
  new.plan := case lower(btrim(coalesce(new.plan, '')))
    when 'pro' then 'pro'
    when 'featured' then 'pro'
    when 'basic' then 'basic'
    when 'listed' then 'basic'
    when 'trial' then 'trial'
    else case when tg_op = 'UPDATE' then old.plan else 'trial' end
  end;

  if tg_op = 'UPDATE' and not unlocked then
    new.plan := old.plan;
  end if;

  if tg_op = 'INSERT' then
    if new.owner_user_id is not null then
      new.user_id := new.owner_user_id;
    elsif new.user_id is not null then
      new.owner_user_id := new.user_id;
    end if;
  elsif new.owner_user_id is distinct from old.owner_user_id then
    if new.owner_user_id is not null then
      new.user_id := new.owner_user_id;
    elsif new.user_id is not null then
      new.owner_user_id := new.user_id;
    end if;
  elsif new.user_id is distinct from old.user_id then
    new.owner_user_id := new.user_id;
  end if;

  if tg_op = 'INSERT' then
    if nullif(btrim(coalesce(new.business_name, '')), '') is not null then
      new.agency_name := new.business_name;
    elsif nullif(btrim(coalesce(new.agency_name, '')), '') is not null then
      new.business_name := new.agency_name;
    end if;
  elsif new.business_name is distinct from old.business_name
    and nullif(btrim(coalesce(new.business_name, '')), '') is not null then
    new.agency_name := new.business_name;
  elsif new.agency_name is distinct from old.agency_name
    and nullif(btrim(coalesce(new.agency_name, '')), '') is not null then
    new.business_name := new.agency_name;
  end if;

  if tg_op = 'INSERT' then
    if new.description is not null then
      new.bio := new.description;
    elsif new.bio is not null then
      new.description := new.bio;
    end if;
  elsif new.description is distinct from old.description and new.description is not null then
    new.bio := new.description;
  elsif new.bio is distinct from old.bio and new.bio is not null then
    new.description := new.bio;
  end if;

  if nullif(btrim(coalesce(new.agent_code, '')), '') is not null then
    new.agent_code := upper(btrim(new.agent_code));
  else
    new.agent_code := null;
  end if;
  if nullif(btrim(coalesce(new.referral_code, '')), '') is not null then
    new.referral_code := upper(btrim(new.referral_code));
  else
    new.referral_code := null;
  end if;

  if tg_op = 'UPDATE' then
    agent_edited := new.agent_code is distinct from nullif(upper(btrim(coalesce(old.agent_code, ''))), '');
    referral_edited := new.referral_code is distinct from nullif(upper(btrim(coalesce(old.referral_code, ''))), '');
  end if;

  if tg_op = 'INSERT' then
    if new.agent_code is not null then
      new.referral_code := new.agent_code;
    elsif new.referral_code is not null then
      new.agent_code := new.referral_code;
    end if;
  elsif agent_edited and not referral_edited then
    new.referral_code := new.agent_code;
  elsif referral_edited and not agent_edited then
    new.agent_code := new.referral_code;
  elsif agent_edited and referral_edited and new.agent_code is distinct from new.referral_code then
    -- Both were changed to different values in one save. Keep agent_code.
    new.referral_code := new.agent_code;
  end if;

  if new.agent_code is null then
    new.agent_code := new.referral_code;
  end if;
  if new.referral_code is null then
    new.referral_code := new.agent_code;
  end if;

  if new.agent_code is null then
    new.agent_code := public.generate_agent_code(coalesce(new.business_name, new.agency_name));
    new.referral_code := new.agent_code;
  end if;

  new.cities := coalesce(new.cities, '{}');
  new.status := coalesce(new.status, 'pending');
  new.verified := coalesce(new.verified, false);
  return new;
end;
$$;

revoke all on function public.agent_subscription_fields_unlocked() from public;
grant execute on function public.agent_subscription_fields_unlocked() to postgres, service_role, authenticated, anon;
