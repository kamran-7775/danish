/**
 * Simple drawn placeholders shown until you add your own images in portfolio.ts.
 */

/* Line-art face for the "O" in PORTFOLIO */
const HAIR = Array.from({ length: 17 }, (_, i) => {
  const a = Math.PI + (i / 16) * Math.PI;
  return { x: 100 + 66 * Math.cos(a), y: 100 + 70 * Math.sin(a), r: 17 + (i % 3) * 2 };
});
const HAIR_INNER = Array.from({ length: 11 }, (_, i) => {
  const a = Math.PI * 1.08 + (i / 10) * Math.PI * 0.84;
  return { x: 100 + 42 * Math.cos(a), y: 92 + 48 * Math.sin(a), r: 15 };
});

export function FacePlaceholder() {
  return (
    <svg viewBox="0 0 200 250" className="face-ph" role="img" aria-label="Illustrated portrait placeholder">
      <g fill="var(--paper)" stroke="currentColor" strokeWidth="2.4">
        {/* neck + shoulders */}
        <path d="M80 182 L78 222 Q40 230 8 250 M120 182 L122 222 Q160 230 192 250" fill="none" />
        {/* ears */}
        <ellipse cx="50" cy="128" rx="9" ry="15" />
        <ellipse cx="150" cy="128" rx="9" ry="15" />
        {/* hair */}
        {HAIR.map((c, i) => (
          <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={c.r} />
        ))}
        {HAIR_INNER.map((c, i) => (
          <circle key={`in${i}`} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={c.r} />
        ))}
        {/* face */}
        <path d="M52 100 Q50 175 100 195 Q150 175 148 100 Q120 82 100 92 Q80 82 52 100Z" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {/* glasses */}
        <circle cx="78" cy="128" r="15" />
        <circle cx="122" cy="128" r="15" />
        <path d="M93 127 Q100 122 107 127 M63 126 L52 122 M137 126 L148 122" />
        {/* brows, nose, mouth */}
        <path d="M66 108 Q78 102 90 107 M110 107 Q122 102 134 108" />
        <path d="M100 136 Q96 152 98 156 Q102 159 107 155" />
        <path d="M86 170 Q100 176 114 170" />
      </g>
      <g fill="currentColor">
        <circle cx="82" cy="128" r="3.2" />
        <circle cx="126" cy="128" r="3.2" />
      </g>
    </svg>
  );
}

/* Standing full-body silhouette (About photo) */
export function BodyPlaceholder() {
  return (
    <svg viewBox="0 0 120 300" className="body-ph" role="img" aria-label="Full-body photo placeholder">
      <g fill="#1c1c1c">
        <circle cx="60" cy="28" r="18" />
        <rect x="53" y="44" width="14" height="10" rx="3" />
        <path d="M30 60 Q60 50 90 60 L96 150 L84 152 L82 100 L80 160 L40 160 L38 100 L36 152 L24 150 Z" fill="var(--accent)" />
        <path d="M40 158 L80 158 L78 280 L64 280 L60 180 L56 280 L42 280 Z" />
        <rect x="38" y="278" width="20" height="10" rx="4" fill="#eee" />
        <rect x="62" y="278" width="20" height="10" rx="4" fill="#eee" />
      </g>
    </svg>
  );
}

/* Head-and-shoulders silhouette (sticker cut-out) */
export function BustPlaceholder() {
  return (
    <svg viewBox="0 0 300 330" className="bust-ph" role="img" aria-label="Portrait cut-out placeholder">
      <g fill="#1d1d1d">
        {HAIR.map((c, i) => (
          <circle key={i} cx={(c.x * 1.1 + 40).toFixed(1)} cy={(c.y * 1.0 + 20).toFixed(1)} r={c.r * 1.15} />
        ))}
        <ellipse cx="150" cy="140" rx="62" ry="78" />
        <rect x="122" y="200" width="56" height="40" />
        <path d="M10 330 C20 255 80 228 150 228 C220 228 280 255 290 330 Z" />
      </g>
      <g fill="none" stroke="#3a3a3a" strokeWidth="4">
        <circle cx="126" cy="142" r="17" />
        <circle cx="174" cy="142" r="17" />
        <path d="M143 141 h14" />
      </g>
    </svg>
  );
}
