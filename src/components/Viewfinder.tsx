"use client";

/**
 * Camera-viewfinder overlay for the hero: corner brackets, blinking REC with a running
 * timecode, and camera readouts. The timecode only ticks while the hero is on screen.
 */
import { useEffect, useRef } from "react";

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export default function Viewfinder() {
  const ref = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let id = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (tcRef.current) tcRef.current.textContent = `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad((t * 25) % 25)}`;
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(tick, 40);
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="viewfinder" ref={ref} aria-hidden="true">
      <span className="vf-corner vf-corner--tl" />
      <span className="vf-corner vf-corner--tr" />
      <span className="vf-corner vf-corner--bl" />
      <span className="vf-corner vf-corner--br" />
      <div className="vf-row vf-row--top">
        <span className="vf-rec">
          REC <span ref={tcRef}>00:00:00:00</span>
        </span>
        <span className="vf-right">
          4K · 25P
          <span className="vf-battery">
            <i />
          </span>
        </span>
      </div>
      <div className="vf-row vf-row--bottom">
        <span>ISO 800 · F2.8 · 1/50</span>
        <span>WB 5600K · A-CAM</span>
      </div>
    </div>
  );
}
