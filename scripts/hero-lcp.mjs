import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";

function loadEnv(file) {
  try {
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const split = line.indexOf("=");
      if (split < 1) continue;
      const key = line.slice(0, split).trim();
      let value = line.slice(split + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    return;
  }
}

loadEnv(".env.local");

const manifestPath = path.resolve("lib/lcp-manifest.json");
const outDir = path.resolve("public/lcp");

function emptyManifest() {
  return { source: "", src: "", width: 0, height: 0, srcSet: "", sizes: "" };
}

async function writeManifest(manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("hero-lcp: DATABASE_URL missing, keeping the current manifest.");
  process.exit(0);
}

const sql = neon(databaseUrl);
const [settings] = await sql`select value->>'heroImage' as hero from site_settings where key = 'shop'`;
let hero = settings?.hero ?? "";
if (!hero) {
  const [picture] = await sql`
    select pi.url as url
    from products p
    join product_images pi on pi.product_id = p.id
    where p.deleted_at is null and p.show_in_studio = true and p.status <> 'hidden'
    order by p.created_at desc, pi.sort_order asc
    limit 1
  `;
  hero = picture?.url ?? "";
}

if (!hero) {
  await mkdir(outDir, { recursive: true });
  await writeManifest(emptyManifest());
  console.log("hero-lcp: no hero photograph.");
  process.exit(0);
}

let parsed;
try {
  parsed = new URL(hero);
} catch {
  console.log("hero-lcp: hero URL is not usable, keeping the current manifest.");
  process.exit(0);
}
if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
  console.log("hero-lcp: hero is not a shop blob, keeping the current manifest.");
  process.exit(0);
}

const response = await fetch(hero);
if (!response.ok) {
  console.log(`hero-lcp: download failed (${response.status}), keeping the current manifest.`);
  process.exit(0);
}

const input = Buffer.from(await response.arrayBuffer());
const webp = await sharp(input).rotate().resize({ width: 750, withoutEnlargement: true }).webp({ quality: 64 }).toBuffer();
const info = await sharp(webp).metadata();
const hash = createHash("sha256").update(hero).digest("hex").slice(0, 12);
const filename = `${hash}.webp`;
await mkdir(outDir, { recursive: true });
for (const entry of await readdir(outDir)) {
  if (entry !== filename) await rm(path.join(outDir, entry));
}
await writeFile(path.join(outDir, filename), webp);
const width = info.width ?? 750;
await writeManifest({
  source: hero,
  src: `/lcp/${filename}`,
  width,
  height: info.height ?? 1000,
  srcSet: `/lcp/${filename} ${width}w, ${hero} 1500w`,
  sizes: "(max-width: 768px) 100vw, 60vw",
});
console.log(`hero-lcp: wrote ${filename} ${info.width}x${info.height} ${webp.length} bytes`);
