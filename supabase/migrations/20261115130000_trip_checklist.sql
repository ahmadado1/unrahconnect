-- Group trip checklist: the agency ticks each pilgrim's documents (passport, visa, ticket...),
-- and the pilgrim sees their own list in the app.
create table if not exists public.trip_checklist (
  agent_id uuid not null references public.agents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null check (item in ('passport', 'visa', 'ticket', 'vaccine', 'hotel', 'insurance')),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (agent_id, user_id, item)
);

alter table public.trip_checklist enable row level security;

create or replace function public.owns_agent(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.agents
    where id = a and (user_id = auth.uid() or owner_user_id = auth.uid())
  )
$$;

drop policy if exists "Checklist read" on public.trip_checklist;
create policy "Checklist read"
  on public.trip_checklist for select to authenticated
  using (user_id = auth.uid() or public.owns_agent(agent_id) or public.is_admin());

-- Only the agency, and only for pilgrims connected to it
drop policy if exists "Checklist write" on public.trip_checklist;
create policy "Checklist write"
  on public.trip_checklist for all to authenticated
  using (public.owns_agent(agent_id))
  with check (
    public.owns_agent(agent_id)
    and exists (select 1 from public.agent_pilgrims ap where ap.agent_id = trip_checklist.agent_id and ap.user_id = trip_checklist.user_id)
  );
