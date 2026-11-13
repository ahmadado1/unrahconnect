-- AI guide: verified agencies and admins have unlimited questions (like Premium).
-- Pilgrims stay at 12 free questions per 7 days unless they have Premium.
-- Run in the Supabase SQL editor. Safe to run twice.
create or replace function public.ai_use_request()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  free_limit int := 12;
  used int;
  premium boolean;
begin
  if uid is null then
    return json_build_object('allowed', false, 'reason', 'login');
  end if;

  select
    exists (
      select 1 from public.user_premium
      where user_id = uid and (premium_until >= current_date or store_until >= now())
    )
    -- UmrahConnect admins
    or exists (select 1 from public.profiles where id = uid and role = 'admin')
    -- verified travel agencies (everything is included for them)
    or exists (
      select 1 from public.agents
      where (owner_user_id = uid or user_id = uid) and verified = true and coalesce(status, '') <> 'suspended'
    )
  into premium;

  select count(*) into used
  from public.ai_usage
  where user_id = uid and created_at > now() - interval '7 days';

  if not premium and used >= free_limit then
    return json_build_object('allowed', false, 'reason', 'limit', 'used', used, 'limit', free_limit, 'premium', false);
  end if;

  insert into public.ai_usage (user_id) values (uid);
  return json_build_object(
    'allowed', true,
    'used', used + 1,
    'limit', case when premium then null else free_limit end,
    'premium', premium
  );
end;
$$;
