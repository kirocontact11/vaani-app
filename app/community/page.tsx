import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import ExampleScroller from "@/components/ExampleScroller";
import { WHATSAPP_INVITE } from "@/lib/content/forms";

export const metadata: Metadata = {
  title: "Join the group — KIRO",
  description: "A free WhatsApp group for parents — one message a week, never more.",
};

const WHAT_YOU_GET = [
  "Real questions from other parents, shared with permission.",
  "Answers you can use the same evening.",
  "No selling, no forwards, no spam.",
];

export default function CommunityPage() {
  const inviteReady = WHATSAPP_INVITE !== "#" && WHATSAPP_INVITE !== "";

  return (
    <>
      <SubpageHeader />

      <section className="mx-auto max-w-[1140px] px-4 pt-5 sm:px-12 sm:pt-7">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-10">
          <div className="flex flex-col items-start gap-3.5">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-tint py-2 pl-2.5 pr-4">
              <span className="grid h-6.5 w-6.5 flex-none place-items-center rounded-full bg-[#25D366] text-white">
                <svg viewBox="0 0 32 32" width="15" height="15" fill="currentColor">
                  <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.35.66 4.55 1.8 6.42L4 29l7.78-1.75a11.9 11.9 0 0 0 4.24.77h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.85c-1.42 0-2.8-.36-4-1.03l-.29-.16-3.94.89.9-3.83-.19-.3a9.83 9.83 0 0 1-1.6-5.4c0-5.46 4.44-9.9 9.92-9.9 5.47 0 9.9 4.44 9.9 9.9 0 5.47-4.43 9.83-9.7 9.83z" />
                </svg>
              </span>
              <span className="text-[13.5px] font-bold">KIRO Parents Group</span>
            </div>
            <h1 className="font-heading text-[clamp(34px,4.4vw,54px)] font-semibold leading-[1.06] tracking-[-0.02em]">
              Join the group
            </h1>
            <p className="max-w-[42ch] text-base leading-relaxed text-muted">
              Your number is visible to other members, as in any WhatsApp group. You can leave
              at any time.
            </p>
            {inviteReady ? (
              <a
                href={WHATSAPP_INVITE}
                target="_blank"
                rel="noopener"
                className="mt-1.5 inline-flex items-center gap-2.25 rounded-lg bg-[#25D366] px-6.5 py-3.25 text-[15.5px] font-bold text-white"
              >
                <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor">
                  <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.35.66 4.55 1.8 6.42L4 29l7.78-1.75a11.9 11.9 0 0 0 4.24.77h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm0 21.85c-1.42 0-2.8-.36-4-1.03l-.29-.16-3.94.89.9-3.83-.19-.3a9.83 9.83 0 0 1-1.6-5.4c0-5.46 4.44-9.9 9.92-9.9 5.47 0 9.9 4.44 9.9 9.9 0 5.47-4.43 9.83-9.7 9.83z" />
                </svg>
                Join on WhatsApp
              </a>
            ) : (
              <div
                aria-disabled="true"
                className="mt-1.5 cursor-not-allowed rounded-lg border border-line bg-tint px-6.5 py-3.25 text-[15.5px] font-bold text-muted"
              >
                Link coming soon
              </div>
            )}
            <Link href="/talk" className="text-[14.5px] font-bold text-accent">
              Prefer not to join a group? Speak to Vaani instead →
            </Link>
          </div>

          <div>
            <h2 className="font-heading text-[clamp(20px,2.2vw,26px)] font-medium leading-[1.15] tracking-[-0.02em]">
              What you get
            </h2>
            <div className="mt-3.5 grid gap-0.5">
              {WHAT_YOU_GET.map((line) => (
                <div key={line} className="flex items-start gap-3.5 border-b border-line py-3.25">
                  <div className="mt-2 h-2 w-2 flex-none rounded-full bg-accent" />
                  <div className="text-base leading-relaxed">{line}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ExampleScroller />

      <SubpageFooter />
    </>
  );
}
