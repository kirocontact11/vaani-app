import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Not the doc's default example (which blocks microphone) — this
          // site's /talk/voice genuinely needs it. Camera and geolocation
          // are unused anywhere on the site, so those stay blocked.
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          // No-op over plain HTTP (this dev server); takes effect once C10
          // deploys over real HTTPS.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
