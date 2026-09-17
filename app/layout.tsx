import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "KIRO — Keep It Real Online",
  description: "A free online-safety helpline for Indian families.",
};

// The 1098 emergency bar is the only chrome shared by every screen in the
// design (including chat, which has its own very different header). The full
// nav header/footer belong to the Home screen only; other pages bring their
// own lighter header/footer (see components/SubpageChrome.tsx).
function EmergencyBar() {
  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-alert px-4 py-2.5 text-center text-[14.5px] font-semibold text-white">
      <span>If your child is in danger right now, call the free child helpline</span>
      <a
        href="tel:1098"
        className="rounded-md bg-white px-[15px] py-[5px] font-heading text-[15px] font-semibold tracking-[0.04em] text-alert"
      >
        1098
      </a>
      <span className="opacity-90">Free · 24×7 · any language</span>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base text-ink">
        <EmergencyBar />
        <main className="w-full flex-1">{children}</main>
      </body>
    </html>
  );
}
