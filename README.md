# Danish Naveed: Video Editor & Cinematography Portfolio

Next.js 16 portfolio with a built-in **admin panel** for videos, projects, behind-the-scenes and the showreel.

## Run locally

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (password: `ADMIN_PASSWORD` in `.env.local`)

Local data lives in `data/` (git-ignored):
- `data/portfolio.db`: the SQLite database (created and filled automatically on first run)
- `data/uploads/`: files you upload in the admin

## What you manage in /admin

| Page | What it controls on the site |
|---|---|
| **Projects** | Clips on the Work timeline: video (upload or YouTube / Vimeo / Instagram link), thumbnail, preview loop, title, client, role, tools, 9:16, colour, order |
| **Categories** | Timeline tracks (V1, V2…). Renaming a track moves its projects with it |
| **Behind the scenes** | The “Lights · Camera · Edit” contact-sheet gallery (photos and videos, filter chips) |
| **Showreel** | The big showreel player: video, poster, tagline |

Every save updates the live site immediately. Other text (name, bio, services, contact…) is in `src/data/portfolio.ts`.

## Go live on Vercel

**What goes up with the code:** the site and everything in `public/media/`.
**What does NOT:** `data/` (your local database + admin uploads). Vercel can't keep files, so live data
lives in **Turso** (database) and **Vercel Blob** (uploads). `tools/migrate-to-cloud.mjs` copies your
local data there in one command.

1. **Put the code on GitHub**
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   # create an empty repo on github.com, then:
   git remote add origin https://github.com/<you>/dani-portfolio.git
   git branch -M main
   git push -u origin main
   ```
2. **Create the Vercel project:** vercel.com → *Add New → Project* → import the repo → Deploy.
3. **Add storage** (Vercel project → *Storage*):
   - **Turso** (Marketplace → Turso Cloud) → creates `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
     (or make a DB at turso.tech and add those two variables yourself)
   - **Blob** → creates `BLOB_READ_WRITE_TOKEN`
4. **Add variables** (*Settings → Environment Variables*): `ADMIN_PASSWORD` and `ADMIN_SECRET`
   (copy them from your `.env.local`, or choose new ones).
5. **Copy your local data up.** Create `.env.cloud` in the project folder (it's git-ignored) with the
   three values from Vercel (*Settings → Environment Variables*, click to reveal):
   ```
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   BLOB_READ_WRITE_TOKEN=...
   ```
   ```bash
   node --env-file=.env.cloud tools/migrate-to-cloud.mjs          # preview: shows what will be copied
   node --env-file=.env.cloud tools/migrate-to-cloud.mjs --yes    # copy it
   ```
   This uploads your videos to Blob, rewrites their links and copies all projects, categories, BTS
   and the showreel to Turso. (It mirrors: the cloud database is replaced by your local one.)
6. **Redeploy** (Vercel → *Deployments* → ⋯ → *Redeploy*), then open `https://<your-site>/admin`.

After that, manage everything on the live admin. Every `git push` redeploys the code automatically;
your live data stays in Turso and Blob.

## Tools

- `tools/make_demo_videos.py`: generate placeholder project clips + showreel
- `tools/make_demo_bts.py`: generate placeholder behind-the-scenes media
- `tools/make_assets.py`, `tools/make_lineart.py`: portrait cut-outs and the hero line-art
