// Local-only image-to-image enhancement for desk review.
// OpenRouter image API. Sequential, resumable, ≤2 retries on unbilled failures only.
// HARD COST RULE: at most ONE generation per photo, ever — see generate().
// Usage: pnpm exec tsx scripts/enhance-images.mjs [--build] [--limit N] [--pieces id,id] [--sample dir]
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { enhanceKind, enhancePhoto } from "../lib/enhance.ts";

function loadEnv(file) {
  try {
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 1) continue;
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[line.slice(0, i).trim()]) process.env[line.slice(0, i).trim()] = v;
    }
  } catch { /* missing file is fine */ }
}
loadEnv(".env.local");

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const MANIFEST = path.resolve("seed/enhance/manifest.json");

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
};
const LIMIT = Number(arg("limit")) || 0;
const PIECES = (arg("pieces") ?? "").split(",").filter(Boolean);
const SAMPLE_DIR = arg("sample"); // save before/after pairs for review
const BUILD = process.argv.includes("--build");

const sql = neon(process.env.DATABASE_URL);

const kindOf = enhanceKind;

async function buildManifest() {
  const rows = await sql`
    select p.id as "pieceId", i.id as "photoId", i.url as "srcUrl", c.name as "categoryName", p.attributes
    from products p
    join product_images i on i.product_id = p.id
    left join categories c on c.id = p.category_id
    where p.deleted_at is null and p.status in ('draft','published')
      and i.alt <> 'enhanced-version'
    order by p.updated_at desc, i.sort_order asc`;
  const seen = new Set();
  const entries = [];
  for (const row of rows) {
    if (seen.has(row.pieceId)) continue; // one photo per piece: its first image
    seen.add(row.pieceId);
    entries.push({
      pieceId: row.pieceId,
      photoId: row.photoId,
      srcUrl: row.srcUrl,
      kind: kindOf(row.categoryName, row.attributes),
      status: "pending",
    });
  }
  return entries;
}

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch {
    return [];
  }
}

// Atomic write — a crash can never leave a half-written manifest behind.
function writeManifest(entries) {
  mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const tmp = `${MANIFEST}.tmp`;
  writeFileSync(tmp, JSON.stringify(entries, null, 2));
  renameSync(tmp, MANIFEST);
}

/** One generation per photo, ever — the shared lib enforces retry/fallback rules. */
async function generate(srcBytes, kind, srcUrl) {
  const srcMeta = await sharp(srcBytes).metadata();
  return enhancePhoto({
    apiKey: process.env.OPENROUTER_API_KEY,
    imageUrl: srcUrl,
    kind,
    width: srcMeta.width,
    height: srcMeta.height,
  });
}

// QA gate: same-aspect + mean-colour similarity. Anything wild gets status "rejected".
async function qaCheck(srcBytes, outBytes) {
  const [a, b] = await Promise.all([
    sharp(srcBytes).resize(64, 64, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(outBytes).resize(64, 64, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const [sa, sb] = await Promise.all([sharp(srcBytes).metadata(), sharp(outBytes).metadata()]);
  const aspectDrift = Math.abs((sa.width / sa.height) / (sb.width / sb.height) - 1);
  let sum = 0;
  const n = Math.min(a.data.length, b.data.length);
  for (let i = 0; i < n; i++) sum += Math.abs(a.data[i] - b.data[i]);
  const meanDiff = sum / n;
  return { aspectDrift: Number(aspectDrift.toFixed(3)), meanDiff: Number(meanDiff.toFixed(1)), pass: aspectDrift < 0.25 && meanDiff < 60 };
}

async function optimize(bytes) {
  const webp = await sharp(bytes).rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: false }).webp({ quality: 80 }).toBuffer();
  const info = await sharp(webp).metadata();
  const blur = await sharp(webp).resize(16, 16, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  return { webp, width: info.width ?? null, height: info.height ?? null, blurData: `data:image/webp;base64,${blur.toString("base64")}` };
}

async function run() {
  let entries = readManifest();
  if (BUILD || entries.length === 0) {
    entries = await buildManifest();
    writeManifest(entries);
    console.log(`manifest: ${entries.length} photos`);
    if (!LIMIT && !PIECES.length && !SAMPLE_DIR) return; // build-only pass
  }
  // done/review/output already present = a generation happened = never re-run.
  let work = entries.filter((e) => e.status === "pending" || (e.status === "failed" && !e.enhancedUrl));
  if (PIECES.length) work = work.filter((e) => PIECES.includes(e.pieceId));
  if (LIMIT) work = work.slice(0, LIMIT);
  if (!work.length) return console.log("nothing to do.");

  const outDir = SAMPLE_DIR ? path.resolve(SAMPLE_DIR) : path.resolve("seed/enhance/out");
  mkdirSync(outDir, { recursive: true });

  let done = 0;
  for (const entry of work) {
    console.log(`[${entry.kind}] ${entry.pieceId}/${entry.photoId}`);
    try {
      const srcRes = await fetch(entry.srcUrl);
      if (!srcRes.ok) throw new Error(`source fetch ${srcRes.status}`);
      const srcBytes = Buffer.from(await srcRes.arrayBuffer());
      const gen = await generate(srcBytes, entry.kind, entry.srcUrl);
      const outBytes = gen.bytes;
      entry.model = gen.model;
      entry.usage = gen.usage;
      const qa = await qaCheck(srcBytes, outBytes);
      console.log(`  qa: aspectDrift=${qa.aspectDrift} meanDiff=${qa.meanDiff} ${qa.pass ? "ok" : "REVIEW"}`);
      const stored = await optimize(outBytes);
      const blob = await put(`pieces/enhanced-${entry.photoId}.webp`, stored.webp, { access: "public", contentType: "image/webp" });

      // New photo version; original row untouched, pairing recorded on the product.
      const [imageRow] = await sql`select coalesce(max(sort_order), 0) + 1 as n from product_images where product_id = ${entry.pieceId}`;
      const [ins] = await sql`
        insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
        values (${entry.pieceId}, ${blob.url}, ${stored.width}, ${stored.height}, ${stored.blurData}, 'enhanced-version', ${imageRow.n})
        returning id`;
      await sql`
        update products set attributes = jsonb_set(attributes, '{enhancedVersions}',
          coalesce(attributes->'enhancedVersions','{}') || jsonb_build_object(${entry.photoId}::text, ${ins.id}::text))
        where id = ${entry.pieceId}`;

      if (SAMPLE_DIR) {
        writeFileSync(path.join(outDir, `${entry.pieceId}-src.png`), await sharp(srcBytes).png().toBuffer());
        writeFileSync(path.join(outDir, `${entry.pieceId}-enhanced.png`), outBytes);
      } else {
        writeFileSync(path.join(outDir, `${entry.photoId}.png`), outBytes);
      }

      entry.status = qa.pass ? "done" : "review";
      entry.enhancedUrl = blob.url;
      entry.enhancedImageId = ins.id;
      entry.qa = qa;
      done += 1;
    } catch (error) {
      entry.status = "failed";
      entry.error = String(error?.message ?? error).slice(0, 200);
      console.log(`  FAILED: ${entry.error}`);
    }
    writeManifest(entries);
    await SLEEP(1500);
  }
  console.log(`done: ${done}/${work.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
