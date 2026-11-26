"use client";

/**
 * Media input for the admin: paste a link (YouTube / Vimeo / Instagram / any file URL)
 * or upload a file. Shows a live preview and an upload progress bar.
 *  - storage "blob":  uploads straight from the browser to Vercel Blob (no size limit issues)
 *  - storage "local": uploads to /api/admin/upload → saved in data/uploads/
 * The final URL is submitted with the form in a field called `name`.
 */
import { useRef, useState } from "react";
import { isVideoFile, toEmbedUrl } from "@/lib/utils";

const isImage = (u: string) => /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u);

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
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const mime = accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*";

  async function upload(file: File) {
    setError("");
    setProgress(0);

    // Stall guard: if nothing moves for 90 s (including waiting at ~100%), stop with a clear message
    const controller = new AbortController();
    let lastMove = Date.now();
    let stalled = false;
    const moved = (pct: number) => {
      lastMove = Date.now();
      setProgress(pct);
    };
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastMove > 90_000) {
        stalled = true;
        controller.abort();
      }
    }, 5_000);

    try {
      if (storage === "blob") {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`portfolio/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          multipart: file.size > 50 * 1024 * 1024,
          abortSignal: controller.signal,
          onUploadProgress: (e) => moved(Math.round(e.percentage)),
        });
        setValue(blob.url);
      } else {
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const body = new FormData();
          body.append("file", file);
          controller.signal.addEventListener("abort", () => xhr.abort());
          xhr.onabort = () => reject(new Error("aborted"));
          xhr.open("POST", "/api/admin/upload");
          xhr.upload.onprogress = (e) => e.lengthComputable && moved(Math.round((e.loaded / e.total) * 100));
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
        setValue(url);
      }
    } catch (e) {
      setError(
        stalled
          ? "Upload stopped: no response for 90 seconds. Check your internet and try again (or use a smaller file / a YouTube link)."
          : (e as Error).message || "Upload failed."
      );
    } finally {
      window.clearInterval(watchdog);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
            <label className={`adm-btn adm-btn--ghost${progress !== null ? " is-busy" : ""}`}>
              {progress !== null ? `Uploading ${progress}%` : "⬆ Upload file"}
              <input
                ref={fileRef}
                type="file"
                accept={mime}
                hidden
                disabled={progress !== null}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            {value && (
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setValue("")}>
                Clear
              </button>
            )}
          </div>
          {progress !== null && (
            <div className="mf__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && <p className="mf__error">{error}</p>}
          {hint && <p className="adm-hint">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
