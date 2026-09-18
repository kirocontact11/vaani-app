import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SubpageHeader, SubpageFooter } from "@/components/SubpageChrome";
import { TOPICS, type Topic } from "@/lib/content/topics";
import { VIDEOS } from "@/lib/content/videos";
import { SITE_URL } from "@/lib/site";

// Article, not a medical schema type (e.g. MedicalWebPage) — the assistant's
// own rules explicitly avoid clinical claims, and this content is guidance,
// not medical advice. No datePublished: we don't have a real one to give.
function topicJsonLd(topic: Topic) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.what,
    mainEntityOfPage: `${SITE_URL}/topics/${topic.slug}`,
    publisher: {
      "@type": "Organization",
      name: "KIRO — Keep It Real Online",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/kiro-logo.png` },
    },
  };
}

export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.slug === slug);
  if (!topic) return {};
  return {
    title: `${topic.title} — KIRO`,
    description: topic.what.slice(0, 150),
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.slug === slug);
  if (!topic) notFound();

  const topicVideos = VIDEOS.filter((v) => v.tag1 === topic.videoTag || v.tag2 === topic.videoTag);
  const urgent = topic.cta === "urgent";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topicJsonLd(topic)) }}
      />
      <SubpageHeader backHref="/topics" backLabel="← All topics" />

      <section className="mx-auto max-w-[720px] px-4 pt-5 sm:px-12 sm:pt-7">
        <h1 className="font-heading text-[clamp(34px,4.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.02em]">
          {topic.title}
        </h1>

        <div className="mt-7">
          <div className="font-heading text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
            What it is
          </div>
          <p className="mt-2 text-[16.5px] leading-[1.65]">{topic.what}</p>
        </div>

        <div className="mt-7.5">
          <div className="font-heading text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
            What it looks like on your child&apos;s phone
          </div>
          <ul className="mt-2.5 list-disc pl-5 text-base leading-[1.7]">
            {topic.looksLike.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ul>
        </div>

        <div className="mt-7.5 rounded-xl border border-line bg-tint p-5.5">
          <div className="font-heading text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
            What to do tonight
          </div>
          <ol className="mt-2.5 list-decimal pl-5 text-base leading-[1.7]">
            {topic.tonight.map((li) => (
              <li key={li}>{li}</li>
            ))}
          </ol>
        </div>

        <div className="mt-7.5">
          <div className="font-heading text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
            What the law says in India
          </div>
          <p className="mt-2 text-[15px] leading-[1.65] text-muted">{topic.law}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted opacity-80">
            General information, not legal advice.
          </p>
        </div>

        {topicVideos.length > 0 && (
          <div className="mt-8.5">
            <div className="font-heading text-[13px] font-medium uppercase tracking-[0.14em] text-muted">
              Videos on this
            </div>
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
              {topicVideos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Watch on YouTube: ${v.title}`}
                  className="rounded-xl border border-line bg-surface p-2.5"
                >
                  <div
                    className="aspect-video rounded-lg bg-tint bg-cover bg-center"
                    style={{ backgroundImage: `url(${v.thumb})` }}
                  />
                  <div className="mt-2.25 font-heading text-[15px] font-medium">{v.title}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {urgent ? (
          <div className="mt-10 rounded-[14px] bg-ink p-6.5 text-center text-white">
            <div className="font-heading text-xl font-medium">Talk to Vaani now — or call 1098</div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#FFFFFFD9]">
              You don&apos;t have to figure this out alone tonight.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Link href="/talk" className="rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink">
                Talk to Vaani
              </Link>
              <a href="tel:1098" className="rounded-lg bg-[#FFFFFF1F] px-5.5 py-3 text-[15px] font-bold text-white">
                Call 1098
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-[14px] border border-line bg-tint p-6.5 text-center">
            <div className="font-heading text-xl font-medium">Still not sure what to do?</div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              Talk it through with Vaani, in your own language.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Link href="/talk" className="rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink">
                Talk to Vaani
              </Link>
              <Link href="/book" className="rounded-lg border-[1.5px] border-line bg-white px-5.5 py-3 text-[15px] font-bold">
                Book an appointment
              </Link>
            </div>
          </div>
        )}
      </section>

      <SubpageFooter backHref="/topics" backLabel="← All topics" />
    </>
  );
}
