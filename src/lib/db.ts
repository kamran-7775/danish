/**
 * Database (libSQL / SQLite).
 *  - Local:  DATABASE_URL=file:data/portfolio.db  → a SQLite file in /data (created automatically)
 *  - Vercel: DATABASE_URL=libsql://<db>.turso.io + DATABASE_AUTH_TOKEN → Turso (hosted SQLite)
 * Same code and SQL for both. Tables are created on first use and filled once with the
 * content from src/data/portfolio.ts, so the site never starts empty.
 */
import { createClient, type Client, type InStatement } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { portfolio, type Project } from "@/data/portfolio";

export type Category = { id: string; name: string; label: string; sort: number };
export type ProjectRecord = Project & { sort: number };
export type BtsItem = { id: string; src: string; caption: string; category: string; shape: "wide" | "tall" | "portrait" | "square"; sort: number };
export type Showreel = { videoUrl: string; poster: string; tagline: string };

// DATABASE_* or the TURSO_* names that Vercel's Turso integration creates
const URL = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:data/portfolio.db";
const AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;

/* one client per server process (also survives dev hot-reloads) */
const g = globalThis as unknown as { __db?: Client; __dbReady?: Promise<void> };

function client(): Client {
  if (!g.__db) {
    if (URL.startsWith("file:")) mkdirSync(dirname(URL.slice(5)) || ".", { recursive: true });
    g.__db = createClient({ url: URL, authToken: AUTH_TOKEN });
  }
  return g.__db;
}

async function db(): Promise<Client> {
  const c = client();
  if (!g.__dbReady) g.__dbReady = init(c).catch((e) => ((g.__dbReady = undefined), Promise.reject(e)));
  await g.__dbReady;
  return c;
}

export const dbInfo = () => ({
  kind: URL.startsWith("file:") ? ("local" as const) : ("remote" as const),
  url: URL.startsWith("file:") ? URL.slice(5) : URL.replace(/\/\/([^@/]+@)?/, "//"),
});

