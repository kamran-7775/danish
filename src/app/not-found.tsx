import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Media offline" };

/**
 * 404 page styled as Premiere Pro's famous red "Media Offline" frame.
 */
export default function NotFound() {
  return (
    <main className="offline" id="main">
      <div className="offline__frame">
        <p className="offline__title">Media offline</p>
        <p className="offline__text">
          The clip you&apos;re looking for is missing, was renamed or moved to another bin.
        </p>
        <p className="offline__code">Error 404 · Unable to relink media</p>
        <Link href="/" className="offline__btn">
          ← Back to the edit
        </Link>
      </div>
    </main>
  );
}
