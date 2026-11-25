"use client";

/**
 * BEHIND THE SCENES: a photographer's contact sheet.
 *  - Masonry of film frames (sprocket holes, frame numbers, red "select" circles)
 *  - Category filter chips (Shoot / Lighting / Set / Edit)
 *  - Videos play muted on hover; click any frame for a lightbox with ← → and Esc
 *  - "In the bag": your gear as label-maker tapes
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import { isVideoFile } from "@/lib/utils";
import Band from "./Band";
import TornEdge from "./TornEdge";

type Item = { id?: string; src: string; caption: string; category: string; shape: "wide" | "tall" | "portrait" | "square" };
const poster = (src: string) => (src.startsWith("/media/demo/") ? src.replace(/\.mp4$/, ".jpg") : undefined);

function Frame({ item, index, onOpen }: { item: Item; index: number; onOpen: () => void }) {
  const vRef = useRef<HTMLVideoElement>(null);
  const video = isVideoFile(item.src);
  const play = () => {
    if (!vRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    vRef.current.play().catch(() => {});
  };
  const stop = () => vRef.current?.pause();

  return (
    <li
      className={`frame frame--${item.shape}${index % 3 === 1 ? " frame--select" : ""}`}
      data-reveal
      style={{ "--d": `${(index % 3) * 0.08}s` } as CSSProperties}
    >
      <button
        type="button"
        className="frame__btn"
        data-cursor="play"
        onClick={onOpen}
        onMouseEnter={play}
        onMouseLeave={stop}
        onFocus={play}
        onBlur={stop}
        aria-label={`${item.caption} (${item.category}${video ? ", video" : ""}). Open`}
      >
        <span className="frame__holes" aria-hidden="true" />
        <span className="frame__media">
          {video ? (
            <video ref={vRef} src={item.src} poster={poster(item.src)} muted loop playsInline preload="metadata" aria-hidden="true" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.src} alt="" loading="lazy" decoding="async" />
          )}
          {video && <span className="frame__badge">▶ Video</span>}
        </span>
        <span className="frame__holes" aria-hidden="true" />
        <span className="frame__no" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}A ▸
        </span>
      </button>
      <p className="frame__cap">
        <span>{item.category}</span> {item.caption}
      </p>
    </li>
  );
}

export default function Bts({ items: bts }: { items: Item[] }) {
  const { kit, bands } = portfolio;
  // chips follow whatever categories are in use (in first-seen order)
  const CATS = useMemo(() => ["All", ...Array.from(new Set(bts.map((b) => b.category)))], [bts]);
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const list = useMemo(() => (cat === "All" ? bts : bts.filter((b) => b.category === cat)), [bts, cat]);
  const current = open !== null ? list[open] : null;

  useEffect(() => {
    const d = dialogRef.current;
    if (open !== null && d && !d.open) {
      window.__lenis?.stop();
      d.showModal();
    }
  }, [open]);

  const step = (dir: number) => setOpen((o) => (o === null ? o : (o + dir + list.length) % list.length));

  if (!bts.length) return null; // nothing added yet in the admin: hide the section

  return (
    <section className="bts" id="bts" aria-labelledby="bts-title">
      <Band text={bands.bts} variant="ember" headingId="bts-title" />
      <div className="bts__stage paper">
        <TornEdge position="top" seed={63} tone="dark" />
        <div className="container">
          <div className="bts__head">
            <div>
              <p className="bts__kicker" data-reveal>
                Lights · Camera · Edit
              </p>
              <p className="caps bts__intro" data-reveal>
                How the work gets made: on set, behind the camera and at the edit desk. Shot, lit and cut by {portfolio.person.firstName}.
              </p>
            </div>
            <div className="bts__filters" role="group" aria-label="Filter behind-the-scenes by category" data-reveal>
              {CATS.map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
                  {c}
                  <span>{c === "All" ? bts.length : bts.filter((b) => b.category === c).length}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="sheet" key={cat}>
            {list.map((item, i) => (
              <Frame key={item.id ?? item.src} item={item} index={i} onOpen={() => setOpen(i)} />
            ))}
          </ul>

          <div className="kit" data-reveal>
            <h3 className="kit__title">In the bag</h3>
            <ul className="kit__list">
              {kit.map((k, i) => (
                <li key={k} className="dymo" style={{ "--r": `${[-2, 1.5, -1, 2.5, -1.5, 1, -2.5, 0.8][i % 8]}deg` } as CSSProperties}>
                  {k}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- Lightbox ---------- */}
      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label="Behind the scenes viewer"
        data-lenis-prevent
        onClose={() => {
          window.__lenis?.start();
          setOpen(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {current && (
          <figure className="lightbox__inner">
            <div className={`lightbox__media lightbox__media--${current.shape}`} key={current.src}>
              {isVideoFile(current.src) ? (
                <video src={current.src} poster={poster(current.src)} controls autoPlay loop playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.src} alt={current.caption} />
              )}
            </div>
            <figcaption className="lightbox__cap">
              <span className="lightbox__cat">{current.category}</span>
              {current.caption}
              <span className="lightbox__count">
                {String((open ?? 0) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
            </figcaption>
            <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous">
              ←
            </button>
            <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label="Next">
              →
            </button>
            <button type="button" className="lightbox__close" onClick={() => dialogRef.current?.close()} aria-label="Close viewer">
              ✕
            </button>
          </figure>
        )}
      </dialog>
    </section>
  );
}
