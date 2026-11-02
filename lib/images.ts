import "server-only";

import { del, put } from "@vercel/blob";
import sharp from "sharp";

const MAX_BYTES = 15 * 1024 * 1024;

export function sniffImage(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (["heic", "heix", "hevc", "mif1", "msf1"].includes(brand)) return "image/heic";
  }
  return null;
}

export function assertBlobUrl(url: string) {
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new Error("That photo is not from this shop.");
  }
  return parsed;
}

export async function optimizeImage(buffer: Buffer) {
  if (buffer.length > MAX_BYTES) throw new Error("That photo is larger than 15 MB.");
  if (!sniffImage(buffer)) throw new Error("Use a JPEG, PNG, WebP, or HEIC photo.");
  const rotated = await sharp(buffer, { failOn: "none" }).rotate().toBuffer();
  const webp = await sharp(rotated)
    .resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  const info = await sharp(webp).metadata();
  const blur = await sharp(webp).resize(16, 16, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  return {
    webp,
    width: info.width ?? null,
    height: info.height ?? null,
    blurData: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

export async function storeImage(bytes: Buffer, name: string) {
  const image = await optimizeImage(bytes);
  const blob = await put(name, image.webp, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: true,
  });
  return { ...image, url: blob.url };
}

export async function replaceStoredImage(url: string, bytes: Buffer) {
  const stored = await storeImage(bytes, "pieces/edited.webp");
  await del(url).catch(() => undefined);
  return stored;
}
