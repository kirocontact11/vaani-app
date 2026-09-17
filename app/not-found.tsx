import Link from "next/link";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";

export default function NotFound() {
  return (
    <>
      <SubpageHeader />
      <section className="mx-auto flex max-w-[600px] flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-12">
        <div className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-muted">
          404
        </div>
        <h1 className="mt-3 font-heading text-[clamp(30px,3.6vw,44px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-muted">
          The link may be old, or the page may have moved. If your child is in danger right
          now, use the number at the top of the screen.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink"
        >
          Back to KIRO
        </Link>
      </section>
      <SubpageFooter />
    </>
  );
}