/* ---------------------------------------------------------------------------
   Schema + one-time seed
--------------------------------------------------------------------------- */
async function init(c: Client) {
  await c.batch(
    [
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
    ],
    "write"
  );
  const seeded = await c.execute("SELECT 1 FROM settings WHERE key = 'seeded'");
  if (seeded.rows.length) return;

  // INSERT OR IGNORE + stable ids: safe even if two processes seed at the same time
  const stmts: InStatement[] = [];
  portfolio.workSections.forEach((s, i) =>
    stmts.push({
      sql: "INSERT OR IGNORE INTO categories (id, name, label, sort) VALUES (?, ?, ?, ?)",
      args: [slug(s.category), s.category, s.band, i],
    })
  );
  portfolio.projects.forEach((p, i) =>
    stmts.push({
      sql: `INSERT OR IGNORE INTO projects (id, title, category, year, client, thumbnail, preview, video_url,
              vertical, description, role, tools, hue, sort, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [p.id, p.title, p.category, p.year, p.client, p.thumbnail, p.preview, p.videoUrl, p.vertical ? 1 : 0,
        p.description, p.role, JSON.stringify(p.tools), p.hue, i],
    })
  );
  portfolio.bts.forEach((b, i) =>
    stmts.push({
      sql: "INSERT OR IGNORE INTO bts (id, src, caption, category, shape, sort) VALUES (?, ?, ?, ?, ?, ?)",
      args: [`bts-${i + 1}`, b.src, b.caption, b.category, b.shape, i],
    })
  );
  stmts.push({
    sql: "INSERT OR IGNORE INTO settings (key, value) VALUES ('showreel', ?)",
    args: [JSON.stringify(portfolio.showreel)],
  });
  stmts.push("INSERT OR IGNORE INTO settings (key, value) VALUES ('seeded', '1')");
  await c.batch(stmts, "write");
}

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */
export function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48) || "item"
  );
}
const newId = (base: string) => `${slug(base)}-${randomUUID().slice(0, 6)}`;
const str = (v: unknown) => (v == null ? "" : String(v));

type Row = Record<string, unknown>;
const toProject = (r: Row): ProjectRecord => ({
  id: str(r.id),
  title: str(r.title),
  category: str(r.category),
  year: Number(r.year) || new Date().getFullYear(),
  client: str(r.client),
  thumbnail: str(r.thumbnail),
  preview: str(r.preview),
  videoUrl: str(r.video_url),
  vertical: Number(r.vertical) === 1,
  description: str(r.description),
  role: str(r.role),
  tools: (() => {
    try {
      const t = JSON.parse(str(r.tools) || "[]");
      return Array.isArray(t) ? t.map(String) : [];
    } catch {
      return [];
    }
  })(),
  hue: Number(r.hue) || 0,
  sort: Number(r.sort) || 0,
});
const toCategory = (r: Row): Category => ({ id: str(r.id), name: str(r.name), label: str(r.label), sort: Number(r.sort) || 0 });
const toBts = (r: Row): BtsItem => ({
  id: str(r.id),
  src: str(r.src),
  caption: str(r.caption),
  category: str(r.category) || "Shoot",
  shape: (["wide", "tall", "portrait", "square"].includes(str(r.shape)) ? str(r.shape) : "wide") as BtsItem["shape"],
  sort: Number(r.sort) || 0,
});

async function nextSort(table: "projects" | "bts" | "categories", where = "", args: (string | number)[] = []) {
  const c = await db();
  const r = await c.execute({ sql: `SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM ${table} ${where}`, args });
  return Number(r.rows[0]?.n) || 0;
}

/** Move a row one step up/down among its siblings (rewrites the sort order). */
async function move(table: "projects" | "bts" | "categories", id: string, dir: -1 | 1, scope?: { col: string; val: string }) {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT id FROM ${table} ${scope ? `WHERE ${scope.col} = ?` : ""} ORDER BY sort, rowid`,
    args: scope ? [scope.val] : [],
  });
  const ids = r.rows.map((x) => str(x.id));
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await c.batch(ids.map((x, n) => ({ sql: `UPDATE ${table} SET sort = ? WHERE id = ?`, args: [n, x] })), "write");
}

/* ---------------------------------------------------------------------------
   Public site
--------------------------------------------------------------------------- */
export async function getSiteData() {
  const [categories, projects, bts, showreel] = await Promise.all([listCategories(), listProjects(), listBts(), getShowreel()]);
  return { categories, projects, bts, showreel };
}

/* ---------------------------------------------------------------------------
   Categories (timeline tracks)
--------------------------------------------------------------------------- */
export async function listCategories() {
  const c = await db();
  return (await c.execute("SELECT * FROM categories ORDER BY sort, rowid")).rows.map(toCategory);
}

export async function saveCategory(input: { id?: string; name: string; label: string }) {
  const c = await db();
  const name = input.name.trim();
  const label = input.label.trim() || name;
  if (!name) throw new Error("Category name is required.");
  if (input.id) {
    const old = await c.execute({ sql: "SELECT name FROM categories WHERE id = ?", args: [input.id] });
    const oldName = str(old.rows[0]?.name);
    // renaming a category also moves its projects, so nothing disappears from the site
    await c.batch(
      [
        { sql: "UPDATE categories SET name = ?, label = ? WHERE id = ?", args: [name, label, input.id] },
        { sql: "UPDATE projects SET category = ? WHERE category = ?", args: [name, oldName] },
      ],
      "write"
    );
    return input.id;
  }
  const id = newId(name);
  await c.execute({
    sql: "INSERT INTO categories (id, name, label, sort) VALUES (?, ?, ?, ?)",
    args: [id, name, label, await nextSort("categories")],
  });
  return id;
}

export async function deleteCategory(id: string) {
  const c = await db();
  const cat = (await c.execute({ sql: "SELECT name FROM categories WHERE id = ?", args: [id] })).rows[0];
  if (!cat) return;
  const used = await c.execute({ sql: "SELECT COUNT(*) AS n FROM projects WHERE category = ?", args: [str(cat.name)] });
  if (Number(used.rows[0]?.n) > 0) {
    throw new Error(`"${str(cat.name)}" still has ${used.rows[0]?.n} project(s). Move or delete them first.`);
  }
  await c.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
}

export const moveCategory = (id: string, dir: -1 | 1) => move("categories", id, dir);

/* ---------------------------------------------------------------------------
   Projects (Work timeline)
--------------------------------------------------------------------------- */
export async function listProjects() {
  const c = await db();
  return (await c.execute("SELECT * FROM projects ORDER BY sort, rowid")).rows.map(toProject);
}

export async function getProject(id: string) {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM projects WHERE id = ?", args: [id] });
  return r.rows[0] ? toProject(r.rows[0]) : null;
}

export type ProjectInput = Omit<Project, "id">;

export async function saveProject(input: ProjectInput, id?: string) {
  const c = await db();
  const args = [input.title, input.category, input.year, input.client, input.thumbnail, input.preview, input.videoUrl,
    input.vertical ? 1 : 0, input.description, input.role, JSON.stringify(input.tools), input.hue];
  if (id) {
    await c.execute({
      sql: `UPDATE projects SET title = ?, category = ?, year = ?, client = ?, thumbnail = ?, preview = ?, video_url = ?,
              vertical = ?, description = ?, role = ?, tools = ?, hue = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [...args, id],
    });
    return id;
  }
  const newID = newId(input.title);
  await c.execute({
    sql: `INSERT INTO projects (title, category, year, client, thumbnail, preview, video_url, vertical, description,
            role, tools, hue, id, sort, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [...args, newID, await nextSort("projects")],
  });
  return newID;
}

export async function deleteProject(id: string) {
  const c = await db();
  await c.execute({ sql: "DELETE FROM projects WHERE id = ?", args: [id] });
}

export async function moveProject(id: string, dir: -1 | 1) {
  const p = await getProject(id);
  if (p) await move("projects", id, dir, { col: "category", val: p.category });
}

/* ---------------------------------------------------------------------------
   Behind the scenes
--------------------------------------------------------------------------- */
export async function listBts() {
  const c = await db();
  return (await c.execute("SELECT * FROM bts ORDER BY sort, rowid")).rows.map(toBts);
}

export async function getBts(id: string) {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM bts WHERE id = ?", args: [id] });
  return r.rows[0] ? toBts(r.rows[0]) : null;
}

export async function saveBts(input: Omit<BtsItem, "id" | "sort">, id?: string) {
  const c = await db();
  if (id) {
    await c.execute({
      sql: "UPDATE bts SET src = ?, caption = ?, category = ?, shape = ? WHERE id = ?",
      args: [input.src, input.caption, input.category, input.shape, id],
    });
    return id;
  }
  const newID = newId(input.caption || "bts");
  await c.execute({
    sql: "INSERT INTO bts (id, src, caption, category, shape, sort) VALUES (?, ?, ?, ?, ?, ?)",
    args: [newID, input.src, input.caption, input.category, input.shape, await nextSort("bts")],
  });
  return newID;
}

export async function deleteBts(id: string) {
  const c = await db();
  await c.execute({ sql: "DELETE FROM bts WHERE id = ?", args: [id] });
}

export const moveBts = (id: string, dir: -1 | 1) => move("bts", id, dir);

/* ---------------------------------------------------------------------------
   Showreel (stored as one JSON setting)
--------------------------------------------------------------------------- */
export async function getShowreel(): Promise<Showreel> {
  const c = await db();
  const r = await c.execute("SELECT value FROM settings WHERE key = 'showreel'");
  try {
    return { ...portfolio.showreel, ...JSON.parse(str(r.rows[0]?.value) || "{}") };
  } catch {
    return portfolio.showreel;
  }
}

export async function saveShowreel(s: Showreel) {
  const c = await db();
  await c.execute({
    sql: "INSERT INTO settings (key, value) VALUES ('showreel', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [JSON.stringify(s)],
  });
}
