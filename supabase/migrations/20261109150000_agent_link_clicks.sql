-- "Were you sent by …?" for iPhone (Apple can't carry the agent code through the App Store).
-- When someone opens an agent link (/a/CODE) on the website, we save the agency and a
-- one-way scrambled version of their internet address (never the address itself).
-- When the app opens for the first time from the same internet connection within 24 hours,
-- it asks "Were you sent by <agency>?". Rows older than 2 days are deleted automatically.
-- Only the website server (service role) reads/writes this table. Safe to run twice.
create table if not exists public.agent_link_clicks (
  id bigint generated always as identity primary key,
  agent_id uuid not null references public.agents (id) on delete cascade,
  agent_code text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists agent_link_clicks_ip_idx on public.agent_link_clicks (ip_hash, created_at desc);

alter table public.agent_link_clicks enable row level security;
-- No policies: nobody except the server can read or write it.
