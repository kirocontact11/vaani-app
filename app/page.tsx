import Link from "next/link";
import HeroRotator from "@/components/HeroRotator";
import FeaturedVideos from "@/components/FeaturedVideos";
import NewsCarousel from "@/components/NewsCarousel";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const HERO_CHIPS = [
  { href: "/talk/screen-time", label: "Too much screen time" },
  { href: "/talk/gaming", label: "Online gaming" },
  { href: "/talk/bullying", label: "Being bullied" },
  { href: "/talk/privacy", label: "Strangers & privacy" },
  { href: "/talk/pornography", label: "Adult content" },
  { href: "/talk/incident", label: "Something already happened" },
];

const JOURNEY_STEPS = [
  {
    n: 1,
    title: "Speak to Vaani",
    body: "Free, instant, any Indian language. Say it the way you'd say it to a friend — Vaani gives you something to do tonight.",
  },
  {
    n: 2,
    title: "Connect with a psychologist",
    body: "If it needs a person, we put you in front of a qualified child psychologist. A real conversation, not a chatbot.",
    cta: { href: "/book", label: "Book an appointment →" },
  },
  {
    n: 3,
    title: "Ongoing care",
    body: "For longer-term support we connect you with a therapist or a Child Development Centre near you.",
  },
];

const ABOUT_CARDS = [
  {
    label: "The gap",
    body: 'Clinicians now see "virtual autism" and "digital ADHD", attention and speech delays tied to early screen exposure. No formal diagnosis exists yet.',
  },
  {
    label: "What exists today",
    body: "Childline 1098 is a crisis line. NCPCR acts after harm is reported. Nothing screens early or routes families before a crisis point.",
  },
  {
    label: "What we do",
    body: "KIRO is the missing layer, a preventive front door that catches it early and connects families to real child psychologists.",
  },
];

const TICKER_ITEMS = [
  "Screen time",
  "Bullying",
  "Online gaming",
  "Privacy",
  "Strangers online",
  "Adult content",
];

