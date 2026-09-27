import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";

// ponytail: in-memory sliding window, per server instance — resets on cold
// start and isn't shared across instances. Fine for current low-traffic
// launch; upgrade to a durable store (Upstash Redis) if abuse shows up.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// Length caps keep one request from storing megabytes of text; generous
// enough that no real form entry comes near them.
const required = z.string().trim().min(1).max(200);
const optional = z.string().trim().max(200).optional().default("");
const longText = z.string().trim().max(5000).optional().default("");
const choices = z.array(z.string().max(100)).max(20).optional().default([]);

const phoneOrEmail = (v: { phone: string; email: string }) => Boolean(v.phone || v.email);

const psychSchema = z
  .object({
    kind: z.literal("psych"),
    pname: required,
    qualification: required,
    license: required,
    years: optional,
    specs: choices,
    avail: choices,
    langs: optional,
    city: required,
    phone: optional,
    email: optional,
    pconsent: z.literal(true),
  })
  .refine(phoneOrEmail, { message: "phone or email required" });

const cdcSchema = z
  .object({
    kind: z.literal("cdc"),
    centre: required,
    person: required,
    role: required,
    services: choices,
    ages: choices,
    langs: optional,
    city: required,
    area: optional,
    phone: optional,
    email: optional,
    site: optional,
    note: longText,
    consent: z.literal(true),
  })
  .refine(phoneOrEmail, { message: "phone or email required" });

const bookSchema = z.object({
  kind: z.literal("book"),
  bname: required,
  bage: required,
  bcity: required,
  bphone: required,
  blang: optional,
  bwhat: longText,
  btime: choices,
});

const bodySchema = z.discriminatedUnion("kind", [psychSchema, cdcSchema, bookSchema]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = supabaseAdmin();

  if (body.kind === "psych") {
    const { error } = await supabase.from("experts").insert({
      kind: "psych",
      name: body.pname,
      city: body.city,
      phone: body.phone || null,
      email: body.email || null,
      langs: body.langs || null,
      consent: body.pconsent,
      qualification: body.qualification,
      license: body.license,
      years: body.years || null,
      specs: body.specs,
      avail: body.avail,
    });
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
    await notifyTeam("Psychologist registration — " + body.pname);
  } else if (body.kind === "cdc") {
    const { error } = await supabase.from("experts").insert({
      kind: "cdc",
      name: body.person,
      city: body.city,
      phone: body.phone || null,
      email: body.email || null,
      langs: body.langs || null,
      consent: body.consent,
      centre: body.centre,
      role: body.role,
      services: body.services,
      ages: body.ages,
      area: body.area || null,
      site: body.site || null,
      note: body.note || null,
    });
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
    await notifyTeam("List my centre — " + body.centre);
  } else {
    const { error } = await supabase.from("appointments").insert({
      parent_name: body.bname,
      child_age: body.bage,
      city: body.bcity,
      phone: body.bphone,
      preferred_lang: body.blang || null,
      concern: body.bwhat || null,
      preferred_times: body.btime,
    });
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
    await notifyTeam("Appointment request — " + body.bname);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

// No-ops until RESEND_API_KEY exists — the DB write above is the part that
// actually matters; email is a notification layered on top, not a
// requirement for the submission to succeed.
async function notifyTeam(subject: string) {
  if (!process.env.RESEND_API_KEY) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "KIRO <onboarding@resend.dev>",
      to: process.env.NOTIFY_EMAIL || "kiro.contact11@gmail.com",
      subject,
      text: "A new submission just came in — check the Supabase dashboard for details.",
    });
  } catch {
    // Email failing must never fail the request — the row is already saved.
  }
}
