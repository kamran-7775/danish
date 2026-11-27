"use client";

/**
 * The photo that replaces the "O" in PORTFOLIO, with eyes that follow the pointer.
 * The base picture has its irises erased; each iris is a small separate image that
 * slides inside an eye-shaped clip. Assets + coordinates come from tools/make_hero_cutout.py
 * (coordinates are in the cut-out's pixel space, so they stay valid at any rendered size).
 * Touch devices (no pointer) get a slow idle glance instead. Reduced motion: eyes stay still.
 */
import { useEffect, useRef } from "react";

const W = 812;
const H = 880;
const EYES = [
  { id: "l", d: "M280 345 Q307 319.5 346 350 Q309 357.5 280 345 Z", iris: { x: 293, y: 323, s: 34 } },
  { id: "r", d: "M442 350 Q484 317.5 506 345 Q484 357.5 442 350 Z", iris: { x: 462, y: 323, s: 34 } },
];
const EYE_CENTER = { x: 393, y: 340 }; // midway between the eyes, in image px
const MAX_X = 8; // how far the irises may travel (image px)
const MAX_Y = 2.5;

export default function HeroFace({ src, irisSrc }: { src: string; irisSrc: [string, string] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const irisRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0; // target, -1..1
    let x = 0, y = 0; // eased
    let raf = 0;
    let lastMove = 0;

    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      const t = `translate(${(x * MAX_X).toFixed(2)} ${(y * MAX_Y).toFixed(2)})`;
      for (const g of irisRefs.current) g?.setAttribute("transform", t);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lastMove = performance.now();
      // where the eyes are on screen right now
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / W, r.height / H); // preserveAspectRatio="xMidYMax meet"
      const ex = r.left + (r.width - W * scale) / 2 + EYE_CENTER.x * scale;
      const ey = r.top + (r.height - H * scale) + EYE_CENTER.y * scale;
      const dx = (e.clientX - ex) / (window.innerWidth * 0.35);
      const dy = (e.clientY - ey) / (window.innerHeight * 0.35);
      tx = Math.max(-1, Math.min(1, dx));
      ty = Math.max(-1, Math.min(1, dy));
      kick();
    };

    // no pointer for a while (phones, or mouse resting): glance around now and then
    const idle = window.setInterval(() => {
      if (performance.now() - lastMove < 4000) return;
      const r = Math.random();
      tx = r < 0.35 ? -0.8 : r < 0.7 ? 0.8 : 0;
      ty = Math.random() * 0.6 - 0.2;
      kick();
    }, 2600);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(idle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="hero__face-svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {EYES.map((e) => (
          <clipPath id={`hero-eye-${e.id}`} key={e.id}>
            <path d={e.d} />
          </clipPath>
        ))}
        {/* soft shadow the upper lid casts on the eyeball */}
        <linearGradient id="hero-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2218" stopOpacity="0.45" />
          <stop offset="0.45" stopColor="#3a2218" stopOpacity="0" />
        </linearGradient>
      </defs>
      <image href={src} width={W} height={H} />
      {EYES.map((e, i) => (
        <g clipPath={`url(#hero-eye-${e.id})`} key={e.id}>
          <g ref={(el) => { irisRefs.current[i] = el; }}>
            <image href={irisSrc[i]} x={e.iris.x} y={e.iris.y} width={e.iris.s} height={e.iris.s} />
          </g>
          <path d={e.d} fill="url(#hero-lid)" />
        </g>
      ))}
    </svg>
  );
}
