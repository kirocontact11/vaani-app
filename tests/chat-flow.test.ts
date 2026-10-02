// Typed-chat flow, especially the safety path: every "urgent" follow-up must
// put the 1098 escalation panel on screen. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { KB, TOPIC_ALIAS, resolveTopicSlug } from "../lib/content/chat.ts";
import { URGENT_REPLY, buildMsgs, escalates, stepsFor, type ChatState } from "../lib/content/chat-flow.ts";

const at = (patch: Partial<ChatState>): ChatState => ({ mode: "anon", phase: "topics", topic: null, sub: null, mic: null, ...patch });
const activeStep = (s: ChatState) => stepsFor(s).findIndex((x) => x.bg !== "transparent");

test("every follow-up button leads somewhere the chat can render", () => {
  // A value outside this set renders nothing: that's how "They are threatening
  // me" once silently did nothing.
  for (const [key, entry] of Object.entries(KB)) {
    for (const [label, value] of entry.next) {
      assert.ok(["plan", "anger", "urgent", "menu"].includes(value), `${key} → "${label}" has unhandled value "${value}"`);
    }
  }
});

test("every urgent follow-up escalates, echoes what was tapped, and reassures", () => {
  let count = 0;
  for (const [topic, entry] of Object.entries(KB)) {
    for (const [label, value] of entry.next) {
      if (value !== "urgent") continue;
      count++;
      const s = at({ topic, sub: "urgent" });
      assert.ok(escalates(s), `${topic} → "${label}" must escalate`);
      const texts = buildMsgs(s).map((m) => m.text);
      assert.equal(texts.at(-2), label, `${topic}: echoes "${label}"`);
      assert.equal(texts.at(-1), URGENT_REPLY);
      assert.equal(activeStep(s), 3, `${topic}: step 4 (Escalation) highlighted`);
    }
  }
  assert.equal(count, 4, "bully, privacy, explicit, school each have one urgent follow-up");
});

test("the Urgent topic escalates on its own", () => {
  assert.ok(escalates(at({ topic: "urgent" })));
  assert.equal(activeStep(at({ topic: "urgent" })), 3);
});

test("ordinary topics and their plan/anger follow-ups do not escalate", () => {
  for (const topic of Object.keys(KB).filter((k) => !KB[k].escalate)) {
    for (const sub of [null, "plan", "anger", "menu"]) {
      assert.ok(!escalates(at({ topic, sub })), `${topic}/${sub} must not escalate`);
    }
  }
  assert.ok(!escalates(at({ topic: null, sub: "urgent" })), "no topic → nothing to escalate");
});

test("steps track progress: gate → topic list → answer", () => {
  assert.equal(activeStep(at({ phase: "gate", mode: null })), 0);
  assert.equal(activeStep(at({})), 1);
  assert.equal(activeStep(at({ topic: "gaming" })), 2);
});

test("messages build in order and stop where the user is", () => {
  assert.equal(buildMsgs(at({ mode: null })).length, 1, "gate: greeting only");
  const anon = buildMsgs(at({})).map((m) => m.text);
  assert.ok(anon[2].startsWith("Anonymous session started"));
  const named = buildMsgs(at({ mode: "named" })).map((m) => m.text);
  assert.ok(named[2].includes("booking page"));
  const answered = buildMsgs(at({ topic: "gaming" })).map((m) => m.text);
  assert.equal(answered.at(-2), KB.gaming.q);
  assert.equal(answered.at(-1), KB.gaming.a);
});

test("every /talk/<slug> link on the site resolves to a topic", () => {
  // The 6 hero chips on the home page (app/page.tsx HERO_CHIPS).
  for (const slug of ["screen-time", "gaming", "bullying", "privacy", "pornography", "incident"]) {
    assert.ok(resolveTopicSlug(slug), `/talk/${slug}`);
  }
  for (const slug of [...Object.keys(TOPIC_ALIAS), ...Object.keys(KB)]) assert.ok(resolveTopicSlug(slug), slug);
  for (const slug of ["", "voice", "unknown", "__proto__", "constructor"]) {
    assert.equal(resolveTopicSlug(slug), null, `"${slug}" must not resolve`);
  }
});

test.todo("each topic's 'plan' follow-up has its own answer (awaiting client content; all show the screen-time plan today)");
