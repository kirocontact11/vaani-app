# Vaani / KIRO — Full Project Context

*Written 2026-09-23. Self-contained handover: everything a fresh session needs to pick this up cold.
No secret values are in this file — only where to find them.*

---

## 1. What this is

**KIRO — "Keep It Real Online"** (the AI assistant inside it is called **Vaani**) is a national
online-safety helpline website for Indian parents: screen addiction, cyberbullying, online predators,
gaming disorders, sextortion.

- **Client**: Krupala Nune (Kairo Health).
- **Built by**: Neil (solo), designed first in Claude Design, then ported to a real Next.js app.
- **Core user**: a worried Indian parent, often on a cheap phone, often not in English, sometimes in
  an active crisis. That user shapes every decision below.

**Why this is built carefully rather than fast**: it's a real client site with a deadline, and it
collects sensitive personal data — children's ages, parents' phone numbers, voice-call transcripts.
That carries **DPDP Act** implications, which is why the database has strict RLS, a 12-month
retention purge, and why call transcripts are locked down harder than anything else.

---

## 2. Where everything lives

| Thing | Location |
|---|---|
| **App code** | `/Users/neilrojindar/Documents/Claude/KIRO/vaani-app/` |
| **Build plan** (long-form history) | `~/.claude/plans/users-neilrojindar-downloads-2026-09-13-vectorized-hummingbird.md` |
| **Design source of truth** | `kiro-online-safety-ui-mockups/project/KIRO Site - Final.html` |
| **Original build plan PDF** | `~/Downloads/2026-09-13-vaani-kiro-plan.pdf` |
| **GitHub** | `github.com/kirocontact11/vaani-app` (private, project account **kiro.contact11@gmail.com**, moved 2026-09-27) |
| **Supabase** | Project `KIRO`, ref `tohbwflygqqqnhifvphw`, region Mumbai `ap-south-1` (org owned by **kiro.contact11@gmail.com**, moved 2026-09-27; same URL and keys) |
| **Vapi assistant** | "Keep It Real Parent Intake", id `ca7dccb0-96c6-4c0d-bacf-69322ac70096` (**client's own account**) |
| **Production domain** | `kirohelp.com` (confirmed 2026-09-18) |
| **Secrets** | `.env.local` in the app dir — gitignored, never committed |

**Decoding the design file**: `KIRO Site - Final.html` is a compiled bundle, not readable HTML. The
real markup is a JSON-encoded string inside the `<script type="__bundler/template">` tag — extract it
with `python3` + `json.loads`.

---

## 3. Stack and the one rule that matters most

Next.js **16.3.5** (App Router, Turbopack) · React **19.2.8** · TypeScript strict · Tailwind CSS **v4**
(CSS-first `@theme inline` in `app/globals.css` — **there is no `tailwind.config.ts`**).

> **Current status and open items live in `PLAN.md`.** This file
> explains how things work; that file tracks what's left.

Dependencies: `@supabase/supabase-js`, `@vapi-ai/web`, `resend` (dynamic import, only loads if an
email actually sends), `zod`.

> ### ⚠️ Read the shipped Next.js docs before writing any code
> `next dev` writes an `AGENTS.md` (gitignored; it's generated) that says: *"This is NOT the Next.js you know. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing any code."* This is not boilerplate — following it
> caught real errors, e.g. this version's error boundaries take a **`retry`** prop, not the `reset`
> prop that older Next.js (and most training data) would assume. **Always check the shipped docs in
> `node_modules/next/dist/docs/`, not memory.**

---

## 4. Architecture decisions (don't re-litigate these)

1. **Header/footer are per-page, not global.** Only Home gets the full nav (`SiteHeader`/`SiteFooter`);
   every other page gets `SubpageChrome`'s lighter version. **Only the red 1098 emergency bar is
   global and sticky** (it lives in `app/layout.tsx`).
2. **Nav items `How it works` / `Why?` / `Partner with us` / `Resources` are anchor sections on Home**
   (`/#how` etc.), not separate routes — confirmed from the design's own route flags.
3. **The design's standalone `#cdc` screen was deliberately not ported** — zero inbound links, and
   superseded by `/register`'s second tab.
4. **All real forms share `submitForm()`** in `lib/content/forms.ts` — one helper, one place to change.
5. **Video clicks are one consistent behavior everywhere**: plain link straight to YouTube in a new tab.
6. **No client-side Supabase calls exist anywhere, by design.** Every write goes through a server API
   route using the service-role key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured but intentionally
   unreferenced in app code (it was needed for RLS curl tests, and is the right key if a client-side
   read is ever added).
7. **`app/layout.tsx` has exactly one plain stretching `<main>` child.** This is load-bearing — see
   the flex bug in §9.

---

## 5. File map

```
app/
  layout.tsx              root layout: sticky 1098 emergency bar + Organization JSON-LD. Nothing else.
  page.tsx                Home — hero w/ rotating word, 6 topic chips, voice CTA w/ pulse rings,
                          3-step ladder, About, Partner, video carousel, news carousel, ticker
  globals.css             9 design tokens + @theme inline mapping + @keyframes (pulse, bar)
  not-found.tsx           404
  error.tsx               route-level error boundary (branded, keeps emergency bar)
  global-error.tsx        root-layout-failure fallback — inline-styled, has its own 1098 bar
  manifest.ts             PWA manifest
  opengraph-image.tsx     1200x630 OG image generated from code via next/og ImageResponse
  robots.ts  sitemap.ts   SEO
  icon.png apple-icon.png favicon.ico    real KIRO branding
  videos/page.tsx         → components/VideosPageClient.tsx
  topics/page.tsx
  topics/[slug]/page.tsx  6 static slugs + Article JSON-LD
  community/page.tsx      WhatsApp group join page → components/ExampleScroller.tsx
  register/page.tsx       reads ?tab=psych|cdc → components/RegisterPageClient.tsx
  book/page.tsx           → components/BookPageClient.tsx
  talk/[[...slug]]/page.tsx   /talk, /talk/voice, /talk/<topic> → components/TalkChat.tsx
  api/submit/route.ts         form submissions (zod + service-role + rate limit + optional email)
  api/webhooks/vapi/route.ts  Vapi end-of-call-report logging

components/
  SiteHeader / SiteFooter      Home-only full chrome
  SubpageChrome                SubpageHeader + SubpageFooter for every other page
  HeroRotator, FeaturedVideos, NewsCarousel, ExampleScroller   (all respect prefers-reduced-motion)
  TalkChat.tsx                 THE big one — chat + voice. See §7.
  RegisterPageClient, BookPageClient, VideosPageClient         forms

lib/
  site.ts                 SITE_URL constant (everything SEO reads from this one place)
  vapi.ts                 VAPI_ASSISTANT_ID + classifyCallError() (which SDK errors end a call)
  validation.ts           zod rules for /api/submit and the Vapi webhook (one source for tests too)
  supabase/server.ts      supabaseAdmin() — service-role, server-only
  content/{topics,chat,forms,videos,news}.ts   all copy/data
  content/chat-flow.ts    pure typed-chat logic: buildMsgs, stepsFor, escalates()

tests/                    node --test, zero extra dependencies (see §12)
  validation / chat-flow / vapi / content .test.ts   unit tests (`npm test`)
  smoke.test.ts           checks a RUNNING site from outside, never writes (`npm run test:smoke`)

supabase/migrations/      0001_init.sql, 0002_drop_redundant_person_column.sql, 0003_calls.sql,
                          0004_experts_phone_optional.sql, 0005_drop_anon_insert.sql (both NOT YET RUN, see PLAN.md)
```

**23 routes total.** `npx tsc --noEmit && npx eslint . && npm test && npm run build` is clean.

---

## 6. Database (Supabase Postgres)

Three tables. Migrations 0001–0003 have been run in the Supabase SQL Editor, and live schemas were
verified column-by-column against the migration files — no drift. **0004 and 0005 are written but
not yet run** (checked live 2026-10-02):
- **0004** makes `experts.phone` optional and requires phone *or* email. Until it runs, email-only
  registrations fail.
- **0005** drops the two anon-insert policies. Until it runs, anyone holding the anon key can write
  straight into `experts`/`appointments` (proven, test rows deleted).

| Table | Source | RLS |
|---|---|---|
| `experts` (21 cols) | `/register`, both tabs, discriminated by `kind` (`psych`/`cdc`) | anon insert only *until 0005*, then **zero policies** |
| `appointments` (9 cols) | `/book` | anon insert only *until 0005*, then **zero policies** |
| `calls` (6 cols) | Vapi webhook | **RLS on, zero policies** — not even anon insert |

**The RLS model, and why**: the anon key ships inside the browser bundle by definition, so it must
never read personal data back. Reads happen server-side only via the service-role key, which bypasses
RLS. `calls` is stricter still — nothing client-side should ever touch call transcripts.

**Verification that this actually works** (re-run this after deploy):
anon `select` on each table returns `200` with `[]` (not an error); anon `insert` on `calls` is
rejected, and on `experts`/`appointments` too once 0005 has run.

**Retention**: 12-month purge on `experts` and `appointments` via `pg_cron`, daily at 03:00 UTC.
Client-confirmed policy. Note `calls` has **no** purge yet — worth raising.

---

## 7. Vapi voice integration (the current focus)

### What the client already provided
The client had already built a complete, safety-compliant Vapi assistant in **their own Vapi account**
— consent-first, multilingual with real dialect-matching, and an escalation section explicitly
covering **112 / 1098 / cybercrime.gov.in / 1930**. That made C5/C6 pure integration work; the system
prompt lives in the client's Vapi dashboard, not in this repo.

### How it's wired (`components/TalkChat.tsx`)
- `type Mic = "ask" | "connecting" | "live" | "error" | null` — every state keeps a working path back
  to typed chat.
- One `Vapi` instance created in a `useEffect`, listening to: `call-start`, `call-end`,
  `speech-start`, `speech-end`, `local-volume-level`, `error`, and **`camera-error`**.
- **A call phase (`idle` → `connecting` → `live`) is tracked in a ref**, and every SDK event checks
  it. That's what makes Cancel/restart/leaving the page actually stop a call: the SDK's `stop()` does
  *not* abort a `start()` already in progress, so a cancelled call would otherwise go live anyway.
- **Not every `error` event is a failure** (`lib/vapi.ts` `classifyCallError`). Only 6 SDK error
  types end a call; the others (audio observer, Krisp noise-cancellation, recording setup) are
  "non-critical, the call continues" per the SDK source. Daily's `ejected` error is how a **normal**
  hang-up by Vaani arrives. Parents only ever see plain-language messages; raw SDK detail goes to the
  console.
- **`camera-error` is the non-obvious one**: despite the name (it's Daily's naming, which Vapi wraps),
  that's the event that fires for microphone/device failures. It now stops the call.
- "Connecting…" times out after 30 s with a message; a double tap on Allow can't start two calls.
- **Each tap is a numbered attempt**; Cancel, restart, leaving the page and newer taps invalidate
  older ones. The SDK runs one call at a time and its `start()` can't be aborted, so a new attempt
  waits for a cancelled `start()` to finish (and be stopped) before calling `start()`. The phase
  stays `idle` meanwhile, so the old call's teardown events are ignored.
- **`call-end` is only acted on for a live call.** Other endings are handled by their cause, and
  `stop()` can fire `call-end` while tearing down an old call.
- `ejected` means "Vaani hung up" only once live; before that, it means Vapi couldn't start the
  assistant, which is shown as a failure.
- `@vapi-ai/web` is pinned to exactly **2.7.0**, because the logic above follows that version's
  source. Re-check it before upgrading.
- All of the above found by reading `node_modules/@vapi-ai/web/dist/vapi.js` directly.
- Before `vapi.start()`, the code calls `navigator.mediaDevices.getUserMedia({ audio: true })`
  **directly** — the standard way to trigger the browser's real permission prompt — and maps each
  `DOMException` name to a specific message (`NotAllowedError`, `NotFoundError`, `NotReadableError`,
  `SecurityError`).
- A live local-mic-level meter renders during calls, so you can see whether the mic is producing
  signal at all, not just whether the assistant responds.
- A persistent "🎙 Talk to Vaani" header button appears whenever no call is active, on every `/talk`
  route, so there's always a way back into voice mode.

### The webhook (`app/api/webhooks/vapi/route.ts`)
Researched against Vapi's real docs first: **there is no signature scheme** — auth is a shared secret
you configure yourself, sent as `Authorization: Bearer <secret>` or the legacy `X-Vapi-Secret` header.
The route accepts both, **fails closed** if `VAPI_WEBHOOK_SECRET` isn't set, only acts on
`end-of-call-report`, and safely ignores every other Vapi event type hitting the same endpoint.

**Already verified directly against the route** (no auth → 401, wrong secret → 401, valid secret +
irrelevant event → 200 ignored, valid secret + real payload → 200 + row inserted, legacy header → 200).
What has *never* run is a real Vapi call reaching it over the internet.

### Deliberately NOT built
`topic` and `escalated` are **not** columns on `calls`. They aren't native Vapi fields — extracting
them needs either Vapi's Analysis feature or a defined parsing rule. Inventing a heuristic for a
**safety-relevant** flag risked silently misclassifying a real escalation. Open decision.

---

## 8. Environment variables

All live in `.env.local` (gitignored). `.env.example` documents every name with no values.

| Var | Purpose | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | configured but intentionally unused in app code (§4.6) | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only; all real writes | yes |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | browser-side voice widget | yes |
| `VAPI_WEBHOOK_SECRET` | shared secret, generated with `openssl rand -hex 32` | yes |
| `RESEND_API_KEY` | email notify — **app works fine without it**, just skips email | optional |
| `NOTIFY_EMAIL` | where notifications go | optional |
| `NEXT_PUBLIC_SITE_URL` | overrides `kirohelp.com` default | optional |

---

## 9. Bug history — the lessons that generalize

These are worth knowing because the same classes of bug keep recurring on this project.

| Bug | Lesson |
|---|---|
| Content collapsed to a narrow column on desktop | A flex item with `mx-auto` gets *positioned* by that auto margin instead of stretched — collapses to fit-content. CSS spec rule, not a framework quirk. Fixed with one plain stretching `<main>`. |
| **`text-base` rendered invisible cream text site-wide** | `globals.css` defined a color token named `base`; Tailwind v4's own font-size scale already owns the key `base` (that's what `text-base` normally means). The custom color silently won — compiled output was literally `.text-base { color: var(--base); }` with no font-size. All 12 usages were affected; it only *looked* fine where another `text-*` color class won the cascade by luck. **Fixed at root**: renamed the token `base` → `page`. **Never name a custom Tailwind color after a built-in scale key.** |
| Mic denial left UI stuck on "Connecting…" | The SDK reports device failures through a confusingly-named third event (`camera-error`). Read the shipped SDK source, not just the types. |
| `submitForm()` didn't await its own POST | Harmless while the only destination was `mailto:` (can't fail); a real bug the moment a backend that can 400/500 existed — every form showed fake success. |
| Stale validation errors across all 4 forms | Invisible in code review, obvious on the first live keystroke. |
| 3 chat UI elements looked real but were never wired | Carried over from the Claude Design mockup, which was a *static visual prototype* — its "inputs" were always styled `<div>`s. Correct then, confusing once the rest became real. All 3 removed/wired after confirming with Neil. |
| Anchor nav landed headings behind the sticky bar | No `scroll-margin-top` existed anywhere. Now `scroll-mt-[90px] sm:scroll-mt-[130px]` on all 5 Home sections. |
| 6 internal links used raw `<a>` | ESLint's `no-html-link-for-pages` only fires once the target route *exists* — previously "clean" files sprout errors retroactively as later routes get built. |
| Hero pulse rings looked static | First fix (3 rings, higher alpha) didn't reach the root cause. Real cause (found 2026-09-23): our `@keyframes pulse` shared its name with Tailwind's built-in `animate-pulse` keyframes, and Tailwind's (fade-only) replaced ours in the compiled CSS. Renamed to `ring-pulse`. **Same lesson as `text-base`: never reuse a Tailwind built-in name — for colors *or* keyframes.** |
| Email-only registrations returned 500 | The forms and API allowed phone *or* email, but the DB column was `NOT NULL`. Client validation, server validation and DB constraints must encode the **same** rule — check all three. |
| "They are threatening me" did nothing | Follow-up buttons with value `urgent` set state nothing rendered; the escalation panel only keyed off the Urgent *topic*. Inherited from the mockup. On a safety flow, click every button once. |

