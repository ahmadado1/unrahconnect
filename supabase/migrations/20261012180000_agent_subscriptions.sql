-- BACK UP BEFORE RUNNING THIS.
-- Supabase → Database → Backups, and confirm a recent backup exists.
-- Or export public.agents, public.pilgrim_agent, and public.travel_agents
-- as CSV from the Table Editor.
-- This script does not read or write public.travel_agents (the free directory
-- behind Services → Find an Agent).
--
-- The store app still uses the old names. Nothing it reads is renamed or
-- dropped. New columns are added beside the old ones and a trigger keeps
-- each pair identical.
--
-- REMOVE LATER, once every installed app has updated:
--   agents.user_id
--   agents.agency_name
--   agents.bio
--   agents.referral_code
--   agents.plan values trial, basic, and pro (keep listed and featured)
--   table public.pilgrim_agent
--   function public.agents_sync_legacy()
--   the triggers that copy those pairs

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'pilgrim',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists created_at timestamptz default now();
update public.profiles set role = 'pilgrim' where role is null;
update public.profiles set created_at = now() where created_at is null;
alter table public.profiles alter column role set default 'pilgrim';
alter table public.profiles alter column role set not null;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column created_at set not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('pilgrim', 'agent', 'admin'));

insert into public.profiles (id, role)
select
  u.id,
  case when u.raw_user_meta_data->>'user_type' = 'agent' then 'agent' else 'pilgrim' end
from auth.users u
on conflict (id) do update
  set role = case
    when public.profiles.role = 'admin' then public.profiles.role
    else excluded.role
  end;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.agent_effective_status(p_status text, p_paid_until date)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when p_status = 'active'
      and p_paid_until is not null
      and p_paid_until < current_date
      then 'expired'
    else p_status
  end;
$$;

create or replace function public.sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
begin
  next_role := case
    when new.raw_user_meta_data->>'user_type' = 'agent' then 'agent'
    when exists (select 1 from public.agents where owner_user_id = new.id or user_id = new.id) then 'agent'
    else 'pilgrim'
  end;

  insert into public.profiles (id, role)
  values (new.id, next_role)
  on conflict (id) do update
    set role = case
      when public.profiles.role = 'admin' then public.profiles.role
      else excluded.role
    end;
  return new;
end;
$$;

drop trigger if exists sync_profile_from_auth on auth.users;
create trigger sync_profile_from_auth
  after insert or update of raw_user_meta_data on auth.users
  for each row
  execute function public.sync_profile_from_auth();

-- ---------------------------------------------------------------------------
-- Agents: keep old columns, add new ones
-- ---------------------------------------------------------------------------

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  owner_user_id uuid,
  agency_name text,
  business_name text,
  owner_name text,
  logo_url text,
  license_number text,
  country text,
  cities text[] not null default '{}',
  phone text,
  whatsapp text,
  email text,
  website text,
  nationality text,
  bio text,
  description text,
  referral_code text,
  agent_code text,
  years_experience integer not null default 0,
  pilgrims_managed integer not null default 0,
  verified boolean not null default false,
  plan text not null default 'trial',
  status text not null default 'pending',
  paid_until date,
  created_at timestamptz not null default now()
);

alter table public.agents add column if not exists user_id uuid;
alter table public.agents add column if not exists owner_user_id uuid;
alter table public.agents add column if not exists agency_name text;
alter table public.agents add column if not exists business_name text;
alter table public.agents add column if not exists owner_name text;
alter table public.agents add column if not exists logo_url text;
alter table public.agents add column if not exists license_number text;
alter table public.agents add column if not exists country text;
alter table public.agents add column if not exists cities text[] default '{}';
alter table public.agents add column if not exists phone text;
alter table public.agents add column if not exists whatsapp text;
alter table public.agents add column if not exists email text;
alter table public.agents add column if not exists website text;
alter table public.agents add column if not exists nationality text;
alter table public.agents add column if not exists bio text;
alter table public.agents add column if not exists description text;
alter table public.agents add column if not exists referral_code text;
alter table public.agents add column if not exists agent_code text;
alter table public.agents add column if not exists years_experience integer default 0;
alter table public.agents add column if not exists pilgrims_managed integer default 0;
alter table public.agents add column if not exists verified boolean default false;
alter table public.agents add column if not exists plan text default 'trial';
alter table public.agents add column if not exists status text;
alter table public.agents add column if not exists paid_until date;
alter table public.agents add column if not exists created_at timestamptz default now();

