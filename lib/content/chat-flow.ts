// Pure chat logic, kept out of the React component so it can be unit-tested
// (tests/chat-flow.test.ts). `.ts` extensions are explicit so Node's test
// runner can load these files directly.
import { KB, PLAN } from "./chat.ts";

export type Mode = "anon" | "named" | null;
export type Phase = "gate" | "topics";
export type Mic = "ask" | "connecting" | "live" | "error" | null;

export interface ChatState {
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

export interface Msg {
  text: string;
  align: "flex-start" | "flex-end" | "center";
  max: string;
  bg: string;
  fg: string;
  border: string;
  radius: string;
}

export const URGENT_REPLY =
  "Thank you for telling me — you have done nothing wrong. This needs a real person today, so here is who to call right now.";

// The Urgent topic itself, or any follow-up marked "urgent" (e.g. "They are
// threatening me"), must put the 1098 escalation panel on screen.
export function escalates(s: Pick<ChatState, "topic" | "sub">): boolean {
  return !!(s.topic && (KB[s.topic]?.escalate || s.sub === "urgent"));
}

export function buildMsgs(s: ChatState): Msg[] {
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
    bot(URGENT_REPLY);
  }
  return out;
}

const STEP_DEFS: [string, string, string][] = [
  ["1", "Identity choice", "Anonymous, or share details"],
  ["2", "What is going on", "Seven areas in the knowledge base"],
  ["3", "Grounded answer", "India-specific, plain language"],
  ["4", "Escalation", "Helpline, counsellor or report"],
];

export function stepsFor(s: ChatState) {
  const stage = s.phase === "gate" ? 0 : !s.topic ? 1 : escalates(s) ? 3 : 2;
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
