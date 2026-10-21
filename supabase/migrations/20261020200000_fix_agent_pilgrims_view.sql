-- Fix for Supabase security warning "auth_users_exposed" (User data exposed through a view).
--
-- Before: the view agent_pilgrims_view read auth.users directly, which Supabase flags as unsafe.
-- Now:    a private function reads auth.users and only returns rows the logged-in agent (or an admin)
--         may see. The view keeps the SAME name and columns, so the app and website keep working
--         without any code change (also the version already in the stores).

create or replace function public.agent_pilgrims_list()
returns table (
  agent_id uuid,
  pilgrim_id uuid,
  pilgrim_name text,
  pilgrim_nationality text,
  pilgrim_phone text,
  pilgrim_email text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
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
    and auth.uid() is not null
    and (
      public.is_admin()
      or ap.agent_id in (
        select id from public.agents
        where owner_user_id = auth.uid() or user_id = auth.uid()
      )
    );
$$;

-- Only logged-in users may call it (it still only returns their own agency's pilgrims).
revoke all on function public.agent_pilgrims_list() from public, anon;
grant execute on function public.agent_pilgrims_list() to authenticated;

-- Same view name and columns as before, but it no longer touches auth.users itself.
drop view if exists public.agent_pilgrims_view;
create view public.agent_pilgrims_view
with (security_invoker = true) as
select * from public.agent_pilgrims_list();

revoke all on public.agent_pilgrims_view from anon;
grant select on public.agent_pilgrims_view to authenticated;
