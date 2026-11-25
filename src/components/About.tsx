import type { CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import Counter from "./Counter";
import { BodyPlaceholder } from "./Placeholders";

/** HELLO / EDUCATION / SKILLS / EXPERIENCE, with your photo in a design-tool selection box. */
export default function About() {
  const { person, education, experience, tools, stats } = portfolio;
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <section className="about paper" id="about" aria-labelledby="about-title">
      <div className="container about__grid">
        {/* Photo with transform handles */}
        <div className="about__photo" data-reveal>
          <div className="selection">
            {/* design-tool chrome: layer name, rotate handle, size readout */}
            <span className="selection__layer" aria-hidden="true">
              {person.firstName.toLowerCase()}.png
            </span>
            <span className="selection__rotate" aria-hidden="true" />
            <div className="selection__img">
              {person.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.photo} alt={`${fullName}, photo`} loading="lazy" decoding="async" />
              ) : (
                <BodyPlaceholder />
              )}
            </div>
            <span className="selection__border" aria-hidden="true" />
            {["tl", "tm", "tr", "ml", "mr", "bl", "bm", "br"].map((h, i) => (
              <span key={h} className={`handle handle--${h}`} style={{ "--hi": i } as CSSProperties} aria-hidden="true" />
            ))}
            <span className="selection__size" aria-hidden="true">
              W 1080 × H 1920
            </span>
          </div>
        </div>

        {/* Hello + bio + education */}
        <div className="about__text">
          <h2 className="display hello" id="about-title" data-reveal aria-label="Hello">
            {"HELLO".split("").map((c, i) => (
              <span key={i} aria-hidden="true" style={{ "--i": i } as CSSProperties}>
                {c}
              </span>
            ))}
          </h2>
          <p className="about__hi" data-reveal>
            {person.greeting}
          </p>
          <div className="about__bio" data-reveal>
            {person.bio.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <h3 className="display display--sm" data-reveal>
            Education
          </h3>
          <ul className="plain caps" data-reveal>
            {education.map((e) => (
              <li key={e.school}>
                {e.school}
                <br />
                {e.detail}
              </li>
            ))}
          </ul>
        </div>

        {/* Skills + experience */}
        <div className="about__side">
          <h3 className="display display--sm" data-reveal>
            Skills
          </h3>
          <ul className="apps" data-reveal aria-label="Software skills">
            {tools.map((t, i) => (
              <li
                key={t.name}
                className={`app${t.resolve ? " app--resolve" : ""}`}
                style={{ "--bg": t.bg, "--fg": t.fg, "--d": `${i * 0.06}s` } as CSSProperties}
                title={t.name}
              >
                {t.resolve ? <span className="app__resolve" aria-hidden="true" /> : <span aria-hidden="true">{t.abbr}</span>}
                <span className="sr-only">{t.name}</span>
              </li>
            ))}
          </ul>

          <h3 className="display display--sm" data-reveal>
            Experience
          </h3>
          <ul className="plain caps exp" data-reveal>
            {experience.map((x) => (
              <li key={x.period + x.role}>
                <p>{x.period}</p>
                <p>{x.role}</p>
                <p>{x.description}</p>
              </li>
            ))}
          </ul>

          <ul className="stats" data-reveal>
            {stats.map((s) => (
              <li key={s.label}>
                <span className="stats__value">
                  <Counter value={s.value} suffix={s.suffix} />
                </span>
                <span className="stats__label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
