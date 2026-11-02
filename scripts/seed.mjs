import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const seedDir = process.env.SEED_DIR || (await exists(path.resolve("seed/photos")) ? path.resolve("seed/photos") : "/Users/arnavhazra/Downloads/ajja-art-site-assets");

async function exists(dir) {
  try {
    await readdir(dir);
    return true;
  } catch {
    return false;
  }
}

const defaults = {
  businessName: "Ajja",
  ownerName: "Ajja",
  town: "Collegeville",
  region: "Pennsylvania",
  country: "United States",
  currency: "USD",
  locale: "en",
  whatsapp: "",
  phone: "",
  email: "",
  address: "",
  mapUrl: "https://maps.google.com/?q=Collegeville%2C%20Pennsylvania",
  hours: [],
  announcement: "",
  announcementLive: false,
  heroHeadline: "Paintings, woodwork, and pieces made by hand.",
  heroText: "I work in Collegeville, Pennsylvania. If a piece speaks to you, send a message. I will tell you the price and whether it is still here.",
  heroImage: "",
  heroFocalX: 0.5,
  heroFocalY: 0.45,
  story: "I make poured paintings, woodwork, and other handwork. Each piece is one of a kind. I list a piece here only after I have written its name and price.",
  ownerPhoto: "",
  paymentNote: "Payment is arranged with me directly. This website does not take payment.",
  responseNote: "",
  whatsappChannel: "",
  instagram: "",
  facebook: "",
  enquiryRetentionDays: 365,
  copyNeedsApproval: true,
  lastBackupAt: "",
  policies: {
    buying: "You ask first. I confirm the price and whether the piece is still here. Nothing is paid through this website.",
    collection: "Pieces can be collected in Collegeville once we agree a time. Shipping only happens if we arrange it.",
    returns: "These are single pieces. A sale is final once you have the piece, unless we agree otherwise in writing.",
  },
  faqs: [
    { q: "How do I buy a piece?", a: "Send a message. I tell you the price and whether it is still here. You do not pay on this website." },
    { q: "Where is the studio?", a: "Collegeville, Pennsylvania. I will add the street address when I am ready to publish it." },
  ],
  theme: "walnut",
  fontPair: "fraunces",
  checklist: {},
};

const groups = [
  ["paintings", "Paintings", 0],
  ["woodwork", "Woodwork", 1],
  ["handwork", "Handwork", 2],
];

for (const [slug, name, sort] of groups) {
  await sql`insert into categories (slug, name, intro, sort_order) values (${slug}, ${name}, '', ${sort}) on conflict (slug) do nothing`;
}

const existingSettings = await sql`select value from site_settings where key = 'shop'`;
if (!existingSettings.length) {
  await sql`insert into site_settings (key, value) values ('shop', ${JSON.stringify(defaults)}::jsonb)`;
}

const files = (await readdir(seedDir)).filter((file) => /\.(jpe?g|png|webp|heic)$/i.test(file));
let created = 0;
let skipped = 0;
const failed = [];

for (const file of files) {
  const bytes = await readFile(path.join(seedDir, file));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const found = await sql`select id from products where source_hash = ${hash}`;
  if (found.length) {
    skipped += 1;
    continue;
  }
  try {
    const rotated = await sharp(bytes, { failOn: "none" }).rotate().toBuffer();
    const webp = await sharp(rotated).resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const meta = await sharp(webp).metadata();
    const blur = await sharp(webp).resize(16, 16, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
    const blob = await put(`seed/${hash}.webp`, webp, { access: "public", contentType: "image/webp", addRandomSuffix: true });
    const id = randomUUID();
    const slug = `piece-${hash.slice(0, 10)}`;
    await sql`insert into products (id, slug, title, description, currency, status, show_in_studio, source_hash, attributes)
      values (${id}, ${slug}, '', '', 'USD', 'draft', true, ${hash}, ${JSON.stringify({ originalFile: file })}::jsonb)`;
    await sql`insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
      values (${id}, ${blob.url}, ${meta.width ?? null}, ${meta.height ?? null}, ${`data:image/webp;base64,${blur.toString("base64")}`}, '', 0)`;
    created += 1;
    console.log(`Draft: ${file}`);
  } catch (error) {
    failed.push(`${file}: ${error instanceof Error ? error.message : "could not be saved"}`);
  }
}

const images = await sql`select url, width, height from product_images i join products p on p.id = i.product_id where p.deleted_at is null and p.show_in_studio = true`;
let hero = null;
for (const image of images) {
  const width = Number(image.width) || 0;
  const height = Number(image.height) || 0;
  const area = width * height;
  const portrait = height >= width;
  const score = area + (portrait ? 1_000_000_000_000 : 0);
  if (!hero || score > hero.score) hero = { score, url: image.url };
}

if (hero) {
  await sql`update site_settings
    set value = jsonb_set(value, '{heroImage}', to_jsonb(${hero.url}::text), true), updated_at = now()
    where key = 'shop' and coalesce(value->>'heroImage', '') = ''`;
}

const settings = await sql`select value from site_settings where key = 'shop'`;
const shop = settings[0]?.value ?? {};
console.log("");
console.log(`Created ${created} drafts. Skipped ${skipped} that were already there.`);
if (failed.length) console.log(failed.join("\n"));
console.log("Still empty, on purpose:");
console.log("- titles and prices on every photograph");
console.log("- phone:", shop.phone ? "saved" : "not typed in");
console.log("- email:", shop.email ? "saved" : "not typed in");
console.log("- street address:", shop.address ? "saved" : "not typed in");
console.log("- hours:", Array.isArray(shop.hours) && shop.hours.length ? "saved" : "not typed in");
console.log("- owner photo:", shop.ownerPhoto ? "saved" : "not typed in");
console.log(hero ? "Hero photograph chosen from the largest portrait in the folder. Replace it in the desk." : "No photograph was available for the hero.");
