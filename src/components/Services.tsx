"use client";

/**
 * Vertical SERVICES title + kraft-paper sticky notes.
 * Notes drop in like they're being pinned, and flip over (hover on desktop, tap on touch)
 * to show a short description on the back.
 */
import { useState, type CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import { tornPolygon } from "@/lib/utils";

const TILT = [-2, 1.5, -1, 2, -1.5, 1];

export default function Services() {
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <section className="services paper" id="services" aria-labelledby="services-title">
      <div className="container services__layout">
        <h2 className="services__title" id="services-title" data-reveal>
          <span>Services</span>
        </h2>

        <div>
          <ul className="notes">
            {portfolio.services.map((s, i) => (
              <li
                key={s.title}
                className="note"
                data-reveal
                style={{ "--d": `${(i % 3) * 0.12 + Math.floor(i / 3) * 0.08}s`, "--r": `${TILT[i % TILT.length]}deg` } as CSSProperties}
              >
                <div className="note__inner">
                  <button
                    type="button"
                    className="note__card"
                    aria-pressed={flipped === i}
                    onClick={() => setFlipped((f) => (f === i ? null : i))}
                  >
                    <span className="note__face note__face--front">
                      <span className="note__back" style={{ clipPath: tornPolygon(40 + i, 10, 48) }} />
                      <span className="note__paper" style={{ clipPath: tornPolygon(80 + i, 8, 48) }}>
                        <span className="note__num">0{i + 1}</span>
                        <span className="note__title">{s.title}</span>
                        <span className="note__hint" aria-hidden="true">
                          Flip ↻
                        </span>
                      </span>
                    </span>
                    <span className="note__face note__face--back" style={{ clipPath: tornPolygon(120 + i, 8, 48) }}>
                      <span className="note__back-title">{s.title}</span>
                      <span className="note__desc">{s.description}</span>
                    </span>
                  </button>
                  <span className="note__tape" aria-hidden="true" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
