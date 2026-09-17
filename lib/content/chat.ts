export interface KbEntry {
  label: string;
  q: string;
  a: string;
  next: [string, string][];
  escalate?: boolean;
}

export const KB: Record<string, KbEntry> = {
  screen: {
    label: "Screen Time",
    q: "my son is 8 and games about 5 hours a day",
    a: "That's a lot for 8, and very common — Indian kids under five already average over two hours. Two changes do most of the work: a hard stop 60 minutes before bed, and one screen-free meal a day. Punishing the device usually backfires; naming the time does not.",
    next: [
      ["Give me a 7-day plan", "plan"],
      ["He gets angry when I stop him", "anger"],
      ["Something else", "menu"],
    ],
  },
  gaming: {
    label: "Online Gaming",
    q: "he spent ₹4,000 on a game using my UPI",
    a: "First, turn off in-app purchases and remove the saved UPI mandate — I can walk you through it for Android or iPhone. Then ask for a refund from the platform within 48 hours; many honour first-time claims for minors. This is a design problem, not a character flaw.",
    next: [
      ["Show me the settings", "plan"],
      ["Can I get the money back?", "plan"],
      ["Something else", "menu"],
    ],
  },
  bully: {
    label: "Online Bullying",
    q: "someone in my class made a group about me. i don't want to tell my mother",
    a: "That's bullying, and it isn't your fault. Do three things: screenshot everything, block them, then tell one adult you trust — it does not have to be your mother. A teacher, an older cousin, a coach all count. Want the exact words to use?",
    next: [
      ["Yes, what do I say?", "plan"],
      ["They are threatening me", "urgent"],
      ["Something else", "menu"],
    ],
  },
  privacy: {
    label: "Privacy & Security",
    q: "how do i stop strangers finding my daughter online",
    a: "Set her accounts to private, turn off location in photos, and remove her school name from bios — those three details are what strangers use most. Under the DPDP Act, platforms need verifiable parental consent for under-18s, so you can also demand data deletion.",
    next: [
      ["Walk me through her phone", "plan"],
      ["Someone already contacted her", "urgent"],
      ["Something else", "menu"],
    ],
  },
  explicit: {
    label: "Pornography",
    q: "my 11 year old has seen porn on a friend’s phone",
    a: "Assume curiosity, not damage. Say you are not angry, ask what he saw and how it made him feel, then explain that it is made for adults and is not what real relationships look like. Filters help, but the conversation is what lasts.",
    next: [
      ["What words do I use?", "plan"],
      ["An adult sent it to him", "urgent"],
      ["Something else", "menu"],
    ],
  },
  school: {
    label: "Incident Response",
    q: "a parent reported a fake account impersonating a student",
    a: "Treat it as an incident, not a rumour: log it with time and screenshots, inform the principal the same day, and notify both families before the school day ends. Bombay High Court has held that a school's duty of care extends online — \"outside school hours\" is not a defence.",
    next: [
      ["Give me the checklist", "plan"],
      ["Do we have to involve police?", "urgent"],
      ["Something else", "menu"],
    ],
  },
  urgent: {
    label: "Urgent — happening now",
    q: "a man i met in a game keeps asking me to video call",
    a: "Stop replying, and do not delete the chat — it is evidence. You have done nothing wrong. If he has asked for photos or to meet, that is a crime under POCSO, and this needs an adult today. I am going to put a real number in front of you now.",
    next: [
      ["Show me what to say to an adult", "plan"],
      ["Start over", "menu"],
    ],
    escalate: true,
  },
};

export const PLAN = {
  a: "Here it is, step by step — I'll keep it short enough to screenshot:\n1. Agree the rule out loud, together.\n2. Same stop time every night.\n3. One screen-free meal.\n4. Charge devices outside the bedroom.\n5. Review on day 7, not day 2.",
  anger:
    "Anger at the cut-off is normal — the game punishes stopping mid-match. Give a five-minute warning, end at a natural break, and never confiscate mid-round. Ninety percent of the fight is about timing, not screens.",
};

// Maps a route-friendly topic slug (used in hero chips / /talk/[slug]) to a KB key.
// Slugs already matching a KB key (gaming, privacy) don't need an entry.
export const TOPIC_ALIAS: Record<string, string> = {
  "screen-time": "screen",
  bullying: "bully",
  pornography: "explicit",
  incident: "school",
};

// Resolves a /talk/<slug> route segment to a KB key, or null if it isn't one
// (mirrors the original's silent fallback to the gate screen for an unknown slug).
export function resolveTopicSlug(slug: string): string | null {
  const key = TOPIC_ALIAS[slug] || slug;
  return KB[key] ? key : null;
}
