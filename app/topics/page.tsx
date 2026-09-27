import type { Metadata } from "next";
import Link from "next/link";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import { TOPICS } from "@/lib/content/topics";

export const metadata: Metadata = {
  title: "Topic by topic — KIRO",
  description: "What it is, what it looks like, and what to do tonight — topic by topic.",
};

export default function TopicsHubPage() {
  return (
    <>
      <SubpageHeader />
      <section className="mx-auto max-w-[1100px] px-4 pt-5 text-center sm:px-12 sm:pt-7">
        <h1 className="font-heading text-[clamp(36px,4.6vw,56px)] font-semibold leading-[1.08] tracking-[-0.02em]">
          Topic by topic
        </h1>
        <p className="mx-auto mt-3.5 max-w-[56ch] text-[17px] leading-relaxed text-muted">
          What it is, what it looks like on your child&apos;s phone, and what to do tonight —
          for the things Indian parents ask about most.
        </p>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pt-6 pb-15 sm:px-12">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4.5">
          {TOPICS.map((tp) => (
            <Link
              key={tp.slug}
              href={`/topics/${tp.slug}`}
              className="block rounded-[14px] border border-line bg-surface p-5.5 transition-transform hover:-translate-y-1"
            >
              <div className="font-heading text-xl font-medium">{tp.title}</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                {tp.what.slice(0, 90).replace(/[\s,.;:—-]+\S*$/, "")}…
              </p>
              <div className="mt-3 text-[13.5px] font-bold text-accent">Read more →</div>
            </Link>
          ))}
        </div>
      </section>

      <SubpageFooter />
    </>
  );
}
