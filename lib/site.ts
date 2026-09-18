// TODO(neil): confirm the real production domain (the GoDaddy purchase) —
// this default is inferred from "kirohelp.com" appearing in the footer copy
// and CDC_EMAIL, not confirmed directly. Set NEXT_PUBLIC_SITE_URL in
// .env.local / Vercel once confirmed; everything SEO-related (robots.ts,
// sitemap.ts, metadataBase) reads from this one constant.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kirohelp.com";