update public.agents set owner_user_id = user_id where owner_user_id is null and user_id is not null;
update public.agents set user_id = owner_user_id where user_id is null and owner_user_id is not null;
update public.agents set business_name = agency_name where business_name is null and agency_name is not null;
update public.agents set agency_name = business_name where agency_name is null and business_name is not null;
update public.agents set description = bio where description is null and bio is not null;
update public.agents set bio = description where bio is null and description is not null;
update public.agents set agent_code = referral_code where agent_code is null and referral_code is not null;
update public.agents set referral_code = agent_code where referral_code is null and agent_code is not null;
update public.agents set cities = '{}' where cities is null;
update public.agents set verified = false where verified is null;
update public.agents set years_experience = 0 where years_experience is null;
update public.agents set pilgrims_managed = 0 where pilgrims_managed is null;
update public.agents set created_at = now() where created_at is null;
-- Existing listings stay visible. New rows default to pending.
update public.agents set status = 'active' where status is null;
-- Store app only understands trial / basic / pro. Map the new words back.
update public.agents set plan = 'pro' where lower(coalesce(plan, '')) in ('pro', 'featured');
update public.agents set plan = 'basic' where lower(plan) in ('basic', 'listed');
update public.agents set plan = 'trial' where plan is null or plan not in ('trial', 'basic', 'pro');

