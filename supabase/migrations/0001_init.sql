-- Vaani/KIRO — C3: experts + appointments tables, RLS, and the 12-month
-- retention purge Neil confirmed with the client (2026-09-18).
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- paste the whole file, Run. It's idempotent (IF NOT EXISTS / OR REPLACE
-- throughout) so re-running it is harmless.

-- ── experts ─────────────────────────────────────────────────────────────
-- One table for both /register tabs (psychologist + CDC), discriminated by
-- `kind`. Columns match the real form fields in components/RegisterPageClient.tsx.
create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('psych', 'cdc')),

  -- shared
  name text not null,
  city text not null,
  phone text not null,
  email text,
  langs text,
  consent boolean not null,

  -- psych-only
  qualification text,
  license text,
  years text,
  specs text[],
  avail text[],

  -- cdc-only
  centre text,
  person text,
  role text,
  services text[],
  ages text[],
  area text,
  site text,
  note text,

  status text not null default 'new' check (status in ('new', 'verified', 'rejected'))
);

-- ── appointments ────────────────────────────────────────────────────────
-- From components/BookPageClient.tsx.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  parent_name text not null,
  child_age text not null,
  city text not null,
  phone text not null,
  preferred_lang text,
  concern text,
  preferred_times text[],

  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

-- ── RLS: insert-only for anon, nothing else ────────────────────────────
-- The anon key ships inside the browser bundle by definition, so it must
-- never be able to read personal data back. Reading happens server-side
-- only, via the service-role key (C4's API route), which bypasses RLS.
alter table public.experts enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "anon can insert experts" on public.experts;
create policy "anon can insert experts"
  on public.experts for insert
  to anon
  with check (true);

drop policy if exists "anon can insert appointments" on public.appointments;
create policy "anon can insert appointments"
  on public.appointments for insert
  to anon
  with check (true);

-- No select/update/delete policy for anon on either table — default-deny,
-- confirmed by the RLS test in the plan (anon select must return zero rows,
-- not an error).

-- ── 12-month retention purge ───────────────────────────────────────────
-- Client-confirmed policy (2026-09-18): delete personal data 12 months
-- after submission. Runs daily via pg_cron.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'purge-old-experts',
  '0 3 * * *',  -- daily at 03:00 UTC
  $$ delete from public.experts where created_at < now() - interval '12 months' $$
);

select cron.schedule(
  'purge-old-appointments',
  '0 3 * * *',
  $$ delete from public.appointments where created_at < now() - interval '12 months' $$
);
