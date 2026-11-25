import { Suits } from "./Icons";

/**
 * Black marquee band ("ABOUT ME ♣♦ ABOUT ME ♣♦ …").
 * font:    "wide" = heavy wide sans · "western" = decorative western display
 * variant: "dark" | "ember" (brown-red gradient) | "red"
 * Pass headingId to also render a real (visually hidden) <h2> for screen readers.
 */
export default function Band({
  text,
  font = "western",
  variant = "dark",
  headingId,
  reverse = false,
}: {
  text: string | string[];
  font?: "wide" | "western";
  variant?: "dark" | "ember" | "red";
  headingId?: string;
  reverse?: boolean;
}) {
  const words = Array.isArray(text) ? text : [text];
  const items = Array.from({ length: 8 }, (_, i) => words[i % words.length]);

  return (
    <div className={`band band--${font} band--${variant}`}>
      {headingId && (
        <h2 className="sr-only" id={headingId}>
          {words.join(" / ")}
        </h2>
      )}
      <div className={`band__marquee${reverse ? " band__marquee--reverse" : ""}`} aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="band__track" key={copy}>
            {items.map((w, i) => (
              <span className="band__item" key={i}>
                {w}
                <Suits reverse={i % 2 === 1} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