---

## 10. Status: C0 → C11

| Step | What | Status |
|---|---|---|
| C0 | Scaffold + design tokens | ✅ done, verified |
| C1 | Layout shell | ✅ done, verified |
| C2a | Home page | ✅ done, verified |
| C2b | All other pages | ✅ done, verified |
| P1 | Repo, Supabase project, retention policy | ✅ done, verified |
| C3 | Supabase tables + RLS | ✅ done, verified |
| C4 | Wire forms to Supabase + email | ✅ done — email dormant until `RESEND_API_KEY` exists |
| C5 | Vapi voice widget | ✅ built + verified **except a real spoken call** |
| C6 | Vaani system prompt | ✅ effectively done — client's own assistant covers it |
| C7 | Vapi webhook + call logging | ✅ built + verified against the route — **dashboard config & live call pending** |
| C8 | Video/topic polish | ✅ done — all 11 video IDs confirmed live and on-topic |
| C9 | SEO: robots/sitemap/JSON-LD/OG image/icons/manifest | ✅ done, verified |
| **C10** | **Deploy to Vercel + real domain** | 🔴 **IN PROGRESS — this is the current task** |
| C11 | Pre-demo rehearsal on production, on a real phone | ⬜ last |

Also done outside the C-numbering: real branding icons (favicon was still the default Next.js one
until 2026-09-19), error boundaries, security headers.

