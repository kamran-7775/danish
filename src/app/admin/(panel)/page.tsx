import Link from "next/link";
import { dbInfo, listBts, listCategories, listProjects } from "@/lib/db";
import { storageMode } from "@/lib/storage";

export default async function Dashboard() {
  const [projects, categories, bts] = await Promise.all([listProjects(), listCategories(), listBts()]);
  const onVercel = !!process.env.VERCEL;
  const db = dbInfo();
  const storage = storageMode();
  const noVideo = projects.filter((p) => !p.videoUrl).length;
  const demo = projects.filter((p) => p.videoUrl.includes("/media/demo/")).length + bts.filter((b) => b.src.includes("/media/demo/")).length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Portfolio_2026.prproj</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <Link href="/admin/projects/new" className="adm-btn">
          + New project
        </Link>
      </header>

      {onVercel && db.kind === "local" && (
        <p className="flash flash--error">
          This site is on Vercel but still uses a local SQLite file, which Vercel doesn&apos;t keep. Set DATABASE_URL and
          DATABASE_AUTH_TOKEN to a Turso database (see README).
        </p>
      )}
      {onVercel && storage === "local" && (
        <p className="flash flash--error">
          Uploads need a Vercel Blob store on Vercel. Create one in your Vercel project (Storage → Blob) so
          BLOB_READ_WRITE_TOKEN is set.
        </p>
      )}

      <div className="stats-grid">
        <Link href="/admin/projects" className="stat-card">
          <b>{projects.length}</b>
          <span>Projects</span>
        </Link>
        <Link href="/admin/categories" className="stat-card">
          <b>{categories.length}</b>
          <span>Timeline tracks</span>
        </Link>
        <Link href="/admin/bts" className="stat-card">
          <b>{bts.length}</b>
          <span>Behind-the-scenes items</span>
        </Link>
        <Link href="/admin/showreel" className="stat-card">
          <b>▶</b>
          <span>Showreel</span>
        </Link>
      </div>

      <section className="card">
        <h2 className="card__title">To do</h2>
        <ul className="todo">
          <li className={demo ? "" : "is-done"}>
            {demo ? `${demo} item(s) still use DEMO videos/photos: replace them with your own.` : "All demo media replaced."}
          </li>
          <li className={noVideo ? "" : "is-done"}>
            {noVideo ? `${noVideo} project(s) have no video yet.` : "Every project has a video."}
          </li>
        </ul>
      </section>

      <section className="card">
        <h2 className="card__title">How it works</h2>
        <ol className="howto">
          <li>
            <b>Projects</b> are the clips on the Work timeline. Upload a video (or paste a YouTube / Vimeo / Instagram link),
            pick its track and save: the live site updates straight away.
          </li>
          <li>
            <b>Categories</b> are the timeline tracks (V1, V2…). Renaming one moves its projects with it.
          </li>
          <li>
            <b>Behind the scenes</b> is the “Lights · Camera · Edit” contact-sheet gallery.
          </li>
          <li>
            Use <b>↑ ↓</b> to change the order. The first project in a track plays first.
          </li>
        </ol>
      </section>
    </>
  );
}