alter table public.agents alter column cities set default '{}';
alter table public.agents alter column cities set not null;
alter table public.agents alter column verified set default false;
alter table public.agents alter column verified set not null;
alter table public.agents alter column years_experience set default 0;
alter table public.agents alter column pilgrims_managed set default 0;
alter table public.agents alter column plan set default 'trial';
alter table public.agents alter column plan set not null;
alter table public.agents alter column status set default 'pending';
alter table public.agents alter column status set not null;
alter table public.agents alter column created_at set default now();
alter table public.agents alter column created_at set not null;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'agents'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%plan%'
        or pg_get_constraintdef(con.oid) ilike '%status%'
      )
  loop
    execute format('alter table public.agents drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.agents
  add constraint agents_plan_check
  check (plan in ('trial', 'basic', 'pro'));

alter table public.agents
  add constraint agents_status_check
  check (status in ('pending', 'active', 'expired', 'suspended'));

create or replace function public.generate_agent_code(business text)
returns text
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := upper(regexp_replace(coalesce(business, 'AGENT'), '[^A-Za-z0-9]', '', 'g'));
  if length(base) < 4 then
    base := base || 'AGENT';
  end if;
  base := left(base, 12);
  candidate := base;
  while exists (
    select 1 from public.agents
    where agent_code = candidate or referral_code = candidate
  ) loop
    n := n + 1;
    candidate := left(base, 12) || n::text;
  end loop;
  return candidate;
end;
$$;

-- Copies old <-> new names, maps featured/listed onto pro/basic, and blocks
-- non-admins from changing status, plan, verified, or paid_until.
create or replace function public.agents_sync_legacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and not public.is_admin() then
    new.status := 'pending';
    new.verified := false;
    new.paid_until := null;
  elsif tg_op = 'UPDATE' and not public.is_admin() then
    new.status := old.status;
    new.plan := old.plan;
    new.verified := old.verified;
    new.paid_until := old.paid_until;
  end if;

  new.plan := case lower(btrim(coalesce(new.plan, '')))
    when 'pro' then 'pro'
    when 'featured' then 'pro'
    when 'basic' then 'basic'
    when 'listed' then 'basic'
    when 'trial' then 'trial'
    else case when tg_op = 'UPDATE' then old.plan else 'trial' end
  end;

  if tg_op = 'UPDATE' and not public.is_admin() then
    new.plan := old.plan;
  end if;

  if tg_op = 'INSERT' or new.owner_user_id is distinct from old.owner_user_id then
    if new.owner_user_id is not null then
      new.user_id := new.owner_user_id;
    elsif new.user_id is not null then
      new.owner_user_id := new.user_id;
    end if;
  elsif new.user_id is distinct from old.user_id then
    new.owner_user_id := new.user_id;
  end if;

  if tg_op = 'INSERT' or new.business_name is distinct from old.business_name then
    if nullif(btrim(coalesce(new.business_name, '')), '') is not null then
      new.agency_name := new.business_name;
    elsif nullif(btrim(coalesce(new.agency_name, '')), '') is not null then
      new.business_name := new.agency_name;
    end if;
  elsif new.agency_name is distinct from old.agency_name then
    new.business_name := new.agency_name;
  end if;

  if tg_op = 'INSERT' or new.description is distinct from old.description then
    if new.description is not null then
      new.bio := new.description;
    elsif new.bio is not null then
      new.description := new.bio;
    end if;
  elsif new.bio is distinct from old.bio then
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

  if tg_op = 'INSERT' or new.agent_code is distinct from old.agent_code then
    if new.agent_code is not null then
      new.referral_code := new.agent_code;
    elsif new.referral_code is not null then
      new.agent_code := new.referral_code;
    end if;
  elsif new.referral_code is distinct from old.referral_code then
    new.agent_code := new.referral_code;
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

drop trigger if exists agents_sync_legacy on public.agents;
create trigger agents_sync_legacy
  before insert or update on public.agents
  for each row
  execute function public.agents_sync_legacy();

create or replace function public.agents_set_owner_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  owner_id := coalesce(new.owner_user_id, new.user_id);
  if owner_id is null then
    return new;
  end if;
  insert into public.profiles (id, role)
  values (owner_id, 'agent')
  on conflict (id) do update
    set role = case
      when public.profiles.role = 'admin' then public.profiles.role
      else 'agent'
    end;
  return new;
end;
$$;

drop trigger if exists agents_set_owner_role on public.agents;
create trigger agents_set_owner_role
  after insert or update of owner_user_id, user_id on public.agents
  for each row
  execute function public.agents_set_owner_role();

do $$
declare
  r record;
begin
  for r in
    select id from public.agents
    where agent_code is null or btrim(agent_code) = ''
       or referral_code is null or btrim(referral_code) = ''
  loop
    update public.agents
    set agent_code = agent_code
    where id = r.id;
  end loop;
end $$;

-- Keep the oldest code when duplicates exist. The store app may already
-- have shared that code.
do $$
declare
  dup record;
  extra record;
  n int;
begin
  for dup in
    select referral_code
    from public.agents
    where referral_code is not null
    group by referral_code
    having count(*) > 1
  loop
    n := 0;
    for extra in
      select id
      from public.agents
      where referral_code = dup.referral_code
      order by created_at
      offset 1
    loop
      n := n + 1;
      update public.agents
      set referral_code = left(referral_code, 12) || n::text
      where id = extra.id;
    end loop;
  end loop;
end $$;

create unique index if not exists agents_referral_code_key
  on public.agents (referral_code);

create unique index if not exists agents_agent_code_key
  on public.agents (agent_code);

create index if not exists agents_owner_user_id_idx on public.agents (owner_user_id);
create index if not exists agents_user_id_idx on public.agents (user_id);
create index if not exists agents_country_idx on public.agents (country);

-- New app reads these. plan here is listed/featured. The table column stays
-- trial/basic/pro for the store app.
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
  a.pilgrims_managed
from public.agents a
where public.agent_effective_status(a.status, a.paid_until) = 'active';

create or replace view public.own_agents
with (security_invoker = true) as
select
  a.id,
  coalesce(a.owner_user_id, a.user_id) as owner_user_id,
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
  public.agent_effective_status(a.status, a.paid_until) as status,
  case when a.plan = 'pro' then 'featured' else 'listed' end as plan,
  a.verified,
  a.paid_until,
  a.created_at,
  a.owner_name,
  a.nationality,
  a.years_experience,
  a.pilgrims_managed
from public.agents a
where coalesce(a.owner_user_id, a.user_id) = auth.uid();

-- ---------------------------------------------------------------------------
-- Pilgrim links. pilgrim_agent stays. agent_pilgrims is the new table.
-- ---------------------------------------------------------------------------

create table if not exists public.pilgrim_agent (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  referral_code text,
  created_at timestamptz not null default now()
);

alter table public.pilgrim_agent add column if not exists pilgrim_id uuid;
alter table public.pilgrim_agent add column if not exists agent_id uuid;
alter table public.pilgrim_agent add column if not exists referral_code text;
alter table public.pilgrim_agent add column if not exists created_at timestamptz default now();

create table if not exists public.agent_pilgrims (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  share_contact boolean not null default false
);

create unique index if not exists agent_pilgrims_user_id_key
  on public.agent_pilgrims (user_id);
create index if not exists agent_pilgrims_agent_id_idx
  on public.agent_pilgrims (agent_id);

delete from public.pilgrim_agent
where ctid in (
  select ctid from (
    select
      ctid,
      row_number() over (partition by pilgrim_id order by created_at nulls last, ctid) as rn
    from public.pilgrim_agent
    where pilgrim_id is not null
  ) ranked
  where rn > 1
);

insert into public.agent_pilgrims (agent_id, user_id, joined_at, share_contact)
select
  p.agent_id,
  p.pilgrim_id,
  coalesce(p.created_at, now()),
  true
from public.pilgrim_agent p
where p.agent_id is not null
  and p.pilgrim_id is not null
  and exists (select 1 from public.agents a where a.id = p.agent_id)
on conflict (user_id) do nothing;

create unique index if not exists pilgrim_agent_pilgrim_id_key
  on public.pilgrim_agent (pilgrim_id);

create or replace function public.sync_agent_pilgrim_from_legacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('uc.syncing_agent_link', true) = 'on' then
    return coalesce(new, old);
  end if;
  perform set_config('uc.syncing_agent_link', 'on', true);

  if tg_op = 'DELETE' then
    delete from public.agent_pilgrims where user_id = old.pilgrim_id;
    return old;
  end if;

  insert into public.agent_pilgrims (agent_id, user_id, joined_at, share_contact)
  values (new.agent_id, new.pilgrim_id, coalesce(new.created_at, now()), true)
  on conflict (user_id) do update
    set agent_id = excluded.agent_id,
        joined_at = excluded.joined_at;
  return new;
end;
$$;

create or replace function public.sync_legacy_from_agent_pilgrim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  if current_setting('uc.syncing_agent_link', true) = 'on' then
    return coalesce(new, old);
  end if;
  perform set_config('uc.syncing_agent_link', 'on', true);

  if tg_op = 'DELETE' then
    delete from public.pilgrim_agent where pilgrim_id = old.user_id;
    return old;
  end if;

  select coalesce(agent_code, referral_code) into code
  from public.agents where id = new.agent_id;

  insert into public.pilgrim_agent (pilgrim_id, agent_id, referral_code, created_at)
  values (new.user_id, new.agent_id, code, new.joined_at)
  on conflict (pilgrim_id) do update
    set agent_id = excluded.agent_id,
        referral_code = excluded.referral_code;
  return new;
end;
$$;

drop trigger if exists sync_agent_pilgrim_from_legacy on public.pilgrim_agent;
create trigger sync_agent_pilgrim_from_legacy
  after insert or update or delete on public.pilgrim_agent
  for each row
  execute function public.sync_agent_pilgrim_from_legacy();

drop trigger if exists sync_legacy_from_agent_pilgrim on public.agent_pilgrims;
create trigger sync_legacy_from_agent_pilgrim
  after insert or update or delete on public.agent_pilgrims
  for each row
  execute function public.sync_legacy_from_agent_pilgrim();

-- Same columns the store dashboard already reads.
create or replace view public.agent_pilgrims_view
with (security_invoker = false) as
select
  ap.agent_id,
  ap.user_id as pilgrim_id,
  coalesce(u.raw_user_meta_data->>'full_name', 'Pilgrim') as pilgrim_name,
  u.raw_user_meta_data->>'nationality' as pilgrim_nationality,
  case when ap.share_contact then u.raw_user_meta_data->>'phone' else null end as pilgrim_phone,
  case when ap.share_contact then u.email::text else null end as pilgrim_email,
  ap.joined_at as created_at
from public.agent_pilgrims ap
join auth.users u on u.id = ap.user_id
where ap.share_contact = true
  and (
    public.is_admin()
    or ap.agent_id in (
      select id from public.agents
      where owner_user_id = auth.uid() or user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Announcements and email log
-- ---------------------------------------------------------------------------

create table if not exists public.agent_announcements (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_announcements_agent_id_idx
  on public.agent_announcements (agent_id, created_at desc);

create table if not exists public.agent_email_log (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  type text not null,
  paid_until date,
  sent_at timestamptz not null default now(),
  constraint agent_email_log_type_check
    check (type in (
      'application_received',
      'account_activated',
      'reminder_7_days',
      'reminder_1_day',
      'expired'
    ))
);

-- One application email and one activation email per agent.
create unique index if not exists agent_email_log_lifecycle_key
  on public.agent_email_log (agent_id, type)
  where type in ('application_received', 'account_activated');

-- One reminder or expiry email per paid_until date, so a renewal can send again.
create unique index if not exists agent_email_log_period_key
  on public.agent_email_log (agent_id, type, paid_until)
  where type in ('reminder_7_days', 'reminder_1_day', 'expired');

-- Rows the daily job should send. Dates use the database clock.
create or replace function public.agent_emails_due()
returns table (
  agent_id uuid,
  email text,
  business_name text,
  owner_name text,
  agent_code text,
  plan text,
  paid_until date,
  type text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.email,
    coalesce(a.business_name, a.agency_name),
    a.owner_name,
    coalesce(a.agent_code, a.referral_code),
    a.plan,
    a.paid_until,
    due.type
  from public.agents a
  join (
    select 'reminder_7_days'::text as type, (current_date + 7) as due_on
    union all
    select 'reminder_1_day', (current_date + 1)
    union all
    select 'expired', (current_date - 1)
  ) due on a.paid_until = due.due_on
  where a.email is not null
    and btrim(a.email) <> ''
    and (
      (due.type in ('reminder_7_days', 'reminder_1_day') and a.status = 'active')
      or (due.type = 'expired' and a.status in ('active', 'expired'))
    )
    and not exists (
      select 1 from public.agent_email_log l
      where l.agent_id = a.id
        and l.type = due.type
        and l.paid_until = a.paid_until
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.pilgrim_agent enable row level security;
alter table public.agent_pilgrims enable row level security;
alter table public.agent_announcements enable row level security;
alter table public.agent_email_log enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Admin updates profiles" on public.profiles;
create policy "Admin updates profiles"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Read active or own agent" on public.agents;
create policy "Read active or own agent"
  on public.agents for select to anon, authenticated
  using (
    public.agent_effective_status(status, paid_until) = 'active'
    or user_id = auth.uid()
    or owner_user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Insert own agent" on public.agents;
create policy "Insert own agent"
  on public.agents for insert to authenticated
  with check (
    user_id = auth.uid()
    or owner_user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Update own agent" on public.agents;
create policy "Update own agent"
  on public.agents for update to authenticated
  using (
    user_id = auth.uid()
    or owner_user_id = auth.uid()
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or owner_user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Pilgrim reads own legacy link" on public.pilgrim_agent;
create policy "Pilgrim reads own legacy link"
  on public.pilgrim_agent for select to authenticated
  using (
    pilgrim_id = auth.uid()
    or public.is_admin()
    or agent_id in (
      select id from public.agents
      where user_id = auth.uid() or owner_user_id = auth.uid()
    )
  );

drop policy if exists "Pilgrim inserts own legacy link" on public.pilgrim_agent;
create policy "Pilgrim inserts own legacy link"
  on public.pilgrim_agent for insert to authenticated
  with check (pilgrim_id = auth.uid());

drop policy if exists "Pilgrim reads own link" on public.agent_pilgrims;
create policy "Pilgrim reads own link"
  on public.agent_pilgrims for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (
      share_contact = true
      and agent_id in (
        select id from public.agents
        where owner_user_id = auth.uid() or user_id = auth.uid()
      )
    )
  );

drop policy if exists "Pilgrim joins an active agent" on public.agent_pilgrims;
create policy "Pilgrim joins an active agent"
  on public.agent_pilgrims for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.agents a
      where a.id = agent_id
        and public.agent_effective_status(a.status, a.paid_until) = 'active'
    )
  );

drop policy if exists "Pilgrim updates own link" on public.agent_pilgrims;
create policy "Pilgrim updates own link"
  on public.agent_pilgrims for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Pilgrim leaves agent" on public.agent_pilgrims;
create policy "Pilgrim leaves agent"
  on public.agent_pilgrims for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Read own announcements" on public.agent_announcements;
create policy "Read own announcements"
  on public.agent_announcements for select to authenticated
  using (
    public.is_admin()
    or agent_id in (
      select id from public.agents
      where owner_user_id = auth.uid() or user_id = auth.uid()
    )
    or agent_id in (
      select agent_id from public.agent_pilgrims where user_id = auth.uid()
    )
  );

drop policy if exists "Agent posts own announcement" on public.agent_announcements;
create policy "Agent posts own announcement"
  on public.agent_announcements for insert to authenticated
  with check (
    public.is_admin()
    or agent_id in (
      select id from public.agents
      where owner_user_id = auth.uid() or user_id = auth.uid()
    )
  );

drop policy if exists "Agent deletes own announcement" on public.agent_announcements;
create policy "Agent deletes own announcement"
  on public.agent_announcements for delete to authenticated
  using (
    public.is_admin()
    or agent_id in (
      select id from public.agents
      where owner_user_id = auth.uid() or user_id = auth.uid()
    )
  );

grant select on public.profiles to authenticated;
grant select, insert, update on public.agents to authenticated;
grant select on public.agents to anon;
grant select, insert on public.pilgrim_agent to authenticated;
grant select, insert, update, delete on public.agent_pilgrims to authenticated;
grant select, insert, delete on public.agent_announcements to authenticated;
grant select on public.active_agents to anon, authenticated;
grant select on public.own_agents to authenticated;
grant select on public.agent_pilgrims_view to authenticated;

revoke all on function public.agent_emails_due() from public, anon, authenticated;
grant execute on function public.agent_emails_due() to service_role;
revoke all on public.agent_email_log from public, anon, authenticated;
grant select, insert, delete on public.agent_email_log to service_role;
grant execute on function public.agent_effective_status(text, date) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Email triggers. Failures are logged and do not block signup.
-- Deploy the agent-emails function and store the service role key in Vault
-- before these fire. See supabase/agent_emails_schedule.sql for the daily job.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_agent_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  kind text;
  secret text;
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
    select decrypted_secret into secret
    from vault.decrypted_secrets
    where name = 'service_role_key'
    limit 1;

    if secret is null or btrim(secret) = '' then
      raise warning 'agent email skipped: vault secret service_role_key is missing';
      return new;
    end if;

    perform net.http_post(
      url := 'https://yqabuipymbaylholmmoi.supabase.co/functions/v1/agent-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || secret
      ),
      body := jsonb_build_object('agent_id', new.id, 'type', kind)
    );
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
