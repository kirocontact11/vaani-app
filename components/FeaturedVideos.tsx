"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { FEATURED_VIDEOS } from "@/lib/content/videos";

const ROTATE_MS = 4000;

export default function FeaturedVideos() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!autoRotate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const interval = setInterval(() => {
      if (hover) return;
      setActive((i) => (i + 1) % FEATURED_VIDEOS.length);
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [hover, autoRotate]);

  const goTo = (i: number) => {
    setAutoRotate(false);
    setActive(i);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="mt-4.5"
    >
      <div className="relative mt-4.5 h-[clamp(316px,42vw,392px)] overflow-hidden">
        {FEATURED_VIDEOS.map((v, i) => {
          // 3-item circular carousel: the active card is centered at full size;
          // the other two sit scaled down, one shifted +62% (next) and one -62%
          // (previous) of their own width — matches the original design exactly.
          const rel = (i - active + FEATURED_VIDEOS.length) % FEATURED_VIDEOS.length;
          const isActive = rel === 0;
          const off = rel === 1 ? 62 : -62;
          const cardStyle: CSSProperties = {
            transform: isActive
              ? "translateX(-50%) scale(1)"
              : `translateX(calc(-50% + ${off}%)) scale(0.84)`,
            opacity: isActive ? 1 : 0.4,
            zIndex: isActive ? 3 : 1,
          };
          const cardBody = (
            <div className="rounded-[14px] border border-line bg-surface p-3 text-left">
              <div
                className="relative aspect-video overflow-hidden rounded-[9px] bg-tint bg-cover bg-center"
                style={{ backgroundImage: `url(${v.thumb})` }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-10 w-[58px] place-items-center rounded-lg bg-accent">
                    <div className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-white" />
                  </div>
                </div>
                <div className="absolute right-2.5 bottom-2.5 rounded-[5px] bg-[#1A1A1AE6] px-2.5 py-1 font-heading text-xs font-medium text-white">
                  {v.dur}
                </div>
              </div>
              <div className="mt-3.5 font-heading text-xl font-medium leading-tight">
                {v.title}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[v.age, v.lang, v.tag1].map((tag) => (
                  <div
                    key={tag}
                    className="rounded-md border border-line bg-tint px-2.5 py-1 text-xs font-bold"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          );

          // Active card is a real link that opens the video; flanking cards are
          // plain buttons that only bring themselves into focus (no navigation).
          return isActive ? (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener"
              aria-label={`Play video: ${v.title}`}
              className="absolute top-0 left-1/2 w-[min(408px,78%)] cursor-pointer transition-[transform,opacity] duration-[.6s]"
              style={cardStyle}
            >
              {cardBody}
            </a>
          ) : (
            <button
              key={v.id}
              type="button"
              aria-label={`Show video: ${v.title}`}
              onClick={() => goTo(i)}
              className="absolute top-0 left-1/2 w-[min(408px,78%)] cursor-pointer transition-[transform,opacity] duration-[.6s]"
              style={cardStyle}
            >
              {cardBody}
            </button>
          );
        })}
      </div>

      <div className="mt-5.5 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous video"
          onClick={() => goTo((active + FEATURED_VIDEOS.length - 1) % FEATURED_VIDEOS.length)}
          className="grid h-[46px] w-[46px] place-items-center rounded-lg border-[1.5px] border-ink bg-surface text-lg hover:bg-tint"
        >
          ←
        </button>
        <div className="flex items-center gap-1.5">
          {FEATURED_VIDEOS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Show ${v.title}`}
              onClick={() => goTo(i)}
              className="h-[7px] rounded-full transition-[width,background]"
              style={{
                width: i === active ? "22px" : "7px",
                background: i === active ? "var(--accent)" : "var(--line)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next video"
          onClick={() => goTo((active + 1) % FEATURED_VIDEOS.length)}
          className="grid h-[46px] w-[46px] place-items-center rounded-lg bg-accent text-lg text-accent-ink transition-transform hover:translate-x-[3px]"
        >
          →
        </button>
      </div>

      <Link
        href="/videos"
        className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink"
      >
        See all videos →
      </Link>
    </div>
  );
}
