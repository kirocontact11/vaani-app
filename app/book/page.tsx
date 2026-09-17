import type { Metadata } from "next";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import BookPageClient from "@/components/BookPageClient";

export const metadata: Metadata = {
  title: "Book an appointment — KIRO",
  description: "Request a call back from the KIRO team.",
};

export default function BookPage() {
  return (
    <>
      <SubpageHeader />
      <BookPageClient />
      <SubpageFooter />
    </>
  );
}
