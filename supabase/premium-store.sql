-- In-app purchases (App Store / Google Play via RevenueCat).
-- The revenuecat-webhook Edge Function writes these columns. Website columns stay as they are.
alter table public.user_premium add column if not exists store_until timestamptz;
alter table public.user_premium add column if not exists store_product text;
alter table public.user_premium add column if not exists store_name text;   -- 'apple' or 'google'
alter table public.user_premium add column if not exists store_event text;  -- last RevenueCat event
-- premium_until may now be empty for users who only bought in the app.
alter table public.user_premium alter column premium_until drop not null;
