"use client";

import { put } from "@vercel/blob/client";
import { useState } from "react";
import { addPhotoToPiece, ingestUpload } from "@/lib/desk-actions/pieces";
import { UPLOAD_ATTEMPTS, UPLOAD_MAX_FILES, planUpload } from "@/lib/upload-plan";

async function uploadOne(file: File, signal: AbortSignal) {
  const tokenResponse = await fetch("/api/desk/upload-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, type: file.type }),
    signal,
  });
  if (!tokenResponse.ok) throw new Error("Please sign in again.");
  const tokenBody = (await tokenResponse.json()) as { token: string; pathname: string; type: string };
  // No onUploadProgress: it switches the client to streaming fetch (duplex),
  // which only works over HTTP/2 and silently stalls on plain HTTP/1 dev.
  return put(tokenBody.pathname, file, {
    access: "public",
    token: tokenBody.token,
    contentType: tokenBody.type || file.type || "image/jpeg",
    abortSignal: signal,
  });
}

export function PhotoUpload({ productId, prefix = "" }: { productId?: string; prefix?: string }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [grouped, setGrouped] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setError("");
    if (files.length > UPLOAD_MAX_FILES) {
      setError(`Pick ${UPLOAD_MAX_FILES} photos or fewer at a time.`);
      return;
    }
    const rejected = files.map((file) => planUpload(file)).find((plan) => plan.mode === "rejected");
    if (rejected?.mode === "rejected") {
      setError(rejected.message);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000 * files.length);
    const ids: string[] = [];
    try {
      // Sequential — one photo at a time keeps retries and progress honest.
      for (const [index, file] of files.entries()) {
        for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt += 1) {
          try {
            setStatus(`Uploading ${index + 1} of ${files.length}${attempt > 1 ? ` — try ${attempt}` : ""}…`);
            const blob = await uploadOne(file, controller.signal);
            if (productId) {
              const saved = await addPhotoToPiece(productId, blob.url);
              if (!saved.ok) throw new Error(saved.message);
            } else if (grouped && ids.length > 0) {
              const saved = await addPhotoToPiece(ids[0], blob.url);
              if (!saved.ok) throw new Error(saved.message);
            } else {
              const saved = await ingestUpload(blob.url, file.name);
              if (!saved.ok || !("id" in saved) || !saved.id) throw new Error(saved.message);
              ids.push(saved.id);
            }
            break;
          } catch (caught) {
            if (attempt === UPLOAD_ATTEMPTS) {
              throw caught instanceof Error ? caught : new Error(`${file.name} did not upload.`);
            }
            setStatus(`Try ${attempt + 1} of ${UPLOAD_ATTEMPTS} for ${file.name}…`);
          }
        }
      }
      if (productId) {
        window.location.reload();
        return;
      }
      setStatus("Done.");
      if (ids.length === 1) {
        window.location.assign(new URL(`${prefix}/add?piece=${ids[0]}`, window.location.origin).toString());
      } else {
        window.location.assign(new URL(`${prefix}/pieces?status=draft`, window.location.origin).toString());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The photo did not upload.");
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <div className="grid max-w-xl gap-3">
      <label className="upload-card">
        <input
          className="upload-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          onChange={(event) => void onChange(event)}
        />
        <span>Choose photo from this device</span>
      </label>
      {!productId ? (
        <details className="desk-note">
          <summary className="inline-flex min-h-11 cursor-pointer items-center">Adding several photos at once?</summary>
          <label className="flex min-h-11 items-center gap-2 text-sm text-tar-soft">
            <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />
            Put all of these photos on one piece
          </label>
          <p>{grouped ? "One piece, several photos." : "One piece per photo."}</p>
        </details>
      ) : null}
      {status ? <p role="status">{status}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
