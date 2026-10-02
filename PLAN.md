# KIRO / Vaani — What's left

**Live at https://mykiro.live** (Render Web Service, domain from GoDaddy). How everything works is in
`CONTEXT.md`. The full audit history (findings, test scenarios, decisions) is in git history, up to
commit `65bec37`.

Before any change: `npx tsc --noEmit && npx eslint . && npm test && npm run build`. Pushing to `main`
redeploys the site (~80 s).

## Verified live on 2026-10-02

| What | Result |
|---|---|
| Domain | `A @ → 216.24.57.1`, `www` CNAME, no AAAA. HTTPS certificate valid (Google Trust Services, expires 31 Dec 2026). `http` and `www` both redirect to `https://mykiro.live` ✅ |
| Smoke test on `mykiro.live` | 12/12: 21 pages, all links, 404s, security headers, contact links, site address, rate limit, both APIs, Vapi key in the build ✅ |
| All three forms through the live domain | Booking, email-only psychologist registration, and a centre listing all saved correctly; test rows deleted ✅ |
| Vapi webhook through the live domain | Wrong secret refused; a report saved with its full payload; a repeat skipped; test row deleted ✅ |
| Database vs the public key | Reads return nothing; inserts refused on all 3 tables; with a real row planted, anonymous update and delete affected **0 rows** and the row stayed unchanged ✅ |
| Migrations 0004 and 0005 | Run and verified ✅ |
| Form rate limit | **Was bypassable on Render** (8 faked IPs all got through). Now keyed on Cloudflare's `CF-Connecting-IP`: faked `X-Forwarded-For` is limited after 5; a faked `CF-Connecting-IP` is refused (403) by Cloudflare itself ✅ |
| Phone-width layout, `?tab=cdc`, voice page, urgent chat → 1098 panel | No sideways scroll, no console errors, mic prompt offered, escalation shown ✅ |
| Dependencies | `npm audit`: 0 vulnerabilities (Next.js 16.3.8) ✅ |

Not tested for lack of a microphone or phone: a real spoken call, and the 1098 button on a real phone.

## Still to do

| # | Task | Why | Who | Where |
|---|---|---|---|---|
| 1 | **Turn off public sign-ups**: Authentication → Sign In / Providers → "Allow new users to sign up" off → Save. Still on at last check. | The site has no logins; open sign-ups let strangers make your project send emails | Neil | Supabase (kiro.contact11) |
| 2 | **Vapi dashboard**: Server URL = `https://mykiro.live/api/webhooks/vapi`, Bearer credential = `VAPI_WEBHOOK_SECRET`, server messages = only `end-of-call-report`. **First check the assistant has no tools relying on its Server URL, and whether it also takes calls from other channels** (those would be logged too). | Without it no call is ever logged; with the wrong setup the client's tools break. The route itself is proven through this domain. | Neil | Vapi (client's) |
| 3 | **One real call** on https://mykiro.live/talk/voice in regular Chrome: hang up yourself, let Vaani end the call, and tap Cancel while it says "Connecting…". Each should return to the chat with no error. | The only part never tested with a real microphone | Neil (Claude checks the `calls` row) | — |
| 4 | Compare a real call's stored `raw` payload with what the code expects | Needed before topic/escalation tagging | Claude | Supabase |
| 5 | Real-phone test: 1098 button dials, voice on mobile data, forms, WhatsApp share preview | Desktop can't test `tel:` or the mobile mic | Neil | — |
| 6 | **Confirm the Render instance is not Free**, and which account owns it | Free instances sleep after 15 minutes (about a minute to wake) and Render says not to use them for production. A sleeping server can also miss Vapi's call report. | Neil | Render |
| 7 | Upgrade Supabase to Pro ($25/mo), or accept the risk | Free projects **pause after 1 week with no activity**; forms then fail until restored | Neil / client | Supabase (kiro.contact11) |
| 8 | Decide who reads submissions. Today nobody is notified; rows just appear in Supabase. Either check daily, or set up Resend under kiro.contact11 (`RESEND_API_KEY`, `NOTIFY_EMAIL` in Render, and change the sender from `onboarding@resend.dev` to a verified `mykiro.live` address). | A booking nobody sees is a parent nobody calls back | Neil / client | Resend |
| 9 | Content-Security-Policy, built from a real call's network log | Last missing security header; needs #3 first | Claude | — |
| 10 | Client content: per-topic chat answers, **privacy policy + consent on `/book`**, real news article links, the two placeholder cards, the eSafety YouTube link, WhatsApp link, one video ID | Shouldn't launch publicly without the first two | Client → Claude adds | — |
| 11 | Decisions: `calls` retention period, recording on/off, the "escalated" rule | DPDP data minimisation | Client | — |
| 12 | Ask the client to restrict the Vapi public key to `https://mykiro.live` | Stops others running up the call bill | Client | Vapi (client's) |
| 13 | Watch for 429s ("too many requests") from real users | 5 forms per 10 min per IP; many Indian mobile users share one IP | Neil | Render logs |
| 14 | **Handover**: give the client the kiro.contact11 login; confirm who owns the Render account and the GoDaddy domain; then rotate `SUPABASE_SERVICE_ROLE_KEY` and `VAPI_WEBHOOK_SECRET` (in Render and in the Vapi credential) | Only the client should hold working secrets | Neil + client | All |

## Known limits (deliberate)

- The webhook's duplicate check is check-then-insert. Two copies of the same report arriving within
  milliseconds could both be stored. Vapi doesn't document retries at all, and a sequential re-send
  is handled, so there is no unique index or migration for that edge.
- **Dashboard check, not code (task 2):** the Server URL is set on the client's assistant, so it
  applies to *every* call that assistant handles. If the assistant has tools that rely on that URL,
  their calls would reach our webhook, get `{ignored}` back, and the tools would fail. Calls from
  other channels (e.g. a phone number) would also be logged in our table.
- The rate limit is in memory, per server instance. It resets on every deploy and isn't shared if
  Render ever runs more than one instance.

## Notes for later work

- **Topic / escalation tagging (task 11):** use Vapi's own Analysis (structured data) on the
  assistant, with the client's definition of "escalated". No guessing heuristic on our side. Every
  call's full payload is stored in `calls.raw`, so older calls can be filled in later with one SQL
  `update`.
- **Next migrations:** `0006_calls_retention.sql` (copy the `cron.schedule` pattern in
  `0001_init.sql`, with the client's retention period), then `0007` for the topic/escalated columns.
- **Render settings:** Web Service, build `npm ci && npm run build`, start `npm start`,
  `NODE_VERSION=22`; env vars `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `VAPI_WEBHOOK_SECRET`. `NEXT_PUBLIC_SITE_URL` is optional (defaults
  to `https://mykiro.live`) and is read at build time.
- **Re-check the rate limit after any change of host.** Proxies differ in what they do with
  `X-Forwarded-For`: `npm run test:smoke` has a test for it (runs only against a deployed host).

## Account status

- **GitHub** ✅ `kirocontact11/vaani-app`, with `main` as the only branch.
- **Supabase** ✅ `kiro.contact11@gmail.com's Org`.
- **Site contact email** ✅ `kiro.contact11@gmail.com`.
- **Domain** `mykiro.live` on GoDaddy: whose account holds it is still to confirm (task 14).
- **Render** ⏳ confirm the account (task 6).
- **Resend** ⏳ only when email is switched on.
- **Vapi** stays on the client's account (decided 2026-09-27).
- Git commits are authored as `neilrojindar@gmail.com`, the local git identity.
