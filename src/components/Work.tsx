"use client";

/**
 * WORK = an editing suite.
 *  - Program monitor: shows the selected project (thumbnail / hover preview / clapperboard).
 *  - Metadata panel: title, client, role, tools, description, "Watch full" button.
 *  - Timeline: one video track per category (managed in /admin → Categories), your projects as clips,
 *    a time ruler, an audio waveform and a playhead that glides to the selected clip.
 *  - Auto-preview: steps through clips on its own while in view, until the visitor interacts.
 *  - Clicking "Watch full" (or double-clicking a clip) opens the full video in a modal.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { portfolio, type Project } from "@/data/portfolio";
import { isVideoFile, toEmbedUrl } from "@/lib/utils";
import Band from "./Band";
import { PlayIcon } from "./Icons";

type Track = { category: string; band: string };

/* Pretend clip lengths (seconds) per category, so the timeline looks like a real edit.
   Categories you add in the admin get DEFAULT_DURATION. */
const DURATION: Record<string, number> = { Reels: 15, Ads: 22, Cinematography: 18, "Video Editing": 32 };
const DEFAULT_DURATION = 18;
const GAP = 3;
const FPS = 25;

const tc = (s: number) => {
  const p = (n: number) => String(Math.floor(n)).padStart(2, "0");
  return `${p(s / 3600)}:${p((s / 60) % 60)}:${p(s % 60)}:${p((s * FPS) % FPS)}`;
};

/* deterministic "audio waveform" bars */
const WAVE = Array.from({ length: 220 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 0.37) * 0.6 + Math.sin(i * 1.13) * 0.3 + Math.sin(i * 2.71) * 0.15);
  return Math.round((0.18 + v * 0.82) * 100);
});

