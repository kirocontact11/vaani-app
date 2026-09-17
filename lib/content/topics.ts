export interface Topic {
  slug: string;
  title: string;
  videoTag: string;
  what: string;
  looksLike: string[];
  tonight: string[];
  law: string;
  cta: "talk" | "urgent";
}

export const TOPICS: Topic[] = [
  {
    slug: "parental-controls",
    title: "Parental controls",
    videoTag: "Parental controls",
    what: "Software settings on a phone, tablet, or router that limit what a child can see, download, or spend — screen-time limits, app restrictions, content filters, and purchase approvals. They don't replace a conversation, but they buy time while that conversation is happening.",
    looksLike: [
      'A "Family Link" or "Screen Time" icon they didn’t set up themselves',
      "Apps greyed out or asking for a parent’s PIN to open",
      "A pop-up asking you to approve a download or purchase",
      "The phone locking itself at a set time each night",
    ],
    tonight: [
      "Turn on Google Family Link (Android) or Screen Time (iPhone) — fifteen minutes, done once",
      "Set one hard stop: no phone 60 minutes before bed",
      "Check which apps they actually use before blocking anything — talk about it, don’t just switch it off",
    ],
    law: "India’s Digital Personal Data Protection (DPDP) Act, 2023 treats anyone under 18 as a child for data purposes and requires apps to get verifiable parental consent before processing a child’s personal data. Parental controls are one practical way families exercise that right.",
    cta: "talk",
  },
  {
    slug: "grooming",
    title: "Online grooming",
    videoTag: "Grooming",
    what: "Grooming is when an adult (sometimes posing as a peer) builds trust with a child online, gradually, in order to sexually abuse or exploit them — through gifts, attention, secrecy, or threats. It rarely looks dramatic at first. That’s what makes it dangerous.",
    looksLike: [
      'A new online "friend" your child is unusually protective or secretive about',
      "Gifts, recharge cards, or in-game currency from someone they only know online",
      "Switching screens or deleting chats when you walk in",
      "Mood changes tied to their phone — anxious, withdrawn, or suddenly very private",
    ],
    tonight: [
      "Stay calm — reacting with anger can push a child to hide more, not less",
      "Don’t confront the other account yourself; that can destroy evidence",
      "Screenshot what you can, without deleting anything",
      "Report to the National Cyber Crime Portal (cybercrime.gov.in) or call 1098",
    ],
    law: "The POCSO Act, 2012 criminalises the sexual exploitation of anyone under 18, including grooming and online solicitation. Section 67B of the IT Act, 2000 separately criminalises using the internet to induce, entice, or solicit a child for sexual conduct — a minor cannot legally consent, and that is not a defence.",
    cta: "urgent",
  },
  {
    slug: "bullying",
    title: "Cyberbullying",
    videoTag: "Bullying",
    what: "Bullying that follows a child onto their phone — group chats, comments, memes, or exclusion designed to hurt. Unlike playground bullying, it can carry on at any hour, from anywhere, which is part of why it wears a child down faster.",
    looksLike: [
      "Sudden reluctance to go to school or open a particular app",
      "Checking their phone anxiously, then looking upset",
      "Being left out of a group chat they were always part of",
      "Deleting social accounts abruptly",
    ],
    tonight: [
      "Listen first — don’t take the phone away as a first response, it can feel like punishment for telling you",
      "Screenshot the evidence before anything gets deleted",
      "Report it to the school and to the platform (most have a report button)",
      "Agree together on what happens next — a child who feels consulted is more likely to keep talking to you",
    ],
    law: "India doesn’t yet have one dedicated cyberbullying law. Depending on what happened, it can fall under the IT Act (privacy or obscenity provisions), the Bharatiya Nyaya Sanhita, or school-level policy — CBSE and CISCE both require affiliated schools to maintain anti-bullying and anti-cyberbullying policies.",
    cta: "talk",
  },
  {
    slug: "sextortion",
    title: "Sextortion",
    videoTag: "Sextortion",
    what: "Sextortion is blackmail: someone convinces or pressures a child into sharing an intimate image or video, then threatens to release it unless they pay money or send more. It escalates fast, and shame keeps most victims silent for far too long.",
    looksLike: [
      "Sudden secrecy or panic around phone notifications",
      "Requests to borrow money with no clear reason",
      'Talk of a "friend" or relationship they won’t explain',
      "Signs of panic, sleeplessness, or withdrawal that appeared suddenly",
    ],
    tonight: [
      "Stop all contact with the person blackmailing them — do not pay, do not send more",
      "Tell your child clearly: this is not their fault, even if they sent the image first",
      "Screenshot everything without deleting the conversation",
      "Report immediately to cybercrime.gov.in or call 1098 — for a live threat, call 112",
    ],
    law: "The POCSO Act and Sections 66E/67B of the IT Act both apply — a minor cannot consent to sexual images of themselves, so consent is never a legal defence for the person exploiting them. This is treated as a crime against the child, not something the child did wrong.",
    cta: "urgent",
  },
  {
    slug: "screen-time",
    title: "Screen time",
    videoTag: "Screen time",
    what: "How long, and when, a child is on a device. Less about a magic number of hours and more about what the time replaces — sleep, meals, homework, time with people in the room.",
    looksLike: [
      'The blue glow under the blanket after "lights out"',
      "Irritability or arguments specifically when asked to put the phone down",
      "Eating meals with a screen instead of a conversation",
      "Grades or sleep slipping at the same time screen use goes up",
    ],
    tonight: [
      "Pick one hard stop: 60 minutes before bed, phone charges outside the bedroom",
      "Make one meal a day screen-free, for everyone at the table",
      "Change gradually, not all at once — sudden bans usually get worked around",
    ],
    law: "This is mostly a household habit, not a legal one. Where it does touch the law: the DPDP Act, 2023 restricts platforms from showing certain ads or tracking to users registered as children, which is part of why age-appropriate settings exist at all.",
    cta: "talk",
  },
  {
    slug: "gaming",
    title: "Online gaming",
    videoTag: "Gaming",
    what: "Multiplayer games like Roblox, PUBG, or Free Fire bring real risks alongside the fun — voice chat with strangers, in-game purchases that add up fast, and pressure to keep playing to not let a team down.",
    looksLike: [
      'Unexplained charges for in-game currency or "loot boxes"',
      "Voice chats with people they’ve never met in person",
      "Getting upset or anxious about logging off mid-match",
      "Usernames or profile photos that reveal more than they should",
    ],
    tonight: [
      "Turn off voice/text chat with strangers in the game’s settings",
      "Set a spending limit or remove saved card details from the account",
      "Ask who they play with — by name, not just a screen name",
    ],
    law: "The DPDP Act, 2023 requires games to get verifiable parental consent before collecting a child’s data. If a stranger uses in-game chat to solicit a child sexually, that falls under the same POCSO / IT Act Section 67B protections that apply to grooming anywhere else online.",
    cta: "talk",
  },
];
