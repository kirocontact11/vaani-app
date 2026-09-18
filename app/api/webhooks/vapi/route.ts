import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";

// Vapi's server URL receives many message types (status-update, transcript,
// speech-update, hang, end-of-call-report, ...) at the same endpoint — only
// end-of-call-report is logged here; everything else is safely acknowledged
// and ignored, not treated as an error.
const bodySchema = z.object({
  message: z.object({
    type: z.string(),
    endedReason: z.string().optional(),
    call: z.object({ id: z.string().optional() }).optional(),
    artifact: z.object({ transcript: z.string().optional() }).optional(),
  }),
});

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  // Fail closed: an unconfigured secret means reject everything, not accept
  // everything as an unprotected open endpoint.
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const legacyHeader = req.headers.get("x-vapi-secret");
  if (legacyHeader === secret) return true;

  return false;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { message } = parsed.data;
  if (message.type !== "end-of-call-report") {
    return NextResponse.json({ ok: true, ignored: message.type });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("calls").insert({
    vapi_call_id: message.call?.id ?? null,
    ended_reason: message.endedReason ?? null,
    transcript: message.artifact?.transcript ?? null,
    raw: message,
  });
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
