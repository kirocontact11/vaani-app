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
BASE_URL=https://mykiro.live EXPECT_SITE_URL=https://mykiro.live \
  VAPI_WEBHOOK_SECRET=<secret> NEXT_PUBLIC_VAPI_PUBLIC_KEY=<key> npm run test:smoke
```

## Deploying

Render (a **Web Service**, not a Static Site; the forms and webhook need a server) rebuilds from
GitHub `kirocontact11/vaani-app` on every push to `main`. Settings: build `npm ci && npm run build`,
start `npm start`, `NODE_VERSION=22`. Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `VAPI_WEBHOOK_SECRET`. The site lives at
**https://mykiro.live** (domain on GoDaddy). The checklist and remaining tasks are in `PLAN.md`.

Database changes live in `supabase/migrations/` and are run by hand in the Supabase SQL Editor, in order.
