// Form + webhook validation: the exact rules /api/submit and
// /api/webhooks/vapi run (lib/validation.ts). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { submitSchema, vapiMessageSchema } from "../lib/validation.ts";

const psych = { kind: "psych", pname: "Dr A", qualification: "M.Phil", license: "RCI-1", city: "Pune", phone: "98", pconsent: true };
const cdc = { kind: "cdc", centre: "Sunrise CDC", person: "B", role: "Director", city: "Delhi", email: "b@x.in", consent: true };
const book = { kind: "book", bname: "Asha", bage: "9", bcity: "Mumbai", bphone: "98" };
const ok = (v: unknown) => submitSchema.safeParse(v).success;

test("a valid submission of each kind is accepted", () => {
  assert.ok(ok(psych));
  assert.ok(ok(cdc));
  assert.ok(ok(book));
});

test("every required field is enforced", () => {
  for (const [base, fields] of [
    [psych, ["pname", "qualification", "license", "city"]],
    [cdc, ["centre", "person", "role", "city"]],
    [book, ["bname", "bage", "bcity", "bphone"]],
  ] as const) {
    for (const f of fields) {
      assert.ok(!ok({ ...base, [f]: undefined }), `${base.kind}: missing ${f} must fail`);
      assert.ok(!ok({ ...base, [f]: "   " }), `${base.kind}: blank ${f} must fail`);
    }
  }
});

test("register forms need a phone OR an email, and either alone is enough", () => {
  for (const base of [psych, cdc]) {
    assert.ok(!ok({ ...base, phone: "", email: "" }), `${base.kind}: neither must fail`);
    assert.ok(!ok({ ...base, phone: "   ", email: "" }), `${base.kind}: spaces-only phone must not count`);
    assert.ok(ok({ ...base, phone: "98", email: "" }), `${base.kind}: phone only`);
    assert.ok(ok({ ...base, phone: "", email: "a@b.in" }), `${base.kind}: email only`);
  }
});

test("consent must be exactly true", () => {
  assert.ok(!ok({ ...psych, pconsent: false }));
  assert.ok(!ok({ ...psych, pconsent: "true" }));
  assert.ok(!ok({ ...cdc, consent: undefined }));
});

test("length caps: 200 for fields, 5000 for free text, 20 choices of 100 chars", () => {
  assert.ok(ok({ ...book, bname: "x".repeat(200) }));
  assert.ok(!ok({ ...book, bname: "x".repeat(201) }));
  assert.ok(ok({ ...book, bwhat: "x".repeat(5000) }));
  assert.ok(!ok({ ...book, bwhat: "x".repeat(5001) }));
  assert.ok(!ok({ ...cdc, note: "x".repeat(5001) }));
  assert.ok(!ok({ ...book, btime: Array(21).fill("Morning") }));
  assert.ok(!ok({ ...psych, specs: ["x".repeat(101)] }));
});

test("junk and unknown kinds are rejected", () => {
  for (const bad of [null, undefined, "x", 42, [], {}, { kind: "admin" }, { ...book, kind: "BOOK" }]) {
    assert.ok(!ok(bad), `must reject ${JSON.stringify(bad)}`);
  }
});

test("extra fields are stripped, so nobody can set status, id or prototype", () => {
  const raw = JSON.parse(`{"kind":"book","bname":"A","bage":"9","bcity":"P","bphone":"1",
    "status":"closed","id":"00000000-0000-0000-0000-000000000000","__proto__":{"polluted":true}}`);
  const r = submitSchema.safeParse(raw);
  assert.ok(r.success);
  assert.deepEqual(Object.keys(r.data).sort(), ["bage", "bcity", "blang", "bname", "bphone", "btime", "bwhat", "kind"]);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("values are trimmed before saving", () => {
  const r = submitSchema.safeParse({ ...book, bcity: "  Pune  " });
  assert.ok(r.success && r.data.kind === "book" && r.data.bcity === "Pune");
});

test("text is stored as typed (escaping happens at display time, not here)", () => {
  assert.ok(ok({ ...book, bname: "<script>alert(1)</script>" }));
});

test("vapi webhook: message.type is required, everything else optional", () => {
  assert.ok(vapiMessageSchema.safeParse({ message: { type: "status-update" } }).success);
  assert.ok(vapiMessageSchema.safeParse({ message: { type: "end-of-call-report", call: { id: "c1" }, artifact: { transcript: "hi" } } }).success);
  assert.ok(!vapiMessageSchema.safeParse({ message: {} }).success);
  assert.ok(!vapiMessageSchema.safeParse({}).success);
  assert.ok(!vapiMessageSchema.safeParse(null).success);
});
