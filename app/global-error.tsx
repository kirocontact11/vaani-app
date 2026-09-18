"use client";

// global-error replaces the ENTIRE root layout when it fires — including the
// emergency bar. Per Next's own docs, it doesn't reliably get global styles,
// so this is deliberately inline-styled rather than relying on Tailwind
// classes: on a helpline site, the 1098 number staying visible matters even
// when the rest of the app has broken.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#FAFAF8",
          color: "#1A1A1A",
        }}
      >
        <div
          style={{
            width: "100%",
            background: "#C0392B",
            color: "#FFFFFF",
            textAlign: "center",
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "14.5px",
          }}
        >
          If your child is in danger right now, call the free child helpline{" "}
          <a
            href="tel:1098"
            style={{
              background: "#FFFFFF",
              color: "#C0392B",
              borderRadius: "6px",
              padding: "4px 12px",
              fontWeight: 700,
              textDecoration: "none",
              margin: "0 6px",
            }}
          >
            1098
          </a>
          Free · 24×7 · any language
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "48px 24px",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#C0392B",
            }}
          >
            Something went wrong
          </div>
          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(28px,3.6vw,40px)", fontWeight: 600 }}>
            KIRO hit a snag
          </h1>
          <p style={{ margin: "12px 0 0", color: "#6B6B6B", lineHeight: 1.6 }}>
            Nothing you did caused this. Try again, or reload the page.
          </p>
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={retry}
              style={{
                background: "#2F5D50",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* Deliberately a plain <a>, not next/link's Link: this fires
                when something in the app itself broke, possibly including
                the router — a full page reload is the one navigation path
                guaranteed to work regardless of what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                border: "1.5px solid #E8E6E1",
                borderRadius: "8px",
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: "15px",
                color: "#1A1A1A",
                textDecoration: "none",
              }}
            >
              Back to KIRO
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
