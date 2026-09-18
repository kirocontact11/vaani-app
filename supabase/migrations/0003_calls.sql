-- C7: table for Vapi call logs. Fields kept to what Vapi's own docs actually
-- confirm exist (message.type, endedReason, artifact.transcript) plus the
-- raw payload, since Vapi's `call` object isn't fully enumerated in their
-- public docs — better to keep the raw JSON than guess at field names and
-- silently drop something. `topic`/`escalated` are deliberately NOT columns
-- here: they aren't native Vapi fields, and inventing a parsing heuristic
-- for a safety-relevant flag risked misclassifying a real escalation. That's
-- its own follow-up once Vapi's Analysis feature (or a defined parsing rule)
-- is actually decided on.
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  vapi_call_id text,
  ended_reason text,
  transcript text,
  raw jsonb not null
);

-- RLS enabled, zero policies — not even anon insert. Nothing client-side
-- should ever touch call transcripts; only the webhook route (service-role,
-- which bypasses RLS entirely) writes here, and only a server-side admin
-- tool should ever read it.
alter table public.calls enable row level security;