/** Film clapperboard placeholder, shown until a project has a thumbnail. */
function Slate({ project, index }: { project: Project; index: number }) {
  return (
    <div className="slate" aria-hidden="true">
      <div className="slate__sticks">
        <span className="slate__stick slate__stick--top" />
        <span className="slate__stick" />
      </div>
      <div className="slate__board">
        <div className="slate__row slate__row--title">
          <small>Prod.</small>
          <b>{project.title}</b>
        </div>
        <div className="slate__cols">
          <div>
            <small>Roll</small>
            <b>A{String(index + 1).padStart(2, "0")}</b>
          </div>
          <div>
            <small>Scene</small>
            <b>{project.category.split(" ")[0]}</b>
          </div>
          <div>
            <small>Take</small>
            <b>{project.year}</b>
          </div>
        </div>
        <div className="slate__row">
          <small>Client</small>
          <b>{project.client}</b>
        </div>
        <div className="slate__center">
          <span>{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="slate__foot">
          <span>{project.vertical ? "9:16" : "16:9"}</span>
          <span>{FPS} FPS</span>
          <span className="slate__dot" />
        </div>
      </div>
    </div>
  );
}

type Clip = { project: Project; start: number; dur: number; track: number; order: number };

/** Shown when no project belongs to a track yet (e.g. an empty database). */
function EmptyWork() {
  return (
    <section className="work-suite" id="work" aria-labelledby="work-title">
      <Band text={portfolio.bands.work} variant="ember" headingId="work-title" />
      <div className="suite-stage">
        <div className="container">
          <p className="suite-empty">New projects are being edited. Check back soon.</p>
        </div>
      </div>
    </section>
  );
}

export default function Work({ projects, tracks }: { projects: Project[]; tracks: Track[] }) {
  const names = new Set(tracks.map((t) => t.category));
  if (!projects.some((p) => names.has(p.category))) return <EmptyWork />;
  return <WorkSuite projects={projects} workSections={tracks} />;
}

function WorkSuite({ projects, workSections }: { projects: Project[]; workSections: Track[] }) {
  const { bands } = portfolio;

  /* ---------- lay the clips out on tracks ---------- */
  const { tracks, clips, total } = useMemo(() => {
    const tracks = workSections
      .map((s) => ({ ...s, items: projects.filter((p) => p.category === s.category) }))
      .filter((t) => t.items.length > 0);
    const clips: Clip[] = [];
    tracks.forEach((t, ti) => {
      let at = 2 + ti * 5; // stagger tracks like a real edit
      t.items.forEach((p) => {
        const dur = DURATION[p.category] ?? DEFAULT_DURATION;
        clips.push({ project: p, start: at, dur, track: ti, order: 0 });
        at += dur + GAP;
      });
    });
    clips.sort((a, b) => a.start - b.start || a.track - b.track).forEach((c, i) => (c.order = i));
    const total = Math.ceil(Math.max(...clips.map((c) => c.start + c.dur)) + 8);
    return { tracks, clips, total };
  }, [projects, workSections]);

  const [sel, setSel] = useState(0);
  const [auto, setAuto] = useState(true);
  const [modal, setModal] = useState<Project | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [inView, setInView] = useState(false);

  // clamp: the list can shrink after an admin edit
  const current = clips[Math.min(sel, clips.length - 1)];
  const p = current.project;
  // no separate hover preview uploaded? use the main video file
  const previewSrc = p.preview || (isVideoFile(p.videoUrl) ? p.videoUrl : "");

  const select = useCallback(
    (i: number, byUser = true) => {
      const n = (i + clips.length) % clips.length;
      setSel(n);
      if (byUser) setAuto(false);
    },
    [clips.length]
  );

  /* auto-preview while the section is visible (never with reduced motion) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => select(sel + 1, false), 4200);
    return () => window.clearTimeout(id);
  }, [auto, inView, sel, select]);

  /* keep the selected clip visible inside the scrolling timeline (mobile) */
  useEffect(() => {
    const sc = scrollerRef.current;
    const btn = sc?.querySelector<HTMLElement>(`[data-clip="${sel}"]`);
    if (!sc || !btn) return;
    const left = btn.offsetLeft - sc.clientWidth * 0.3;
    if (btn.offsetLeft < sc.scrollLeft || btn.offsetLeft + btn.offsetWidth > sc.scrollLeft + sc.clientWidth) {
      sc.scrollTo({ left, behavior: "smooth" });
    }
  }, [sel]);

  /* ---------- modal ---------- */
  useEffect(() => {
    const d = dialogRef.current;
    if (modal && d && !d.open) {
      window.__lenis?.stop();
      d.showModal();
    }
  }, [modal]);
  const closeModal = () => dialogRef.current?.close();
  const openFull = (proj: Project) => {
    setAuto(false);
    setModal(proj);
  };
  const embed = modal ? toEmbedUrl(modal.videoUrl) : null;

  /* NLE-style shortcuts while the suite is on screen: ← → (or J / L) switch clip, K plays it */
  useEffect(() => {
    if (!inView || modal) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright" || k === "l") {
        e.preventDefault();
        select(sel + 1);
      } else if (k === "arrowleft" || k === "j") {
        e.preventDefault();
        select(sel - 1);
      } else if (k === "k") {
        openFull(current.project);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pct = (s: number) => `${((s / total) * 100).toFixed(3)}%`;
  const ticks = Array.from({ length: Math.floor(total / 5) + 1 }, (_, i) => i * 5);

  return (
    <section className="work-suite" id="work" ref={sectionRef} aria-labelledby="work-title">
      <Band text={bands.work} variant="ember" headingId="work-title" />

      <div className="suite-stage">
        <div className="container">
          <div className="suite" data-reveal>
            {/* window chrome */}
            <div className="suite__bar">
              <span className="suite__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="suite__file">Portfolio_{portfolio.person.year}.prproj</span>
              <span className="suite__status">
                <span className={`suite__live${auto && inView ? " is-on" : ""}`} aria-hidden="true" />
                {auto ? "Auto preview" : "Manual"} · {clips.length} clips
              </span>
            </div>

            <div className="suite__top">
              {/* ---------- Program monitor ---------- */}
              <div className="monitor">
                <div className="monitor__head">
                  <span>Program: {p.title}</span>
                  <span className="monitor__tc">{tc(current.start)}</span>
                </div>
                <div className="monitor__screen" style={{ "--hue": p.hue } as CSSProperties}>
                  <div className="monitor__ambient" aria-hidden="true" />
                  <div className={`monitor__frame${p.vertical ? " is-vertical" : ""}`} key={p.id}>
                    {previewSrc ? (
                      <video src={previewSrc} poster={p.thumbnail || undefined} muted loop autoPlay playsInline aria-hidden="true" />
                    ) : p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt="" />
                    ) : (
                      <Slate project={p} index={current.order} />
                    )}
                  </div>
                  <span className="monitor__safe" aria-hidden="true" />
                  <button type="button" className="monitor__play" onClick={() => openFull(p)} data-cursor="play" aria-label={`Watch ${p.title}`}>
                    <PlayIcon />
                  </button>
                </div>
                <div className="monitor__transport">
                  <button type="button" onClick={() => select(sel - 1)} aria-label="Previous clip">
                    ⏮
                  </button>
                  <button type="button" className="is-main" onClick={() => openFull(p)} aria-label={`Play ${p.title}`}>
                    <PlayIcon />
                  </button>
                  <button type="button" onClick={() => select(sel + 1)} aria-label="Next clip">
                    ⏭
                  </button>
                  <span className="monitor__count">
                    {String(sel + 1).padStart(2, "0")} / {String(clips.length).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* ---------- Metadata panel ---------- */}
              <aside className="metapanel" aria-live="polite">
                <div className="metapanel__tabs" aria-hidden="true">
                  <span className="is-on">Metadata</span>
                  <span>Effects</span>
                  <span>Lumetri</span>
                </div>
                <div className="metapanel__body" key={p.id}>
                  <p className="metapanel__cat">
                    <i style={{ background: `hsl(${p.hue} 65% 45%)` }} />
                    {p.category} · {p.year}
                  </p>
                  <h3 className="metapanel__title">{p.title}</h3>
                  <p className="metapanel__desc">{p.description}</p>
                  <dl className="metapanel__rows">
                    <div>
                      <dt>Client</dt>
                      <dd>{p.client}</dd>
                    </div>
                    <div>
                      <dt>Role</dt>
                      <dd>{p.role}</dd>
                    </div>
                    <div>
                      <dt>Format</dt>
                      <dd>{p.vertical ? "9:16 · Vertical" : "16:9 · Horizontal"}</dd>
                    </div>
                  </dl>
                  <ul className="metapanel__tools">
                    {p.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <button type="button" className="btn btn--red btn--block" onClick={() => openFull(p)} data-magnetic>
                    ▶ Watch full video
                  </button>
                </div>
              </aside>
            </div>

            {/* ---------- Timeline ---------- */}
            <div className="timeline">
              <div className="timeline__heads" aria-hidden="true">
                <div className="timeline__corner">{tc(current.start).slice(3)}</div>
                {tracks.map((t, ti) => (
                  <div className="timeline__head" key={t.category}>
                    <b>V{tracks.length - ti}</b>
                    <span>{t.band}</span>
                  </div>
                ))}
                <div className="timeline__head timeline__head--audio">
                  <b>A1</b>
                  <span>Music</span>
                </div>
              </div>

              <div className="timeline__scroll" ref={scrollerRef} data-lenis-prevent>
                <div className="timeline__inner" style={{ "--secs": total } as CSSProperties}>
                  <div className="timeline__ruler" aria-hidden="true">
                    {ticks.map((s) => (
                      <span key={s} style={{ left: pct(s) }} className={s % 10 === 0 ? "is-major" : undefined}>
                        {s % 10 === 0 ? tc(s).slice(3, 8) : ""}
                      </span>
                    ))}
                  </div>

                  {tracks.map((t, ti) => (
                    <div className="timeline__track" key={t.category} role="group" aria-label={`${t.band} track`}>
                      {clips
                        .filter((c) => c.track === ti)
                        .map((c) => (
                          <button
                            type="button"
                            key={c.project.id}
                            data-clip={c.order}
                            className={`clip${c.order === sel ? " is-active" : ""}`}
                            style={{ left: pct(c.start), width: pct(c.dur), "--hue": c.project.hue } as CSSProperties}
                            onClick={() => select(c.order)}
                            onDoubleClick={() => openFull(c.project)}
                            aria-pressed={c.order === sel}
                            aria-label={`${c.project.title}, ${c.project.category}, ${c.project.year}`}
                          >
                            <span
                              className="clip__frames"
                              style={c.project.thumbnail ? { backgroundImage: `url(${c.project.thumbnail})` } : undefined}
                              aria-hidden="true"
                            />
                            <span className="clip__name">{c.project.title}</span>
                          </button>
                        ))}
                    </div>
                  ))}

                  <div className="timeline__track timeline__track--audio" aria-hidden="true">
                    <div className="wave">
                      {WAVE.map((h, i) => (
                        <i key={i} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* playhead glides to the selected clip */}
                  <div className="playhead-rail" aria-hidden="true" style={{ transform: `translateX(${pct(current.start + 0.6)})` }}>
                    <span className="playhead" />
                  </div>
                </div>
              </div>
            </div>
            <p className="suite__hint">
              <span>Click a clip to preview · double-click or ▶ to watch</span>
              <span className="suite__keys" aria-label="Keyboard shortcuts: left and right arrows switch clip, K plays">
                <kbd>←</kbd>
                <kbd>→</kbd> switch <kbd>K</kbd> play
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Full video modal ---------- */}
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="modal-title"
        data-lenis-prevent
        onClose={() => {
          window.__lenis?.start();
          setModal(null); // unmounts the player, stopping playback
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        {modal && (
          <div className="modal__inner" style={{ "--hue": modal.hue } as CSSProperties}>
            <button type="button" className="modal__close" onClick={closeModal} aria-label="Close video">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className={`modal__stage${modal.vertical ? " is-vertical" : ""}`}>
              <div className="modal__player">
                {modal.videoUrl && isVideoFile(modal.videoUrl) ? (
                  <video src={modal.videoUrl} controls autoPlay playsInline poster={modal.thumbnail || undefined} />
                ) : embed ? (
                  <iframe
                    src={embed}
                    title={`${modal.title}: video`}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="ph ph--modal">
                    <span className="ph__label">{modal.title}</span>
                    <span className="ph__hint">No video yet: add one in /admin → Projects</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal__body">
              <div>
                <p className="label">
                  {modal.category} · {modal.year}
                </p>
                <h2 className="modal__title" id="modal-title">
                  {modal.title}
                </h2>
                <p className="modal__desc">{modal.description}</p>
              </div>
              <dl className="meta">
                <div>
                  <dt>Client</dt>
                  <dd>{modal.client}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{modal.role}</dd>
                </div>
                <div>
                  <dt>Tools</dt>
                  <dd>
                    <ul className="tags">
                      {modal.tools.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
