-- Run this in Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  hotel_name text not null,
  hotel_city text not null,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1,
  nights integer not null,
  total_price integer not null,
  phone text not null,
  special_requests text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can insert own bookings"
  on public.bookings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own bookings"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = user_id);
