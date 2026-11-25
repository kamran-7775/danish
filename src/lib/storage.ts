/**
 * Where uploaded media goes.
 *  - "blob":  BLOB_READ_WRITE_TOKEN is set (Vercel) → Vercel Blob. The browser uploads straight
 *             to Blob storage, so big videos never pass through a serverless function.
 *  - "local": otherwise → files are saved in data/uploads/ and served by /api/uploads/<name>.
 */
import { join } from "node:path";

export type StorageMode = "blob" | "local";
export const storageMode = (): StorageMode => (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");
export const UPLOAD_DIR = join(process.cwd(), "data", "uploads");

export const MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Safe, unique file name: 1732540000000-my-clip.mp4 */
export function safeName(original: string) {
  const dot = original.lastIndexOf(".");
  const ext = (dot > 0 ? original.slice(dot) : "").toLowerCase();
  const base = (dot > 0 ? original.slice(0, dot) : original)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${Date.now()}-${base || "file"}${ext}`;
}
