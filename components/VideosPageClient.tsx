"use client";

import { useMemo, useState } from "react";
import { VIDEOS } from "@/lib/content/videos";
import { submitForm } from "@/lib/content/forms";

const VTABS: [string, string][] = [
  ["all", "All videos"],
  ["parents", "For parents"],
  ["6", "Ages 6–9"],
  ["10", "Ages 10–13"],
  ["14", "Ages 14–18"],
];

export default function VideosPageClient() {
  const [vtab, setVtab] = useState("all");
  const [ttab, setTtab] = useState("all");
  const [reqSent, setReqSent] = useState(false);
  const [reqErr, setReqErr] = useState("");
  const [req, setReq] = useState({ school: "", age: "", email: "", desc: "" });

  const topicList = useMemo(() => ["all", ...new Set(VIDEOS.map((v) => v.tag1))], []);
  const vlist = useMemo(
    () =>
      VIDEOS.filter(
        (v) => (vtab === "all" || v.grp === vtab) && (ttab === "all" || v.tag1 === ttab)
      ),
    [vtab, ttab]
  );

  const submitReq = async () => {
    if (!req.desc.trim()) {
      setReqErr("Tell us what the short should cover.");
      return;
    }
    const rows: [string, string][] = [
      ["School / organisation", req.school],
      ["Age group", req.age],
      ["Email", req.email],
      ["What it should cover", req.desc],
    ];
    // Deliberately stays on the mailto: fallback — no table was built for
    // video requests, out of scope for C4 (only /register and /book write
    // to Supabase).
    await submitForm(rows, "Video request for school", null);
    setReqSent(true);
    setReqErr("");
  };

  return (
    <>
      <section className="mx-auto max-w-[1100px] px-4 pt-5 text-center sm:px-12 sm:pt-7">
        <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-tint px-4 py-1.75 text-[13.5px] font-bold">
          11 videos · Hindi &amp; English · Free
        </div>
        <h1 className="mt-4.5 font-heading text-[clamp(38px,5.2vw,68px)] font-semibold leading-[1.05] tracking-[-0.02em]">
          Watch and learn
        </h1>
        <p className="mx-auto mt-3.5 max-w-[52ch] text-lg leading-[1.55] text-muted">
          Practical advice, simple how-tos and honest answers on the things parents actually
          worry about. Pick an age group, or just start anywhere.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2.25">
          {VTABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVtab(id)}
              className="rounded-lg border-[1.5px] px-4.5 py-2.5 text-sm font-bold transition-colors"
              style={{
                background: vtab === id ? "var(--accent)" : "var(--surface)",
                color: vtab === id ? "var(--accent-ink)" : "var(--ink)",
                borderColor: vtab === id ? "var(--accent)" : "var(--line)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3.5 flex flex-wrap justify-center gap-2">
          {topicList.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTtab(tp)}
              className="rounded-md border-[1.5px] px-3.5 py-1.75 text-[13px] font-bold"
              style={{
                background: ttab === tp ? "var(--ink)" : "var(--surface)",
                color: ttab === tp ? "#FFFFFF" : "var(--ink)",
                borderColor: ttab === tp ? "var(--ink)" : "var(--line)",
              }}
            >
              {tp === "all" ? "All topics" : tp}
            </button>
          ))}
        </div>
        <div className="mt-3.5">
          <a
            href="https://www.youtube.com/results?search_query=eSafety+Commissioner"
            target="_blank"
            rel="noopener"
            className="text-sm font-bold text-accent"
          >
            See all videos on YouTube →
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pt-3.5 sm:px-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(286px,1fr))] gap-5">
          {vlist.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener"
              aria-label={`Watch on YouTube: ${v.title}`}
              className="rounded-[14px] border border-line bg-surface p-3 text-left transition-transform hover:-translate-y-1"
            >
              <div
                className="relative aspect-video overflow-hidden rounded-[9px] bg-tint bg-cover bg-center"
                style={{ backgroundImage: `url(${v.thumb})` }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-[39px] w-14 place-items-center rounded-lg bg-accent">
                    <div className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-white" />
                  </div>
                </div>
                <div className="absolute right-2.25 bottom-2.25 rounded-[5px] bg-[#1A1A1AE6] px-2.25 py-1 font-heading text-xs font-medium text-white">
                  {v.dur}
                </div>
              </div>
              <div className="mt-3.5 font-heading text-xl font-medium leading-tight">{v.title}</div>
              <div className="mt-2.5 flex flex-wrap gap-1.75">
                {[v.age, v.lang, v.tag1, v.tag2].map((tag) => (
                  <div key={tag} className="rounded-md border border-line bg-tint px-2.75 py-1 text-xs font-bold">
                    {tag}
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{v.body}</p>
              <div className="mt-2 text-xs text-muted opacity-85">
                Source: {v.source} · opens on YouTube ↗
              </div>
            </a>
          ))}
        </div>
        {vlist.length === 0 && (
          <div className="py-10 text-center text-muted">
            <div className="font-heading text-lg text-ink">No videos match this filter yet</div>
            <p className="mt-2 text-[14.5px]">
              Try a different age group or topic — or request one below.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pt-5 sm:px-12 sm:pt-7">
        <div className="rounded-[14px] border border-line bg-surface p-6.5">
          <div className="font-heading text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.15]">
            Request a video
          </div>
          <p className="mt-2 max-w-[52ch] text-[15.5px] leading-relaxed text-muted">
            Describe the short you need — the worry, the age group, the setting. We review
            every request and get back to you.
          </p>

          {reqSent ? (
            <div role="status" className="mt-4.5 rounded-xl border border-accent bg-tint p-5">
              <div className="font-heading text-base font-medium">Thank you — that&apos;s with us</div>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
                This opens your email app with the details filled in — press send there. We
                reply within a week.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4.5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  School or organisation
                  <input
                    value={req.school}
                    onChange={(e) => setReq((r) => ({ ...r, school: e.target.value }))}
                    className="rounded-lg border-[1.5px] border-line bg-base px-3 py-2.5 text-[14.5px] font-normal"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Age group
                  <input
                    value={req.age}
                    onChange={(e) => setReq((r) => ({ ...r, age: e.target.value }))}
                    placeholder="e.g. 10–13"
                    className="rounded-lg border-[1.5px] border-line bg-base px-3 py-2.5 text-[14.5px] font-normal"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  Your email
                  <input
                    type="email"
                    value={req.email}
                    onChange={(e) => setReq((r) => ({ ...r, email: e.target.value }))}
                    className="rounded-lg border-[1.5px] border-line bg-base px-3 py-2.5 text-[14.5px] font-normal"
                  />
                </label>
              </div>
              <label className="mt-3.5 flex flex-col gap-1.5 text-sm font-bold">
                What should the short cover? *
                <textarea
                  rows={3}
                  value={req.desc}
                  onChange={(e) => {
                    setReq((r) => ({ ...r, desc: e.target.value }));
                    setReqErr("");
                  }}
                  placeholder="The worry, the situation, anything specific you want covered"
                  className="resize-y rounded-lg border-[1.5px] border-line bg-base px-3 py-2.5 text-[14.5px] font-normal"
                />
                <span className="text-[12.5px] font-semibold text-alert">{reqErr}</span>
              </label>
              <button
                type="button"
                onClick={submitReq}
                className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink"
              >
                Send request
              </button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
