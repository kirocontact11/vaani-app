// mykiro.live (bought on GoDaddy) is the real domain. Override via
// NEXT_PUBLIC_SITE_URL only if that ever changes; everything SEO-related
// (robots.ts, sitemap.ts, metadataBase) reads from this one constant.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mykiro.live";
