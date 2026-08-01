-- Run in Supabase Dashboard → SQL Editor
-- Creates the travel_agents directory table (public read).

create table if not exists public.travel_agents (
  id text primary key,
  name text not null,
  country text not null,
  city text not null default '',
  address text,
  phone text,
  website text,
  whatsapp text,
  email text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists travel_agents_country_idx
  on public.travel_agents (country);

create index if not exists travel_agents_featured_idx
  on public.travel_agents (featured desc);

alter table public.travel_agents enable row level security;

drop policy if exists "Anyone can read travel agents" on public.travel_agents;
create policy "Anyone can read travel agents"
  on public.travel_agents
  for select
  to anon, authenticated
  using (true);

-- Writes stay service-role / dashboard only (no insert/update/delete policies for clients).
