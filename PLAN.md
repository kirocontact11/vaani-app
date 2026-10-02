# KIRO / Vaani — What's left

The live checklist. How everything works is in `CONTEXT.md`. The full audit history (findings,
test scenarios, decisions) lives in git history: everything up to commit `65bec37`.

Before any change: `npx tsc --noEmit && npx eslint . && npm test && npm run build`

## Before you deploy (must be done first)

1. Supabase SQL Editor: run `supabase/migrations/0004_experts_phone_optional.sql`, then
   `0005_drop_anon_insert.sql`. Live check 2026-10-02: **neither has run yet.** Until 0004 runs,
   email-only registrations fail; until 0005 runs, anyone with the anon key can write straight into
   `experts`/`appointments`.
2. Supabase → Authentication → Sign In / Providers → turn **off** "Allow new users to sign up"
   (still on).
3. Vercel, signed in as **kiro.contact11@gmail.com** via "Continue with GitHub" (the
   `kirocontact11` account) → import `kirocontact11/vaani-app` → add these settings → Deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPI_PUBLIC_KEY`,
     `VAPI_WEBHOOK_SECRET` (from `.env.local`)
   - `NEXT_PUBLIC_SITE_URL` = the new `https://….vercel.app` address, **until `kirohelp.com` points
     at Vercel**. Today `kirohelp.com` doesn't load at all, so share previews, the sitemap and
     canonical links would point at a dead site. This value is read at build time, so redeploy
     after changing it.
4. Run the smoke test against the live address:
   `BASE_URL=https://<address> VAPI_WEBHOOK_SECRET=<secret> NEXT_PUBLIC_VAPI_PUBLIC_KEY=<key> npm run test:smoke`

## After deploy: every remaining task

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

## Known limits (deliberate)

- The webhook's duplicate check is check-then-insert. Two copies of the same report arriving within
  milliseconds could both be stored. Vapi doesn't document retries at all, and a sequential re-send
  is handled, so I didn't add a unique index and a migration for that edge.
- **Dashboard check, not code (post-deploy #3):** the Server URL is set on the client's assistant,
  so it applies to *every* call that assistant handles. If the assistant has tools that rely on that
  URL, their calls would reach our webhook, get `{ignored}` back, and the tools would fail. Calls
  from other channels (e.g. a phone number) would also be logged in our table.

## Notes for later work

- **Topic / escalation tagging (task 14):** use Vapi's own Analysis (structured data) on the
  assistant, with the client's definition of "escalated". No guessing heuristic on our side. Every
  call's full payload is stored in `calls.raw`, so older calls can be filled in later with one SQL
  `update`.
- **Next migrations:** `0006_calls_retention.sql` (copy the `cron.schedule` pattern in
  `0001_init.sql`, with the client's retention period), then `0007` for the topic/escalated columns.

## Account status

All under **kiro.contact11@gmail.com** except Vapi:
- **GitHub** ✅ `kirocontact11/vaani-app`, with `main` as the only branch.
- **Supabase** ✅ `kiro.contact11@gmail.com's Org`.
- **Site contact email** ✅ `kiro.contact11@gmail.com`.
- **Vercel** ⏳ not created yet.
- **Resend** ⏳ only when email is switched on.
- **Vapi** stays on the client's account (decided 2026-09-27).
- Git commits are authored as `neilrojindar@gmail.com`, the local git identity.
