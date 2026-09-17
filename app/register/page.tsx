import type { Metadata } from "next";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import RegisterPageClient from "@/components/RegisterPageClient";

export const metadata: Metadata = {
  title: "Join the KIRO network — KIRO",
  description: "Register as a psychologist, or list your child development centre.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "cdc" ? "cdc" : "psych";

  return (
    <>
      <SubpageHeader />
      <RegisterPageClient initialTab={initialTab} />
      <SubpageFooter />
    </>
  );
}
