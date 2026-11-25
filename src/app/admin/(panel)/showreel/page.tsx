import { getShowreel } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import { saveShowreelAction } from "../../actions";
import MediaField from "@/components/admin/MediaField";
import { SubmitButton } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function ShowreelPage({ searchParams }: { searchParams: Search }) {
  const { msg, error } = await searchParams;
  const reel = await getShowreel();
  const storage = storageMode();

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">Big player on the home page</p>
          <h1 className="page-title">Showreel</h1>
        </div>
      </header>
      <Flash msg={msg} error={error} />

      <form action={saveShowreelAction} className="form-grid">
        <section className="card form-grid__main">
          <MediaField
            name="videoUrl"
            label="Showreel video"
            accept="video"
            storage={storage}
            defaultValue={reel.videoUrl}
            hint="Best: upload an MP4. It then also plays as a silent live preview when visitors scroll to it. YouTube / Vimeo links work too."
          />
          <MediaField
            name="poster"
            label="Poster image (optional)"
            accept="image"
            storage={storage}
            defaultValue={reel.poster}
            hint="Leave empty to show the built-in SHOWREEL title card with your name."
          />
        </section>
        <section className="card form-grid__side">
          <div className="adm-field">
            <label className="adm-label" htmlFor="tagline">
              Tagline (under your name on the title card)
            </label>
            <input id="tagline" name="tagline" className="adm-input" defaultValue={reel.tagline} maxLength={120} />
          </div>
          <div className="form-actions">
            <SubmitButton>Save showreel</SubmitButton>
          </div>
        </section>
      </form>
    </>
  );
}
