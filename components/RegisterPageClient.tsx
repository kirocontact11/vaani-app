"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICES, AGE_OPTS, SPECS, AVAIL_OPTS, SUBMIT_ENDPOINT, submitForm } from "@/lib/content/forms";

type Tab = "psych" | "cdc";

interface CdcForm {
  centre: string;
  person: string;
  role: string;
  services: string[];
  ages: string[];
  langs: string;
  city: string;
  area: string;
  phone: string;
  email: string;
  site: string;
  note: string;
  consent: boolean;
}

interface PsychForm {
  pname: string;
  qualification: string;
  license: string;
  years: string;
  specs: string[];
  avail: string[];
  langs: string;
  city: string;
  phone: string;
  email: string;
  pconsent: boolean;
}

const emptyCdc: CdcForm = {
  centre: "",
  person: "",
  role: "",
  services: [],
  ages: [],
  langs: "",
  city: "",
  area: "",
  phone: "",
  email: "",
  site: "",
  note: "",
  consent: false,
};

const emptyPsych: PsychForm = {
  pname: "",
  qualification: "",
  license: "",
  years: "",
  specs: [],
  avail: [],
  langs: "",
  city: "",
  phone: "",
  email: "",
  pconsent: false,
};

function toggleIn(list: string[], val: string) {
  return list.includes(val) ? list.filter((v) => v !== val) : [...list, val];
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.25 rounded-lg border-[1.5px] border-line bg-page px-3.5 py-2.25 text-[14.5px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4.25 w-4.25 accent-accent"
      />
      {label}
    </label>
  );
}

const submitNote = SUBMIT_ENDPOINT
  ? "Sent straight to the KIRO team."
  : "This opens your email app with the details filled in — press send there.";
const sentNote = SUBMIT_ENDPOINT
  ? "We read every listing by hand and usually reply within a week."
  : "Check that your email app opened and the message was sent. We reply within a week.";

