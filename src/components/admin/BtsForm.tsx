import Link from "next/link";
import type { BtsItem } from "@/lib/db";
import type { StorageMode } from "@/lib/storage";
import { saveBtsAction } from "@/app/admin/actions";
import MediaField from "./MediaField";
import { SubmitButton } from "./Buttons";

const SHAPES = [
  { v: "wide", l: "Wide (16:9)" },
  { v: "tall", l: "Tall (9:16)" },
  { v: "portrait", l: "Portrait (4:5)" },
  { v: "square", l: "Square (1:1)" },
];

export default function BtsForm({ item, storage, categories }: { item?: BtsItem | null; storage: StorageMode; categories: string[] }) {
  return (
    <form action={saveBtsAction} className="form-grid">
      {item && <input type="hidden" name="id" value={item.id} />}
      <section className="card form-grid__main">
        <h2 className="card__title">Photo or video</h2>
        <MediaField
          name="src"
          label="Media *"
          accept="any"
          storage={storage}
          defaultValue={item?.src}
          hint="A photo (JPG / WebP) or a short video (MP4) from the shoot: camera, set, lighting, editing desk."
        />
      </section>
      <section className="card form-grid__side">
        <h2 className="card__title">Details</h2>
        <div className="adm-field">
          <label className="adm-label" htmlFor="caption">
            Caption
          </label>
          <input id="caption" name="caption" className="adm-input" defaultValue={item?.caption} maxLength={200} placeholder="Key light + softbox, 45° from camera left" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="category">
            Category (filter chip)
          </label>
          <input id="category" name="category" className="adm-input" list="bts-cats" defaultValue={item?.category ?? "Shoot"} maxLength={40} />
          <datalist id="bts-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="shape">
            Frame shape
          </label>
          <select id="shape" name="shape" className="adm-input" defaultValue={item?.shape ?? "wide"}>
            {SHAPES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <SubmitButton>{item ? "Save changes" : "Add item"}</SubmitButton>
          <Link href="/admin/bts" className="adm-btn adm-btn--ghost">
            Cancel
          </Link>
        </div>
      </section>
    </form>
  );
}
