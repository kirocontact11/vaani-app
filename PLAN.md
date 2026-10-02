# KIRO / Vaani — Plan: finish the Vapi integration first

*Written 2026-09-23. On approval this is saved as `vaani-app/PLAN.md`. Everything non-Vapi (domain,
CSP, content TODOs, ownership transfer, phone rehearsal) is parked at the bottom and comes after.*

## Vapi architecture re-audit (2026-10-02, before pushing)

Fresh pass against the SDK source, with a more realistic test harness. Found and fixed:

| # | Flaw | Fix | Verified |
|---|---|---|---|
| 1 | **Cancel then Allow again while the cancelled `start()` was still running broke the new call.** The SDK runs one call at a time, and the cancelled start's teardown errors (`daily-call-join-error`) arrived while the new attempt was "connecting", killing it. | Each tap is a numbered attempt. A new attempt waits for any cancelled `start()` to finish and be stopped before calling `start()`, and the phase stays `idle` meanwhile, so old events are ignored. | Old errors ignored, old call stopped, new call goes live ✅ |
| 2 | **Vapi failing to start the assistant made the panel silently vanish.** The room deletion arrives as Daily `ejected`, which was always treated as a normal hang-up. | `ejected` is a normal end only once the call is live; before that, it shows "Couldn't reach Vaani". | Unit test + browser ✅ |
| 3 | **Insecure page → "unknown error".** `navigator.mediaDevices` doesn't exist on plain HTTP. | Gives the real reason: HTTPS needed. | Browser ✅ |
| 4 | **A `call-end` from a cancelled call's teardown could reset the screen while a new call was connecting** (found in my own fix for #1: the old harness's fake `stop()` didn't fire `call-end` the way the real SDK does) | `call-end` only acts on a live call; every other ending is handled by its cause | With a realistic `stop()`: the screen held "Connecting…" for all 12 samples ✅ |
| 5 | **`@vapi-ai/web` was `^2.7.0`.** The error handling is written against 2.7's internals, so a silent upgrade could change event types. | Pinned to exactly `2.7.0` | `package.json` ✅ |
| 6 | **A deploy missing the Vapi public key** would show "Voice isn't available" to everyone, and no test noticed | The smoke test checks the key is in `/talk/voice`'s scripts | Passes with the real key, fails with a wrong one ✅ |

All earlier scenarios re-run with the realistic harness and pass: Stop, Vaani hangs up, a plain end
while live, cancel races, cancel during the prompt, double tap, mic failure, network drop, non-fatal
errors, failed start → Try again, leaving the page during the prompt or the start, and the 30 s
timeout. Unit tests 27/27 (the new ejection test was proven to catch the old logic). Smoke 10/10.

**Known limits, deliberately not built:**
- The webhook's duplicate check is check-then-insert. Two copies of the same report arriving within
  milliseconds could both be stored. Vapi doesn't document retries at all, and a sequential re-send
  is handled, so I didn't add a unique index and a migration for that edge.
