"use server";

/**
 * Admin server actions. Every action checks the session first (server actions are public
 * endpoints), validates the form, writes to the database, then refreshes the public page.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import * as db from "@/lib/db";

const text = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const int = (f: FormData, k: string, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(f.get(k)));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const dir = (f: FormData): -1 | 1 => (f.get("dir") === "up" ? -1 : 1);

/** Re-render the public site + the admin list after a change. */
function refresh(...paths: string[]) {
  revalidatePath("/");
  paths.forEach((p) => revalidatePath(p));
}
const back = (path: string, msg: string, kind: "ok" | "error" = "ok") =>
  redirect(`${path}?${kind === "ok" ? "msg" : "error"}=${encodeURIComponent(msg)}`);

/* ---------- session ---------- */
export async function login(_: unknown, form: FormData) {
  if (!checkPassword(text(form, "password", 200))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- projects ---------- */
export async function saveProjectAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 100) || undefined;
  const title = text(form, "title", 120);
  const category = text(form, "category", 80);
  if (!title || !category) back(id ? `/admin/projects/${id}` : "/admin/projects/new", "Title and category are required.", "error");
  await db.saveProject(
    {
      title,
      category,
      year: int(form, "year", 1990, 2100, new Date().getFullYear()),
      client: text(form, "client", 120),
      thumbnail: text(form, "thumbnail", 1000),
      preview: text(form, "preview", 1000),
      videoUrl: text(form, "videoUrl", 1000),
      vertical: form.get("vertical") === "on",
      description: text(form, "description", 1500),
      role: text(form, "role", 160),
      tools: text(form, "tools", 400)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
      hue: int(form, "hue", 0, 360, 0),
    },
    id
  );
  refresh("/admin/projects");
  back("/admin/projects", id ? `Saved “${title}”.` : `Added “${title}”.`);
}

export async function deleteProjectAction(form: FormData) {
  await requireAdmin();
  await db.deleteProject(text(form, "id", 100));
  refresh("/admin/projects");
  back("/admin/projects", "Project deleted.");
}

export async function moveProjectAction(form: FormData) {
  await requireAdmin();
  await db.moveProject(text(form, "id", 100), dir(form));
  refresh("/admin/projects");
}

/* ---------- categories ---------- */
export async function saveCategoryAction(form: FormData) {
  await requireAdmin();
  try {
    await db.saveCategory({ id: text(form, "id", 100) || undefined, name: text(form, "name", 60), label: text(form, "label", 80) });
  } catch (e) {
    back("/admin/categories", (e as Error).message.includes("UNIQUE") ? "A category with that name already exists." : (e as Error).message, "error");
  }
  refresh("/admin/categories", "/admin/projects");
  back("/admin/categories", "Category saved.");
}

export async function deleteCategoryAction(form: FormData) {
  await requireAdmin();
  try {
    await db.deleteCategory(text(form, "id", 100));
  } catch (e) {
    back("/admin/categories", (e as Error).message, "error");
  }
  refresh("/admin/categories");
  back("/admin/categories", "Category deleted.");
}

export async function moveCategoryAction(form: FormData) {
  await requireAdmin();
  await db.moveCategory(text(form, "id", 100), dir(form));
  refresh("/admin/categories");
}

/* ---------- behind the scenes ---------- */
const SHAPES = ["wide", "tall", "portrait", "square"] as const;

export async function saveBtsAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 100) || undefined;
  const src = text(form, "src", 1000);
  if (!src) back(id ? `/admin/bts/${id}` : "/admin/bts/new", "Please upload or link a photo / video.", "error");
  const shape = text(form, "shape", 20) as (typeof SHAPES)[number];
  await db.saveBts(
    {
      src,
      caption: text(form, "caption", 200),
      category: text(form, "category", 40) || "Shoot",
      shape: SHAPES.includes(shape) ? shape : "wide",
    },
    id
  );
  refresh("/admin/bts");
  back("/admin/bts", id ? "Item saved." : "Item added.");
}

export async function deleteBtsAction(form: FormData) {
  await requireAdmin();
  await db.deleteBts(text(form, "id", 100));
  refresh("/admin/bts");
  back("/admin/bts", "Item deleted.");
}

export async function moveBtsAction(form: FormData) {
  await requireAdmin();
  await db.moveBts(text(form, "id", 100), dir(form));
  refresh("/admin/bts");
}

/* ---------- showreel ---------- */
export async function saveShowreelAction(form: FormData) {
  await requireAdmin();
  await db.saveShowreel({
    videoUrl: text(form, "videoUrl", 1000),
    poster: text(form, "poster", 1000),
    tagline: text(form, "tagline", 120),
  });
  refresh("/admin/showreel");
  back("/admin/showreel", "Showreel saved.");
}
