/**
 * Serves files uploaded in local mode (data/uploads/), with HTTP Range support so
 * videos can be scrubbed/seeked in the browser.
 *
 * The file is read with a pull-based stream: a chunk is read only when the browser asks
 * for more, and the file is closed as soon as the request is cancelled. (Browsers cancel
 * video requests all the time while seeking; Node's Readable.toWeb() would keep pushing
 * into the closed stream and crash with "Controller is already closed".)
 */
import { open, stat, type FileHandle } from "node:fs/promises";
import { extname, join } from "node:path";
import { MIME, UPLOAD_DIR } from "@/lib/storage";

const CHUNK = 256 * 1024; // bytes read per pull
const MAX_RANGE = 4 * 1024 * 1024; // answer open-ended ranges ("bytes=N-") with at most 4 MB

/** Stream bytes [start, end] of a file; reads lazily and stops cleanly on cancel. */
function fileStream(path: string, start: number, end: number) {
  let fh: FileHandle | null = null;
  let pos = start;
  const close = async () => {
    const h = fh;
    fh = null;
    await h?.close().catch(() => {});
  };
  return new ReadableStream<Uint8Array>({
    async start() {
      fh = await open(path, "r");
    },
    async pull(controller) {
      try {
        if (!fh || pos > end) {
          await close();
          controller.close();
          return;
        }
        const len = Math.min(CHUNK, end - pos + 1);
        const buf = new Uint8Array(len);
        const { bytesRead } = await fh.read(buf, 0, len, pos);
        if (bytesRead === 0) {
          await close();
          controller.close();
          return;
        }
        pos += bytesRead;
        controller.enqueue(buf.subarray(0, bytesRead));
      } catch (e) {
        await close();
        controller.error(e);
      }
    },
    async cancel() {
      await close(); // browser aborted (seek / pause / navigation): just stop
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w.-]+$/.test(name) || name.includes("..")) return new Response("Not found", { status: 404 });

  const path = join(UPLOAD_DIR, name);
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": MIME[extname(name).toLowerCase()] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable", // names are unique per upload
  };

  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range && (range[1] || range[2])) {
    let start: number;
    let end: number;
    if (range[1]) {
      start = Number(range[1]);
      end = range[2] ? Number(range[2]) : start + MAX_RANGE - 1; // open-ended: send a chunk, browser asks for more
    } else {
      start = size - Number(range[2]); // "bytes=-N": the last N bytes
      end = size - 1;
    }
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(fileStream(path, start, end), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(fileStream(path, 0, size - 1), { headers: { ...headers, "Content-Length": String(size) } });
}
