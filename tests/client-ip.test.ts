// Which IP the form rate limit counts against. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp } from "../lib/client-ip.ts";

const h = (o: Record<string, string>) => new Headers(o);

test("Cloudflare's header wins, so a faked X-Forwarded-For can't dodge the limit", () => {
  assert.equal(clientIp(h({ "cf-connecting-ip": "49.36.1.2", "x-forwarded-for": "6.6.6.6, 49.36.1.2" })), "49.36.1.2");
  assert.equal(clientIp(h({ "cf-connecting-ip": " 49.36.1.2 " })), "49.36.1.2");
});

test("without Cloudflare (local dev, Vercel) it uses the first X-Forwarded-For entry", () => {
  assert.equal(clientIp(h({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientIp(h({ "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");
});

test("with no proxy headers at all, everyone shares one 'unknown' bucket rather than crashing", () => {
  assert.equal(clientIp(h({})), "unknown");
  assert.equal(clientIp(h({ "cf-connecting-ip": "", "x-forwarded-for": "" })), "unknown");
});
