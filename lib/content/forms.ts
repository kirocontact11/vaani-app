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

// TODO(neil): mailto is a stopgap — swap for a real Supabase-backed endpoint in step C3/C4.
export const CDC_ENDPOINT: string | null = null;
// TODO(neil): confirm the kirohelp.com address.
export const CDC_EMAIL = "hello@kirohelp.com";

// TODO(neil): paste the real chat.whatsapp.com invite link — the source design already
// carries the real link, ported verbatim below. Typed as `string` (not narrowed to this
// literal) since /community compares it against "#" / "" to decide whether the link is ready.
export const WHATSAPP_INVITE: string = "https://chat.whatsapp.com/IU5FL4HDgY55rdI4NOQzpG";

/**
 * Submits a form: POSTs JSON to `endpoint` if one is set (the future C3/C4
 * Supabase-backed path), otherwise falls back to opening a pre-filled
 * `mailto:` draft. Shared by every form on the site (CDC/psych registration,
 * book-an-appointment, request-a-video) so the fallback logic lives in one
 * place instead of being copy-pasted per form.
 */
export function submitForm(
  rows: [string, string][],
  subject: string,
  endpoint: string | null,
  data?: unknown
) {
  if (endpoint) {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return;
  }
  const body = rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n");
  location.href = `mailto:${CDC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
