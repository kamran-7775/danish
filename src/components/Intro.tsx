"use client";

/**
 * Film-leader intro: a sweeping countdown (3·2·1) that plays once per browser session,
 * then wipes up to reveal the page. Skipped entirely with prefers-reduced-motion
 * (the inline script in layout.tsx only adds .is-loading when it should play).
 * Fires a window "intro:done" event that starts the scroll reveals and smooth scroll.
 */
import { useEffect } from "react";
import { portfolio } from "@/data/portfolio";

const DURATION = 2100; // ms the countdown runs before the wipe

export default function Intro() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("is-loading")) return;

    const t1 = window.setTimeout(() => {
      root.classList.add("is-intro-out");
      try {
        sessionStorage.setItem("intro-seen", "1");
      } catch {}
      window.setTimeout(() => window.dispatchEvent(new Event("intro:done")), 250);
    }, DURATION);
    const t2 = window.setTimeout(() => root.classList.remove("is-loading", "is-intro-out"), DURATION + 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const { person } = portfolio;
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro__frame">
        <span className="intro__cross intro__cross--h" />
        <span className="intro__cross intro__cross--v" />
        <span className="intro__ring intro__ring--outer" />
        <span className="intro__ring intro__ring--inner" />
        <span className="intro__sweep" />
        <span className="intro__num">
          <b>3</b>
          <b>2</b>
          <b>1</b>
        </span>
      </div>
      <div className="intro__meta">
        <span>
          {person.firstName} {person.lastName}
        </span>
        <span>Reel {person.year}</span>
      </div>
      <div className="intro__bar">
        <i />
      </div>
    </div>
  );
}
