"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Vapi from "@vapi-ai/web";
import { KB, PLAN } from "@/lib/content/chat";
import { VAPI_ASSISTANT_ID } from "@/lib/vapi";

type Mode = "anon" | "named" | null;
type Phase = "gate" | "topics";
type Mic = "ask" | "connecting" | "live" | "error" | null;

interface ChatState {
  mode: Mode;
  phase: Phase;
  topic: string | null;
  sub: string | null;
  mic: Mic;
}

export interface InitialChatState {
  mode?: Mode;
  phase?: Phase;
  topic?: string | null;
  mic?: Mic;
}

interface Msg {
  text: string;
  align: "flex-start" | "flex-end" | "center";
  max: string;
  bg: string;
  fg: string;
  border: string;
  radius: string;
}

const STEP_DEFS: [string, string, string][] = [
  ["1", "Identity choice", "Anonymous, or share details"],
  ["2", "What is going on", "Seven areas in the knowledge base"],
  ["3", "Grounded answer", "India-specific, plain language"],
  ["4", "Escalation", "Helpline, counsellor or report"],
];

function buildMsgs(s: ChatState): Msg[] {
  const out: Msg[] = [];
  const bot = (text: string) =>
    out.push({ text, align: "flex-start", max: "86%", bg: "#F4F3EF", fg: "#1A1A1A", border: "#E8E6E1", radius: "12px 12px 12px 4px" });
  const me = (text: string) =>
    out.push({ text, align: "flex-end", max: "74%", bg: "#2F5D50", fg: "#FFFFFF", border: "#2F5D50", radius: "12px 12px 4px 12px" });
  const note = (text: string) =>
    out.push({ text, align: "center", max: "92%", bg: "#FFFFFF", fg: "#6B6B6B", border: "#E8E6E1", radius: "999px" });

  bot(
    "Hi, I’m Vaani. Ask me about whatever is going on — screens, gaming, bullying, a stranger, an incident at school. First though: do you want to share your details, or stay anonymous?"
  );
  if (!s.mode) return out;
  me(s.mode === "anon" ? "Stay anonymous" : "Share my details");
  if (s.mode === "anon") {
    note("Anonymous session started. You have given no name and no number.");
  } else {
    note("Want a call back? Share your details on the booking page below — Vaani can still help right now too.");
  }

  bot("What is going on? Pick whatever is closest.");
  if (!s.topic) return out;
  const k = KB[s.topic];
  me(k.q);
  bot(k.a);
  if (s.sub === "plan") {
    me("Yes, give me that");
    bot(PLAN.a);
  }
  if (s.sub === "anger") {
    me("He gets angry when I stop him");
    bot(PLAN.anger);
  }
  if (s.sub === "urgent") {
    me(k.next.find(([, v]) => v === "urgent")?.[0] ?? "This is urgent");
    bot("Thank you for telling me — you have done nothing wrong. This needs a real person today, so here is who to call right now.");
  }
  return out;
}