**Security headers** (`next.config.ts`): `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security`. ⚠️ **`Permissions-Policy` uses `microphone=(self)`,
NOT the `microphone=()` in Next's own docs example** — copying the docs verbatim silently breaks
`/talk/voice`. **No CSP yet** — deliberately, see §11.

---

## 11. What's actually left

### 🔴 C10 — Deploy to Vercel (current task, in progress)
Neil chose this path on 2026-09-22 to unblock everything Vapi-related at once.
1. Sign in to Vercel as **kiro.contact11@gmail.com** ("Continue with GitHub" → the `kirocontact11` account) → import `kirocontact11/vaani-app`. Note: `vaani-app.vercel.app` is already taken by an unrelated site, so Vercel will assign a different address.
2. Add the 5 required env vars from §8 in Vercel's dashboard — **never in the repo**.
3. Deploy, confirm HTTPS.
4. Point `kirohelp.com` at Vercel (needs registrar/DNS access — unknown where DNS is hosted; **ask Neil**).
5. Re-run the RLS verification (§6) against production.

*Account creation and OAuth authorization are Neil's to do — per a standing rule on this project,
Claude never handles passwords or account credentials; Neil signs up himself and pastes only keys.*

### 🟡 Unblocked the moment C10 lands
- **Vapi dashboard config**: set the assistant's **Server URL** to
  `https://<domain>/api/webhooks/vapi`, attach a credential (header `Authorization`, Bearer prefix on,
  value = `VAPI_WEBHOOK_SECRET`). Then make a real call and confirm a row lands in `calls`.