function Ticker() {
  const row = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex flex-none items-center gap-5.5 pr-5.5"
    >
      {TICKER_ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-5.5">
          {item}
          <span className="opacity-50">·</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="mt-6 overflow-hidden bg-accent sm:mt-8">
      <div
        className="flex w-max items-center py-3.5 font-heading text-lg font-medium tracking-[0.01em] text-accent-ink"
        style={{ animation: "slide 48s linear infinite" }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <section
        id="top"
        className="mx-auto max-w-[1140px] px-4 pt-4.5 pb-8 sm:px-12 sm:pt-7 sm:pb-12"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-10">
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-tint px-4 py-1.75 text-[13.5px] font-bold text-ink">
              Free · For families in India · In any Indian language
            </div>
            <h1 className="mt-4.5 max-w-[15ch] font-heading text-[clamp(38px,5.2vw,68px)] font-semibold leading-[1.05] tracking-[-0.02em] text-pretty">
              You&apos;re not the only <HeroRotator />{" "}
              <span className="sr-only">parent, teacher or student</span> wondering.
            </h1>
            <p className="mt-5 max-w-[44ch] text-[17.5px] leading-[1.65] text-muted">
              Screen time, gaming, a message you weren&apos;t meant to see. Whatever it is,
              just ask.
              <br />
              Vaani gives you a kind, clear answer — and a real person if you need one.
            </p>
            <div className="mt-7.5 flex max-w-[560px] flex-wrap gap-3">
              {HERO_CHIPS.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-lg border border-[#8FB3A1] bg-[#A9C9B8] px-4.5 py-2.5 text-[13.5px] font-semibold text-ink"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[320px] flex-col items-center justify-center">
            <div className="relative grid h-[240px] w-[240px] place-items-center">
              <div
                className="pointer-events-none absolute h-[258px] w-[258px] rounded-full border-2 border-[#2F5D5066]"
                style={{ animation: "ring-pulse 3.6s ease-out 0s infinite" }}
              />
              <div
                className="pointer-events-none absolute h-[258px] w-[258px] rounded-full border-2 border-[#2F5D5066]"
                style={{ animation: "ring-pulse 3.6s ease-out 1.2s infinite" }}
              />
              <div
                className="pointer-events-none absolute h-[258px] w-[258px] rounded-full border-2 border-[#2F5D5066]"
                style={{ animation: "ring-pulse 3.6s ease-out 2.4s infinite" }}
              />
              <Link
                href="/talk/voice"
                aria-label="Speak to Vaani"
                className="relative grid h-[240px] w-[240px] place-items-center rounded-full bg-accent shadow-[0_28px_56px_-32px_#2F5D5099] transition-transform duration-250 hover:scale-[1.04]"
              >
                <div className="flex flex-col items-center gap-3.5">
                  <div className="h-[46px] w-[30px] rounded-full bg-white" />
                  <div className="flex h-6 items-end gap-1">
                    {[0, 0.18, 0.36, 0.54, 0.72].map((delay) => (
                      <div
                        key={delay}
                        className="h-full w-[5px] rounded-[3px] bg-[#FFFFFFCC]"
                        style={{ animation: `bar 1.1s ease-in-out ${delay}s infinite` }}
                      />
                    ))}
                  </div>
                  <div className="font-heading text-xl font-medium text-white">
                    Speak to Vaani
                  </div>
                </div>
              </Link>
            </div>
            <Link
              href="/talk"
              className="mt-5 rounded-lg border-[1.5px] border-ink bg-surface px-6 py-3 text-[15.5px] font-bold"
            >
              I&apos;d rather type
            </Link>
          </div>
        </div>
      </section>

      <section
        id="how"
        className="scroll-mt-[90px] bg-[#DAEAE4] px-4 py-6 sm:scroll-mt-[130px] sm:px-12 sm:py-8"
      >
        <div className="mx-auto max-w-[1100px] text-center">
          <h2 className="font-heading text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Three simple steps
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-lg leading-[1.55] text-muted">
            No account. No forms. Nothing to download.
          </p>
          <div className="mt-4.5 grid grid-cols-[repeat(auto-fit,minmax(258px,1fr))] gap-4.5">
            {JOURNEY_STEPS.map((step) => (
              <div
                key={step.n}
                className="flex flex-col items-center gap-3 rounded-[14px] border border-line bg-surface p-4.5 px-4"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full border border-line bg-tint font-heading text-lg font-medium">
                  {step.n}
                </div>
                <div className="font-heading text-[clamp(22px,2.4vw,26px)] font-medium leading-[1.15]">
                  {step.title}
                </div>
                <p className="max-w-[30ch] text-[15.5px] leading-[1.55] text-muted">
                  {step.body}
                </p>
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="mt-1 rounded-lg bg-accent px-4 py-2.25 text-sm font-bold text-accent-ink"
                  >
                    {step.cta.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[14.5px] italic text-muted">
            Most families stop at step one. That&apos;s the point.
          </p>
        </div>
      </section>

      <section
        id="about"
        className="scroll-mt-[90px] bg-[#E7E1F1] px-4 py-6 sm:scroll-mt-[130px] sm:px-12 sm:py-8"
      >
        <div className="mx-auto max-w-[900px]">
          <h2 className="font-heading text-[clamp(28px,3.2vw,40px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Why we built this
          </h2>
          <p className="mt-3.5 max-w-[34ch] font-heading text-[clamp(20px,2.4vw,27px)] font-medium leading-[1.35] tracking-[-0.01em]">
            There&apos;s a name for what&apos;s happening to kids&apos; attention and speech.
            No one is screening for it… until now.
          </p>

          <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
            {ABOUT_CARDS.map((card) => (
              <div key={card.label} className="rounded-[14px] border border-line bg-surface p-4.5">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
                  {card.label}
                </div>
                <p className="mt-2 text-[15px] leading-[1.55]">{card.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-5.5 max-w-[70ch] text-[17px] leading-[1.6] text-muted">
            Founded by Krupala Nune, a BITS Pilani alumna and founder of BeyondScroll, built
            with qualified child psychologists and child development experts. Part of Keep It
            Real Online India.
          </p>
        </div>
      </section>

      <section
        id="together"
        className="scroll-mt-[90px] bg-[#FCECD6] px-4 py-6 sm:scroll-mt-[130px] sm:px-12 sm:py-8"
      >
        <div className="mx-auto max-w-[1100px] text-center">
          <h2 className="font-heading text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Partner with us
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-lg leading-[1.55] text-muted">
            Two ways to help families before it becomes a crisis.
          </p>
          <div className="mt-4.5 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4.5">
            <div className="flex flex-col items-center gap-3 rounded-[14px] border border-line bg-surface p-5 px-4.5">
              <div className="font-heading text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.15]">
                Are you a psychologist?
              </div>
              <p className="max-w-[34ch] text-[15.5px] leading-[1.55] text-muted">
                Take live calls with parents who need a real conversation, not a chatbot. This
                is a paid role, not volunteer work.
              </p>
              <Link
                href="/register?tab=psych"
                className="mt-2 rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink"
              >
                Register to join
              </Link>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-[14px] border border-line bg-surface p-5 px-4.5">
              <div className="font-heading text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.15]">
                Run a child development centre?
              </div>
              <p className="max-w-[34ch] text-[15.5px] leading-[1.55] text-muted">
                List your centre so parents nearby can find you when longer-term, in-person
                care is what&apos;s needed. Free, one short form.
              </p>
              <Link
                href="/register?tab=cdc"
                className="mt-2 rounded-lg bg-accent px-5.5 py-3 text-[15px] font-bold text-accent-ink"
              >
                List my centre
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="watch"
        className="scroll-mt-[90px] bg-[#DAE8F4] px-4 py-6 sm:scroll-mt-[130px] sm:px-12 sm:py-8"
      >
        <div className="mx-auto max-w-[1100px] text-center">
          <h2 className="font-heading text-[clamp(30px,3.6vw,46px)] font-medium leading-[1.1] tracking-[-0.02em]">
            Watch and learn
          </h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-lg leading-[1.55] text-muted">
            Three minutes tonight is worth more than an hour of worrying. Short videos, plain
            language, made for Indian families.
          </p>
          <FeaturedVideos />
        </div>
      </section>

      <section
        id="resources"
        className="scroll-mt-[90px] bg-[#FCF2CE] px-4 py-6 sm:scroll-mt-[130px] sm:px-12 sm:py-8"
      >
        <div className="mx-auto max-w-[1100px]">
          <NewsCarousel />
        </div>
      </section>

      <Ticker />
      <SiteFooter />
    </>
  );
}
