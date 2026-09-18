"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SubpageHeader />
      <section className="mx-auto flex max-w-[600px] flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-12">
        <div className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-alert">
          Something went wrong
        </div>
        <h1 className="mt-3 font-heading text-[clamp(30px,3.6vw,44px)] font-semibold leading-[1.1] tracking-[-0.02em]">
          This page hit a snag
        </h1>
        <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-muted">
          Nothing you did caused this. Try again, or head back to the home page. If your child
          is in danger right now, use the number at the top of the screen.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="rounded-lg bg-accent px-6 py-3 text-[15px] font-bold text-accent-ink"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border-[1.5px] border-line bg-surface px-6 py-3 text-[15px] font-bold"
          >
            Back to KIRO
          </Link>
        </div>
      </section>
      <SubpageFooter />
    </>
  );
}
