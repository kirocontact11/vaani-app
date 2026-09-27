# KIRO / Vaani — Plan: finish the Vapi integration first

*Written 2026-09-23. On approval this is saved as `vaani-app/PLAN.md`. Everything non-Vapi (domain,
CSP, content TODOs, ownership transfer, phone rehearsal) is parked at the bottom and comes after.*

## Status at a glance (updated 2026-09-23, after a full line-by-line audit)

**The code is feature-complete.** Every route, form, API and the voice widget is built. A full audit
of all ~4,500 lines found and fixed 6 bugs (see the findings log). Type-check, lint and a clean
production build all pass.

Nothing is left to *build* without new input. What remains needs a person, an account or content:

**Neil — to do now**
- [ ] **Run `supabase/migrations/0004_experts_phone_optional.sql`** in the Supabase SQL Editor. Until
      then, any psychologist or centre that registers with only an email gets an error and is lost.
- [ ] Re-test the voice call in Chrome: does hang-up return to chat? Paste the `[vaani]` timings.
- [ ] Stage 2: Vercel deploy → Stage 3: Vapi dashboard (needs the client's Vapi login).
- [ ] Commit the audit changes once you've checked them (nothing is committed yet).

**Client — content and decisions the site can't ship without**
- [ ] **Chat follow-up answers are wrong for 5 of 7 topics.** Every "plan" button (e.g. Gaming → "Can
      I get the money back?") shows the same screen-time 7-day plan. It came from the design mockup.
      The client needs to supply or approve real answers per topic (`lib/content/chat.ts`).
- [ ] **Privacy policy.** The footer's "Privacy" is only an email link, and `/book` collects a
      parent's phone and a child's age with no consent box or notice. DPDP needs a real notice; the
      client must supply the text. Then add a page and a consent line on `/book`.
- [ ] **News "Read more" links** go to each source's homepage, not the actual article, and the Madras
      HC item promises "a simple summary" that doesn't exist (`lib/content/news.ts`).
- [ ] **Placeholders:** two "More examples coming" cards on `/community`; "See all videos on YouTube"
      opens a search for the Australian eSafety Commissioner (`components/VideosPageClient.tsx`).
- [ ] The three `TODO(neil)` items: `hello@kirohelp.com`, the WhatsApp link, one video ID.
- [ ] `calls` retention period, call recording on/off, and the `topic`/`escalated` rule (Stages 5–6).

**When email is switched on (not before)**
- [ ] `app/api/submit/route.ts` sends from `onboarding@resend.dev`, Resend's test sender, which only
      delivers to the Resend account owner. Change it to a verified `@kirohelp.com` address then.

---

## Context

The Vapi **code** is built and has been checked against the source:
- `components/TalkChat.tsx:129-206`: one `Vapi` instance with all 8 events, including `camera-error`.
  It calls `getUserMedia` directly before `vapi.start(VAPI_ASSISTANT_ID)`.
- `app/api/webhooks/vapi/route.ts`: rejects every request if the secret is missing; accepts Bearer or
  `X-Vapi-Secret`; logs only `end-of-call-report`; saves `call.id`, `endedReason`,
  `artifact.transcript` and the whole `raw` payload into `calls` (`0003_calls.sql`).

Two things have never happened: **(1) a real spoken conversation** and **(2) a real Vapi call
reaching the webhook over the internet.** Two constraints made them look blocked:
- The mic needs a secure context. **`http://localhost:3000` counts as secure.** So the spoken call
  does not need a deploy. It can be tested on your own Mac today.
- The webhook needs a public URL. This network only lets ports 80/443 out: cloudflared's port 7844
  is blocked and ngrok needs a signup. **A Vercel deploy is the cleanest public HTTPS URL.** It uses
  port 443, it doesn't change between restarts, and it's the same step C10 needs anyway.

So the best route is **voice on localhost now, webhook on a `*.vercel.app` URL next**. Neither waits
for the `kirohelp.com` DNS.

**Prerequisite (Neil):** you need login access to the **client's** Vapi dashboard, because the
assistant and the webhook settings live in their account. If you don't have it, ask Krupala first.
It's the only hard blocker in this plan.

Roles: **Neil** handles logins, dashboards and speaking into the mic. **Claude** handles code, curl
checks, logs, database checks and writing down findings.

---

## Stage 1: Real spoken call on localhost (today, no deploy)

1. Claude starts `npm run dev` and leaves it running.
2. Neil opens `http://localhost:3000/talk/voice` in an **Incognito window**. That starts with no
   saved permissions, so the browser's mic prompt must appear. Allow it.
   - The prompt doesn't appear, or it says "denied" → the problem is macOS: System Settings →
     Privacy & Security → Microphone → turn the browser on. That settles the old "mic denied" issue.
   - The level meter moves but Vaani never answers → a Vapi-side issue. Claude reads the browser
     console and network log.
3. Neil runs through a ~2-minute script:
   - Consent: Vaani asks for consent first.
   - Normal question: "my 12-year-old games till 2am".
   - Language: switch to Hindi or your own language mid-call and check that Vaani switches too.
   - **Escalation:** say something clearly urgent, such as an adult online asking your child for
     photos. Check that Vaani brings up **1930 / cybercrime.gov.in / 1098 / 112**.
   - Hang up with the button. The UI should return to typed chat, and the "Talk to Vaani" header
     button should reappear.
4. Neil checks the call appears in the Vapi dashboard's **Call Logs** with a transcript. This proves
   the assistant side works without any webhook involved.
5. Claude writes the result into `PLAN.md`. Any UI bug found gets fixed, then re-tested live.

## Stage 2: Minimum deploy for a public webhook URL (Neil clicks, Claude checks)

1. Neil: Vercel → sign in with GitHub → import `neilrojindar/vaani-app` → add the 5 env vars from
   `.env.local` (Supabase ×3, `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `VAPI_WEBHOOK_SECRET`) → Deploy.
   Paste the `*.vercel.app` URL back here.
2. Claude, against the live URL:
   - `curl` auth checks on `/api/webhooks/vapi`: no header → 401, wrong secret → 401, valid secret
     with an ignored event type → 200 `ignored`.
   - `curl -I` shows `Permissions-Policy: microphone=(self)`. If this header is wrong, prod voice
     breaks.
   - Rerun the RLS checks: anon `select` on `calls` → `200 []`; anon `insert` → rejected.
   - `/talk/voice` loads on HTTPS without console errors.

*If you'd rather not deploy yet: ngrok (you sign up) also works on 443. But its URL is temporary and
you'd have to change the Vapi setting again later. Vercel does it once.*

## Stage 3: Vapi dashboard webhook settings (Neil, ~10 min)

In the client's Vapi dashboard → assistant **"Keep It Real Parent Intake"** → Advanced / Server:
1. **Server URL:** `https://<vercel-url>/api/webhooks/vapi`
2. **Credential:** new Bearer credential. Header `Authorization`, Bearer prefix on, value =
   `VAPI_WEBHOOK_SECRET`. Paste it straight from `.env.local` into the dashboard; it never goes in
   chat.
3. **Server Messages:** tick **only `end-of-call-report`**. Our route already ignores the other
   message types safely. Leaving them off means fewer function runs and less noise in the logs.

## Stage 4: End-to-end proof (Neil speaks, Claude checks)

1. Neil makes one real call on `https://<vercel-url>/talk/voice`. HTTPS on the deployed site is the
   same setup as production.
2. Claude checks:
   - Vercel function logs show one `POST /api/webhooks/vapi` → **200**. If it's 401, the credential
     is misconfigured; go back to Stage 3.2.
   - A new row in `calls` (queried with the service-role key): `vapi_call_id` filled in,
     `ended_reason` makes sense, `transcript` not empty.
   - **Compare the real `raw` payload with the zod schema.** The schema was written from Vapi's docs.
     Now we check it against a real payload. Write down where `analysis.summary`,
     `analysis.structuredData`, `durationSeconds` and `recordingUrl` actually sit. Stage 6 needs this.
3. Edge cases, one short call each:
   - User hangs up in the first 5 seconds.
   - Close the browser tab mid-call.
   - Let Vaani end the call.

   Each should still produce exactly one row with a different `ended_reason`.
4. Claude deletes the test rows. Stage 4 passing = **C5 and C7 closed.**

## Stage 5: Privacy tidy-up on `calls` (Claude code, Neil runs the SQL)

Now that the real payload is known:
1. Check what's inside `raw`: the full transcript, `recordingUrl`, and the call object. If recording
   is on in the client's assistant, the stored URL points to audio of a parent talking about their
   child. **Decision for Neil/client:** keep the URL, strip it before saving, or turn recording off
   in Vapi. This is a DPDP data-minimisation question.
2. Add a retention purge for `calls`: new `supabase/migrations/0005_calls_retention.sql` copying the
   `cron.schedule` pattern at `0001_init.sql:84-98`. The retention period comes from the client.
   Neil runs it; Claude checks `select * from cron.job`.

## Stage 6: `topic` / `escalated` (needs client sign-off, do last)

The safe way uses **Vapi's own Analysis feature** on the assistant: a structured-data schema such as
`{ topic: enum[the 6 site topics], escalated: boolean, escalation_type: enum[112,1098,1930,none] }`.
Vapi's model fills it in after each call using the client's own rules. There's still no guessing
rule on our side.
1. Neil/client agree on the schema and on what "escalated" means (client's decision, since it's
   about child safety). Neil adds it in the dashboard.
2. Claude: migration `0006` adds nullable `topic` and `escalated` columns; the route maps
   `message.analysis.structuredData` using the location found in Stage 4.2; the zod schema gets
   those fields as optional.
3. Every call is already saved in full in `raw`, so older calls can be filled in later with one SQL
   `update`. Nothing is lost by waiting on the client's decision.

---

## Verification (after every code change)

```bash
npx tsc --noEmit && npx eslint . && rm -rf .next && npm run build
```
…then a live check: `/talk/voice` in the browser, and a `calls` row for anything that touches the
webhook. Findings go into `PLAN.md` as they happen.

## Files touched in this plan

- `vaani-app/PLAN.md`: this plan (new)
- `components/TalkChat.tsx`: only if Stage 1 turns up a bug
- `supabase/migrations/0005_calls_retention.sql`: new (Stage 5)
- `supabase/migrations/0006_calls_analysis.sql` and `app/api/webhooks/vapi/route.ts`: only after
  Stage 6 sign-off

## After Vapi is done (parked, in order)

1. CSP: first in Report-Only mode, built from the network log of a real Vapi call, then enforced.
2. `kirohelp.com` DNS on Vercel + Resend email (both need DNS records, so do them together). Then
   change the Vapi Server URL to the real domain.
3. Content TODOs: `lib/content/forms.ts:32,35` and `lib/content/videos.ts:73`.
4. C11: rehearsal on a real phone (1098 `tel:` link, voice on mobile data, forms, WhatsApp share
   preview).
5. **Handover to the client**: see the section below.

---

## Handover to the client (the end state of this project)

The finished site belongs to the client, not to Neil. Every step before this should make the move
easy.

**Rule from now on:** any *new* account gets created by the client, in their name, from day one.
That covers Resend (email), the paid Vercel plan, and anything else not yet signed up. Neil then
gets invited in. Moving an account later is always harder than starting it in the right place.

| Service | Owner today | How it moves | Breaks anything? |
|---|---|---|---|
| Vapi assistant | Client | Nothing to do | No |
| GitHub `vaani-app` | Neil | Repo Settings → Transfer ownership → client's account/org | Vercel's Git link must be reconnected to the new repo location |
| Vercel project | Neil (after Stage 2) | Project Settings → Transfer → client's Vercel team (Pro, since this is a commercial site) | No: env vars, domains and deployments move with the project |
| Supabase `KIRO` | Neil | Transfer the project to the client's Supabase organization (Neil must be an owner in both at that moment) | No: same URL and keys, so no env var changes |
| `kirohelp.com` + DNS | Client (to confirm) | Should stay theirs | No |

**Order:** GitHub → reconnect in Vercel → transfer Vercel → Supabase. Test one form submission
and one voice call after each move.

**Final security step (don't skip):** Neil has seen the production secrets. After handover the
client should **rotate** `SUPABASE_SERVICE_ROLE_KEY` and `VAPI_WEBHOOK_SECRET`, then update them in
Vercel and in the Vapi credential. Delete Neil's local `.env.local` after that. This is standard
practice when a contractor hands a system over, not a sign of distrust.

**What the client receives:** the accounts above, plus `CONTEXT.md` (how everything works) and
this `PLAN.md` (history and open decisions).

---

## Findings log

- **2026-09-23 — Stage 1, first attempt:** "Microphone permission is blocked" reproduced exactly in the
  Claude app's built-in browser pane, which blocks mic capture outright. Always run voice tests in a
  real Chrome/Safari window, never the app's pane. Also split the NotAllowedError message in
  `TalkChat.tsx` so an OS-level block ("Permission denied by system") gets its own macOS-specific text.
- **2026-09-23 — Stage 1, first real call worked in Chrome.** Two issues reported:
  - *Hang-up didn't return to chat.* Root cause (read from `@vapi-ai/web@2.7.0` source): Daily emits a
    trailing `error` after a call ends; our `onError` turned it into the error panel. Also the SDK's
    error payload is `{ type, error: { message } }`, so our message extraction always fell back to the
    generic text. Fixed with `callActiveRef` (errors outside an active call are ignored) and nested
    message extraction.
  - *Slow "Connecting…".* `call-start` only fires when Vapi's server sends `"listening"`, so most of
    the wait is likely server-side assistant spin-up. Added dev-only `call-start-progress` timing logs
    to measure it before changing anything. Awaiting one measured call.
- Voice live/connecting panel lightened 30% (`bg-ink` → `bg-ink/70`) at Neil's request.
- **Status of the above (2026-09-23):** type-check, lint and a clean production build all pass, and the
  mic-blocked error path still works in the browser pane. **Not yet verified on a real call:** that
  hanging up returns to chat, and the connect timings. Neil to check both on his next Chrome call
  (DevTools console open, paste the `[vaani]` lines). Nothing committed yet.
- **2026-09-23 — Full audit (every source file read, fixes verified live):**
  1. *Email-only registrations were lost.* `experts.phone` was `NOT NULL` in the live DB while both
     register forms and the API accept phone **or** email. Reproduced: 500 "Could not save". Fix:
     `0004_experts_phone_optional.sql` (drops NOT NULL, adds a phone-or-email CHECK). **Neil must run it.**
  2. *Urgent chat follow-ups didn't escalate.* "They are threatening me", "Someone already contacted
     her", "An adult sent it to him", "Do we have to involve police?" set `sub: "urgent"`, which
     nothing rendered — no 1098 panel. Bug existed in the original design too. Fixed: they now echo
     the choice, reassure, and show the escalation panel. Verified on /talk/bullying and /talk/privacy.
  3. *Hero rings never spread.* Same class as the `text-base` bug: our `@keyframes pulse` was replaced
     by Tailwind's own `pulse` (fade only). Renamed to `ring-pulse`; verified the ring reaches 110%
     scale mid-animation.
  4. *Stale "phone or email" error* stayed on the other field after fixing one. Both now clear together.
  5. *No server-side length limits* on form fields. Added caps (200 chars; 5,000 for free text; 20
     choices) and trimming. Verified: oversized → 400, spaces-only phone → 400, valid → 201 (test row
     deleted).
  6. *Untrue copy:* "Saved to your case" in named chat mode, though nothing is saved. Now says so.
  - Also: nested `<main>` in TalkChat → `<section>`; `text-wrap-pretty` (not a real class) →
    `text-pretty`; topic-card summaries now end on a whole word; video count derived from the list.
  - Dead code removed: unreachable "opens your email app" branches in Register/Book, unused YouTube
    `images.remotePatterns` in `next.config.ts`, boilerplate README (now points to CONTEXT/PLAN).
  - Checked and fine: RLS model, webhook auth, rate limiter, JSON-LD, sitemap/robots, manifest icon
    sizes (512/180), security headers, error boundaries, all 6 hero-chip → topic routes.
