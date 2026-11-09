-- Hidden agencies: work normally (code, QR, deep link, dashboard, commissions) but are NOT shown
-- in the app's "Find an Agent" list. Used for the founder's own test agency (MeMo), so pilgrims
-- don't think it is a real agency. Only the list hides it; opening its code still works.
-- Run in Supabase SQL editor. Safe to run twice.

alter table public.agents add column if not exists hidden boolean not null default false;

-- Same view as before, with "hidden" added at the end (adding a column at the end is allowed).
create or replace view public.active_agents
with (security_invoker = true) as
select
  a.id,
  coalesce(a.business_name, a.agency_name) as business_name,
  a.logo_url,
  a.license_number,
  a.country,
  a.cities,
  a.phone,
  a.whatsapp,
  a.email,
  a.website,
  coalesce(a.description, a.bio) as description,
  coalesce(a.agent_code, a.referral_code) as agent_code,
  case when a.plan = 'pro' then 'featured' else 'listed' end as plan,
  a.verified,
  a.created_at,
  a.owner_name,
  a.nationality,
  a.years_experience,
  a.pilgrims_managed,
  a.hidden
from public.agents a
where public.agent_effective_status(a.status, a.paid_until) = 'active';

-- Make MeMo (test agency) active, verified, never expiring, and hidden from the list.
update public.agents a
set status = 'active',
    verified = true,
    paid_until = '2099-12-31',
    hidden = true
where lower(a.email) = 'ahmadado6002+agent2@gmail.com'
   or a.user_id in (select id from auth.users where lower(email) = 'ahmadado6002+agent2@gmail.com')
   or a.owner_user_id in (select id from auth.users where lower(email) = 'ahmadado6002+agent2@gmail.com')
returning id, business_name, agent_code, status, plan, verified, paid_until, hidden;
