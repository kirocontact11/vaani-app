import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { vapiMessageSchema } from "@/lib/validation";

// Constant-time: hashing makes both sides the same length, and timingSafeEqual
// doesn't leak how many characters matched.
function secretMatches(given: string | null, secret: string): boolean {
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  // Fail closed: an unconfigured secret means reject everything, not accept
  // everything as an unprotected open endpoint.
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  return secretMatches(bearer, secret) || secretMatches(req.headers.get("x-vapi-secret"), secret);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = vapiMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { message } = parsed.data;
  if (message.type !== "end-of-call-report") {
    return NextResponse.json({ ok: true, ignored: message.type });
  }

  const supabase = supabaseAdmin();
  // Vapi doesn't document whether it re-sends reports; a repeat must not
  // store the same transcript twice.
  const callId = message.call?.id;
  if (callId) {
    const { data: existing } = await supabase.from("calls").select("id").eq("vapi_call_id", callId).limit(1);
    if (existing?.length) return NextResponse.json({ ok: true, duplicate: true });
  }
  const { error } = await supabase.from("calls").insert({
    vapi_call_id: message.call?.id ?? null,
    ended_reason: message.endedReason ?? null,
    transcript: message.artifact?.transcript ?? null,
    // The original payload, not zod's output: zod drops every field outside
    // the schema, and the full report (analysis, recording) is needed later.
    raw: json.message,
  });
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
