"use client";

/**
 * Showreel section: band + player.
 * Shows a title card (or your poster) with a play button; the YouTube/Vimeo
 * player only loads after the click (fast page load).
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { portfolio } from "@/data/portfolio";
import { isVideoFile, toEmbedUrl } from "@/lib/utils";
import Band from "./Band";
import { PlayIcon, Sparkle } from "./Icons";

type ShowreelData = { videoUrl: string; poster: string; tagline: string };

function TitleCard({ showreel }: { showreel: ShowreelData }) {
  const { person, tools } = portfolio;
  return (
    <div className="reel-card" aria-hidden="true">
      <div className="reel-card__corner reel-card__corner--tl">
        Video editor
        <br />
        Cinematography
        <i />
      </div>
      <div className="reel-card__corner reel-card__corner--tr">Create · Edit · Inspire</div>
      <Sparkle className="reel-card__spark" />
      <p className="reel-card__title">Showreel</p>
      <p className="reel-card__name">
        {person.firstName} {person.lastName}
      </p>
      <p className="reel-card__tag">{showreel.tagline}</p>
      <div className="reel-card__strip">
        {[20, 25, 210, 35, 15, 0, 220].map((h, i) => (
          <span key={i} style={{ "--hue": h } as CSSProperties} />
        ))}
      </div>
      <div className="reel-card__tools">
        {tools.slice(0, 3).map((t, i) => (
          <span key={t.abbr}>
            {i > 0 && <Sparkle />}
            <b>{t.abbr}</b>
          </span>
        ))}
      </div>
      <div className="reel-card__foot">
        <span>▶ Play</span>
        <span>|||||||||| {person.year}</span>
      </div>
    </div>
  );
}

export default function Showreel({ showreel }: { showreel: ShowreelData }) {
  const { bands } = portfolio;
  const [playing, setPlaying] = useState(false);
  const embed = toEmbedUrl(showreel.videoUrl);
  const isFile = isVideoFile(showreel.videoUrl);

  // Live preview: when the player is on screen, a muted loop of the reel starts behind the
  // title card, and the card fades away once it's playing. (Own video files only; never with reduced motion.)
  const playerRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = playerRef.current;
    if (!el || !isFile || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setNearby(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [isFile]);

  return (
    <section className="showreel" id="showreel" aria-labelledby="showreel-title">
      <Band text={bands.showreel} font="western" headingId="showreel-title" />
      <div className="showreel__stage">
        <div className="container">
          <div className="player-wrap" data-reveal>
          <div className="player" ref={playerRef}>
            {playing && embed && isFile ? (
              <video src={showreel.videoUrl} controls autoPlay playsInline className="player__video" />
            ) : playing && embed ? (
              <iframe src={embed} title="Showreel" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
            ) : (
              <button
                type="button"
                className={`player__poster${live ? " is-live" : ""}`}
                data-cursor="play"
                onClick={() => embed && setPlaying(true)}
                aria-label={embed ? "Play showreel with sound" : "Showreel (add a video in /admin → Showreel)"}
              >
                {isFile && nearby && (
                  <video
                    className="player__bg"
                    src={showreel.videoUrl}
                    muted
                    loop
                    autoPlay
                    playsInline
                    aria-hidden="true"
                    onPlaying={() => window.setTimeout(() => setLive(true), 1400)}
                  />
                )}
                <span className="player__sound" aria-hidden="true">
                  ▶ Watch with sound
                </span>
                {showreel.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={showreel.poster} alt="" loading="lazy" decoding="async" />
                ) : (
                  <TitleCard showreel={showreel} />
                )}
                <span className="player__play">
                  <PlayIcon />
                </span>
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
