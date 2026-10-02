// The visitor's IP, for rate limiting. Render serves the site through
// Cloudflare, which sets CF-Connecting-IP to the real visitor and overwrites
// anything the visitor sent under that name. X-Forwarded-For can't be trusted
// on its own there: a visitor can put any value first in it, and the form
// limit then never triggers. It's only the fallback for hosts without
// Cloudflare (local dev, Vercel).
export function clientIp(headers: { get(name: string): string | null }): string {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
