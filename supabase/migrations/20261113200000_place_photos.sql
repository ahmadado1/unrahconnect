-- Photos for restaurants and malls near the Haram / Nabawi, found on Tripadvisor (or none found).
-- Saved so each place is only looked up about once a month (the free Tripadvisor plan has 1,000 requests a month).
-- Only the server (nearby-places function) reads and writes this table.
create table if not exists public.place_photos (
  google_place_id text primary key,
  source text not null,              -- 'tripadvisor' | 'none'
  url text,
  author text,
  link text,
  checked_at timestamptz not null default now()
);
alter table public.place_photos enable row level security;  -- no policies: server only

