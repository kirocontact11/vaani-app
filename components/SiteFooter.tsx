import Image from "next/image";

// The full footer — Home screen only. Every other page uses SubpageFooter.
export default function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-4 px-4 pb-14 pt-12 text-center sm:px-12">
      <div className="flex items-center gap-2.5">
        <Image src="/kiro-logo.png" alt="" width={52} height={52} className="block object-contain" />
        <span className="font-heading text-[22px] font-semibold tracking-[0.04em]">
          KIRO — KEEP IT REAL ONLINE
        </span>
      </div>
      <p className="max-w-[44ch] text-[15.5px] leading-relaxed text-muted">
        KIRO stands for Keep It Real Online. A free helpline that helps Indian families
        keep their children safe online.
      </p>
      <div className="flex flex-wrap justify-center gap-5 text-[15px] font-bold">
        <a href="mailto:kiro.contact11@gmail.com">kiro.contact11@gmail.com</a>
        <a href="https://childlineindia.org/a/p/contact-us" target="_blank" rel="noopener">
          1098 Childline
        </a>
        <a href="https://cybercrime.gov.in" target="_blank" rel="noopener">
          1930 Cyber Crime
        </a>
        <a href="mailto:kiro.contact11@gmail.com?subject=Privacy">Privacy</a>
      </div>
      <div className="mt-2 text-[13.5px] text-muted">
        © 2026 KIRO · Keep It Real Online India, New Delhi · kirohelp.com
      </div>
    </footer>
  );
}
