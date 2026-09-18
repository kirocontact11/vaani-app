import { createClient } from "@supabase/supabase-js";

// Service-role client — server-only, bypasses RLS. Never import this from a
// "use client" component; it must only ever run inside an API route.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
