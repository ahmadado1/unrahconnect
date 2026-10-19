-- Cache for "About this surah" (filled by the surah-info Edge Function).
create table if not exists public.surah_info_cache (
  surah int not null check (surah between 1 and 114),
  language text not null,
  text text not null,
  short_text text,
  source text,
  updated_at timestamptz not null default now(),
  primary key (surah, language)
);
-- Only the Edge Function (service role) reads and writes it.
alter table public.surah_info_cache enable row level security;
