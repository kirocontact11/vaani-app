"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Vapi from "@vapi-ai/web";
import { KB } from "@/lib/content/chat";
import {
  buildMsgs,
  escalates,
  stepsFor,
  type ChatState,
  type InitialChatState,
  type Msg,
} from "@/lib/content/chat-flow";
import { CONNECT_TIMEOUT_MS, VAPI_ASSISTANT_ID, classifyCallError, type VapiErrorEvent } from "@/lib/vapi";

type CallPhase = "idle" | "connecting" | "live";

// Opens the user's own email client with the conversation so far, pre-filled
// as the body — no backend, no email capture needed. They address it to
// whichever inbox they want, same fallback pattern every other form on this
// site already uses when there's no real endpoint to POST to.
function emailTranscript(msgs: Msg[]) {
  const body = msgs.map((m) => m.text).join("\n\n");
  const subject = "My conversation with Vaani — KIRO";
  location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function TalkChat({ initial }: { initial: InitialChatState }) {
  const [state, setState] = useState<ChatState>({
    mode: initial.mode ?? null,
    phase: initial.phase ?? "gate",
    topic: initial.topic ?? null,
    sub: null,
    mic: initial.mic ?? null,
  });
  const [micError, setMicError] = useState("");
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const vapiRef = useRef<Vapi | null>(null);
  // The call's real lifecycle. SDK listeners are attached once, so they read
  // this ref (always current) to decide whether an event still applies to
  // what the user asked for; `mic` state only drives what's on screen.
  const callPhaseRef = useRef<CallPhase>("idle");
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (patch: Partial<ChatState>) => setState((s) => ({ ...s, ...patch }));

  const stopCall = () => {
    callPhaseRef.current = "idle";
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = null;
    vapiRef.current?.stop().catch(() => {});
    setAssistantSpeaking(false);
    setLocalAudioLevel(0);
    set({ mic: null });
  };
  const restart = () => {
    stopCall();
    setState((s) => ({ ...s, phase: "gate", mode: null, topic: null, sub: null, mic: null }));
  };

  // One Vapi instance for the component's lifetime.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;
    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    const clearConnectTimer = () => {
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    };
    const fail = (message: string) => {
      callPhaseRef.current = "idle";
      clearConnectTimer();
      vapi.stop().catch(() => {});
      setAssistantSpeaking(false);
      setLocalAudioLevel(0);
      setMicError(message);
      setState((s) => ({ ...s, mic: "error" }));
    };

    // Dev-only: per-stage timings so a slow connect can be measured, not guessed at.
    if (process.env.NODE_ENV !== "production") {
      vapi.on("call-start-progress", (p) =>
        console.info(`[vaani] ${p.stage} ${p.status}${p.duration != null ? ` ${p.duration}ms` : ""}`)
      );
    }
    vapi.on("call-start", () => {
      // Cancelled, restarted or left while connecting: start() doesn't abort
      // on its own, so don't let the call go live behind the user's back.
      if (callPhaseRef.current !== "connecting") {
        vapi.stop().catch(() => {});
        return;
      }
      if (process.env.NODE_ENV !== "production") console.timeEnd("[vaani] click → listening");
      callPhaseRef.current = "live";
      clearConnectTimer();
      setMicError("");
      setState((s) => ({ ...s, mic: "live" }));
    });
    vapi.on("call-end", () => {
      // A real failure while connecting always arrives as a fatal `error`
      // first (which sets the phase to idle), so an end event now is left over
      // from tearing down a previous call.
      if (callPhaseRef.current === "connecting") return;
      callPhaseRef.current = "idle";
      clearConnectTimer();
      setAssistantSpeaking(false);
      setLocalAudioLevel(0);
      // Keep an error panel on screen; otherwise return to typed chat.
      setState((s) => (s.mic === "error" ? s : { ...s, mic: null }));
    });
    vapi.on("speech-start", () => setAssistantSpeaking(true));
    vapi.on("speech-end", () => setAssistantSpeaking(false));
    // Shows whether the mic is producing signal at all — tells "Vaani can't
    // hear me" apart from a mic hardware/permission problem.
    vapi.on("local-volume-level", (level) => setLocalAudioLevel(level));
    vapi.on("error", (err: VapiErrorEvent) => {
      if (callPhaseRef.current === "idle") return;
      const outcome = classifyCallError(err);
      if (outcome.kind === "non-fatal") {
        console.warn("[vaani] non-fatal call error, call continues:", err);
        return;
      }
      if (outcome.kind === "ended") {
        callPhaseRef.current = "idle";
        clearConnectTimer();
        setState((s) => ({ ...s, mic: null }));
        return;
      }
      console.error("[vaani] call failed:", err);
      fail(outcome.message);
    });
    // Daily's naming: this fires for microphone/device failures, not just
    // cameras (confirmed in the SDK source). The call can't work without audio.
    vapi.on("camera-error", (err) => {
      if (callPhaseRef.current === "idle") return;
      console.error("[vaani] microphone failed:", err);
      fail("Your microphone couldn't be used for the call. Check it isn't in use by another app, then try again.");
    });

    return () => {
      // start() may still be running; startCall stops it once it returns.
      callPhaseRef.current = "idle";
      clearConnectTimer();
      vapi.stop().catch(() => {});
      vapi.removeAllListeners();
      vapiRef.current = null;
    };
  }, []);

  const startCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) {
      setMicError("Voice isn't available right now.");
      set({ mic: "error" });
      return;
    }
    // Already connecting or live — e.g. a double tap on Allow.
    if (callPhaseRef.current !== "idle") return;
    callPhaseRef.current = "connecting";
    setMicError("");
    set({ mic: "connecting" });
    if (process.env.NODE_ENV !== "production") console.time("[vaani] click → listening");

    // Request the mic directly via the standard browser API before handing
    // off to Vapi/Daily. This is the most reliable way to actually trigger
    // the browser's permission prompt, and it gives the real underlying
    // reason (denied / no device / in use elsewhere / insecure page) instead
    // of Vapi's one generic message for every failure mode.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // Daily opens its own.
    } catch (err) {
      if (callPhaseRef.current !== "connecting") return; // cancelled meanwhile
      const name = err instanceof DOMException ? err.name : "";
      // Chrome uses the same NotAllowedError for an OS-level block; only the message differs.
      const systemBlocked = err instanceof Error && /by system/i.test(err.message);
      const message =
        name === "NotAllowedError" && systemBlocked
          ? "Your computer is blocking this browser from using the microphone. On Mac: System Settings → Privacy & Security → Microphone → turn this browser on, then quit and reopen the browser."
          : name === "NotAllowedError"
          ? "Microphone permission is blocked for this site. Click the padlock icon next to the address bar → Site settings → Microphone → Allow, then reload the page. On Mac, also check System Settings → Privacy & Security → Microphone has this browser turned on."
          : name === "NotFoundError"
            ? "No microphone was found on this device."
            : name === "NotReadableError"
              ? "Your microphone is already in use by another app or browser tab — close it and try again."
              : name === "SecurityError"
                ? "This page must be loaded over HTTPS (or localhost) to use the microphone."
                : `Couldn't access the microphone (${name || "unknown error"}).`;
      callPhaseRef.current = "idle";
      setMicError(message);
      set({ mic: "error" });
      return;
    }
    // Cancelled while the browser's permission prompt was open.
    if (callPhaseRef.current !== "connecting") return;

    // start() can hang or return null without any error event; don't leave
    // the parent watching "Connecting…" forever.
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    connectTimerRef.current = setTimeout(() => {
      connectTimerRef.current = null;
      if (callPhaseRef.current !== "connecting") return;
      callPhaseRef.current = "idle";
      vapi.stop().catch(() => {});
      setMicError("Vaani is taking too long to answer. Please try again in a moment.");
      set({ mic: "error" });
    }, CONNECT_TIMEOUT_MS);

    try {
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch {
      // Only input validation throws, and it also emits a fatal `error` event.
    }
    // Cancelled, restarted or unmounted while start() was still setting up.
    // (Cast: TS narrows the ref above and can't see the await changing it.)
    if ((callPhaseRef.current as CallPhase) === "idle") vapi.stop().catch(() => {});
  };

  const k = state.topic ? KB[state.topic] : null;
  const anon = state.mode === "anon";
  const msgs = buildMsgs(state);
  const steps = stepsFor(state);

  const showBookLink = state.mode === "named";
  const showEscalate = escalates(state);
  const showClose = !!(state.sub && state.sub !== "menu");
  const bannerText = k ? `Topic: ${k.label}` : "Screen time, gaming, pornography, bullying, privacy, incidents, urgent";
  const modeLabel = state.mode ? (anon ? "Anonymous" : "Sharing details") : "Awaiting choice";
  const replyLabel = !state.mode ? "Choose one to continue" : state.topic ? "Follow-ups" : "What is this about?";

  const replies: { t: string; primary: boolean; onClick: () => void }[] = !state.mode
    ? [
        { t: "Stay anonymous", primary: true, onClick: () => set({ mode: "anon", phase: "topics" }) },
        { t: "Share my details", primary: false, onClick: () => set({ mode: "named", phase: "topics" }) },
      ]
    : !state.topic
      ? Object.keys(KB).map((key) => ({
          t: KB[key].label,
          primary: key === "urgent",
          onClick: () => set({ topic: key, sub: null }),
        }))
      : k!.next.map(([label, value]) => ({
          t: label,
          primary: value === "urgent",
          onClick: () => (value === "menu" ? set({ topic: null, sub: null }) : set({ sub: value })),
        }));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-17.5 pt-6.5 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-3.5">
        <div className="flex items-center gap-2.75">
          <span className="font-heading text-[19px] font-semibold tracking-[0.04em]">
            KIRO — KEEP IT REAL ONLINE
          </span>
          <Link href="/" className="border-l border-line pl-3 text-[13px] text-muted">
            ← back to site
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          {state.mic === null && (
            <button
              type="button"
              onClick={() => set({ mic: "ask" })}
              className="rounded-lg bg-accent px-4 py-2.25 text-[13.5px] font-bold text-accent-ink"
            >
              🎙 Talk to Vaani
            </button>
          )}
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border-[1.5px] border-line px-4 py-2.25 text-[13.5px] font-bold"
          >
            Restart flow
          </button>
          <a href="tel:1098" className="rounded-lg bg-alert px-4.5 py-2.5 text-[13.5px] font-bold text-white">
            Need help now
          </a>
        </div>
      </header>

      <div className="mt-6.5 flex flex-wrap items-start gap-6">
        <aside className="max-w-[290px] flex-[1_1_240px] rounded-[14px] border border-line bg-surface p-5.5">
          <div className="font-heading text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">
            How Vaani works
          </div>
          <div className="mt-3.5 flex flex-col gap-0.5">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-3 rounded-lg px-3 py-2.75"
                style={{ background: s.bg }}
              >
                <div
                  className="grid h-5.5 w-5.5 flex-none place-items-center rounded-full font-heading text-[11.5px] font-semibold"
                  style={{ background: s.dot, color: s.dotFg }}
                >
                  {s.n}
                </div>
                <div>
                  <div className="text-[14.5px] font-bold" style={{ color: s.fg }}>
                    {s.t}
                  </div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4.5 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">
            Anonymous mode means you give no name and no number. Ask us at any point what we
            keep — we&apos;ll tell you plainly.
          </div>
        </aside>

        <section className="flex min-h-[660px] flex-[6_1_340px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
          <div
            className="flex flex-wrap items-center gap-3 border-b border-line px-5.5 py-4.5"
            style={{ background: showEscalate ? "#F4F3EF" : "#FFFFFF" }}
          >
            <div className="min-w-0">
              <div className="font-heading text-[17px] font-medium">Speak to Vaani</div>
              <div className="text-[12.5px] text-muted">{bannerText}</div>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-md border border-line bg-page px-3 py-1.5 text-xs font-bold">
              <span
                className="h-1.75 w-1.75 rounded-full"
                style={{ background: state.mode ? "#2F5D50" : "#C0392B" }}
              />
              {modeLabel}
            </div>
          </div>

          {state.mic === "ask" && (
            <div className="mx-5.5 mt-6 flex flex-wrap items-center gap-5 rounded-xl border border-line bg-tint p-6">
              <div className="grid h-13.5 w-13.5 flex-none place-items-center rounded-full bg-accent">
                <div className="h-5.5 w-3.5 rounded-full bg-white" />
              </div>
              <div className="min-w-[220px] flex-1">
                <div className="font-heading text-lg font-medium">Use your microphone?</div>
                <div className="mt-1 text-[14.5px] leading-snug text-muted">
                  Speak instead of typing. You can switch back to the keyboard at any time.
                </div>
              </div>
              <div className="flex flex-wrap gap-2.25">
                <button
                  type="button"
                  onClick={startCall}
                  className="rounded-lg bg-accent px-5 py-3 text-[14.5px] font-bold text-accent-ink"
                >
                  Allow
                </button>
                <button
                  type="button"
                  onClick={() => set({ mic: null })}
                  className="rounded-lg border-[1.5px] border-line bg-surface px-5 py-3 text-[14.5px] font-bold"
                >
                  I&apos;ll type instead
                </button>
              </div>
            </div>
          )}
          {state.mic === "connecting" && (
            <div className="mx-5.5 mt-6 flex flex-wrap items-center gap-4.5 rounded-xl bg-ink/70 p-5.5 text-white">
              <div className="grid h-11.5 w-11.5 flex-none animate-pulse place-items-center rounded-full bg-accent">
                <div className="h-[19px] w-3 rounded-full bg-white" />
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="font-heading text-[18px] font-medium">Connecting…</div>
                <div className="mt-0.75 text-[14.5px] leading-snug text-[#FFFFFFCC]">
                  One moment while we reach Vaani.
                </div>
              </div>
              <button
                type="button"
                onClick={stopCall}
                className="rounded-lg bg-[#FFFFFF2E] px-4.5 py-2.75 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          )}
          {state.mic === "live" && (
            <div className="mx-5.5 mt-6 flex flex-wrap items-center gap-4.5 rounded-xl bg-ink/70 p-5.5 text-white">
              <div className="grid h-11.5 w-11.5 flex-none place-items-center rounded-full bg-accent">
                <div className="h-[19px] w-3 rounded-full bg-white" />
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="font-heading text-[18px] font-medium">
                  {assistantSpeaking ? "Vaani is speaking…" : "Listening…"}
                </div>
                <div className="mt-0.75 text-[14.5px] leading-snug text-[#FFFFFFCC]">
                  Speak in any Indian language. Take your time.
                </div>
                {!assistantSpeaking && (
                  <div className="mt-2 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-[#FFFFFF26]">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-100"
                      style={{ width: `${Math.min(100, localAudioLevel * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={stopCall}
                className="rounded-lg bg-[#FFFFFF2E] px-4.5 py-2.75 text-sm font-bold"
              >
                Stop
              </button>
            </div>
          )}
          {state.mic === "error" && (
            <div className="mx-5.5 mt-6 flex flex-wrap items-center gap-5 rounded-xl border border-alert bg-tint p-6">
              <div className="min-w-[220px] flex-1">
                <div className="font-heading text-lg font-medium">Couldn&apos;t connect</div>
                <div className="mt-1 text-[14.5px] leading-snug text-muted">
                  {micError || "Check your microphone permission and try again."}
                </div>
              </div>
              <div className="flex flex-wrap gap-2.25">
                <button
                  type="button"
                  onClick={startCall}
                  className="rounded-lg bg-accent px-5 py-3 text-[14.5px] font-bold text-accent-ink"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => set({ mic: null })}
                  className="rounded-lg border-[1.5px] border-line bg-surface px-5 py-3 text-[14.5px] font-bold"
                >
                  I&apos;ll type instead
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-3.25 overflow-hidden p-5.5">
            {msgs.map((m, i) => (
              <div
                key={i}
                className="max-w-[var(--max)] whitespace-pre-line text-[15px] leading-relaxed"
                style={{
                  alignSelf: m.align,
                  ["--max" as string]: m.max,
                  background: m.bg,
                  color: m.fg,
                  border: `1px solid ${m.border}`,
                  borderRadius: m.radius,
                  padding: "14px 17px",
                }}
              >
                {m.text}
              </div>
            ))}

            {showBookLink && (
              <div className="self-stretch rounded-xl border border-line bg-tint p-5">
                <div className="font-heading text-[17px] font-medium">Want a call back?</div>
                <div className="mt-1 text-[13px] leading-relaxed text-muted">
                  Share your details on our booking page — a real counsellor will follow up.
                  Vaani can keep helping right here in the meantime.
                </div>
                <Link
                  href="/book"
                  target="_blank"
                  className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[14.5px] font-bold text-accent-ink"
                >
                  Go to booking page →
                </Link>
              </div>
            )}

            {showEscalate && (
              <div className="self-stretch rounded-xl bg-ink p-6 text-white">
                <div className="font-heading text-[11.5px] font-medium uppercase tracking-[0.16em] text-[#FFFFFFB3]">
                  Handing you to a human
                </div>
                <div className="mt-2 font-heading text-[clamp(28px,3.4vw,38px)] font-semibold leading-[1.05]">
                  Call 1098 now
                </div>
                <p className="mt-2.5 max-w-[52ch] text-[15px] leading-relaxed text-[#FFFFFFD9]">
                  CHILDLINE India — free, 24×7, any language. A child can call it themselves. If
                  there is immediate physical danger, call 112.
                </p>
                <div className="mt-4.5 flex flex-wrap gap-2.25">
                  <a href="tel:1098" className="rounded-lg bg-alert px-5 py-3 text-[14.5px] font-bold text-white">
                    Call 1098
                  </a>
                  <Link href="/book" className="rounded-lg bg-white px-5 py-3 text-[14.5px] font-bold text-ink">
                    Request a counsellor call-back
                  </Link>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener"
                    className="rounded-lg bg-[#FFFFFF1F] px-5 py-3 text-[14.5px] font-bold text-white"
                  >
                    Report on Cyber Crime Portal
                  </a>
                </div>
              </div>
            )}

            {showClose && (
              <div className="flex flex-wrap items-center gap-4 self-stretch rounded-xl border border-line bg-tint p-5">
                <div className="min-w-[240px] flex-1">
                  <div className="font-heading text-[17px] font-medium">
                    {anon ? "Nothing was asked of you" : "Nothing from this chat is saved"}
                  </div>
                  <div className="mt-1 text-sm leading-snug text-muted">
                    {anon
                      ? "You gave no name and no number. Screenshot anything you want to keep."
                      : "Email it to yourself below, or book a call back and a counsellor will follow up."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => emailTranscript(msgs)}
                    className="rounded-lg border-[1.5px] border-line bg-surface px-4 py-2.75 text-[13.5px] font-bold"
                  >
                    Email me this
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="rounded-lg bg-accent px-4 py-2.75 text-[13.5px] font-bold text-accent-ink"
                  >
                    Ask something else
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-page px-5.5 pb-5.5 pt-4.5">
            <div className="font-heading text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">
              {replyLabel}
            </div>
            <div className="mt-3 flex flex-wrap gap-2.25">
              {replies.map((r) => (
                <button
                  key={r.t}
                  type="button"
                  onClick={r.onClick}
                  className="rounded-lg px-4.5 py-2.75 text-sm font-bold transition-transform hover:-translate-y-0.5"
                  style={{
                    background: r.primary ? "#2F5D50" : "#FFFFFF",
                    color: r.primary ? "#FFFFFF" : "#1A1A1A",
                    border: `1.5px solid ${r.primary ? "#2F5D50" : "#E8E6E1"}`,
                  }}
                >
                  {r.t}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