- **Dashboard check, not code (post-deploy #3):** the Server URL is set on the client's assistant,
  so it applies to *every* call that assistant handles. If the assistant has tools that rely on that
  URL, their calls would reach our webhook, get `{ignored}` back, and the tools would fail. Calls
  from other channels (e.g. a phone number) would also be logged in our table.

---

## ▶ Current status (2026-10-02): tested, deployment-ready, post-deploy tasks

### Test suite (new): `npm test` + `npm run test:smoke`
There were no automated tests before this. Now (Node's built-in runner, no new dependencies):

| Suite | Covers | Result |
|---|---|---|
| `tests/validation.test.ts` | Every form rule: required fields, phone-or-email, consent, length caps, junk, stripped extra fields, trimming; webhook payload shape | ✅ 10/10 |
| `tests/chat-flow.test.ts` | All 4 "urgent" follow-ups escalate to 1098; ordinary ones don't; every follow-up value is renderable; every `/talk/<slug>` link resolves | ✅ 7/7, 1 todo (per-topic plan answers: client content) |
| `tests/vapi.test.ts` | Which SDK errors end a call, hang-up vs failure (live vs connecting), no raw SDK text shown | ✅ 5/5 |
| `tests/content.test.ts` | Video IDs/links/thumbnails/durations, age filters, topic data | ✅ 5/5 |
| `tests/smoke.test.ts` | A running site from outside: 21 pages, all internal links, 404s, headers, contact links, robots/sitemap, both APIs refuse bad input, Vapi public key present in the build. **Never writes.** | ✅ 10/10 against a fresh production build |

**Do the tests actually catch bugs?** Five real bugs from earlier audits were re-introduced one at a
time; each was caught by the test written for it, then restored.

**Browser-only checks re-run on the refactored code** (production build, faked SDK events): cancel
races, non-fatal errors, normal hang-up, network drop, mic failure, double tap, leftover events,
failed start → Try again, and a real click on "Do we have to involve police?" → 1098 panel. All ✅.
**Still never tested: a real spoken call with the latest code** (needs Neil + a mic).

**Security fix found during this pass: Next.js 16.3.5 → 16.3.8.** A critical advisory published
after the last audit (GHSA-vcvr-r3jv-pc5j) covers remote code execution in `next/og`'s
`ImageResponse`, which `app/opengraph-image.tsx` uses. Our usage wasn't exploitable: the advisory
only affects apps passing attacker-controlled values into the image, and ours has fixed text and the
logo only. Upgraded anyway (`next` and `eslint-config-next`, exact pins). `npm audit` is back to 0,
everything above was re-run on the new version, and the share image was checked visually.

**Records corrected:**
- Vercel needs **4** required settings, not 5: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is never read by the
  code.
- The Vercel import is `kirocontact11/vaani-app`, not `neilrojindar/...`.
- `vaani-app.vercel.app` is **someone else's live site**, so expect a different address.
- CONTEXT.md now has the voice phase model, the error classification, the 0004/0005 state and the
  test commands.
- Supabase's free plan pauses projects after 1 week of inactivity (Supabase pricing page), and
  Vercel's Hobby plan is non-commercial only (Vercel docs). Both are in the table below.

### Before you deploy (≈15 min, must be done first)
1. Supabase SQL Editor: run `0004_experts_phone_optional.sql`, then `0005_drop_anon_insert.sql`.
   Live check 2026-10-02: **neither has run yet.**
2. Supabase → Authentication → Sign In / Providers → turn **off** "Allow new users to sign up"
   (still on).
3. `git push`: GitHub is missing the audit commit and everything since.
4. Vercel, signed in as **kiro.contact11@gmail.com** via "Continue with GitHub" (the
   `kirocontact11` account) → import `kirocontact11/vaani-app` → add these settings → Deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPI_PUBLIC_KEY`,
     `VAPI_WEBHOOK_SECRET` (from `.env.local`)
   - `NEXT_PUBLIC_SITE_URL` = the new `https://….vercel.app` address, **until `kirohelp.com` points
     at Vercel**. Today `kirohelp.com` doesn't load at all, so share previews, the sitemap and
     canonical links would point at a dead site. This value is read at build time, so redeploy
     after changing it.
5. Run the smoke test against the live address:
   `BASE_URL=https://<address> VAPI_WEBHOOK_SECRET=<secret> NEXT_PUBLIC_VAPI_PUBLIC_KEY=<key> npm run test:smoke`

### After deploy: every remaining task

| # | Task | Why | Who | Account |
|---|---|---|---|---|
| 1 | Run the smoke test against the live site | Proves pages, headers and both APIs work in production | Claude | — |
| 2 | Re-run the database attack checks on production (anon read → `[]`, anon insert → refused) | Confirms 0005 and RLS on the live setup | Claude | Supabase (kiro.contact11) |
| 3 | Vapi dashboard: Server URL = `https://<address>/api/webhooks/vapi`, Bearer credential = `VAPI_WEBHOOK_SECRET`, server messages = only `end-of-call-report`. **First check the assistant has no tools relying on its Server URL, and whether it also takes calls from other channels** (those would be logged too) | Without it, no call is ever logged; with the wrong setup, the client's tools break | Neil, in the client's Vapi | Vapi (client's; kiro.contact11 not connected, per your choice) |
| 4 | One real call on the live `/talk/voice`; test hang-up, Vaani ending the call, and Cancel while connecting | The only part never tested with a real mic | Neil (Claude checks the `calls` row) | — |
| 5 | Compare a real call's stored `raw` payload with what the code expects | Needed before topic/escalation tagging | Claude | Supabase |
| 6 | Real-phone test: 1098 button dials, voice on mobile data, forms, WhatsApp share preview | Desktop can't test `tel:` or mobile mic | Neil | — |
| 7 | Upgrade Supabase to Pro ($25/mo), or accept the risk | Free projects **pause after 1 week with no activity**; the forms then fail until someone restores it | Neil / client | Supabase (kiro.contact11) |
| 8 | Upgrade Vercel to Pro ($20/user/mo) | Hobby is non-commercial only, and keeps just 1 hour of logs | Neil / client | Vercel (kiro.contact11) |
| 9 | Point `kirohelp.com` at Vercel, then set `NEXT_PUBLIC_SITE_URL` back to `https://kirohelp.com` and redeploy | Real domain; correct previews and SEO | Neil (DNS is at the client's registrar) | Vercel (kiro.contact11); domain (client) |
| 10 | Update the Vapi Server URL to the `kirohelp.com` address | The webhook follows the domain | Neil | Vapi (client's) |
| 11 | Decide who reads submissions, and how. Today nobody is notified; rows just appear in Supabase. Either check daily, or set up Resend under kiro.contact11 (`RESEND_API_KEY`, `NOTIFY_EMAIL`, and change the sender from `onboarding@resend.dev` to a verified kirohelp.com address) | A booking nobody sees is a parent nobody calls back | Neil / client | Resend (kiro.contact11) |
| 12 | Content-Security-Policy, built from a real call's network log | Last missing security header; needs #4 first | Claude | — |
| 13 | Client content: per-topic chat answers, privacy policy + consent on `/book`, real news article links, the two placeholder cards, the eSafety YouTube link, WhatsApp link and one video ID | Shouldn't launch publicly without the first two | Client → Claude adds | — |
| 14 | Decisions: `calls` retention period, recording on/off, the "escalated" rule | DPDP data minimisation | Client | — |
| 15 | Ask the client to restrict the Vapi public key to the site's domains | Stops others running up the call bill | Client | Vapi (client's) |
| 16 | Watch for 429s ("too many requests") from real users | 5 forms per 10 min per IP; Indian mobile networks share IPs between many users | Neil (Vercel logs) | Vercel (kiro.contact11) |
| 17 | Handover: give the client the kiro.contact11 login, then rotate `SUPABASE_SERVICE_ROLE_KEY` and `VAPI_WEBHOOK_SECRET` | Only the client should hold working secrets | Neil + client | All |

**Account status:** GitHub ✅ `kirocontact11` (verified: the remote points there). Supabase ✅
`kiro.contact11@gmail.com's Org` (verified from your dashboard screenshot; the project's own keys
can't show the owning org). Site contact email ✅ `kiro.contact11@gmail.com`. Vercel ⏳ not
created yet. Resend ⏳ only when email is switched on. Vapi stays on the client's account (your
decision on 2026-09-27). Git commits are still authored as `neilrojindar@gmail.com`, the local git
identity, which only you can change.

---

## Vapi integration audit + fix plan (2026-09-28)

Audited against the SDK's shipped source (`@vapi-ai/web@2.7.0`, `@daily-co/daily-js`), not memory.

| # | Bug | Evidence in SDK source | Fix |
|---|---|---|---|
| 1 | Cancel during "Connecting…" doesn't stop the call: it goes live anyway, mic on and billed | `stop()` only destroys an existing call object; `start()` carries on after its awaits | Track the call phase; if `start()` resolves or `listening` arrives after a cancel, stop the call |
| 2 | Cancel while the browser's mic prompt is open still starts the call | We `await getUserMedia` then call `start()` unconditionally | Re-check the phase after the prompt resolves |
| 3 | Non-fatal SDK errors show "Couldn't connect" while the call keeps running; "I'll type instead" then leaves the mic live | 4 error types are labelled "non-critical, the call continues" (audio-observer, audio-processing incl. Krisp, recovery, video-recording) | Only 6 fatal types end the call (`validation`, `daily-call-object-creation`, `daily-call-join`, `start-method`, `daily`, `reconnect`); others are logged |
| 4 | A parent can see "[object Object]" or raw technical text | `serializeError` sets `message` to Daily's nested error *object* | Friendly messages; raw detail goes to the console |
| 5 | A normal ending (Vaani hangs up, room deleted) can show the error panel | Daily reports ejection as a fatal `error` with `error.type: "ejected"` | Treat `ejected` as a normal end → back to chat |
| 6 | A real mid-call error is wiped out by the `call-end` that follows | Daily sends `error` then `left-meeting` | `call-end` leaves an error panel on screen |
| 7 | A mic failure (`camera-error`) shows the error but leaves the call running without audio | Our handler never stops the call | Stop the call |
| 8 | Double-tapping Allow starts two start attempts | No guard | Ignore taps while connecting or live |
| 9 | "Connecting…" can hang forever | `start()` can return `null` without an error (already-started path); nothing times out | 30 s timeout → friendly error |
| 10 | Leaving the page mid-connect can join a call nobody's watching | Same race as #1 | Same phase guard on unmount |
| 11 | Webhook could store duplicates if Vapi ever re-sends a report | Retry behaviour is undocumented | Skip a `call.id` that's already stored |

Also: drop the `call-start-failed` listener. It fires alongside `error: start-method-error` with less detail, and caused the real reason to be lost.

**Status: all 11 fixed and verified (2026-09-28).** The real component was driven in the browser
with the mic prompt and Vapi's network calls (`start`/`stop`) replaced by instrumented fakes,
firing the exact event sequences the SDK source produces:

| # | Scenario | Result |
|---|---|---|
| 1 | Cancel, then `start()` resolves, then "listening" | Stopped 3 times; screen never goes live ✅ |
| 2 | Cancel while the mic prompt is open | `start()` never called ✅ |
| 3 | Krisp and audio-observer errors while live | Still live; no stop ✅ |
| 4 | Network drop mid-call | "The connection dropped. Check your internet and try again." ✅ |
| 5 | Vaani hangs up (`ejected` + `call-end`) | Back to chat, "Talk to Vaani" shown ✅ |
| 6 | Fatal error, then `call-end` | Error panel stays ✅ |
| 7 | Mic device failure while connecting | Clear message; call stopped ✅ |
| 8 | Double tap on Allow | Exactly one `start()` ✅ |
| 9 | `start()` hangs | Still connecting at 21 s; stopped with a message at 31 s ✅ |
| 10 | Leave the page mid-connect | Stopped on unmount, and again when `start()` resolved ✅ |
| 11 | Same report delivered twice | `duplicate: true`, one row; a report with no call ID still saves ✅ (test rows deleted) |
| — | Leftover `call-end` while connecting; errors after pressing Stop; failed start then "Try again" | Ignored / ignored / restarts cleanly ✅ |

Type-check, lint and a production build all pass. **Still untested: a real spoken call with these
changes.** Next time Neil calls in Chrome, check: normal hang-up, Vaani hanging up, and Cancel
during "Connecting…".

---

## Pre-launch security audit + fix plan (2026-09-27)

How it was tested: a production build (`next build` + `next start`) attacked over HTTP; the live
Supabase project probed from an outsider's position (public anon key only); the client JS bundle
scanned for every secret in `.env.local`; every page and link crawled; all main pages measured at
phone width; `npm audit`.

**What held up:**
- `npm audit`: 0 vulnerabilities.
- No server secret (service-role key, webhook secret) in the browser bundle; no source maps shipped.
- All 5 security headers present.
- Webhook rejects wrong method (405), no auth (401) and wrong secret (401).
- Forms reject junk JSON, unknown kinds and oversized fields (400). Extra fields are **stripped, not
  rejected**: a valid booking that also sent `__proto__`, `status: "closed"` and a chosen `id` was
  saved with a random ID and `status: "new"`, and the server stayed healthy. So nobody can set
  fields they shouldn't.
- Text is stored as typed. A valid booking with `<script>` as the name is accepted (201). That's
  safe because nothing on the site displays submissions, React escapes text by default, and the
  notification email is plain text. **If an admin page that shows submissions is ever built, it
  must not render them as HTML.**
- No XSS through `?tab=` or `/talk/<slug>`; path traversal and `/.env.local` both 404.
- Anon can read nothing from any table (`200 []`), and can't write to `calls`. No storage buckets.
  (Signed-in users would get the same denial: the only policies in the project are the two
  anon-insert ones. This comes from the migrations, not a live test, since testing it means creating
  an account.)
- The anon key itself is in **no** published place: not in the browser bundle, the prerendered
  pages, or any commit in git history. No `.env` file other than `.env.example` has ever been
  committed.
- Clickjacking blocked: the site refuses to load in a frame, even from itself.
- All 21 pages and 25 internal links return 200; all 11 YouTube videos are live and public.
- No horizontal overflow on any main page at 375px (phone width).
- The rate limiter *can* be bypassed locally by faking `X-Forwarded-For`, but **not on Vercel**,
  which overwrites that header to prevent spoofing (per Vercel's request-headers docs).

**Found, and the fix:**

| # | Severity | Finding | Fix | Who |
|---|---|---|---|---|
| 1 | Medium (defence in depth) | With the anon key, anyone can insert rows straight into `experts` and `appointments` through Supabase's REST API. That skips all validation, length limits and rate limiting. Proven on **both** tables with test rows (deleted). Not exploitable today: the key isn't published anywhere (see above). But Supabase treats that key as public, so this shouldn't depend on it staying hidden. Nothing in the app uses these policies; every real write goes through `/api/submit` with the service-role key. | Migration `0005` drops the two anon insert policies. | Claude writes, **Neil runs** |
| 2 | **High** | Migration `0004` was never run: email-only registrations still fail. | Run it. | **Neil** |
| 3 | Medium | Footer "1098 Childline" link is **404**. | → `childlineindia.org/a/p/contact-us` (verified 200). | Claude |
| 4 | Medium | Supreme Court news link (`main.sci.gov.in`) doesn't connect. | → `www.sci.gov.in` (verified 200). | Claude |
| 5 | Medium | Webhook saves zod's *parsed* payload as `raw`, and zod drops every unknown field. So the full Vapi report (analysis, recording URL, etc.) is lost, and Stage 6's "fill in later from `raw`" can't work. | Save the original request body. | Claude |
| 6 | Low (defence in depth) | Supabase Auth has **public sign-ups on**. The site has no logins, but anyone holding the anon key can create accounts and make the project send confirmation emails to any address. | Dashboard → Authentication → Sign In / Providers → turn off "Allow new users to sign up". | **Neil** |
| 7 | Low | Webhook compares the secret with `===`, which can leak timing information. | Constant-time comparison. | Claude |
| 8 | Low | `X-Powered-By: Next.js` header tells attackers the framework. | `poweredByHeader: false`. | Claude |
| 9 | Low | Rate-limit memory is never pruned, and its reliance on Vercel's header overwrite isn't documented. | Prune old entries; add a comment. | Claude |
| 10 | Blocker for deploy | The audit commit (`26923ea`) isn't pushed to GitHub, so Vercel would deploy the old, buggy code. | Push after these fixes. | **Neil approves** |
| 11 | Advice (client) | The Vapi public key is in the browser bundle by design, so anyone can copy it and start calls billed to the client. | Client restricts the key to allowed origins in the Vapi dashboard. Vapi is out of scope for us. | Client |
| — | Deferred | No Content-Security-Policy yet. | Unchanged: build it from a real voice call's network log (After-Vapi item 1). | Later |

**Fix status (2026-09-27), re-tested against a fresh production build:**
- ✅ **#3 Childline link**: now in the rendered footer.
- ✅ **#4 Supreme Court link**: new URL in the bundle, old one gone.
- ✅ **#5 full payload**: a test report kept `analysis` and `recordingUrl` in `raw` (row deleted).
- ✅ **#7 constant-time secret**: no auth, wrong secret and wrong scheme → 401; Bearer and legacy
  header → 200.
- ✅ **#8 `X-Powered-By`**: gone.
- ✅ **#9 rate limiter**: still returns 429 after 5 attempts. 5,100 distinct IPs pushed it past the pruning threshold with no errors. (Nothing was stale yet, so the delete branch didn't remove anything; that part is verified by reading the code only.)
- ✅ Type-check, lint and a clean build all pass.
- ⏳ **#1** Neil runs `0005_drop_anon_insert.sql`. Then Claude re-runs the anon-insert attack, which
  should now fail with 401.
- ⏳ **#2** Neil runs `0004`; **#6** Neil turns off Supabase sign-ups; **#10** Neil OKs the push.
- ⏳ **#11** Suggest to the client: restrict the Vapi public key to the site's domains.

---

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
- [x] Commit the audit changes (done 2026-09-27 as `26923ea`, not yet pushed).

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
- [ ] The two remaining `TODO(neil)` items: the WhatsApp link, one video ID. (Contact email is
      settled: `kiro.contact11@gmail.com`.)
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

1. *(Superseded: see "Before you deploy" at the top.)* Neil: Vercel as kiro.contact11 → import
   `kirocontact11/vaani-app` → add the 4 required settings → Deploy.
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
2. Add a retention purge for `calls`: new `supabase/migrations/0006_calls_retention.sql` copying the
   `cron.schedule` pattern at `0001_init.sql:84-98`. The retention period comes from the client.
   Neil runs it; Claude checks `select * from cron.job`.

## Stage 6: `topic` / `escalated` (needs client sign-off, do last)

The safe way uses **Vapi's own Analysis feature** on the assistant: a structured-data schema such as
`{ topic: enum[the 6 site topics], escalated: boolean, escalation_type: enum[112,1098,1930,none] }`.
Vapi's model fills it in after each call using the client's own rules. There's still no guessing
rule on our side.
1. Neil/client agree on the schema and on what "escalated" means (client's decision, since it's
   about child safety). Neil adds it in the dashboard.
2. Claude: migration `0007` adds nullable `topic` and `escalated` columns; the route maps
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
- `supabase/migrations/0006_calls_retention.sql`: new (Stage 5)
- `supabase/migrations/0007_calls_analysis.sql` and `app/api/webhooks/vapi/route.ts`: only after
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
