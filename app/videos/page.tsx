import type { Metadata } from "next";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import VideosPageClient from "@/components/VideosPageClient";
import { VIDEOS, durationToISO8601 } from "@/lib/content/videos";

export const metadata: Metadata = {
  title: "Watch and learn — KIRO",
  description: "Practical videos on online safety, for Indian families.",
};

// Real fields only: name/description/thumbnailUrl/duration all come straight
// from lib/content/videos.ts. No uploadDate — we don't have a real one, and
// schema.org's duration requirement is already satisfied without inventing it.
const videosJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: VIDEOS.map((v, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "VideoObject",
      name: v.title,
      description: v.body,
      thumbnailUrl: v.thumb,
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
      duration: durationToISO8601(v.dur),
    },
  })),
};

export default function VideosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videosJsonLd) }}
      />
      <SubpageHeader />
      <VideosPageClient />
      <SubpageFooter />
    </>
  );
}
