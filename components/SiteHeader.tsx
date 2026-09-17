import Image from "next/image";
import Link from "next/link";

// "How it works" / "Why?" / "Partner with us" / "Resources" are anchor
// sections (id="how"/"about"/"together"/"resources") inside the Home screen
// in the design, not separate pages — confirmed by reading the design's own
// route flags (data-screen-label / sc-if), not guessed.
const NAV_LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#about", label: "Why?" },
  { href: "/#together", label: "Partner with us" },
  { href: "/videos", label: "Videos" },
  { href: "/topics", label: "Topics" },
  { href: "/#resources", label: "Resources" },
];

// The full nav header — Home screen only. Every other page uses SubpageHeader.
export default function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line bg-[#FAFAF8F2] px-4 py-3 backdrop-blur-md sm:px-12">
      <Link href="/" aria-label="KIRO home" className="flex items-center gap-2.5">
        <Image src="/kiro-logo.png" alt="" width={50} height={50} className="block object-contain" />
        <span className="font-heading text-xl font-semibold tracking-[0.04em]">
          KIRO — KEEP IT REAL ONLINE
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-3.5 text-[15px] font-semibold sm:gap-7">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link href="/community" className="rounded-lg bg-[#25D366] px-5 py-2.5 text-black">
          Community
        </Link>
        <Link href="/talk" className="rounded-lg bg-accent px-5 py-2.5 text-accent-ink">
          Speak to Vaani
        </Link>
      </nav>
    </header>
  );
}