// Opens the user's own email client with the conversation so far, pre-filled
// as the body — no backend, no email capture needed. They address it to
// whichever inbox they want, same fallback pattern every other form on this
// site already uses when there's no real endpoint to POST to.
function emailTranscript(msgs: Msg[]) {
  const body = msgs.map((m) => m.text).join("\n\n");
  const subject = "My conversation with Vaani — KIRO";
  location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function stepsFor(s: ChatState) {
  const stage = s.phase === "gate" ? 0 : !s.topic ? 1 : KB[s.topic]?.escalate || s.sub === "urgent" ? 3 : 2;
  return STEP_DEFS.map(([n, t, d], i) => ({
    n,
    t,
    d,
    bg: i === stage ? "#F4F3EF" : "transparent",
    fg: i <= stage ? "#1A1A1A" : "#6B6B6B",
    dot: i <= stage ? "#2F5D50" : "#E8E6E1",
    dotFg: i <= stage ? "#FFFFFF" : "#6B6B6B",
  }));
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
  // Daily fires a trailing "meeting ended" error after every hang-up; errors
  // outside an active call must not flip the UI to the error panel.
  const callActiveRef = useRef(false);

  const set = (patch: Partial<ChatState>) => setState((s) => ({ ...s, ...patch }));
  const restart = () => {
    callActiveRef.current = false;
    vapiRef.current?.stop().catch(() => {});
    setState((s) => ({ ...s, phase: "gate", mode: null, topic: null, sub: null, mic: null }));
  };

  // One Vapi instance for the component's lifetime; listeners are attached
  // once and read the latest state via refs rather than being re-attached
  // on every render.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;
    const vapi = new Vapi(key);
    vapiRef.current = vapi;

    // Dev-only: per-stage timings so a slow connect can be measured, not guessed at.
    if (process.env.NODE_ENV !== "production") {
      vapi.on("call-start-progress", (p) =>
        console.info(`[vaani] ${p.stage} ${p.status}${p.duration != null ? ` ${p.duration}ms` : ""}`)
      );
    }
    vapi.on("call-start", () => {
      if (process.env.NODE_ENV !== "production") console.timeEnd("[vaani] click → listening");
      setMicError("");
      setState((s) => ({ ...s, mic: "live" }));
    });
    vapi.on("call-end", () => {
      callActiveRef.current = false;
      setAssistantSpeaking(false);
      setLocalAudioLevel(0);
      setState((s) => ({ ...s, mic: null }));
    });
    vapi.on("speech-start", () => setAssistantSpeaking(true));
    vapi.on("speech-end", () => setAssistantSpeaking(false));
    // Real feedback on whether the mic is actually producing signal — without
    // this there's no way to tell "the assistant can't hear me" apart from
    // "the mic hardware/permission is the actual problem."
    vapi.on("local-volume-level", (level) => setLocalAudioLevel(level));
    const onError = (err: unknown) => {
      if (!callActiveRef.current) return;
      callActiveRef.current = false;
      // SDK payload is { type, error: { message } }, not a top-level message.
      const e = err as { message?: unknown; error?: { message?: unknown; errorMsg?: unknown } } | null;
      const detail = e?.error?.message ?? e?.error?.errorMsg ?? e?.message;
      const message = detail ? String(detail) : "Something went wrong with the call.";
      setMicError(message);
      setState((s) => ({ ...s, mic: "error" }));
    };
    vapi.on("error", onError);
    vapi.on("call-start-failed", onError);
    // Daily's own naming: this fires for audio device failures too, not just
    // video — this is the actual channel a denied mic permission comes
    // through, confirmed by reading the SDK's source rather than guessing.
    vapi.on("camera-error", () => {
      callActiveRef.current = false;
      setMicError("Microphone access was denied. Please allow microphone permission and try again.");
      setState((s) => ({ ...s, mic: "error" }));
    });

    return () => {
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
    set({ mic: "connecting" });
    callActiveRef.current = true;
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
      callActiveRef.current = false;
      setMicError(message);
      set({ mic: "error" });
      return;
    }

    vapi.start(VAPI_ASSISTANT_ID).catch((err: unknown) => {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Couldn't start the call — check your microphone permission.";
      callActiveRef.current = false;
      setMicError(message);
      set({ mic: "error" });
    });
  };

  const stopCall = () => {
    callActiveRef.current = false;
    vapiRef.current?.stop().catch(() => {});
    set({ mic: null });
  };

  const k = state.topic ? KB[state.topic] : null;
  const anon = state.mode === "anon";
  const msgs = buildMsgs(state);
  const steps = stepsFor(state);

  const showBookLink = state.mode === "named";
  // A follow-up marked "urgent" (e.g. "They are threatening me") escalates too,
  // not just the Urgent topic itself.
  const showEscalate = !!(k && (k.escalate || state.sub === "urgent"));
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
