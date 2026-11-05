"use client";

import { put } from "@vercel/blob/client";
import { useState } from "react";
import { addPhotoToPiece, ingestUpload } from "@/lib/desk-actions";

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 12;

async function uploadOne(file: File, signal: AbortSignal, onProgress: (pct: number) => void) {
  const tokenResponse = await fetch("/api/desk/upload-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, type: file.type }),
    signal,
  });
  if (!tokenResponse.ok) throw new Error("Please sign in again.");
  const tokenBody = (await tokenResponse.json()) as { token: string; pathname: string };
  return put(tokenBody.pathname, file, {
    access: "public",
    token: tokenBody.token,
    contentType: file.type || "image/jpeg",
    abortSignal: signal,
    onUploadProgress: (update) => onProgress(update.percentage),
  });
}

export function PhotoUpload({ productId }: { productId?: string }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [grouped, setGrouped] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setError("");
    if (files.length > MAX_FILES) {
      setError(`Pick ${MAX_FILES} photos or fewer at a time.`);
      return;
    }
    const big = files.find((file) => file.size > MAX_BYTES);
    if (big) {
      setError(`${big.name} is larger than 15 MB.`);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000 * files.length);
    const ids: string[] = [];
    try {
      // Sequential — one photo at a time keeps retries and progress honest.
      for (const [index, file] of files.entries()) {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            setStatus(`Uploading ${index + 1} of ${files.length}${attempt > 1 ? ` — try ${attempt}` : ""}…`);
            const blob = await uploadOne(file, controller.signal, (pct) =>
              setStatus(`Uploading ${index + 1} of ${files.length}… ${Math.round(pct)}%`),
            );
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
            if (attempt === 3) throw caught instanceof Error ? caught : new Error(`${file.name} did not upload.`);
            setStatus(`Try ${attempt + 1} of 3 for ${file.name}…`);
          }
        }
      }
      if (productId) {
        window.location.reload();
        return;
      }
      setStatus("Done.");
      if (ids.length === 1) {
        window.location.assign(new URL(`pieces/${ids[0]}`, window.location.href).toString());
      } else {
        window.location.assign(new URL("pieces?status=draft", window.location.href).toString());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The photo did not upload.");
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <div className="grid max-w-xl gap-2">
      <label className="grid gap-2">
        Choose photos
        <input
          className="field"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          onChange={(event) => void onChange(event)}
        />
      </label>
      {!productId ? (
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />
          Put all of these photos on one piece
        </label>
      ) : null}
      {!productId ? <p className="desk-note">{grouped ? "One piece, several photos." : "One piece per photo."}</p> : null}
      {status ? <p role="status">{status}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
