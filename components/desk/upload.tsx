"use client";

import { put } from "@vercel/blob/client";
import { useState } from "react";
import { addPhotoToPiece, ingestUpload } from "@/lib/desk-actions";

export function PhotoUpload({ productId }: { productId?: string }) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [trying, setTrying] = useState(0);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("That photo is larger than 15 MB.");
      return;
    }
    let last = "The photo did not upload.";
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      setTrying(attempt);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180_000);
      try {
        const tokenResponse = await fetch("/api/desk/upload-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, type: file.type }),
          signal: controller.signal,
        });
        if (!tokenResponse.ok) throw new Error("Please sign in again.");
        const tokenBody = (await tokenResponse.json()) as { token: string; pathname: string };
        const blob = await put(tokenBody.pathname, file, {
          access: "public",
          token: tokenBody.token,
          contentType: file.type || "image/jpeg",
          abortSignal: controller.signal,
          onUploadProgress: (update) => setProgress(update.percentage),
        });
        if (productId) {
          const saved = await addPhotoToPiece(productId, blob.url);
          if (!saved.ok) throw new Error(saved.message);
          window.location.reload();
          return;
        }
        const saved = await ingestUpload(blob.url, file.name);
        if (!saved.ok || !("id" in saved) || !saved.id) throw new Error(saved.message);
        window.location.assign(new URL(`pieces/${saved.id}`, window.location.href).toString());
        return;
      } catch (caught) {
        last = caught instanceof Error ? caught.message : last;
        setError(last);
      } finally {
        clearTimeout(timer);
      }
    }
    setError(last);
  }

  return (
    <label className="grid max-w-xl gap-2">
      Choose a photo
      <input className="field" type="file" accept="image/jpeg,image/png,image/webp,image/heic,.heic" onChange={(event) => void onChange(event)} />
      {trying ? (
        <p role="status">
          {progress ? `Uploading… ${Math.round(progress)}%` : "Uploading…"}
          {trying > 1 ? ` Try ${trying} of 3.` : ""}
        </p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </label>
  );
}
