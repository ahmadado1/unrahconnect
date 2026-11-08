-- =============================================================================
-- Agent commissions: agents earn 10% of the Premium a pilgrim they brought pays.
--
-- Rules (decided Nov 2026):
--   * The FIRST agency a pilgrim joins gets the credit, forever (pilgrim_referrals, never changes,
--     even if the pilgrim later leaves or switches agency).
--   * Only Premium paid AFTER joining counts, and only for 12 months after joining.
--   * 10% of what UmrahConnect actually receives:
--       App Store / Google Play -> price after the store's cut (RevenueCat "takehome")
--       Website (Paystack, PayPal, manual transfer) -> the amount paid
--   * Each commission waits 30 days (refund window) before it is ready to pay.
--   * Refunds cancel the commission ("reversed").
--   * Payouts are made by hand (bank / Paystack transfer) and marked paid by an admin.
--
-- Run in Supabase SQL editor (or `supabase db push`). Safe to run twice.
-- =============================================================================

-- 1. First agent of each pilgrim (locked) -------------------------------------
create table if not exists public.pilgrim_referrals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  referred_at timestamptz not null default now()
);
create index if not exists pilgrim_referrals_agent_idx on public.pilgrim_referrals (agent_id);

alter table public.pilgrim_referrals enable row level security;
drop policy if exists "Agent reads own referrals" on public.pilgrim_referrals;
create policy "Agent reads own referrals"
  on public.pilgrim_referrals for select to authenticated
  using (
    exists (
      select 1 from public.agents a
      where a.id = agent_id and (a.user_id = auth.uid() or a.owner_user_id = auth.uid())
    )
    or user_id = auth.uid()
    or public.is_admin()
  );
-- No insert/update/delete policies: only the trigger below (and the server) write here.

-- Every time a pilgrim joins an agency, remember it ONLY if it is their first.
create or replace function public.remember_first_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pilgrim_referrals (user_id, agent_id, referred_at)
  values (new.user_id, new.agent_id, coalesce(new.joined_at, now()))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists agent_pilgrims_remember_first on public.agent_pilgrims;
create trigger agent_pilgrims_remember_first
  after insert on public.agent_pilgrims
  for each row execute function public.remember_first_agent();

-- Pilgrims who already joined an agency before this change: their current agency is their first.
insert into public.pilgrim_referrals (user_id, agent_id, referred_at)
select user_id, agent_id, joined_at from public.agent_pilgrims
on conflict (user_id) do nothing;

-- 2. Commissions ---------------------------------------------------------------
create table if not exists public.agent_commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  source text not null,                 -- apple | google | paystack | paypal | manual
  source_ref text not null,             -- store transaction id / payment reference
  plan text,                            -- monthly | yearly
  gross_amount numeric(12, 2) not null, -- what the pilgrim paid
  net_amount numeric(12, 2) not null,   -- what UmrahConnect received
  currency text not null default 'USD',
  rate numeric(5, 4) not null default 0.10,
  commission numeric(12, 2) not null,
  status text not null default 'earned' check (status in ('earned', 'paid', 'reversed')),
  paid_at timestamptz not null,         -- when the pilgrim paid
  available_at timestamptz not null,    -- paid_at + 30 days (refund window)
  payout_at timestamptz,                -- when we paid the agent
  payout_ref text,
  created_at timestamptz not null default now(),
  unique (source, source_ref)           -- the same payment is never counted twice
);
create index if not exists agent_commissions_agent_idx on public.agent_commissions (agent_id, status);

alter table public.agent_commissions enable row level security;
drop policy if exists "Agent reads own commissions" on public.agent_commissions;
create policy "Agent reads own commissions"
  on public.agent_commissions for select to authenticated
  using (
    exists (
      select 1 from public.agents a
      where a.id = agent_id and (a.user_id = auth.uid() or a.owner_user_id = auth.uid())
    )
    or public.is_admin()
  );
-- No insert/update policies: only the server (service role) and the triggers below write here.

-- 3. Record / reverse a commission (used by the RevenueCat webhook and website triggers) ---
create or replace function public.record_agent_commission(
  p_user uuid,
  p_source text,
  p_ref text,
  p_plan text,
  p_gross numeric,
  p_net numeric,
  p_currency text,
  p_paid_at timestamptz default now()
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ref record;
  new_id uuid;
begin
  if p_user is null or p_ref is null or coalesce(p_net, 0) <= 0 then
    return null;
  end if;

  select * into ref from public.pilgrim_referrals where user_id = p_user;
  if not found then
    return null; -- pilgrim was not brought by an agent
  end if;

  -- Only Premium paid after joining, and within 12 months of joining.
  if p_paid_at < ref.referred_at or p_paid_at > ref.referred_at + interval '12 months' then
    return null;
  end if;

  insert into public.agent_commissions (
    agent_id, user_id, source, source_ref, plan, gross_amount, net_amount, currency,
    commission, paid_at, available_at
  ) values (
    ref.agent_id, p_user, p_source, p_ref, p_plan, coalesce(p_gross, p_net), p_net,
    coalesce(nullif(upper(p_currency), ''), 'USD'),
    round(p_net * 0.10, 2), p_paid_at, p_paid_at + interval '30 days'
  )
  on conflict (source, source_ref) do nothing
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.reverse_agent_commission(p_source text, p_ref text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.agent_commissions
  set status = 'reversed'
  where source = p_source and source_ref = p_ref and status = 'earned';
$$;

-- Only the server may call these.
revoke all on function public.record_agent_commission(uuid, text, text, text, numeric, numeric, text, timestamptz) from public, anon, authenticated;
revoke all on function public.reverse_agent_commission(text, text) from public, anon, authenticated;
grant execute on function public.record_agent_commission(uuid, text, text, text, numeric, numeric, text, timestamptz) to service_role;
grant execute on function public.reverse_agent_commission(text, text) to service_role;

-- 4. Website Premium payments (Paystack, PayPal, manual transfer) -> commission automatically ---
create or replace function public.premium_payment_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_text text := coalesce(new.reference, new.id::text);
begin
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    perform public.record_agent_commission(
      new.user_id, new.method, ref_text, new.plan, new.amount, new.amount, new.currency, new.created_at
    );
  elsif tg_op = 'UPDATE' and old.status = 'confirmed' and new.status is distinct from 'confirmed' then
    perform public.reverse_agent_commission(new.method, ref_text);
  end if;
  return new;
end;
$$;

drop trigger if exists premium_payments_commission on public.premium_payments;
create trigger premium_payments_commission
  after insert or update of status on public.premium_payments
  for each row execute function public.premium_payment_commission();

-- 5. Totals for the agent dashboard (one row per agent and currency) -------------
create or replace view public.agent_commission_summary
with (security_invoker = true)
as
select
  c.agent_id,
  c.currency,
  count(distinct c.user_id) filter (where c.status <> 'reversed')                           as premium_pilgrims,
  coalesce(sum(c.commission) filter (where c.status = 'earned' and c.available_at > now()), 0)  as pending,
  coalesce(sum(c.commission) filter (where c.status = 'earned' and c.available_at <= now()), 0) as ready,
  coalesce(sum(c.commission) filter (where c.status = 'paid'), 0)                            as paid
from public.agent_commissions c
group by c.agent_id, c.currency;

grant select on public.agent_commission_summary to authenticated;
