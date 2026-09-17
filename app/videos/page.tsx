import type { Metadata } from "next";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import VideosPageClient from "@/components/VideosPageClient";

export const metadata: Metadata = {
  title: "Watch and learn — KIRO",
  description: "Practical videos on online safety, for Indian families.",
};

export default function VideosPage() {
  return (
    <>
      <SubpageHeader />
      <VideosPageClient />
      <SubpageFooter />
    </>
  );
}