export default function RegisterPageClient({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const [cdc, setCdc] = useState<CdcForm>(emptyCdc);
  const [cdcErrs, setCdcErrs] = useState<Record<string, string>>({});
  const [cdcSent, setCdcSent] = useState(false);
  const [cdcSubmitting, setCdcSubmitting] = useState(false);
  const [cdcSubmitError, setCdcSubmitError] = useState("");

  const [psych, setPsych] = useState<PsychForm>(emptyPsych);
  const [psychErrs, setPsychErrs] = useState<Record<string, string>>({});
  const [psychSent, setPsychSent] = useState(false);
  const [psychSubmitting, setPsychSubmitting] = useState(false);
  const [psychSubmitError, setPsychSubmitError] = useState("");

  // Clears a field's own error message the moment it changes, matching the
  // source design's `field()` helper — otherwise a stale error keeps showing
  // even after the user has fixed it, right up until the next submit attempt.
  function updateCdc<K extends keyof CdcForm>(key: K, value: CdcForm[K]) {
    setCdc((c) => ({ ...c, [key]: value }));
    setCdcErrs((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }
  function updatePsych<K extends keyof PsychForm>(key: K, value: PsychForm[K]) {
    setPsych((p) => ({ ...p, [key]: value }));
    setPsychErrs((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  const submitCdc = async () => {
    const errs: Record<string, string> = {};
    if (!cdc.centre.trim()) errs.centre = "Please add the name parents will look for.";
    if (!cdc.person.trim()) errs.person = "Who should we contact?";
    if (!cdc.role.trim()) errs.role = "Your role at the practice.";
    if (!cdc.city.trim()) errs.city = "We list by city, so this one matters.";
    if (!cdc.phone.trim() && !cdc.email.trim()) {
      errs.phone = "Add a phone or an email so parents can reach you.";
      errs.email = "Add a phone or an email so parents can reach you.";
    }
    if (!cdc.consent) errs.consent = "Please confirm you are authorised to list this practice.";
    if (Object.keys(errs).length) {
      setCdcErrs(errs);
      return;
    }
    const rows: [string, string][] = [
      ["Centre / practice", cdc.centre],
      ["Contact person", cdc.person],
      ["Role", cdc.role],
      ["Services", cdc.services.join(", ")],
      ["Ages served", cdc.ages.join(", ")],
      ["Languages", cdc.langs],
      ["City", cdc.city],
      ["Area", cdc.area],
      ["Phone", cdc.phone],
      ["Email", cdc.email],
      ["Website", cdc.site],
      ["Notes", cdc.note],
      ["Consent given", "yes"],
    ];
    setCdcSubmitError("");
    setCdcSubmitting(true);
    const ok = await submitForm(rows, "List my centre — " + cdc.centre, SUBMIT_ENDPOINT, {
      kind: "cdc",
      ...cdc,
    });
    setCdcSubmitting(false);
    if (ok) {
      setCdcSent(true);
      setCdcErrs({});
    } else {
      setCdcSubmitError("Something went wrong sending this — please try again in a moment.");
    }
  };

  const submitPsych = async () => {
    const errs: Record<string, string> = {};
    if (!psych.pname.trim()) errs.pname = "Please add your full name.";
    if (!psych.qualification.trim()) errs.qualification = "What is your qualification?";
    if (!psych.license.trim()) errs.license = "RCI or licence/registration number.";
    if (!psych.city.trim()) errs.city = "We match by city, so this one matters.";
    if (!psych.phone.trim() && !psych.email.trim()) {
      errs.phone = "Add a phone or an email so we can reach you.";
      errs.email = "Add a phone or an email so we can reach you.";
    }
    if (!psych.pconsent) errs.pconsent = "Please confirm the details above are accurate.";
    if (Object.keys(errs).length) {
      setPsychErrs(errs);
      return;
    }
    const rows: [string, string][] = [
      ["Name", psych.pname],
      ["Qualification", psych.qualification],
      ["RCI / licence no.", psych.license],
      ["Years of experience", psych.years],
      ["Specialisation", psych.specs.join(", ")],
      ["Languages", psych.langs],
      ["City", psych.city],
      ["Availability", psych.avail.join(", ")],
      ["Phone", psych.phone],
      ["Email", psych.email],
      ["Consent given", "yes"],
    ];
    setPsychSubmitError("");
    setPsychSubmitting(true);
    const ok = await submitForm(rows, "Psychologist registration — " + psych.pname, SUBMIT_ENDPOINT, {
      kind: "psych",
      ...psych,
    });
    setPsychSubmitting(false);
    if (ok) {
      setPsychSent(true);
      setPsychErrs({});
    } else {
      setPsychSubmitError("Something went wrong sending this — please try again in a moment.");
    }
  };

  return (
    <section className="mx-auto max-w-[860px] px-4 pt-5 sm:px-12 sm:pt-7">
      <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-tint px-4 py-1.75 text-[13.5px] font-bold">
        Partner with us
      </div>
      <h1 className="mt-4.5 max-w-[22ch] font-heading text-[clamp(34px,4.6vw,58px)] font-semibold leading-[1.08] tracking-[-0.02em]">
        Join the KIRO network
      </h1>
      <p className="mt-3 max-w-[56ch] text-[16.5px] leading-relaxed text-muted">
        Register as a psychologist to take live calls, or list your child development centre
        so parents nearby can find you.
      </p>

      <div className="mt-6.5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => setTab("psych")}
          className="rounded-lg px-5 py-3 text-[14.5px] font-bold"
          style={{
            background: tab === "psych" ? "var(--accent)" : "#FFFFFF",
            color: tab === "psych" ? "#FFFFFF" : "var(--ink)",
            border: `1.5px solid ${tab === "psych" ? "var(--accent)" : "var(--line)"}`,
          }}
        >
          I&apos;m a psychologist or psychiatrist
        </button>
        <button
          type="button"
          onClick={() => setTab("cdc")}
          className="rounded-lg px-5 py-3 text-[14.5px] font-bold"
          style={{
            background: tab === "cdc" ? "var(--accent)" : "#FFFFFF",
            color: tab === "cdc" ? "#FFFFFF" : "var(--ink)",
            border: `1.5px solid ${tab === "cdc" ? "var(--accent)" : "var(--line)"}`,
          }}
        >
          We&apos;re a Child Development Centre
        </button>
      </div>

      {tab === "psych" ? (
        <>
          <div className="mt-7">
            <h2 className="font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.02em]">
              What parents will see
            </h2>
            <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-muted">
              This preview fills in as you type. Nothing else about you is shown.
            </p>
            <div className="mt-4.5 max-w-[520px] rounded-[14px] border border-line bg-surface p-6.5">
              <div className="font-heading text-xl font-medium">{psych.pname.trim() || "Your name"}</div>
              <div className="mt-1 text-[14.5px] text-muted">
                {[psych.qualification.trim(), psych.city.trim()].filter(Boolean).join(" · ") ||
                  "Qualification, city"}
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.75">
                {(psych.specs.length ? psych.specs : ["Specialisation you pick"]).map((t) => (
                  <div key={t} className="rounded-md border border-line bg-tint px-2.75 py-1 text-[12.5px] font-bold">
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3.5 text-[14.5px]">
                <div>
                  <span className="text-muted">Available </span>
                  {psych.avail.join(", ") || "—"}
                </div>
                <div>
                  <span className="text-muted">Languages </span>
                  {psych.langs.trim() || "—"}
                </div>
              </div>
              <div className="mt-3.5 font-heading text-[15px] font-medium">
                {psych.phone.trim() || psych.email.trim() || "Phone or email"}
              </div>
            </div>
          </div>

          <div className="mt-7">
            <h2 className="font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.02em]">
              Your details
            </h2>
            {psychSent ? (
              <div role="status" className="mt-4.5 rounded-[14px] border border-accent bg-tint p-6.5">
                <div className="font-heading text-xl font-medium">Thank you — that&apos;s with us</div>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{sentNote}</p>
                <Link href="/" className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink">
                  Back to KIRO
                </Link>
              </div>
            ) : (
              <div className="mt-4.5 flex flex-col gap-4.5">
                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">About you</div>
                  <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Full name *
                      <input
                        value={psych.pname}
                        onChange={(e) => updatePsych("pname", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.pname}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Qualification *
                      <input
                        value={psych.qualification}
                        onChange={(e) => updatePsych("qualification", e.target.value)}
                        placeholder="e.g. M.Phil Clinical Psychology"
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.qualification}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      RCI / registration or licence no. *
                      <input
                        value={psych.license}
                        onChange={(e) => updatePsych("license", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.license}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Years of experience
                      <input
                        type="number"
                        min={0}
                        value={psych.years}
                        onChange={(e) => setPsych((p) => ({ ...p, years: e.target.value }))}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">How you can help</div>
                  <div className="mt-4 text-[14.5px] font-bold">Specialisation</div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {SPECS.map((t) => (
                      <Checkbox
                        key={t}
                        label={t}
                        checked={psych.specs.includes(t)}
                        onChange={() => setPsych((p) => ({ ...p, specs: toggleIn(p.specs, t) }))}
                      />
                    ))}
                  </div>
                  <div className="mt-5 text-[14.5px] font-bold">Availability</div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {AVAIL_OPTS.map((t) => (
                      <Checkbox
                        key={t}
                        label={t}
                        checked={psych.avail.includes(t)}
                        onChange={() => setPsych((p) => ({ ...p, avail: toggleIn(p.avail, t) }))}
                      />
                    ))}
                  </div>
                  <label className="mt-5 flex max-w-[340px] flex-col gap-1.5 text-[14.5px] font-bold">
                    Languages you work in
                    <input
                      value={psych.langs}
                      onChange={(e) => setPsych((p) => ({ ...p, langs: e.target.value }))}
                      placeholder="e.g. Hindi, English, Marathi"
                      className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                    />
                  </label>
                </div>

                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">How we reach you</div>
                  <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      City *
                      <input
                        value={psych.city}
                        onChange={(e) => updatePsych("city", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.city}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Phone
                      <input
                        type="tel"
                        value={psych.phone}
                        onChange={(e) => updatePsych("phone", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.phone}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Email
                      <input
                        type="email"
                        value={psych.email}
                        onChange={(e) => updatePsych("email", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{psychErrs.email}</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-[14px] border border-line bg-tint p-5.5">
                  <label className="flex cursor-pointer items-start gap-2.75 text-[15px] leading-snug">
                    <input
                      type="checkbox"
                      checked={psych.pconsent}
                      onChange={(e) => updatePsych("pconsent", e.target.checked)}
                      className="mt-0.5 h-[18px] w-[18px] flex-none accent-accent"
                    />
                    I confirm the details above are accurate and KIRO may show my professional
                    details to parents.
                  </label>
                  <div className="mt-1.5 text-[13px] font-semibold text-alert">{psychErrs.pconsent}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={submitPsych}
                    disabled={psychSubmitting}
                    className="rounded-lg bg-accent px-7 py-3.5 text-[15.5px] font-bold text-accent-ink disabled:opacity-60"
                  >
                    {psychSubmitting ? "Sending…" : "Register to join"}
                  </button>
                  <div className="max-w-[38ch] text-sm text-muted">{submitNote}</div>
                </div>
                {psychSubmitError && (
                  <div className="text-[13px] font-semibold text-alert">{psychSubmitError}</div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-7">
            <h2 className="font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.02em]">
              What parents will see
            </h2>
            <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-muted">
              This preview fills in as you type. Nothing else about you is shown.
            </p>
            <div className="mt-4.5 max-w-[520px] rounded-[14px] border border-line bg-surface p-6.5">
              <div className="font-heading text-xl font-medium">{cdc.centre.trim() || "Your centre's name"}</div>
              <div className="mt-1 text-[14.5px] text-muted">
                {[cdc.area.trim(), cdc.city.trim()].filter(Boolean).join(", ") || "Area, city"}
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.75">
                {(cdc.services.length ? cdc.services : ["Services you pick"]).map((t) => (
                  <div key={t} className="rounded-md border border-line bg-tint px-2.75 py-1 text-[12.5px] font-bold">
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3.5 text-[14.5px]">
                <div>
                  <span className="text-muted">Ages </span>
                  {cdc.ages.join(", ") || "—"}
                </div>
                <div>
                  <span className="text-muted">Languages </span>
                  {cdc.langs.trim() || "—"}
                </div>
              </div>
              <div className="mt-3.5 font-heading text-[15px] font-medium">
                {cdc.phone.trim() || cdc.email.trim() || "Phone or email"}
              </div>
            </div>
          </div>

          <div className="mt-7">
            <h2 className="font-heading text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] tracking-[-0.02em]">
              Your details
            </h2>
            {cdcSent ? (
              <div role="status" className="mt-4.5 rounded-[14px] border border-accent bg-tint p-6.5">
                <div className="font-heading text-xl font-medium">Thank you — that&apos;s with us</div>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted">{sentNote}</p>
                <Link href="/" className="mt-3.5 inline-block rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink">
                  Back to KIRO
                </Link>
              </div>
            ) : (
              <div className="mt-4.5 flex flex-col gap-4.5">
                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">About the centre</div>
                  <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Centre or practice name *
                      <input
                        value={cdc.centre}
                        onChange={(e) => updateCdc("centre", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.centre}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Contact person *
                      <input
                        value={cdc.person}
                        onChange={(e) => updateCdc("person", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.person}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Your role *
                      <input
                        value={cdc.role}
                        onChange={(e) => updateCdc("role", e.target.value)}
                        placeholder="e.g. Clinical psychologist, Director"
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.role}</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">What you offer</div>
                  <div className="mt-4 text-[14.5px] font-bold">Services</div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {SERVICES.map((t) => (
                      <Checkbox
                        key={t}
                        label={t}
                        checked={cdc.services.includes(t)}
                        onChange={() => setCdc((c) => ({ ...c, services: toggleIn(c.services, t) }))}
                      />
                    ))}
                  </div>
                  <div className="mt-5 text-[14.5px] font-bold">Ages served</div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {AGE_OPTS.map((t) => (
                      <Checkbox
                        key={t}
                        label={t}
                        checked={cdc.ages.includes(t)}
                        onChange={() => setCdc((c) => ({ ...c, ages: toggleIn(c.ages, t) }))}
                      />
                    ))}
                  </div>
                  <label className="mt-5 flex max-w-[340px] flex-col gap-1.5 text-[14.5px] font-bold">
                    Languages you work in
                    <input
                      value={cdc.langs}
                      onChange={(e) => setCdc((c) => ({ ...c, langs: e.target.value }))}
                      placeholder="e.g. Hindi, English, Marathi"
                      className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                    />
                  </label>
                </div>

                <div className="rounded-[14px] border border-line bg-surface p-6.5">
                  <div className="font-heading text-[11.5px] uppercase tracking-[0.16em] text-muted">How parents reach you</div>
                  <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      City *
                      <input
                        value={cdc.city}
                        onChange={(e) => updateCdc("city", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.city}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Area or locality
                      <input
                        value={cdc.area}
                        onChange={(e) => setCdc((c) => ({ ...c, area: e.target.value }))}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Phone
                      <input
                        type="tel"
                        value={cdc.phone}
                        onChange={(e) => updateCdc("phone", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.phone}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Email
                      <input
                        type="email"
                        value={cdc.email}
                        onChange={(e) => updateCdc("email", e.target.value)}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                      <span className="text-[13px] font-semibold text-alert">{cdcErrs.email}</span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14.5px] font-bold">
                      Website (optional)
                      <input
                        value={cdc.site}
                        onChange={(e) => setCdc((c) => ({ ...c, site: e.target.value }))}
                        className="rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                      />
                    </label>
                  </div>
                  <label className="mt-4 flex flex-col gap-1.5 text-[14.5px] font-bold">
                    Anything else we should know
                    <textarea
                      rows={3}
                      value={cdc.note}
                      onChange={(e) => setCdc((c) => ({ ...c, note: e.target.value }))}
                      className="resize-y rounded-lg border-[1.5px] border-line bg-page px-3.25 py-2.75 text-[15px] font-normal"
                    />
                  </label>
                </div>

                <div className="rounded-[14px] border border-line bg-tint p-5.5">
                  <label className="flex cursor-pointer items-start gap-2.75 text-[15px] leading-snug">
                    <input
                      type="checkbox"
                      checked={cdc.consent}
                      onChange={(e) => updateCdc("consent", e.target.checked)}
                      className="mt-0.5 h-[18px] w-[18px] flex-none accent-accent"
                    />
                    I confirm I&apos;m authorised to list this practice and that KIRO may show
                    these details to parents.
                  </label>
                  <div className="mt-1.5 text-[13px] font-semibold text-alert">{cdcErrs.consent}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={submitCdc}
                    disabled={cdcSubmitting}
                    className="rounded-lg bg-accent px-7 py-3.5 text-[15.5px] font-bold text-accent-ink disabled:opacity-60"
                  >
                    {cdcSubmitting ? "Sending…" : "Send my listing"}
                  </button>
                  <div className="max-w-[38ch] text-sm text-muted">{submitNote}</div>
                </div>
                {cdcSubmitError && (
                  <div className="text-[13px] font-semibold text-alert">{cdcSubmitError}</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
