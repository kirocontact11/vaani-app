-- Both /register forms (and /api/submit) accept a phone OR an email, but 0001
-- made experts.phone NOT NULL, so every email-only registration failed with a
-- 500 and was lost. Make phone optional and enforce the real rule here instead:
-- at least one way to reach the person.
alter table public.experts alter column phone drop not null;

alter table public.experts drop constraint if exists experts_phone_or_email;
alter table public.experts add constraint experts_phone_or_email
  check (phone is not null or email is not null);
