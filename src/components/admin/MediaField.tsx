"use client";

/**
 * Media input for the admin: paste a link (YouTube / Vimeo / Instagram / any file URL)
 * or upload a file. Shows a live preview and honest upload progress.
 *
 *  - storage "blob" (Vercel): uploads straight from the browser to Vercel Blob.
 *      · up to 8 MB: one request
 *      · bigger: split into 8 MB pieces, 2 at a time. The bar only moves when Blob CONFIRMS
 *        a piece ("24.0 of 64.0 MB uploaded"), and each piece is retried up to 3 times.
 *  - storage "local": uploads to /api/admin/upload → saved in data/uploads/
 *
 * The final URL is submitted with the form in a field called `name`.
 */
import { useRef, useState } from "react";
import { isVideoFile, toEmbedUrl } from "@/lib/utils";

const isImage = (u: string) => /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u);
const PART = 8 * 1024 * 1024; // piece size (Blob needs ≥ 5 MB per piece, except the last)
const STALL_MS = 4 * 60 * 1000; // give up after 4 min without any confirmed progress
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
const cleanName = (n: string) => n.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80);

type Progress = { sent: number; total: number; finishing: boolean; speed: string };

/** Ask our server for a short-lived Blob upload token (checks you're signed in). */
async function getClientToken(pathname: string, multipart: boolean) {
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, clientPayload: null, multipart } }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.clientToken) throw new Error(json.error || `Could not start the upload (error ${res.status}).`);
  return json.clientToken as string;
}

/** Run fn, retrying up to `tries` times on network hiccups (not on cancel). */
async function withRetry<T>(fn: () => Promise<T>, signal: AbortSignal, tries = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (signal.aborted || attempt >= tries) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

export default function MediaField({
  name,
  label,
  accept,
  defaultValue = "",
  storage,
  hint,
}: {
  name: string;
  label: string;
  accept: "video" | "image" | "any";
  defaultValue?: string;
  storage: "blob" | "local";
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [up, setUp] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const mime = accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*";

  async function upload(file: File) {
    setError("");
    const controller = new AbortController();
    const started = Date.now();
    let lastMove = started;
    let stalled = false;

    /** Update the bar: `sent` = bytes confirmed so far. */
    const report = (sent: number, finishing = false) => {
      lastMove = Date.now();
      const secs = (lastMove - started) / 1000;
      let speed = "";
      if (!finishing && secs > 1 && sent > 0 && sent < file.size) {
        const bps = sent / secs;
        const left = Math.max(1, Math.round((file.size - sent) / bps));
        speed = `${mb(bps)} MB/s · about ${left < 60 ? `${left} s` : `${Math.round(left / 60)} min`} left`;
      }
      setUp({ sent: Math.min(sent, file.size), total: file.size, finishing, speed });
    };
    report(0);

    const watchdog = window.setInterval(() => {
      if (Date.now() - lastMove > STALL_MS) {
        stalled = true;
        controller.abort();
      }
    }, 5_000);

    try {
      let url: string;
      if (storage === "blob") {
        const { put, createMultipartUploader } = await import("@vercel/blob/client");
        const pathname = `portfolio/${cleanName(file.name)}`;
        const contentType = file.type || undefined;

        if (file.size <= PART) {
          // small file: one request
          const token = await getClientToken(pathname, false);
          const blob = await put(pathname, file, {
            access: "public",
            token,
            contentType,
            abortSignal: controller.signal,
            onUploadProgress: (e) => report(e.loaded, e.percentage >= 99),
          });
          url = blob.url;
        } else {
          // big file: confirmed 8 MB pieces, 2 at a time
          const token = await getClientToken(pathname, true);
          const uploader = await createMultipartUploader(pathname, { access: "public", token, contentType, abortSignal: controller.signal });
          const count = Math.ceil(file.size / PART);
          const parts: { etag: string; partNumber: number }[] = [];
          let confirmed = 0;
          let next = 0;
          const worker = async () => {
            while (next < count) {
              const i = next++;
              const chunk = file.slice(i * PART, Math.min(file.size, (i + 1) * PART));
              const part = await withRetry(() => uploader.uploadPart(i + 1, chunk), controller.signal);
              parts.push(part);
              confirmed += chunk.size;
              report(confirmed);
            }
          };
          await Promise.all([worker(), worker()]);
          report(file.size, true); // joining the pieces
          const blob = await uploader.complete(parts.sort((a, b) => a.partNumber - b.partNumber));
          url = blob.url;
        }
      } else {
        // local: one request to our server (saved in data/uploads)
        url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const body = new FormData();
          body.append("file", file);
          controller.signal.addEventListener("abort", () => xhr.abort());
          xhr.onabort = () => reject(new Error("aborted"));
          xhr.open("POST", "/api/admin/upload");
          xhr.upload.onprogress = (e) => e.lengthComputable && report(e.loaded, e.loaded >= e.total);
          xhr.onload = () => {
            try {
              const res = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && res.url) resolve(res.url);
              else reject(new Error(res.error || `Upload failed (${xhr.status}).`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status}).`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload."));
          xhr.send(body);
        });
      }
      setValue(url);
    } catch (e) {
      setError(
        stalled
          ? "Upload stopped: nothing arrived for 4 minutes. Check your internet and try again (or use a smaller file / a YouTube link)."
          : `Upload failed: ${(e as Error).message || "unknown error"}`
      );
    } finally {
      window.clearInterval(watchdog);
      setUp(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const pct = up ? Math.floor((up.sent / Math.max(1, up.total)) * 100) : 0;
  const embed = value && !isVideoFile(value) && !isImage(value) ? toEmbedUrl(value) : null;

  return (
    <div className="mf">
      <label className="adm-label" htmlFor={`mf-${name}`}>
        {label}
      </label>
      <div className="mf__body">
        <div className="mf__preview" aria-hidden="true">
          {!value ? (
            <span className="mf__empty">{accept === "image" ? "No image" : "No media"}</span>
          ) : isVideoFile(value) ? (
            <video src={value} muted playsInline preload="metadata" controls />
          ) : isImage(value) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" />
          ) : (
            <span className="mf__link">🔗 {embed?.includes("youtube") ? "YouTube" : embed?.includes("vimeo") ? "Vimeo" : embed?.includes("instagram") ? "Instagram" : "Link"}</span>
          )}
        </div>
        <div className="mf__controls">
          <input
            id={`mf-${name}`}
            name={name}
            className="adm-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={accept === "image" ? "Paste an image URL, or upload →" : "Paste a YouTube / Vimeo / Instagram link or file URL, or upload →"}
          />
          <div className="mf__buttons">
            <label className={`adm-btn adm-btn--ghost${up ? " is-busy" : ""}`}>
              {!up ? "⬆ Upload file" : up.finishing ? "Finishing…" : `Uploading ${pct}%`}
              <input
                ref={fileRef}
                type="file"
                accept={mime}
                hidden
                disabled={!!up}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            {value && !up && (
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setValue("")}>
                Clear
              </button>
            )}
          </div>
          {up && (
            <>
              <div className="mf__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${pct}%` }} />
              </div>
              <p className="mf__stats" aria-live="polite">
                {up.finishing ? (
                  <>All {mb(up.total)} MB received · saving the file…</>
                ) : (
                  <>
                    <b>
                      {mb(up.sent)} of {mb(up.total)} MB
                    </b>{" "}
                    uploaded{up.speed && ` · ${up.speed}`}
                  </>
                )}
              </p>
            </>
          )}
          {error && <p className="mf__error">{error}</p>}
          {hint && <p className="adm-hint">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
