"use client";

import { useRef } from "react";

const EXAMPLES = [
  {
    who: "A parent in Pune",
    q: '"My son is 8 and games about five hours a day. Taking the tablet away turns into a fight every evening."',
    a: "A hard stop 60 minutes before bed, and one screen-free meal a day. End at a natural break — never mid-match.",
  },
  {
    who: "A mother in Chennai",
    q: '"He spent ₹4,000 on a game using my UPI. Is that money gone?"',
    a: "Turn off in-app purchases and remove the saved UPI mandate first, then ask the platform for a refund within 48 hours.",
  },
  {
    who: "A school counsellor in Delhi",
    q: '"A parent reported a fake account impersonating one of our students. Do we have to act?"',
    a: "Yes — log it, inform the principal the same day, and notify both families. A school's duty of care extends online.",
  },
];

export default function ExampleScroller() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-[1140px] pt-4 sm:pt-5.5">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-12">
        <h2 className="font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.02em]">
          What type of questions you can ask
        </h2>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="h-9 w-9 rounded-full border border-line bg-surface text-base"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="h-9 w-9 rounded-full border border-line bg-surface text-base"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="mt-4.5 flex gap-3.5 overflow-x-auto px-4 pb-1.5 sm:px-12"
        style={{ scrollSnapType: "x proximity", scrollBehavior: "smooth" }}
      >
        {EXAMPLES.map((ex) => (
          <div
            key={ex.who}
            className="flex-[0_0_300px] rounded-[14px] border border-line bg-surface p-5"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">{ex.who}</div>
            <p className="mt-2.5 text-[15.5px] font-semibold leading-snug">{ex.q}</p>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{ex.a}</p>
          </div>
        ))}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex-[0_0_220px] grid place-items-center rounded-[14px] border-[1.5px] border-dashed border-line p-5 text-center text-sm font-semibold text-muted"
            style={{ scrollSnapAlign: "start" }}
          >
            More examples coming
          </div>
        ))}
      </div>
    </section>
  );
}
