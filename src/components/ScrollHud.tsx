"use client";

/**
 * Editing-timeline HUD fixed to the bottom of the screen:
 *  - a thin track with a playhead showing scroll progress (transforms written by Effects.tsx)
 *  - chapter markers for every section: hover shows the name, click jumps there
 *  - a REC timecode pill (text written by Effects.tsx via [data-timecode])
 */
import { useEffect, useState } from "react";

const CHAPTERS: Array<[string, string]> = [
  ["top", "Intro"],
  ["about", "About"],
  ["services", "Services"],
  ["showreel", "Reel"],
  ["work", "Work"],
  ["bts", "BTS"],
  ["process", "Process"],
  ["testimonials", "Reviews"],
  ["contact", "Contact"],
];

export default function ScrollHud() {
  const [marks, setMarks] = useState<Array<{ id: string; label: string; at: number }>>([]);

  // Where each section sits along the page (0-1), recomputed when the layout changes
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setMarks(
        CHAPTERS.flatMap(([id, label]) => {
          const el = document.getElementById(id);
          if (!el) return [];
          const top = el.getBoundingClientRect().top + window.scrollY;
          return [{ id, label, at: Math.min(1, Math.max(0, top / max)) }];
        })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -10 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="hud">
      <div className="hud__track" aria-hidden="true">
        <div className="hud__fill" />
        <div className="hud__head" />
      </div>
      <nav className="hud__chapters" aria-label="Chapters">
        {marks.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className="hud__mark"
            style={{ left: `${(m.at * 100).toFixed(2)}%` }}
            onClick={() => jump(m.id)}
            aria-label={`Jump to ${m.label}`}
          >
            <span className="hud__label">
              <b>{String(i + 1).padStart(2, "0")}</b> {m.label}
            </span>
          </button>
        ))}
      </nav>
      <div className="hud__pill" aria-hidden="true">
        <span className="hud__rec">REC</span>
        <span data-timecode>00:00:00:00</span>
      </div>
    </div>
  );
}
