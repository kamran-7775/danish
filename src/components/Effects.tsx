"use client";

/**
 * Global motion layer (one place for every scroll/pointer effect):
 *  1. Lenis smooth scrolling. Exposes window.__lenis so the modal/menu can pause it.
 *     Writes --velocity (scroll speed) and --progress (0-1) on <html>, and updates [data-timecode].
 *  2. Scroll reveal: [data-reveal] gets .is-visible in view. Waits for the intro to finish.
 *  3. Parallax: [data-parallax="0.15"] moves with scroll.
 *  4. Custom cursor: dot + trailing ring; "Play" label over [data-cursor="play"].
 *  5. Magnetic: [data-magnetic] elements lean towards the pointer.
 *  6. Tilt: [data-tilt] cards rotate in 3D and get a glare that follows the pointer.
 *  7. Follow: [data-follow="14"] drifts towards the pointer (hero face).
 *
 * Only transform/opacity are animated. With prefers-reduced-motion everything except the
 * plain reveal is skipped (and the CSS shows reveals instantly).
 */
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

export default function Effects() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: Array<() => void> = [];
    const cleanup = () => cleanups.forEach((fn) => fn());

    /* ---------- 2. Scroll reveal (waits for the intro) ---------- */
    const targets = new Map<Element, Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (targets.get(entry.target) ?? entry.target).classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    const startReveal = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        // "mask" children start outside their overflow:hidden parent, so watch the parent
        const watch = el.dataset.reveal === "mask" && el.parentElement ? el.parentElement : el;
        targets.set(watch, el);
        io.observe(watch);
      });
    };
    if (root.classList.contains("is-loading")) {
      window.addEventListener("intro:done", startReveal, { once: true });
      cleanups.push(() => window.removeEventListener("intro:done", startReveal));
    } else {
      startReveal();
    }
    cleanups.push(() => io.disconnect());

    /* ---------- progress + timecode (works with or without Lenis) ----------
       PERF: values are written straight onto the few elements that use them.
       Never set per-frame custom properties on <html>: that restyles the whole page every frame. */
    const timecodes = Array.from(document.querySelectorAll<HTMLElement>("[data-timecode]"));
    const hudFill = document.querySelector<HTMLElement>(".hud__fill");
    const hudHead = document.querySelector<HTMLElement>(".hud__head");
    const REEL_SECONDS = 180; // the whole page = a 3-minute "edit"
    let lastTc = "";
    const writeProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (hudFill) hudFill.style.transform = `scaleX(${p.toFixed(4)})`;
      if (hudHead) hudHead.style.transform = `translate3d(${(p * window.innerWidth).toFixed(1)}px, 0, 0)`;
      const t = p * REEL_SECONDS;
      const tc = `00:${pad(t / 60)}:${pad(t % 60)}:${pad((t * 25) % 25)}`;
      if (tc !== lastTc) {
        lastTc = tc;
        timecodes.forEach((el) => (el.textContent = tc));
      }
    };
    writeProgress();

    /* PERF: pause looping CSS animations in sections that are off-screen */
    const offIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-off", !e.isIntersecting)),
      { rootMargin: "100px 0px" }
    );
    document.querySelectorAll("main > section, main > div > section, main > .band, .footer").forEach((s) => offIo.observe(s));
    cleanups.push(() => offIo.disconnect());

    if (reduceMotion) {
      window.addEventListener("scroll", writeProgress, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", writeProgress));
      return cleanup;
    }

    /* ---------- 1. Lenis smooth scroll ---------- */
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -10 }, autoRaf: false });
    window.__lenis = lenis;
    if (root.classList.contains("is-loading")) lenis.stop();
    window.addEventListener("intro:done", () => lenis.start(), { once: true });

    let velocity = 0;
    lenis.on("scroll", (l: Lenis) => {
      velocity = l.velocity;
      writeProgress();
    });

    /* ---------- 3. Parallax ---------- */
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const followEls = Array.from(document.querySelectorAll<HTMLElement>("[data-follow]"));

    // pointer state shared by cursor / follow
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let fx = 0;
    let fy = 0;
    let smoothVel = 0;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const useCursor = finePointer && dot && ring;
    if (useCursor) root.classList.add("has-cursor", "cursor-hidden");

    const bands = Array.from(document.querySelectorAll<HTMLElement>(".band__marquee"));
    let lastSkew = 0;
    let lastParallaxY = -1;
    let lastFollow = "";
    let lastRing = "";

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);

      // bands lean with scroll speed: written only when the value really changes
      smoothVel += (Math.max(-40, Math.min(40, velocity)) - smoothVel) * 0.12;
      velocity *= 0.9;
      // capped at ±5deg so fast scrolling never makes the text look glitchy
      const skew = Math.abs(smoothVel) < 0.05 ? 0 : Math.round(Math.max(-5, Math.min(5, smoothVel * -0.25)) * 100) / 100;
      if (skew !== lastSkew) {
        lastSkew = skew;
        const tf = skew ? `skewX(${skew}deg)` : "";
        for (const b of bands) b.style.transform = tf;
      }

      // parallax (only near the top, where it's used, and only when scroll changed)
      const y = Math.round(window.scrollY);
      if (y !== lastParallaxY && y < window.innerHeight * 1.6) {
        lastParallaxY = y;
        for (const el of parallaxEls) {
          el.style.transform = `translate3d(0, ${(y * parseFloat(el.dataset.parallax || "0.2")).toFixed(1)}px, 0)`;
        }
      }

      if (finePointer) {
        // follow (eases towards the pointer; stops writing once settled)
        const tx = mx / window.innerWidth - 0.5;
        const ty = my / window.innerHeight - 0.5;
        fx += (tx - fx) * 0.06;
        fy += (ty - fy) * 0.06;
        if (followEls.length) {
          const f = `${fx.toFixed(3)},${fy.toFixed(3)}`;
          if (f !== lastFollow) {
            lastFollow = f;
            for (const el of followEls) {
              const s = parseFloat(el.dataset.follow || "12");
              el.style.transform = `translate3d(${(fx * s).toFixed(2)}px, ${(fy * s).toFixed(2)}px, 0) rotate(${(fx * s * 0.15).toFixed(2)}deg)`;
            }
          }
        }
        // cursor ring trails the pointer
        if (useCursor) {
          rx += (mx - rx) * 0.18;
          ry += (my - ry) * 0.18;
          const r = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
          if (r !== lastRing) {
            lastRing = r;
            ring.style.transform = r;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete window.__lenis;
    });

    if (!finePointer) return cleanup;

    /* ---------- 4-6. Cursor, magnetic, tilt ---------- */
    let magnet: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;
    const release = () => {
      if (magnet) magnet.style.transform = "";
      if (tilt) tilt.style.transform = "";
      magnet = null;
      tilt = null;
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (useCursor) {
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        root.classList.remove("cursor-hidden");
      }

      const target = e.target instanceof Element ? e.target : null;
      if (useCursor) {
        const play = target?.closest("[data-cursor='play']");
        const interactive = target?.closest("a, button, input, select, textarea, label, [role='button']");
        ring.classList.toggle("is-play", !!play);
        ring.classList.toggle("is-hover", !!interactive && !play);
      }

      const m = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
      if (magnet && magnet !== m) magnet.style.transform = "";
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const x = mx - (r.left + r.width / 2);
        const yy = my - (r.top + r.height / 2);
        m.style.transform = `translate3d(${(x * 0.3).toFixed(1)}px, ${(yy * 0.4).toFixed(1)}px, 0)`;
      }

      const t = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (tilt && tilt !== t) tilt.style.transform = "";
      tilt = t;
      if (t) {
        const r = t.getBoundingClientRect();
        const px = (mx - r.left) / r.width;
        const py = (my - r.top) / r.height;
        t.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 8).toFixed(2)}deg) rotateY(${((px - 0.5) * 10).toFixed(2)}deg)`;
        t.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        t.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      }
    };
    const onLeave = () => {
      root.classList.add("cursor-hidden");
      release();
    };
    const onDown = () => ring?.classList.add("is-down");
    const onUp = () => ring?.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    cleanups.push(() => {
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.classList.remove("has-cursor", "cursor-hidden");
      release();
    });

    return cleanup;
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <div className="cursor-ring__inner" />
        <span className="cursor-ring__label">▶ Play</span>
      </div>
    </>
  );
}
