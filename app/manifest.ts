import type { MetadataRoute } from "next";

// Values match the site's own design tokens (app/globals.css) and existing
// metadata — nothing invented here.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIRO — Keep It Real Online",
    short_name: "KIRO",
    description: "A free online-safety helpline for Indian families.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#2F5D50",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
