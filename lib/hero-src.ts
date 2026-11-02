import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import sharp from "sharp";

const TARGET_WIDTH = 1200;

export type HeroSrc = {
  src: string;
  width: number;
  height: number;
};

function fallback(url: string): HeroSrc {
  return { src: url, width: 1500, height: 2000 };
}

export async function heroSrc(url: string): Promise<HeroSrc> {
  "use cache";
  cacheLife("days");
  if (!url) return { src: "", width: TARGET_WIDTH, height: 1600 };

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return fallback(url);
  }
  if (!host.endsWith(".public.blob.vercel-storage.com")) return fallback(url);

  const id = createHash("sha256").update(url).digest("hex").slice(0, 12);
  const filename = `${id}-w1200.webp`;
  const dir = path.join(process.cwd(), "public", "lcp");
  const filePath = path.join(dir, filename);
  const src = `/lcp/${filename}`;

  try {
    const existing = await readFile(filePath);
    const meta = await sharp(existing).metadata();
    if (meta.width === TARGET_WIDTH && meta.format === "webp") {
      return { src, width: meta.width, height: meta.height ?? 1600 };
    }
  } catch {
    // The resized file is written once, below.
  }

  const response = await fetch(url);
  if (!response.ok) return fallback(url);
  const input = Buffer.from(await response.arrayBuffer());
  const webp = await sharp(input)
    .rotate()
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer();
  const meta = await sharp(webp).metadata();
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, webp);
  return { src, width: meta.width ?? TARGET_WIDTH, height: meta.height ?? 1600 };
}
