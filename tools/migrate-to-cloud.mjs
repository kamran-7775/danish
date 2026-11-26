/**
 * Copy your LOCAL portfolio to the CLOUD, for the live site on Vercel:
 *   data/portfolio.db  →  Turso (hosted SQLite database)
 *   data/uploads/*     →  Vercel Blob (files uploaded in the local admin)
 * Links to uploaded files (/api/uploads/...) are rewritten to their new Blob URLs.
 * Files in public/media/ need nothing: they're deployed with the code.
 *
 * The cloud database is REPLACED by your local content (a mirror), so run this before you
 * start editing on the live site.
 *
 * usage (from the project folder):
 *   node --env-file=.env.cloud tools/migrate-to-cloud.mjs          → preview only, changes nothing
 *   node --env-file=.env.cloud tools/migrate-to-cloud.mjs --yes    → copy everything
 *
 * .env.cloud (git-ignored) needs:
 *   TURSO_DATABASE_URL=libsql://...      TURSO_AUTH_TOKEN=...      BLOB_READ_WRITE_TOKEN=...
 */
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const YES = process.argv.includes("--yes");
const SOURCE = process.env.SOURCE_DB || "file:data/portfolio.db";
// same names (and order) as src/lib/db.ts
const TARGET = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const TARGET_TOKEN = ["DATABASE_AUTH_TOKEN", "DATABASE_TOKEN", "TURSO_AUTH_TOKEN", "TURSO_DATABASE_AUTH_TOKEN", "TURSO_TOKEN"]
  .map((k) => process.env[k])
  .find(Boolean);
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const UPLOADS = join(process.cwd(), "data", "uploads");

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

if (!TARGET) fail("TURSO_DATABASE_URL is not set. Put it in .env.cloud (see README → Deploy).");
if (TARGET === SOURCE) fail("Target database is the same as the local one. Set TURSO_DATABASE_URL to your Turso URL.");
if (!existsSync("data/portfolio.db") && SOURCE === "file:data/portfolio.db") fail("data/portfolio.db not found. Run the site locally once first.");

/* Same schema as src/lib/db.ts */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, label TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, year INTEGER, client TEXT,
    thumbnail TEXT, preview TEXT, video_url TEXT, vertical INTEGER NOT NULL DEFAULT 0,
    description TEXT, role TEXT, tools TEXT, hue INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0, updated_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS bts (
    id TEXT PRIMARY KEY, src TEXT NOT NULL, caption TEXT, category TEXT, shape TEXT,
    sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
];
const TABLES = ["categories", "projects", "bts", "settings"];

/* ---------- read everything from the local database ---------- */
const src = createClient({ url: SOURCE });
const data = {};
for (const t of TABLES) {
  data[t] = (await src.execute(`SELECT * FROM ${t}`)).rows.map((r) => ({ ...r }));
}

/* ---------- find links to locally uploaded files ---------- */
const local = (url) => (typeof url === "string" ? url.match(/^\/api\/uploads\/([\w.-]+)$/)?.[1] : undefined);
const files = new Map(); // name -> size
const note = (url) => {
  const name = local(url);
  if (!name) return;
  const path = join(UPLOADS, name);
  if (!existsSync(path)) console.warn(`  ! missing local file, link left as is: ${url}`);
  else files.set(name, statSync(path).size);
};
data.projects.forEach((p) => [p.thumbnail, p.preview, p.video_url].forEach(note));
data.bts.forEach((b) => note(b.src));
const reelRow = data.settings.find((s) => s.key === "showreel");
const reel = reelRow ? JSON.parse(reelRow.value) : null;
if (reel) [reel.videoUrl, reel.poster].forEach(note);

const total = [...files.values()].reduce((a, b) => a + b, 0);
console.log(`\nLocal → cloud`);
console.log(`  database:  ${SOURCE}  →  ${TARGET.replace(/\/\/.*@/, "//")}`);
console.log(`  rows:      ${data.categories.length} categories, ${data.projects.length} projects, ${data.bts.length} BTS items, showreel`);
console.log(`  uploads:   ${files.size} file(s), ${mb(total)} → Vercel Blob`);
[...files].forEach(([n, s]) => console.log(`             · ${n} (${mb(s)})`));

if (!YES) {
  console.log(`\nPreview only: nothing was changed. Run again with --yes to copy.\n`);
  process.exit(0);
}
if (files.size && !BLOB_TOKEN) fail("BLOB_READ_WRITE_TOKEN is not set, but there are files to upload. Put it in .env.cloud.");

/* ---------- upload files to Blob ---------- */
const MIME = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };
const moved = new Map(); // "/api/uploads/x" -> blob url
let i = 0;
for (const [name, size] of files) {
  i++;
  process.stdout.write(`  ↑ [${i}/${files.size}] ${name} (${mb(size)}) … `);
  const blob = await put(`portfolio/${name}`, createReadStream(join(UPLOADS, name)), {
    access: "public",
    token: BLOB_TOKEN,
    contentType: MIME[extname(name).toLowerCase()],
    multipart: size > 50 * 1024 * 1024,
    addRandomSuffix: true,
  });
  moved.set(`/api/uploads/${name}`, blob.url);
  console.log("done");
}
const swap = (url) => moved.get(url) ?? url;

/* ---------- rewrite links ---------- */
data.projects.forEach((p) => {
  p.thumbnail = swap(p.thumbnail);
  p.preview = swap(p.preview);
  p.video_url = swap(p.video_url);
});
data.bts.forEach((b) => (b.src = swap(b.src)));
if (reel && reelRow) {
  reel.videoUrl = swap(reel.videoUrl);
  reel.poster = swap(reel.poster);
  reelRow.value = JSON.stringify(reel);
}

/* ---------- write to Turso in one transaction (all or nothing) ---------- */
const dst = createClient({ url: TARGET, authToken: TARGET_TOKEN });
await dst.batch(SCHEMA, "write");
const stmts = [];
for (const t of TABLES) {
  stmts.push(`DELETE FROM ${t}`);
  for (const row of data[t]) {
    const cols = Object.keys(row);
    stmts.push({ sql: `INSERT INTO ${t} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, args: cols.map((c) => row[c]) });
  }
}
await dst.batch(stmts, "write");

/* ---------- verify ---------- */
const counts = {};
for (const t of TABLES) counts[t] = Number((await dst.execute(`SELECT COUNT(*) AS n FROM ${t}`)).rows[0].n);
const ok = TABLES.every((t) => counts[t] === data[t].length);
console.log(`\n${ok ? "✓" : "✗"} Cloud database now has ${counts.categories} categories, ${counts.projects} projects, ${counts.bts} BTS items.`);
console.log(`  ${moved.size} file(s) uploaded to Vercel Blob and their links updated.`);
console.log(`\nNext: deploy (or redeploy) on Vercel so the live page is built from this data.\n`);
process.exit(ok ? 0 : 1);
