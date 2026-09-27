# KIRO — Keep It Real Online

Online-safety helpline site for Indian parents, with the Vaani voice/chat assistant.
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase · Vapi.

- **`CONTEXT.md`** — how everything works: architecture, database, voice, env vars, known pitfalls.
- **`PLAN.md`** — what's done, what's left, and the handover checklist.
- **`AGENTS.md`** — read before changing code: this Next.js version differs from older docs.

## Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

## Before shipping any change

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Database changes live in `supabase/migrations/` and are run by hand in the Supabase SQL Editor, in order.
