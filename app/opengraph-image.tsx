import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export const alt = "KIRO — Keep It Real Online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Uses only the real logo asset and brand colors already in this repo
// (app/globals.css's design tokens) — no invented design, no new asset.
const logoData = await readFile(join(process.cwd(), "public/kiro-logo.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text -- rendered server-side
            into a PNG via Satori, not real DOM; the `alt` export above
            already supplies the accessible description via og:image:alt. */}
        <img src={logoSrc} width={180} height={180} />
        <div
          style={{
            marginTop: 28,
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "#1A1A1A",
          }}
        >
          KIRO — KEEP IT REAL ONLINE
        </div>
        <div style={{ marginTop: 14, fontSize: 30, color: "#6B6B6B" }}>
          A free online-safety helpline for Indian families
        </div>
      </div>
    ),
    { ...size }
  );
}
