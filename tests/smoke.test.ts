// Checks a RUNNING copy of the site from the outside: pages, links, security
// headers, and that both APIs refuse bad input. It never writes to the
// database, so it's safe to point at production.
//   BASE_URL=http://localhost:3000 npm run test:smoke
//   BASE_URL=https://<your-site> VAPI_WEBHOOK_SECRET=<secret> npm run test:smoke
// Skipped entirely when BASE_URL isn't set (e.g. plain `npm test`).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL?.replace(/\/$/, "");
const SECRET = process.env.VAPI_WEBHOOK_SECRET;
const skip = !BASE && "set BASE_URL to run smoke tests";
const get = (path: string, init?: RequestInit) => fetch(BASE + path, { redirect: "manual", ...init });
// Each run gets its own made-up IP. Locally that keeps the form rate limit
// (5 per 10 min) from carrying over between runs; Vercel ignores it and uses
// the real IP, so a 429 there just means the limiter is working.
const fakeIp = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
const post = (path: string, body: string, headers: Record<string, string> = {}) =>
  get(path, { method: "POST", body, headers: { "Content-Type": "application/json", "X-Forwarded-For": fakeIp, ...headers } });

const PAGES = [
  "/", "/videos", "/topics", "/community", "/register", "/register?tab=cdc", "/book",
  "/talk", "/talk/voice", "/talk/bullying", "/talk/urgent",
  "/topics/parental-controls", "/topics/grooming", "/topics/bullying",
  "/topics/sextortion", "/topics/screen-time", "/topics/gaming",
  "/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/opengraph-image",
];

test("every page loads", { skip }, async () => {
  for (const p of PAGES) assert.equal((await get(p)).status, 200, p);
});

test("unknown pages and secret files are 404", { skip }, async () => {
  for (const p of ["/does-not-exist", "/topics/not-a-topic", "/.env.local", "/.env", "/.git/config"]) {
    assert.equal((await get(p)).status, 404, p);
  }
});

test("security headers are set, and the framework isn't advertised", { skip }, async () => {
  const h = (await get("/")).headers;
  assert.equal(h.get("x-content-type-options"), "nosniff");
  assert.equal(h.get("x-frame-options"), "DENY");
  assert.equal(h.get("referrer-policy"), "strict-origin-when-cross-origin");
  // microphone=(self), not (): /talk/voice needs the mic.
  assert.equal(h.get("permissions-policy"), "camera=(), microphone=(self), geolocation=()");
  assert.match(h.get("strict-transport-security") ?? "", /max-age=\d+/);
  assert.equal(h.get("x-powered-by"), null);
});

test("every internal link on the main pages works", { skip }, async () => {
  const links = new Set<string>();
  for (const p of ["/", "/topics", "/videos", "/community", "/book", "/talk"]) {
    const html = await (await get(p)).text();
    for (const [, href] of html.matchAll(/href="(\/[^"#]*)/g)) if (!href.startsWith("/_next")) links.add(href.replace(/&amp;/g, "&"));
  }
  assert.ok(links.size > 15, `found ${links.size} links`);
  for (const href of links) assert.equal((await get(href)).status, 200, href);
});

test("contact details point at the project's addresses", { skip }, async () => {
  const html = await (await get("/")).text();
  assert.ok(html.includes("mailto:kiro.contact11@gmail.com"), "footer email");
  assert.ok(html.includes('href="tel:1098"'), "1098 emergency bar");
  assert.ok(html.includes("childlineindia.org/a/p/contact-us"), "Childline link");
});

test("robots.txt keeps crawlers out of /api and the sitemap lists every topic", { skip }, async () => {
  assert.match(await (await get("/robots.txt")).text(), /Disallow: \/api\//);
  const sitemap = await (await get("/sitemap.xml")).text();
  for (const t of ["parental-controls", "grooming", "bullying", "sextortion", "screen-time", "gaming"]) {
    assert.ok(sitemap.includes(`/topics/${t}`), t);
  }
});

test("form API refuses bad input without saving anything", { skip }, async () => {
  assert.equal((await get("/api/submit")).status, 405, "GET");
  // Every check below is invalid, so nothing can be written. 429 is also an
  // acceptable refusal: the rate limiter answering first.
  for (const [label, body] of [
    ["junk", "not json"],
    ["unknown kind", '{"kind":"admin"}'],
    ["oversized", JSON.stringify({ kind: "book", bname: "x".repeat(201), bage: "9", bcity: "x", bphone: "1" })],
  ]) {
    assert.ok([400, 429].includes((await post("/api/submit", body)).status), label);
  }
});

test("webhook rejects anyone without the secret", { skip }, async () => {
  assert.equal((await get("/api/webhooks/vapi")).status, 405, "GET");
  assert.equal((await post("/api/webhooks/vapi", "{}")).status, 401, "no auth");
  assert.equal((await post("/api/webhooks/vapi", "{}", { Authorization: "Bearer wrong" })).status, 401, "wrong secret");
  assert.equal((await post("/api/webhooks/vapi", "{}", { "X-Vapi-Secret": "wrong" })).status, 401, "wrong legacy secret");
});

test("webhook accepts the real secret (ignored message type: nothing saved)", { skip: skip || (!SECRET && "set VAPI_WEBHOOK_SECRET to run") }, async () => {
  const body = '{"message":{"type":"status-update"}}';
  const authVariants: Record<string, string>[] = [{ Authorization: `Bearer ${SECRET}` }, { "X-Vapi-Secret": SECRET! }];
  for (const headers of authVariants) {
    const r = await post("/api/webhooks/vapi", body, headers);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, ignored: "status-update" });
  }
});
