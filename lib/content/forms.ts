export const SERVICES = [
  "Speech therapy",
  "Occupational therapy",
  "Behavioural therapy",
  "Counselling",
  "Special education",
  "Assessment / diagnosis",
  "Other",
];

export const AGE_OPTS = ["0–5", "6–9", "10–13", "14–18"];

export const SPECS = [
  "Child & adolescent",
  "Anxiety & depression",
  "ADHD / behavioural",
  "Trauma",
  "Screen & internet addiction",
  "Family counselling",
  "Other",
];

export const AVAIL_OPTS = ["Weekday mornings", "Weekday evenings", "Weekends", "Flexible"];

export const BOOK_TIMES = ["Morning", "Afternoon", "Evening"];

// C3/C4 done (2026-09-18): Supabase tables + RLS exist, and this now points at
// the real API route. Register and Book use this; the video-request form
// deliberately stays on the mailto: fallback below — no table was built for
// it, out of scope for C4.
export const SUBMIT_ENDPOINT: string | null = "/api/submit";
// TODO(neil): confirm the kirohelp.com address.
export const CDC_EMAIL = "hello@kirohelp.com";

// TODO(neil): paste the real chat.whatsapp.com invite link — the source design already
// carries the real link, ported verbatim below. Typed as `string` (not narrowed to this
// literal) since /community compares it against "#" / "" to decide whether the link is ready.
export const WHATSAPP_INVITE: string = "https://chat.whatsapp.com/IU5FL4HDgY55rdI4NOQzpG";

/**
 * Submits a form: POSTs JSON to `endpoint` if one is set, otherwise falls
 * back to opening a pre-filled `mailto:` draft. Shared by every form on the
 * site so the fallback logic lives in one place instead of being copy-pasted
 * per form. Returns whether it actually succeeded — callers must await this
 * and only show a success state on `true`; a fire-and-forget POST would
 * silently show "success" on a validation failure or a database error.
 */
export async function submitForm(
  rows: [string, string][],
  subject: string,
  endpoint: string | null,
  data?: unknown
): Promise<boolean> {
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  const body = rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n");
  location.href = `mailto:${CDC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return true;
}
