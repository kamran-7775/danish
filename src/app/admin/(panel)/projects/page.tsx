import Link from "next/link";
import { listCategories, listProjects } from "@/lib/db";
import { deleteProjectAction, moveProjectAction } from "../../actions";
import { ConfirmForm } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

const isImg = (u: string) => /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u);

export default async function ProjectsPage({ searchParams }: { searchParams: Search }) {
  const { msg, error } = await searchParams;
  const [projects, categories] = await Promise.all([listProjects(), listCategories()]);
  const known = new Set(categories.map((c) => c.name));
  const orphans = projects.filter((p) => !known.has(p.category));

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Work timeline</p>
          <h1 className="page-title">Projects</h1>
        </div>
        <Link href="/admin/projects/new" className="adm-btn">
          + New project
        </Link>
      </header>
      <Flash msg={msg} error={error} />

      {orphans.length > 0 && (
        <p className="flash flash--error">
          {orphans.length} project(s) use a category that no longer exists, so they are hidden on the site. Edit them and
          pick a track.
        </p>
      )}

      {categories.map((c, ci) => {
        const items = projects.filter((p) => p.category === c.name);
        return (
          <section key={c.id} className="card">
            <div className="card__head">
              <h2 className="card__title">
                <span className="track-badge">V{categories.length - ci}</span> {c.name}
                <small> · {items.length} clip(s)</small>
              </h2>
              <Link href={`/admin/projects/new?category=${encodeURIComponent(c.name)}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                + Add to {c.name}
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="adm-hint">No clips on this track yet.</p>
            ) : (
              <ul className="rows">
                {items.map((p, i) => (
                  <li key={p.id} className="row">
                    <div className="row__thumb" style={{ background: `hsl(${p.hue} 55% 30%)` }}>
                      {p.thumbnail && isImg(p.thumbnail) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumbnail} alt="" loading="lazy" />
                      )}
                      {p.vertical && <span className="row__tag">9:16</span>}
                    </div>
                    <div className="row__main">
                      <Link href={`/admin/projects/${p.id}`} className="row__title">
                        {p.title}
                      </Link>
                      <p className="row__meta">
                        {p.year} · {p.client || "No client"} · {p.videoUrl ? (p.videoUrl.includes("/media/demo/") ? "Demo video" : "Video ✓") : "No video"}
                      </p>
                    </div>
                    <div className="row__actions">
                      <form action={moveProjectAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="icon-btn" name="dir" value="up" disabled={i === 0} aria-label={`Move ${p.title} up`}>
                          ↑
                        </button>
                        <button className="icon-btn" name="dir" value="down" disabled={i === items.length - 1} aria-label={`Move ${p.title} down`}>
                          ↓
                        </button>
                      </form>
                      <Link href={`/admin/projects/${p.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                        Edit
                      </Link>
                      <ConfirmForm action={deleteProjectAction} id={p.id} message={`Delete “${p.title}”? This can't be undone.`}>
                        Delete
                      </ConfirmForm>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {orphans.length > 0 && (
        <section className="card">
          <h2 className="card__title">Without a track (hidden on the site)</h2>
          <ul className="rows">
            {orphans.map((p) => (
              <li key={p.id} className="row">
                <div className="row__main">
                  <Link href={`/admin/projects/${p.id}`} className="row__title">
                    {p.title}
                  </Link>
                  <p className="row__meta">Category: {p.category}</p>
                </div>
                <div className="row__actions">
                  <Link href={`/admin/projects/${p.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                    Edit
                  </Link>
                  <ConfirmForm action={deleteProjectAction} id={p.id} message={`Delete “${p.title}”?`}>
                    Delete
                  </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
