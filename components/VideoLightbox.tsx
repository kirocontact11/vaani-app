"use client";

import { useEffect, useRef } from "react";
import type { Video } from "@/lib/content/videos";

export default function VideoLightbox({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    const box = boxRef.current;
    const closeBtn = box?.querySelector<HTMLElement>('[aria-label="Close video"]');
    closeBtn?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !box) return;
      const focusable = [...box.querySelectorAll<HTMLElement>('a[href],[role=button],iframe,[tabindex="0"]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const src = `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&modestbranding=1&autoplay=1`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] grid place-items-center bg-[#1A1A1AE6] p-3 sm:p-11"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={video.title}
        tabIndex={-1}
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[920px] overflow-auto rounded-[14px] bg-base shadow-[0_44px_90px_-44px_#000000CC] outline-none"
      >
        <div className="relative aspect-video overflow-hidden rounded-t-[14px] bg-black">
          <iframe
            src={src}
            title={video.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        <div className="flex flex-wrap items-start gap-5.5 p-4.5 pt-6 sm:p-7">
          <div className="min-w-[250px] flex-1">
            <div className="font-heading text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.15]">
              {video.title}
            </div>
            <div className="mt-2.75 flex flex-wrap gap-1.75">
              {[video.age, video.lang, video.dur].map((tag) => (
                <div key={tag} className="rounded-md border border-line bg-tint px-2.75 py-1 text-xs font-bold">
                  {tag}
                </div>
              ))}
            </div>
            <p className="mt-3.5 max-w-[56ch] text-[15.5px] leading-relaxed text-muted">{video.body}</p>
          </div>
          <div className="flex min-w-[210px] flex-col gap-2.25">
            <a
              href={video.url}
              target="_blank"
              rel="noopener"
              className="rounded-lg bg-accent px-5.5 py-3 text-center text-[14.5px] font-bold text-accent-ink"
            >
              Watch on YouTube ↗
            </a>
            <button
              type="button"
              aria-label="Close video"
              onClick={onClose}
              className="rounded-lg border-[1.5px] border-ink bg-surface px-5.5 py-3 text-center text-[14.5px] font-bold"
            >
              Close
            </button>
            <div className="mt-0.5 text-center text-[12.5px] leading-relaxed text-muted">
              Playing here keeps you on our site. YouTube may show ads and suggestions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
