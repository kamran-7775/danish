/** Turns any YouTube/Vimeo link into an embeddable player URL (autoplay on). */
export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&title=0&byline=0`;
  const insta = url.match(/instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]+)/);
  if (insta) return `https://www.instagram.com/reel/${insta[1]}/embed/`;
  return url;
}

/** True for self-hosted video files (played with a native <video> player instead of an iframe). */
export const isVideoFile = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

/** Small seeded random generator, so torn edges render identically on server and client. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * CSS clip-path polygon with a ripped-paper bottom edge.
 * depth = how far up (in %) the tear can reach.
 */
export function tornPolygon(seed: number, depth = 60, points = 64, extra = 0): string {
  const r = rng(seed);
  const pts: string[] = [];
  const top = 100 - depth;
  let y = top + depth * 0.55;
  for (let i = points; i >= 0; i--) {
    const x = (i / points) * 100;
    // Random walk + small jitter = irregular, natural-looking rip
    y = Math.max(top, Math.min(100, y + (r() - 0.5) * depth * 0.45));
    const jag = (r() - 0.5) * depth * 0.18;
    const yy = Math.max(0, Math.min(100, y + jag + extra));
    pts.push(`${x.toFixed(2)}% ${yy.toFixed(1)}%`);
  }
  return `polygon(0 0, 100% 0, ${pts.join(", ")})`;
}
