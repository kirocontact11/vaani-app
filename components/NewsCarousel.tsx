"use client";

import { useState } from "react";
import { NEWS } from "@/lib/content/news";

export default function NewsCarousel() {
  const [active, setActive] = useState(0);
  const item = NEWS[active];

  const prev = () => setActive((i) => (i + NEWS.length - 1) % NEWS.length);
  const next = () => setActive((i) => (i + 1) % NEWS.length);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 className="m-0 max-w-[26ch] font-heading text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.02em]">
          Things every parent should know
        </h2>
        <div className="flex items-center gap-3">
          <div className="font-heading text-sm font-medium text-muted">
            {active + 1} / {NEWS.length}
          </div>
          <button
            type="button"
            aria-label="Previous"
            onClick={prev}
            className="grid h-[46px] w-[46px] place-items-center rounded-lg border-[1.5px] border-ink bg-surface text-lg hover:bg-tint"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={next}
            className="grid h-[46px] w-[46px] place-items-center rounded-lg bg-accent text-lg text-accent-ink transition-transform hover:translate-x-[3px]"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] items-center gap-7.5 rounded-[14px] border border-line bg-surface p-7.5">
        <div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-md border border-line bg-tint px-3 py-1.5 font-heading text-[12.5px] font-medium">
              {item.date}
            </div>
            <div className="rounded-md border border-line bg-tint px-3 py-1.5 font-heading text-[12.5px] font-medium">
              {item.source}
            </div>
          </div>
          <h3 className="mt-4 max-w-[26ch] font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.015em]">
            {item.title}
          </h3>
          <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-muted">{item.body}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href={item.href}
              target="_blank"
              rel="noopener"
              className="rounded-lg bg-accent px-5.5 py-3 text-[14.5px] font-bold text-accent-ink"
            >
              Read more →
            </a>
          </div>
          <div className="mt-5 flex items-center gap-1.5">
            {NEWS.map((n, i) => (
              <button
                key={n.title}
                type="button"
                aria-label={`Show ${n.title}`}
                onClick={() => setActive(i)}
                className="h-[7px] rounded-full transition-[width,background]"
                style={{
                  width: i === active ? "22px" : "7px",
                  background: i === active ? "var(--accent)" : "var(--line)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="grid min-h-[200px] place-items-center rounded-[10px] border border-line bg-tint p-6">
          <div className="w-full rounded-lg border border-line bg-surface px-4.5 py-5 text-center">
            <div className="font-heading text-[19px] font-medium">{item.source}</div>
            <div className="mt-1.5 font-heading text-[11.5px] uppercase tracking-[0.18em] text-muted">
              Source
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
