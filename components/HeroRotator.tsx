"use client";

import { useEffect, useState } from "react";

const WORDS = ["parent", "teacher", "student"] as const;

export default function HeroRotator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let fadeTimer: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 260);
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className="inline-block min-w-[6.6ch]"
      style={{
        display: "inline-block",
        transition: "opacity .26s ease, transform .26s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(4px)",
        color: "#2F5D50",
      }}
    >
      {WORDS[index]}
    </span>
  );
}
