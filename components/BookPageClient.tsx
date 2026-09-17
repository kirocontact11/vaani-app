"use client";

import { useState } from "react";
import Link from "next/link";
import { BOOK_TIMES, submitForm } from "@/lib/content/forms";

interface BookForm {
  bname: string;
  bage: string;
  bcity: string;
  bphone: string;
  blang: string;
  bwhat: string;
  btime: string[];
}

const emptyBook: BookForm = {
  bname: "",
  bage: "",
  bcity: "",
  bphone: "",
  blang: "",
  bwhat: "",
  btime: [],
};

export default function BookPageClient() {
  const [form, setForm] = useState<BookForm>(emptyBook);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const toggleTime = (t: string) =>
    setForm((f) => ({
      ...f,
      btime: f.btime.includes(t) ? f.btime.filter((v) => v !== t) : [...f.btime, t],
    }));

  // Clears a field's own error the moment it changes (matches the source
  // design's `field()` helper) so a fixed field doesn't keep showing a stale error.
  function updateField<K extends keyof BookForm>(key: K, value: BookForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrs((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  const submitBook = () => {
    const nextErrs: Record<string, string> = {};
    if (!form.bname.trim()) nextErrs.bname = "What should we call you?";
    if (!form.bage.trim()) nextErrs.bage = "Your child’s age.";
    if (!form.bcity.trim()) nextErrs.bcity = "We match by city, so this one matters.";
    if (!form.bphone.trim()) nextErrs.bphone = "How should someone call you back?";
    if (Object.keys(nextErrs).length) {
      setErrs(nextErrs);
      return;
    }
    const rows: [string, string][] = [
      ["First name", form.bname],
      ["Child’s age", form.bage],
      ["City", form.bcity],
      ["Phone", form.bphone],
      ["Preferred language", form.blang],
      ["What’s going on", form.bwhat],
      ["Preferred time", form.btime.join(", ")],
    ];
    submitForm(rows, "Appointment request — " + form.bname, null);
    setSent(true);
    setErrs({});
  };

  return (
    <section className="mx-auto max-w-[680px] px-4 pt-5 sm:px-12 sm:pt-7">
      <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-tint px-4 py-1.75 text-[13.5px] font-bold">
        For parents
      </div>
      <h1 className="mt-4.5 font-heading text-[clamp(32px,4.2vw,50px)] font-semibold leading-[1.08] tracking-[-0.02em]">
        Book an appointment
      </h1>
      <p className="mt-3.5 text-[16.5px] leading-relaxed text-muted">
        We only ask for this because someone is going to call you back. Nothing else.
      </p>

      {sent ? (
        <div role="status" className="mt-5.5 rounded-[14px] border border-accent bg-tint p-6.5">
          <div className="font-heading text-xl font-medium">Thank you — that&apos;s with us</div>
          <p className="mt-2 text-[15.5px] leading-relaxed text-muted">
            This opens your email app with the details filled in — press send there. Someone
            will call you back soon.
          </p>
          <Link href="/" className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink">
            Back to KIRO
          </Link>
        </div>
      ) : (
        <div className="mt-5.5 flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-6.5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
              First name *
              <input
                value={form.bname}
                onChange={(e) => updateField("bname", e.target.value)}
                className="rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
              />
              <span className="text-[13px] font-semibold text-alert">{errs.bname}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
              Child&apos;s age *
              <input
                value={form.bage}
                onChange={(e) => updateField("bage", e.target.value)}
                className="rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
              />
              <span className="text-[13px] font-semibold text-alert">{errs.bage}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
              City *
              <input
                value={form.bcity}
                onChange={(e) => updateField("bcity", e.target.value)}
                className="rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
              />
              <span className="text-[13px] font-semibold text-alert">{errs.bcity}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
              Phone *
              <input
                type="tel"
                value={form.bphone}
                onChange={(e) => updateField("bphone", e.target.value)}
                className="rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
              />
              <span className="text-[13px] font-semibold text-alert">{errs.bphone}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
              Preferred language
              <input
                value={form.blang}
                onChange={(e) => setForm((f) => ({ ...f, blang: e.target.value }))}
                placeholder="e.g. Hindi, English"
                className="rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
            What&apos;s going on
            <textarea
              rows={3}
              value={form.bwhat}
              onChange={(e) => setForm((f) => ({ ...f, bwhat: e.target.value }))}
              className="resize-y rounded-lg border-[1.5px] border-line bg-base px-3.25 py-2.75 text-[15px] font-normal"
            />
          </label>

          <div>
            <div className="text-[14.5px] font-bold">Preferred time</div>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {BOOK_TIMES.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-2.25 rounded-lg border-[1.5px] border-line bg-base px-3.5 py-2.25 text-[14.5px]"
                >
                  <input
                    type="checkbox"
                    checked={form.btime.includes(t)}
                    onChange={() => toggleTime(t)}
                    className="h-4.25 w-4.25 accent-accent"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={submitBook}
              className="rounded-lg bg-accent px-7 py-3.5 text-[15.5px] font-bold text-accent-ink"
            >
              Request a call back
            </button>
            <div className="max-w-[38ch] text-sm text-muted">
              This opens your email app with the details filled in — press send there.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
