"use client";

/**
 * Navigation: pill menu on desktop, full-screen menu on mobile.
 * - Hides while scrolling down, reappears when scrolling up.
 * - Highlights the section currently in view (scrollspy).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import { Club } from "./Icons";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#showreel", label: "Showreel" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState("");

  // Hide on scroll down / show on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 300);
        last = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy
  useEffect(() => {
    // the hero (#top) is watched too, so the highlight clears back at the top
    const sections = ["#top", ...LINKS.map((l) => l.href)]
      .map((h) => document.querySelector(h))
      .filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id === "top" ? "" : `#${e.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobile menu: lock scroll + Escape to close
  useEffect(() => {
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`nav${hidden && !open ? " is-hidden" : ""}${open ? " is-open" : ""}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo" aria-label={`${portfolio.person.firstName} ${portfolio.person.lastName}, back to top`}>
          <span className="nav__logo-text">{portfolio.person.initials}</span>
          <Club />
        </a>

        <nav aria-label="Primary" className="nav__menu">
          <ul id="nav-links" className="nav__links">
            {LINKS.map((l, i) => (
              <li key={l.href} style={{ "--i": i } as CSSProperties}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active === l.href ? "true" : undefined}
                  data-label={l.label}
                >
                  <span>{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#contact" className="btn btn--red btn--sm nav__cta" data-magnetic>
          <span className="nav__cta-dot" aria-hidden="true" />
          Hire me
        </a>

        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav__bar" />
          <span className="nav__bar" />
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
    </header>
  );
}
