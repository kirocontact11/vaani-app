// Not a secret — just an identifier for which Vapi assistant to start.
// The client's already-configured assistant, "Keep It Real Parent Intake"
// (consent-first, multilingual, escalation rules for 112/1098/cybercrime.gov.in
// already built into its system prompt in the Vapi dashboard).
export const VAPI_ASSISTANT_ID = "ca7dccb0-96c6-4c0d-bacf-69322ac70096";

export const CONNECT_TIMEOUT_MS = 30_000;

// Error types the SDK (@vapi-ai/web 2.7) treats as ending or preventing the
// call. Every other `error` it emits (audio observer, noise cancellation,
// recording setup) is labelled non-critical in its source and the call keeps
// running, so the UI must keep running too.
const FATAL_CALL_ERRORS = new Set([
  "validation-error",
  "daily-call-object-creation-error",
  "daily-call-join-error",
  "start-method-error",
  "daily-error",
  "reconnect-error",
]);

// The SDK's error event: { type, error: { message, ... } }. For Daily errors
// `error` also carries Daily's own { errorMsg, error: { type } }, and
// `message` can be an object, so it's never shown to users as-is.
export interface VapiErrorEvent {
  type?: string;
  error?: { message?: unknown; errorMsg?: unknown; error?: { type?: string } };
}

export type CallPhase = "idle" | "connecting" | "live";

export type CallErrorOutcome =
  | { kind: "non-fatal" }
  | { kind: "ended" }
  | { kind: "failed"; message: string };

const COULD_NOT_REACH = "Couldn't reach Vaani right now. Please try again in a moment.";

export function classifyCallError(e: VapiErrorEvent | null | undefined, phase: CallPhase): CallErrorOutcome {
  if (!FATAL_CALL_ERRORS.has(e?.type ?? "")) return { kind: "non-fatal" };
  const dailyType = e?.error?.error?.type;
  // Vapi ending a call deletes the room, which Daily reports as "ejected".
  // Once live, that's Vaani hanging up: a normal end. Before the call is
  // live, it means Vapi couldn't start the assistant: a failure.
  if (dailyType === "ejected") return phase === "live" ? { kind: "ended" } : { kind: "failed", message: COULD_NOT_REACH };
  return {
    kind: "failed",
    message: dailyType === "connection-error" ? "The connection dropped. Check your internet and try again." : COULD_NOT_REACH,
  };
}
