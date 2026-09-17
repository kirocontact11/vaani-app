import Image from "next/image";
import Link from "next/link";

interface ChromeProps {
  backHref?: string;
  backLabel?: string;
}

// The lighter header/footer every non-Home page uses in the design: a small
// back-link plus the "Speak to Vaani" CTA, instead of the full nav. Topic
// pages override the back-link to point at /topics ("← All topics").
export function SubpageHeader({ backHref = "/", backLabel = "← Back to site" }: ChromeProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line bg-[#FAFAF8F2] px-4 py-3 backdrop-blur-md sm:px-12">
      <Link href="/" aria-label="KIRO home" className="flex items-center gap-2.5">
        <Image src="/kiro-logo.png" alt="" width={50} height={50} className="block object-contain" />
        <span className="font-heading text-xl font-semibold tracking-[0.04em]">
          KIRO — KEEP IT REAL ONLINE
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-3.5 text-[15px] font-semibold sm:gap-7">
        <Link href={backHref}>{backLabel}</Link>
        <Link href="/talk" className="rounded-lg bg-accent px-5 py-2.5 text-accent-ink">
          Speak to Vaani
        </Link>
      </nav>
    </header>
  );
}

export function SubpageFooter({ backHref = "/", backLabel = "← Back to KIRO" }: ChromeProps) {
  return (
    <footer className="flex flex-col items-center gap-3 px-4 pb-14 pt-12 text-center sm:px-12">
      <Link href={backHref} className="text-[15px] font-bold">
        {backLabel}
      </Link>
      <div className="text-[13.5px] text-muted">
        © 2026 KIRO · Keep It Real Online India, New Delhi
      </div>
    </footer>
  );
}
