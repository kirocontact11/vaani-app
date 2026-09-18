-- Drop the redundant `person` column on experts. The shared `name` column
-- already covers "contact person's name" for both kinds (psych.pname and
-- cdc.person map to the same concept) — having both was two places storing
-- the same personal data under different names, which is exactly what DPDP
-- data-minimization argues against. Safe to run any time; table is empty.
alter table public.experts drop column if exists person;
