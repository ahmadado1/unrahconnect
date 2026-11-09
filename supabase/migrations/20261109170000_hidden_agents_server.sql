-- Hide test agencies (hidden = true) from the "Find an Agent" list on EVERY app version,
-- straight from the server (old app versions read active_agents directly).
--   active_agents : the public list  -> excludes hidden agencies
--   agent_lookup  : open one agency by code/id (QR, deep link, my agent) -> includes hidden ones
-- Run in Supabase SQL editor. Safe to run twice.

create or replace view public.agent_lookup
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

grant select on public.agent_lookup to anon, authenticated;

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
where public.agent_effective_status(a.status, a.paid_until) = 'active'
  and not coalesce(a.hidden, false);
