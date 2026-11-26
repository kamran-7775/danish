/**
 * Media upload endpoint for the admin.
 *  - JSON body  → Vercel Blob "client upload" handshake (the browser then uploads straight to Blob).
 *  - multipart  → local mode: the file is saved to data/uploads/ and served by /api/uploads/<name>.
 * Only signed-in admins can upload.
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth";
import { safeName, storageMode, UPLOAD_DIR } from "@/lib/storage";

const ALLOWED = ["image/*", "video/*"];
const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";

  // ---- Vercel Blob: issue a short-lived upload token for the browser ----
  // No onUploadCompleted callback on purpose: we don't need it (the browser gets the file URL
  // back directly), and a callback Blob can't reach leaves uploads hanging at ~99%.
  if (type.includes("application/json")) {
    const body = (await request.json()) as HandleUploadBody;
    try {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => {
          if (!(await isAdmin())) throw new Error("Not signed in.");
          return { allowedContentTypes: ALLOWED, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
        },
      });
      return Response.json(result);
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // ---- Local: save to data/uploads ----
  if (!(await isAdmin())) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (storageMode() === "blob") return Response.json({ error: "Use the Blob client upload." }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No file received." }, { status: 400 });
  if (!/^(image|video)\//.test(file.type)) return Response.json({ error: "Only images and videos can be uploaded." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File is larger than 1 GB." }, { status: 413 });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = safeName(file.name);
  // stream to disk so big videos don't have to fit in memory
  await pipeline(Readable.fromWeb(file.stream() as unknown as import("node:stream/web").ReadableStream), createWriteStream(join(UPLOAD_DIR, name)));
  return Response.json({ url: `/api/uploads/${name}` });
}
