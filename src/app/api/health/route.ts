/**
 * Setup check: open /api/health to see whether the live site is configured.
 * Shows only YES/NO and variable NAMES, never secret values.
 */
import { dbEnv, dbInfo, listCategories } from "@/lib/db";
import { storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Turn a raw error into a plain reason without leaking URLs or tokens. */
function reason(e: unknown) {
  const m = String((e as Error)?.message ?? e);
  if (/EROFS|read-only|EACCES|ENOENT.*data/i.test(m)) return "No cloud database set: add DATABASE_URL (or TURSO_DATABASE_URL) in Vercel.";
  if (/401|unauthori[sz]ed|token|jwt|auth/i.test(m)) return "Database token missing or wrong: check DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN).";
  if (/ENOTFOUND|fetch failed|ECONNREFUSED|getaddrinfo|404/i.test(m)) return "Can't reach the database URL: check it's the libsql://… URL of your Turso database.";
  return m.replace(/(libsql|https?):\/\/\S+/g, "<url>").replace(/[A-Za-z0-9_-]{30,}/g, "<hidden>").slice(0, 200);
}

export async function GET() {
  const env = dbEnv();
  const onVercel = !!process.env.VERCEL;
  let database: string;
  try {
    await listCategories();
    database = "connected ✓";
  } catch (e) {
    database = `ERROR: ${reason(e)}`;
  }

  const checks = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "set ✓" : "MISSING ✗",
    ADMIN_SECRET: (process.env.ADMIN_SECRET?.length ?? 0) >= 16 ? "set ✓" : "MISSING or too short ✗ (needs 16+ characters)",
    database_url_variable: env.urlVar ?? (onVercel ? "MISSING ✗" : "none (using local file)"),
    database_token_variable: env.tokenVar ?? (dbInfo().kind === "remote" ? "MISSING ✗" : "not needed locally"),
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "set ✓" : onVercel ? "MISSING ✗ (uploads won't work)" : "not set (local uploads)",
    database,
    uploads: storageMode() === "blob" ? "Vercel Blob" : "local disk",
  };
  const ok = Object.values(checks).every((v) => !/MISSING|ERROR/.test(v));
  return Response.json({ ok, running_on: onVercel ? "vercel" : "local", ...checks }, { headers: { "Cache-Control": "no-store" } });
}
