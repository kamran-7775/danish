import { tornPolygon } from "@/lib/utils";

/**
 * Ripped edge that overlaps the edge of a section.
 * position="top":    the strip hangs down from the top of its section
 * position="bottom": the strip rises up from the bottom of its section
 * tone="paper":      grid paper with a white fibre fringe (use inside dark sections)
 * tone="dark":       black (use inside paper sections that follow a dark one)
 */
export default function TornEdge({
  position = "top",
  seed = 1,
  tone = "paper",
}: {
  position?: "top" | "bottom";
  seed?: number;
  tone?: "paper" | "dark";
}) {
  return (
    <div className={`torn torn--${position} torn--${tone}`} aria-hidden="true">
      {tone === "paper" && <div className="torn__fringe" style={{ clipPath: tornPolygon(seed, 70, 160, 10) }} />}
      <div className={`torn__layer${tone === "paper" ? " paper" : ""}`} style={{ clipPath: tornPolygon(seed, 70, 160) }} />
    </div>
  );
}
