"use client";

/**
 * Testimonials as client review comments pinned on a video scrubber (Frame.io style).
 * Markers on the scrubber select a comment; autoplay steps through them while visible
 * (paused on hover/focus, off with reduced motion). Arrow keys and swipe also work.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import Band from "./Band";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* each comment gets a timecode along a 1-minute review clip */
const stamp = (i: number, n: number) => {
  const s = Math.round(((i + 1) / (n + 1)) * 60);
  return `00:00:${String(s).padStart(2, "0")}:${String((i * 7 + 3) % 25).padStart(2, "0")}`;
};

export default function Testimonials() {
  const items = portfolio.testimonials;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex((i + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go(index + 1), 6500);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  const t = items[index];
  const pos = (i: number) => `${(((i + 1) / (items.length + 1)) * 100).toFixed(2)}%`;

  return (
    <section className="testimonials" id="testimonials" aria-labelledby="testimonials-title">
      <Band text={portfolio.bands.testimonials} font="wide" headingId="testimonials-title" />
      <div className="testimonials__stage">
        <div
          className="container"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            className="review"
            data-reveal
            role="region"
            aria-roledescription="carousel"
            aria-label="Client reviews"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(index + 1);
              if (e.key === "ArrowLeft") go(index - 1);
            }}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
              touchX.current = null;
            }}
          >
            <div className="review__bar">
              <span className="suite__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>Review · client_cut_v3_FINAL.mp4</span>
              <span className="review__count">
                {items.length} comments · all approved
              </span>
            </div>

            {/* scrubber with comment markers */}
            <div className="scrubber">
              <div className="scrubber__track">
                <span className="scrubber__fill" style={{ transform: `scaleX(${((index + 1) / (items.length + 1)).toFixed(3)})` }} />
              </div>
              {items.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`marker${i === index ? " is-active" : ""}`}
                  style={{ left: pos(i) } as CSSProperties}
                  onClick={() => go(i)}
                  aria-label={`Comment ${i + 1} of ${items.length}, ${c.name}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  {initials(c.name)}
                </button>
              ))}
            </div>

            {/* active comment */}
            <figure className="comment" key={index} aria-live={paused ? "polite" : "off"}>
              <div className="comment__head">
                <span className="comment__avatar" aria-hidden="true">
                  {initials(t.name)}
                </span>
                <figcaption>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </figcaption>
                <span className="comment__tc">@ {stamp(index, items.length)}</span>
              </div>
              <blockquote className="comment__quote">
                <p>{t.quote}</p>
              </blockquote>
              <div className="comment__foot">
                <span className="comment__ok">✓ Approved</span>
                <div className="comment__nav">
                  <button type="button" className="slider__btn" onClick={() => go(index - 1)} aria-label="Previous comment" data-magnetic>
                    ←
                  </button>
                  <button type="button" className="slider__btn" onClick={() => go(index + 1)} aria-label="Next comment" data-magnetic>
                    →
                  </button>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
