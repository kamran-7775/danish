import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/* 8-ray starburst points (16 vertices, alternating long/short radius) */
const BURST = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8 - Math.PI / 2;
  const r = i % 2 === 0 ? 12 : 4.2;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

export const Club = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="12" cy="6.6" r="5.2" />
    <circle cx="6" cy="13.6" r="5.2" />
    <circle cx="18" cy="13.6" r="5.2" />
    <path d="M10.7 11h2.6l1.9 12.5H8.8z" />
  </svg>
);

export const Diamond = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 0l8 12-8 12-8-12z" />
  </svg>
);

export const Sparkle = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 0c.9 7.6 3.9 10.9 12 12-8.1 1.1-11.1 4.4-12 12-.9-7.6-3.9-10.9-12-12C8.1 10.9 11.1 7.6 12 0z" />
  </svg>
);

export const Starburst = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <polygon points={BURST} />
  </svg>
);

/** The ♣♦ pair used between marquee words */
export const Suits = ({ reverse = false }: { reverse?: boolean }) => (
  <span className="suits" aria-hidden="true">
    {reverse ? (
      <>
        <Diamond />
        <Club />
      </>
    ) : (
      <>
        <Club />
        <Diamond />
      </>
    )}
  </span>
);

export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);
