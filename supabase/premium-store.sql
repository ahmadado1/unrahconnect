-- In-app purchases (App Store / Google Play via RevenueCat).
-- The revenuecat-webhook Edge Function writes these columns. Website columns stay as they are.
alter table public.user_premium add column if not exists store_until timestamptz;
alter table public.user_premium add column if not exists store_product text;
alter table public.user_premium add column if not exists store_name text;   -- 'apple' or 'google'
alter table public.user_premium add column if not exists store_event text;  -- last RevenueCat event
-- premium_until may now be empty for users who only bought in the app.
alter table public.user_premium alter column premium_until drop not null;

-- App Store / Google Play Premium also counts as Premium (AI Guide unlimited, is_premium()).
create or replace function public.is_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_premium
    where user_id = auth.uid()
      and (premium_until >= current_date or store_until >= now())
  );
$$;
grant execute on function public.is_premium() to authenticated;

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

  select exists (
    select 1 from public.user_premium
    where user_id = uid and (premium_until >= current_date or store_until >= now())
  ) into premium;

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
grant execute on function public.ai_use_request() to authenticated;
