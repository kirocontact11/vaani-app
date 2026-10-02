// How the voice widget reacts to each error the Vapi SDK can emit
// (lib/vapi.ts). Error shapes copied from @vapi-ai/web 2.7's source.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyCallError } from "../lib/vapi.ts";

const daily = (type: string) => ({
  type: "daily-error",
  // serializeError turns Daily's plain-object event into this shape: note that
  // `message` is an object, which is how "[object Object]" once reached the UI.
  error: { message: { type }, errorMsg: "Meeting has ended", error: { type, msg: "x" } },
});

test("non-critical SDK errors don't end the call", () => {
  for (const type of [
    "audio-processing-setup-error",
    "audio-processor-recovery-error", // e.g. Krisp's "KrispInitError: Canceled"
    "audio-observer-setup-error",
    "video-recording-setup-error",
    "something-new-from-a-future-sdk",
  ]) {
    assert.deepEqual(classifyCallError({ type }), { kind: "non-fatal" }, type);
  }
  assert.deepEqual(classifyCallError(null), { kind: "non-fatal" });
  assert.deepEqual(classifyCallError(undefined), { kind: "non-fatal" });
  assert.deepEqual(classifyCallError({}), { kind: "non-fatal" });
});

test("Vaani hanging up (Daily 'ejected') is a normal end, not a failure", () => {
  assert.deepEqual(classifyCallError(daily("ejected")), { kind: "ended" });
});

test("a dropped connection gets its own plain-language message", () => {
  const r = classifyCallError(daily("connection-error"));
  assert.equal(r.kind, "failed");
  assert.match(r.kind === "failed" ? r.message : "", /connection dropped/);
});

test("every other fatal error fails with a friendly message, never raw SDK text", () => {
  for (const e of [
    { type: "start-method-error", error: { message: "Request failed with status 400" } },
    { type: "daily-call-join-error", error: { message: "join failed" } },
    { type: "daily-call-object-creation-error" },
    { type: "validation-error" },
    { type: "reconnect-error" },
    daily("meeting-full"),
    daily("exp-room"),
  ]) {
    const r = classifyCallError(e);
    assert.equal(r.kind, "failed", e.type);
    const msg = r.kind === "failed" ? r.message : "";
    assert.match(msg, /^Couldn't reach Vaani right now\./, e.type);
    assert.doesNotMatch(msg, /\[object|status \d|join failed/);
  }
});
