import type { CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import TornEdge from "./TornEdge";
import { Suits } from "./Icons";

export default function Footer() {
  const { person, socials } = portfolio;
  const year = new Date().getFullYear();
  const name = `${person.firstName} ${person.lastName}`;

  return (
    <footer className="footer">
      <TornEdge position="top" seed={93} />
      <div className="container">
        {/* End credits: lines rise in one after another, like a film's closing roll */}
        <div className="credits">
          <p className="credits__thanks" data-reveal>
            Thanks for watching
          </p>
          <dl className="credits__list">
            {[
              ["Edited by", name],
              ["Motion design by", name],
              ["Color & sound by", name],
              ["Built with", "Next.js · lots of coffee"],
            ].map(([role, who], i) => (
              <div key={role} data-reveal style={{ "--d": `${i * 0.12}s` } as CSSProperties}>
                <dt>{role}</dt>
                <dd>{who}</dd>
              </div>
            ))}
            <div data-reveal style={{ "--d": "0.5s" } as CSSProperties}>
              <dt>Starring</dt>
              <dd>
                <a href="#contact" className="credits__you">
                  Your project, coming soon →
                </a>
              </dd>
            </div>
          </dl>
          <p className="credits__end" data-reveal style={{ "--d": "0.65s" } as CSSProperties}>
            <Suits /> The End <Suits reverse />
          </p>
        </div>
        <p className="footer__big" aria-hidden="true" style={{ "--len": name.length } as CSSProperties}>
          {name.split("").map((c, i) => (
            <span key={i} style={{ "--i": i } as CSSProperties}>
              {c === " " ? " " : c}
            </span>
          ))}
        </p>
        <div className="footer__row">
          <p>
            © {year} {name} <Suits />
          </p>
          <ul className="footer__socials" aria-label="Social links">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#top" className="footer__top">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
