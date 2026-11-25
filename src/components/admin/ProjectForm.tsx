import Link from "next/link";
import type { Category, ProjectRecord } from "@/lib/db";
import type { StorageMode } from "@/lib/storage";
import { saveProjectAction } from "@/app/admin/actions";
import MediaField from "./MediaField";
import { HueField, SubmitButton } from "./Buttons";

/** Create / edit form for a project (a clip on the Work timeline). */
export default function ProjectForm({
  project,
  categories,
  storage,
  defaultCategory,
}: {
  project?: ProjectRecord | null;
  categories: Category[];
  storage: StorageMode;
  defaultCategory?: string;
}) {
  const p = project;
  return (
    <form action={saveProjectAction} className="form-grid">
      {p && <input type="hidden" name="id" value={p.id} />}

      <section className="card form-grid__main">
        <h2 className="card__title">Video</h2>
        <MediaField
          name="videoUrl"
          label="Full video"
          accept="video"
          storage={storage}
          defaultValue={p?.videoUrl}
          hint="Upload an MP4 (best: plays instantly, no branding) or paste a YouTube / Vimeo / Instagram link. Opens when visitors press Play."
        />
        <MediaField
          name="thumbnail"
          label="Thumbnail (cover image)"
          accept="image"
          storage={storage}
          defaultValue={p?.thumbnail}
          hint="Shown on the timeline clip and as the poster. JPG / WebP, around 1280 px wide."
        />
        <MediaField
          name="preview"
          label="Preview loop (optional)"
          accept="video"
          storage={storage}
          defaultValue={p?.preview}
          hint="A short, light MP4 (3–6 s) that plays in the monitor. Leave empty to use the full video file."
        />
      </section>

      <section className="card form-grid__side">
        <h2 className="card__title">Details</h2>
        <div className="adm-field">
          <label className="adm-label" htmlFor="title">
            Title *
          </label>
          <input id="title" name="title" className="adm-input" defaultValue={p?.title} required maxLength={120} />
        </div>
        <div className="adm-row">
          <div className="adm-field">
            <label className="adm-label" htmlFor="category">
              Track / category *
            </label>
            <select id="category" name="category" className="adm-input" defaultValue={p?.category ?? defaultCategory ?? categories[0]?.name} required>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="year">
              Year
            </label>
            <input id="year" name="year" type="number" min={1990} max={2100} className="adm-input" defaultValue={p?.year ?? new Date().getFullYear()} />
          </div>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="client">
            Client
          </label>
          <input id="client" name="client" className="adm-input" defaultValue={p?.client} maxLength={120} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="role">
            Your role
          </label>
          <input id="role" name="role" className="adm-input" defaultValue={p?.role} placeholder="Editor & colorist" maxLength={160} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="tools">
            Tools (comma separated)
          </label>
          <input id="tools" name="tools" className="adm-input" defaultValue={p?.tools.join(", ")} placeholder="Premiere Pro, After Effects" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="description">
            Description
          </label>
          <textarea id="description" name="description" className="adm-input" rows={4} defaultValue={p?.description} maxLength={1500} />
        </div>
        <label className="adm-check">
          <input type="checkbox" name="vertical" defaultChecked={p?.vertical} /> Vertical video (9:16: reels, TikTok, Shorts)
        </label>
        <HueField defaultValue={p?.hue ?? Math.floor(Math.random() * 360)} />
        <div className="form-actions">
          <SubmitButton>{p ? "Save changes" : "Add project"}</SubmitButton>
          <Link href="/admin/projects" className="adm-btn adm-btn--ghost">
            Cancel
          </Link>
        </div>
      </section>
    </form>
  );
}
