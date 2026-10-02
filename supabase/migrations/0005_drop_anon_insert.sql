-- Security (2026-09-27 audit): anyone holding the public anon key could insert
-- rows straight into experts/appointments through Supabase's REST API,
-- skipping /api/submit's validation, length limits and rate limit. Nothing in
-- the app uses these policies: every real write goes through /api/submit with
-- the service-role key, which bypasses RLS. With no policies left, RLS denies
-- all anon access to both tables, same as `calls`.
drop policy if exists "anon can insert experts" on public.experts;
drop policy if exists "anon can insert appointments" on public.appointments;
