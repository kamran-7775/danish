import { listCategories, listProjects } from "@/lib/db";
import { deleteCategoryAction, moveCategoryAction, saveCategoryAction } from "../../actions";
import { ConfirmForm, SubmitButton } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function CategoriesPage({ searchParams }: { searchParams: Search }) {
  const { msg, error } = await searchParams;
  const [categories, projects] = await Promise.all([listCategories(), listProjects()]);
  const count = (name: string) => projects.filter((p) => p.category === name).length;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Timeline tracks</p>
          <h1 className="page-title">Categories</h1>
        </div>
      </header>
      <Flash msg={msg} error={error} />
      <p className="adm-hint page-intro">
        Each category is a track on the Work timeline. <b>Name</b> is what you pick on a project; <b>Track label</b> is the
        text shown on the timeline. Renaming a category moves its projects with it.
      </p>

      <section className="card">
        <ul className="rows">
          {categories.map((c, i) => (
            <li key={c.id} className="row row--form">
              <span className="track-badge">V{categories.length - i}</span>
              <form action={saveCategoryAction} className="inline-form">
                <input type="hidden" name="id" value={c.id} />
                <label className="sr-only" htmlFor={`n-${c.id}`}>
                  Name
                </label>
                <input id={`n-${c.id}`} name="name" className="adm-input" defaultValue={c.name} required maxLength={60} />
                <label className="sr-only" htmlFor={`l-${c.id}`}>
                  Track label
                </label>
                <input id={`l-${c.id}`} name="label" className="adm-input" defaultValue={c.label} maxLength={80} />
                <SubmitButton className="adm-btn adm-btn--ghost adm-btn--sm">Save</SubmitButton>
              </form>
              <span className="row__meta row__count">{count(c.name)} project(s)</span>
              <div className="row__actions">
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="icon-btn" name="dir" value="up" disabled={i === 0} aria-label={`Move ${c.name} up`}>
                    ↑
                  </button>
                  <button className="icon-btn" name="dir" value="down" disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`}>
                    ↓
                  </button>
                </form>
                <ConfirmForm action={deleteCategoryAction} id={c.id} message={`Delete the “${c.name}” track?`}>
                  Delete
                </ConfirmForm>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="card__title">Add a category</h2>
        <form action={saveCategoryAction} className="inline-form">
          <label className="sr-only" htmlFor="new-name">
            Name
          </label>
          <input id="new-name" name="name" className="adm-input" placeholder="Name, e.g. Weddings" required maxLength={60} />
          <label className="sr-only" htmlFor="new-label">
            Track label
          </label>
          <input id="new-label" name="label" className="adm-input" placeholder="Track label, e.g. Wedding Films" maxLength={80} />
          <SubmitButton>+ Add</SubmitButton>
        </form>
      </section>
    </>
  );
}
