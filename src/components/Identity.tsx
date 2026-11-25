import { portfolio } from "@/data/portfolio";
import Band from "./Band";
import TornEdge from "./TornEdge";
import { BustPlaceholder } from "./Placeholders";

/** Black strip between torn paper: huge "EDITOR ♦♣ Cinematography" marquee + red-outlined sticker portrait. */
export default function Identity() {
  const { person, bands } = portfolio;
  return (
    <section className="identity" aria-label={`${person.firstName} ${person.lastName}, ${person.title}`}>
      <TornEdge position="top" seed={11} />
      <div className="identity__band">
        <Band text={bands.identity} font="western" reverse />
      </div>
      <div className="identity__cutout">
        {person.cutout ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.cutout} alt={`${person.firstName} ${person.lastName}`} loading="lazy" decoding="async" />
        ) : (
          <BustPlaceholder />
        )}
      </div>
      <TornEdge position="bottom" seed={27} />
    </section>
  );
}
