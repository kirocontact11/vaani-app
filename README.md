# KIRO — Keep It Real Online

Online-safety helpline site for Indian parents, with the Vaani voice/chat assistant.
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase · Vapi.

- **`CONTEXT.md`** — how everything works: architecture, database, voice, env vars, known pitfalls.
- **`PLAN.md`** — what's left: the deploy checklist and every post-deploy task.

This Next.js version differs from older docs and most AI training data: check the guides in
`node_modules/next/dist/docs/` before changing code. (`next dev` also writes an `AGENTS.md` saying
so; it's gitignored, since it's generated.)

## Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

## Before shipping any change

```bash
npx tsc --noEmit && npx eslint . && npm test && npm run build
```

## Check a running site (local or production)

Never writes to the database, so it's safe against the live site after every deploy:

```bash
BASE_URL=https://<site> VAPI_WEBHOOK_SECRET=<secret> npm run test:smoke
```

## Deploying

Vercel (account **kiro.contact11@gmail.com**) builds from GitHub `kirocontact11/vaani-app` on every
push to `main`. Required settings: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `VAPI_WEBHOOK_SECRET`. Plus `NEXT_PUBLIC_SITE_URL` while the site
isn't on `kirohelp.com` yet. The full checklist and post-deploy tasks are in `PLAN.md`.

Database changes live in `supabase/migrations/` and are run by hand in the Supabase SQL Editor, in order.
