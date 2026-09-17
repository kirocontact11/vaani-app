"use client";

import { useState } from "react";
import Link from "next/link";
import { KB, PLAN } from "@/lib/content/chat";

type Mode = "anon" | "named" | null;
type Phase = "gate" | "form" | "topics";
type Mic = "ask" | "live" | null;

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
  ["2", "Consent and context", "Age, role, city — only if shared"],
  ["3", "What is going on", "Seven areas in the knowledge base"],
  ["4", "Grounded answer", "India-specific, plain language"],
  ["5", "Escalation", "Helpline, counsellor or report"],
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
  } else if (s.phase === "form") {
    bot("Thanks — four quick fields, all optional except the first.");
    return out;
  } else {
    note("Details saved. A counsellor can call you back if you ask.");
  }

  if (s.phase === "form") return out;
  bot("What is going on? Pick whatever is closest — you can also type it yourself.");
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
  return out;
}

function stepsFor(s: ChatState) {
  const stage =
    s.phase === "gate" ? 0 : s.phase === "form" ? 1 : !s.topic ? 2 : KB[s.topic]?.escalate ? 4 : 3;
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

  const set = (patch: Partial<ChatState>) => setState((s) => ({ ...s, ...patch }));
  const restart = () => setState((s) => ({ ...s, phase: "gate", mode: null, topic: null, sub: null }));

  const k = state.topic ? KB[state.topic] : null;
  const anon = state.mode === "anon";
  const msgs = buildMsgs(state);
  const steps = stepsFor(state);

  const showForm = state.phase === "form";
  const showEscalate = !!(k && k.escalate);
  const showClose = !!(state.sub && state.sub !== "menu");
  const bannerText = k ? `Topic: ${k.label}` : "Screen time, gaming, pornography, bullying, privacy, incidents, urgent";
  const modeLabel = state.mode ? (anon ? "Anonymous" : "Details shared") : "Awaiting choice";
  const replyLabel = !state.mode ? "Choose one to continue" : state.topic ? "Follow-ups" : "What is this about?";

  const replies: { t: string; primary: boolean; onClick: () => void }[] = !state.mode
    ? [
        { t: "Stay anonymous", primary: true, onClick: () => set({ mode: "anon", phase: "topics" }) },
        { t: "Share my details", primary: false, onClick: () => set({ mode: "named", phase: "form" }) },
      ]
    : state.phase === "form"
      ? [{ t: "Skip for now", primary: false, onClick: () => set({ phase: "topics" }) }]
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

        <main className="flex min-h-[660px] flex-[6_1_340px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface">
          <div
            className="flex flex-wrap items-center gap-3 border-b border-line px-5.5 py-4.5"
            style={{ background: k && k.escalate ? "#F4F3EF" : "#FFFFFF" }}
          >
            <div className="min-w-0">
              <div className="font-heading text-[17px] font-medium">Speak to Vaani</div>
              <div className="text-[12.5px] text-muted">{bannerText}</div>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-md border border-line bg-base px-3 py-1.5 text-xs font-bold">
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
                  onClick={() => set({ mic: "live" })}
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
          {state.mic === "live" && (
            <div className="mx-5.5 mt-6 flex flex-wrap items-center gap-4.5 rounded-xl bg-ink p-5.5 text-white">
              <div className="grid h-11.5 w-11.5 flex-none place-items-center rounded-full bg-accent">
                <div className="h-[19px] w-3 rounded-full bg-white" />
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="font-heading text-[18px] font-medium">Listening…</div>
                <div className="mt-0.75 text-[14.5px] leading-snug text-[#FFFFFFCC]">
                  Speak in any Indian language. Take your time.
                </div>
              </div>
              <button
                type="button"
                onClick={() => set({ mic: null })}
                className="rounded-lg bg-[#FFFFFF2E] px-4.5 py-2.75 text-sm font-bold"
              >
                Stop
              </button>
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

            {showForm && (
              <div className="self-stretch rounded-xl border border-line bg-tint p-5">
                <div className="font-heading text-[17px] font-medium">Your details</div>
                <div className="mt-1 text-[13px] text-muted">
                  Only used to follow up. You can delete it any time.
                </div>
                <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                  {["First name", "Age of the child", "City", "Phone (optional)"].map((ph) => (
                    <div
                      key={ph}
                      className="rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-muted"
                    >
                      {ph}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => set({ phase: "topics" })}
                  className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[14.5px] font-bold text-accent-ink"
                >
                  Save and continue
                </button>
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
                    {anon ? "Nothing was asked of you" : "Saved to your case"}
                  </div>
                  <div className="mt-1 text-sm leading-snug text-muted">
                    {anon
                      ? "You gave no name and no number. Screenshot anything you want to keep."
                      : "A counsellor can pick this up from where you left it."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
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

          <div className="border-t border-line bg-base px-5.5 pb-5.5 pt-4.5">
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
            <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3.25 text-[14.5px] text-muted">
              Describe the problem in your own words — any Indian language works
              <span className="ml-auto grid h-7.5 w-7.5 flex-none place-items-center rounded-md bg-accent text-sm text-white">
                ↑
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
