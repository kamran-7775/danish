import type { CSSProperties } from "react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { portfolio } from "@/data/portfolio";
import { Club, PlayIcon, Starburst } from "./Icons";
import { FacePlaceholder } from "./Placeholders";
import HeroFace from "./HeroFace";
import Viewfinder from "./Viewfinder";

/** Giant "PORTF◯LIO" with your illustrated portrait replacing the O. */
export default function Hero() {
  const { person } = portfolio;
  const left = "PORTF".split("");
  const right = "LIO".split("");
  const d = (i: number) => ({ "--d": `${0.1 + i * 0.05}s` }) as CSSProperties;
  // Use the round avatar only if the file is actually in /public (checked at build time)
  const has = (p?: string) => !!p && existsSync(join(process.cwd(), "public", p));
  // Cut-out photo with moving eyes wins; then the round avatar; then the line-art illustration
  const face = has(person.face) ? person.face : "";
  const avatar = !face && has(person.avatar) ? person.avatar : "";
  const irisSrc = (k: string) => face.replace(/[^/]+$/, `hero-iris-${k}.webp`);

  return (
    <section className="hero paper" id="top" aria-labelledby="hero-title">
      <Viewfinder />
      <div className="container">
        <div className="hero__labels" data-reveal>
          <p className="label">{person.title}</p>
          <p className="label">{person.year}</p>
        </div>

        <h1 className="hero__word" id="hero-title">
          <span className="sr-only">
            Portfolio of {person.firstName} {person.lastName}, {person.title}
          </span>
          {left.map((c, i) => (
            <span className="hero__char" key={`l${i}`} aria-hidden="true">
              <span data-reveal="mask" style={d(i)}>
                {c}
              </span>
            </span>
          ))}
          <span
            className={`hero__face${face ? " hero__face--photo" : avatar ? " hero__face--round" : ""}`}
            aria-hidden="true"
            data-reveal
            style={d(5)}
          >
            <span className="hero__face-inner" data-parallax="-0.06">
              <span className="hero__face-follow" data-follow="16">
                {face ? (
                  <HeroFace src={face} irisSrc={[irisSrc("l"), irisSrc("r")]} />
                ) : avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" />
                ) : person.illustration ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.illustration} alt="" />
                ) : (
                  <FacePlaceholder />
                )}
              </span>
            </span>
          </span>
          {right.map((c, i) => (
            <span className="hero__char" key={`r${i}`} aria-hidden="true">
              <span data-reveal="mask" style={d(i + 6)}>
                {c}
              </span>
            </span>
          ))}
        </h1>

        <div className="hero__bottom" data-reveal style={d(8)}>
          <p className="label">{person.title}</p>
        </div>

        {/* Starburst · play button (goes to the showreel) · club */}
        <div className="hero__icons" data-reveal style={d(9)}>
          <Starburst className="hero__burst" />
          <a href="#showreel" className="hero__play" aria-label="Watch my showreel" data-magnetic>
            <span className="hero__play-pulse" aria-hidden="true" />
            <PlayIcon />
          </a>
          <Club />
        </div>

        {/* Phones only: a line of intro + clear next steps, so the first screen isn't empty */}
        <div className="hero__mobile" data-reveal style={d(10)}>
          <p>{person.tagline}</p>
          <div className="hero__mobile-ctas">
            <a href="#work" className="btn btn--ink">
              View work
            </a>
            <a href="#contact" className="btn btn--outline">
              Hire me
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
