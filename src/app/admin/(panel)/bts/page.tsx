import Link from "next/link";
import { listBts } from "@/lib/db";
import { isVideoFile } from "@/lib/utils";
import { deleteBtsAction, moveBtsAction } from "../../actions";
import { ConfirmForm } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function BtsPage({ searchParams }: { searchParams: Search }) {
  const { msg, error } = await searchParams;
  const items = await listBts();

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Lights · Camera · Edit</p>
          <h1 className="page-title">Behind the scenes</h1>
        </div>
        <Link href="/admin/bts/new" className="adm-btn">
          + Add photo / video
        </Link>
      </header>
      <Flash msg={msg} error={error} />

      {items.length === 0 ? (
        <section className="card">
          <p className="adm-hint">Nothing here yet. The section is hidden on the site until you add something.</p>
        </section>
      ) : (
        <ul className="media-grid">
          {items.map((b, i) => (
            <li key={b.id} className="media-card">
              <Link href={`/admin/bts/${b.id}`} className="media-card__media">
                {isVideoFile(b.src) ? (
                  <video src={b.src} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.src} alt="" loading="lazy" />
                )}
                <span className="row__tag">
                  {isVideoFile(b.src) ? "▶ video" : "photo"} · {b.shape}
                </span>
              </Link>
              <p className="media-card__cap">
                <span className="track-badge">{b.category}</span> {b.caption || <em>No caption</em>}
              </p>
              <div className="row__actions">
                <form action={moveBtsAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="icon-btn" name="dir" value="up" disabled={i === 0} aria-label="Move earlier">
                    ←
                  </button>
                  <button className="icon-btn" name="dir" value="down" disabled={i === items.length - 1} aria-label="Move later">
                    →
                  </button>
                </form>
                <Link href={`/admin/bts/${b.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                  Edit
                </Link>
                <ConfirmForm action={deleteBtsAction} id={b.id} message="Delete this item?">
                  Delete
                </ConfirmForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