- **A real spoken conversation on `/talk/voice`** — never done. This sandbox has no microphone, and
  `getUserMedia` requires a secure context (HTTPS or literally `localhost`), so LAN-IP testing over
  plain HTTP **cannot** work. Neil hit a persistent "Microphone access was denied" on his own machine;
  the next diagnostic step was an **Incognito window** (zero permission history → prompt guaranteed to
  appear). That result was never reported back.
- **Content-Security-Policy** — deliberately not written yet. Needs the exact Supabase/Vapi/Daily
  connect-src domains enumerated against a live voice call; guessing risked a silent break.

### 🟡 Needs a real phone
- The **1098 emergency button** was reported as "does nothing". Verified: it's a correct
  `<a href="tel:1098">`. Desktop browsers have no dialer to hand off to, so nothing visibly happens —
  that's true of every website. Needs a real phone to confirm, not a code change.

### 🟡 Content confirmations (all are `TODO(neil)` in code)
- ~~Contact email~~ — settled 2026-09-27: `kiro.contact11@gmail.com`.
- `lib/content/forms.ts:35` — is the WhatsApp invite link still valid?
- `lib/content/videos.ts:73` — final sign-off on one video ID (verified live and on-topic, but the
  client's call whether they meant a different one).

### 🟡 Account ownership — do before/at deploy, not after
- **GitHub repo** → transfer from Neil's personal account to the client (or a dedicated org).
- **Supabase project** → same.

### ⚪ Deferred decisions (cost nothing to wait)
- **Who reads form submissions, how fast.** Today's default: check Supabase's table view manually.
  Three tiers exist: manual → email (built, dormant, needs a Resend account) → SMS/WhatsApp or an
  admin dashboard (neither built).
- **`topic`/`escalated` extraction** on call logs — needs a Vapi Analysis decision (§7).
- **Retention purge for `calls`** — `experts`/`appointments` have one; `calls` does not.
- **Storage stays Supabase, not raw AWS** (client raised this). Supabase's own infra *is* AWS
  (`ap-south-1` is a real AWS region), so "use AWS" is already satisfied. Only reconsider if there's a
  compliance reason data must sit in the client's *own* AWS account.

---

## 12. Working method (this has actually worked; deviating from it caused the bugs in §9)

1. **Read the real source before writing anything** — design HTML, SDK source in `node_modules/`,
   vendor docs. Never guess a value. *Every* significant bug here traced back to a guessed value or an
   untested interaction.
2. **Interact with the feature live, not just review code.** The stale-validation bug, the layout
   squish, the `camera-error` mic bug, and the invisible-text bug were all invisible in code review and
   obvious the instant something was clicked, typed into, or measured in the browser.
3. **Confirm non-trivial removals with Neil before acting.** He's explicitly asked for this — he wants
   the patient-facing flow simple and uncrowded, but wants to approve what goes.
4. **Log open items in `PLAN.md`; the history goes in commit messages.**

### Standing verification, after any meaningful change
```bash
npx tsc --noEmit && npx eslint . && npm test && rm -rf .next && npm run build
```
…then a **live browser check of the thing that changed**.

### Tests (added 2026-10-02)
- `npm test`: unit tests for form/webhook validation, the typed-chat escalation path, voice error
  handling and content data. Uses Node's built-in runner (Node 24 runs `.ts` directly), so no test
  framework to install. Each test was checked by re-introducing the bug it guards against and
  confirming it fails.
- `BASE_URL=<site> VAPI_WEBHOOK_SECRET=<secret> npm run test:smoke`: checks a running site from
  outside: every page, every internal link, headers, 404s, and that both APIs refuse bad input.
  **Never writes to the database**, so it's safe to run against production after every deploy.
- Not automated: the voice call itself (needs a real mic) and the browser-side call lifecycle. Those
  were verified by driving the real component with faked SDK events (see git history up to `65bec37`).

### Environment gotchas
- **This network blocks non-standard outbound ports.** Confirmed twice: SSH :22 (worked around by
  switching git to HTTPS) and cloudflared's tunnel port 7844 (both UDP and TCP). Only 80/443 reliably
  get out. **ngrok** also now requires account signup. This is why no public tunnel was ever
  established, and why C10 became the unblock path.
- The browser pane's **screenshot goes blank under a tall emulated viewport** — use
  `getBoundingClientRect` / `getComputedStyle` / `get_page_text` instead, or a normal viewport.
- **Leave the dev server running** when handing back to Neil (`npm run dev`, port 3000; it binds
  `0.0.0.0` so the LAN IP works for phone testing of everything except the mic).

### Neil's preferences
- Wants the *why* and the architecture before the code — not "just code it".
- Design-first thinker; visual/UX regressions matter to him as much as logic bugs.
- Expects repeat audit passes and live verification, not claimed success.
- Never handle credentials: he signs up for services himself and pastes only API keys/tokens.
