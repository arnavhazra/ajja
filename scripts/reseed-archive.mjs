import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken) {
  console.error("BLOB_READ_WRITE_TOKEN is missing.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const assetDir = "/Users/arnavhazra/Downloads/ajja-art-site-assets";

const archiveFolio = [
  {
    file: "c6cfe7df-522c-4c0c-8594-1948c02ee763.JPG",
    category: "paintings",
    medium: "Poured pigment on stretched canvas",
    description: "Vertical stretched canvas with full floral blossom plume in warm sunlit ochre, lavender lilac, and sap green.",
    alt: "Vertical stretched canvas poured painting with luminous flower-like plume in yellow, magenta, and green.",
    focalX: 0.5,
    focalY: 0.45,
    isHero: true,
  },
  {
    file: "46d960cd-ee77-4e83-88c6-385de04cd049.JPG",
    category: "paintings",
    medium: "Poured pigment on stretched canvas",
    description: "Horizontal stretched canvas with botanical feathering in cerulean blue, saffron yellow, and crimson.",
    alt: "Horizontal canvas poured painting with feather plume patterns in blue, yellow, and red.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "ba03cebb-c0e1-44d4-965e-e59fa3c920ff.JPG",
    category: "paintings",
    medium: "Poured pigment on stretched canvas",
    description: "Horizontal canvas with botanical plume spread in marigold yellow, coral pink, and moss green.",
    alt: "Horizontal canvas poured painting featuring organic plume feathering in warm tones.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "62f00bc9-cf07-4064-a0fd-af7eec29b4cf.JPG",
    category: "paintings",
    medium: "Poured pigment on stretched canvas",
    description: "Vertical canvas with cascading feather plume currents in turquoise, royal cobalt, scarlet, and sunburst yellow.",
    alt: "Vertical canvas poured painting with vibrant plume streams in turquoise, red, and yellow.",
    focalX: 0.5,
    focalY: 0.45,
  },
  {
    file: "0501dab1-5da6-49a7-961d-58ca54236ff3.JPG",
    category: "paintings",
    medium: "Poured pigment on wood panel",
    description: "Fluid pigment pour on square wood panel with earthy ochre, cobalt blue, and vermilion veins.",
    alt: "Square wood panel with poured fluid painting in ochre, blue, and red.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "4ad89611-b2b8-4e12-a0b2-5849a6b627cf.JPG",
    category: "paintings",
    medium: "Poured pigment on panel",
    description: "Square panel poured painting with nocturnal ultramarine blues, ember orange, and warm golden flows.",
    alt: "Square poured painting with fluid currents of deep blue, orange, and yellow.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_0183.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical pour with an amber-red flame current running between forest green and lapis blue banks.",
    alt: "Tall vertical poured painting panel with central orange flame and green margins.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_0330.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel featuring moss green river currents, white foam veining, and terracotta highlights.",
    alt: "Tall vertical poured painting panel in verdant greens and warm terracotta.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_0469.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel featuring warm ember red, golden yellow, and bone white marbled currents.",
    alt: "Tall vertical poured painting panel in glowing flame colors and white marble swirls.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_2073.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with deep emerald green ground and ruby red, alabaster, and sapphire swirls.",
    alt: "Tall vertical poured painting panel in rich emerald green, crimson, and white.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_2085.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with marigold orange and lavender background bearing black mineral blossom patterns.",
    alt: "Tall vertical poured painting panel with orange, purple, and black blooming shapes.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_2105.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with fiery crimson and cadmium yellow core flanked by deep indigo and green.",
    alt: "Tall vertical poured painting panel in saturated autumn shades of red, yellow, and blue.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_4231.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with swirling sky blue, coral red, and soft cream wave formations.",
    alt: "Tall vertical poured painting panel in sky blue and coral marble swirls.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_6076.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with willow green and canary yellow feather plumes over clean white ground.",
    alt: "Tall vertical poured painting panel with feather-like green and yellow plumes.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_6343.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with rose madder and goldenrod plume surrounded by rich plum tendrils.",
    alt: "Tall vertical poured painting panel with rose red and gold central plume.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_8453.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with luminous sunfire currents in golden amber, vermilion, and rose tones.",
    alt: "Tall vertical poured painting panel with golden flame swirls.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_9048.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with deep cardinal red river centered between pine green and saffron margins.",
    alt: "Tall vertical poured painting panel with red, green, and orange flows.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_9072.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with intricate peacock plume feathering in ochre, turquoise, and violet.",
    alt: "Tall vertical poured painting panel with multicolor plume pattern.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_9551.JPG",
    category: "paintings",
    medium: "Poured pigment on horizontal wooden panel",
    description: "Horizontal panel pour with twilight violet, cloud white crests, and amber highlights.",
    alt: "Horizontal poured painting panel with purple and white cloud-like swirls.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "IMG_9920.JPG",
    category: "paintings",
    medium: "Poured pigment on tall wooden panel",
    description: "Tall vertical panel with spruce green needle feathering along an orange and copper spine.",
    alt: "Tall vertical poured painting panel with organic green and orange branching pattern.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "10043ebe-60d2-46b5-9a03-294541cde84d.JPG",
    category: "woodwork",
    medium: "Solid pine and backboard with brass hooks",
    description: "Wall-mounted entryway key and mail rack constructed with horizontal natural pine slats and three brass hanging hooks.",
    alt: "Handmade wooden wall organizer with pine slats and three brass hooks.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "25a2e499-8c6f-4222-9c33-ad1ccb17742e.JPG",
    category: "woodwork",
    medium: "Hand-joined pine with textured tops",
    description: "Pair of matching handcrafted side tables featuring open slatted lower shelves and textured warm stone tops.",
    alt: "Pair of handcrafted wooden end tables with slatted lower shelves.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "330005b4-81c5-45d5-8c7f-0aeff93aaee4.JPG",
    category: "woodwork",
    medium: "Solid pine",
    description: "Three-tier open pine plant stand and display tower with exposed joinery and four corner uprights.",
    alt: "Three-tier handcrafted pine plant stand in workshop.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "3acd3fe2-9091-49f3-80b5-403dea546611.JPG",
    category: "woodwork",
    medium: "Terracotta-finished pine",
    description: "Slatted entrance deck grating finished in warm terracotta exterior coat with framed borders.",
    alt: "Terracotta-finished slatted wooden door mat grating.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "430453ff-9912-48c9-b45a-11f7c7c584d9.JPG",
    category: "woodwork",
    medium: "Handcrafted pine bench mount",
    description: "Custom studio rotary spindle sander workbench mount crafted from solid pine blocks with height index markings.",
    alt: "Custom pine bench mount for workshop rotary tool.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "686c2c26-91ab-485e-a950-a3be5d0dcfca.JPG",
    category: "woodwork",
    medium: "Solid pine",
    description: "Handcrafted pine sofa companion C-table with solid square column post and weighted base.",
    alt: "Handcrafted pine C-table standing beside sofa.",
    focalX: 0.5,
    focalY: 0.4,
  },
  {
    file: "6f04f6fb-e140-47b4-8604-9a1da4e3de03.JPG",
    category: "woodwork",
    medium: "Natural pine",
    description: "Natural pine slatted door mat and mudroom floor grating with framed border rails.",
    alt: "Natural pine slatted door mat on entryway floor.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "75ec9713-d78a-4d7f-9012-c12991b93cce.JPG",
    category: "woodwork",
    medium: "Hand-joined pine",
    description: "Handcrafted stepped pine display crate riser with dual platform elevations.",
    alt: "Stepped wooden display riser on studio floor.",
    focalX: 0.6,
    focalY: 0.5,
  },
  {
    file: "a08d3639-d755-418c-a405-0f7bb72d4ae6.JPG",
    category: "woodwork",
    medium: "Carved pine with brass hook",
    description: "Sculptural curved wooden banana hanger and accessory pendant stand on solid pine base.",
    alt: "Sculptural curved pine hook stand on table.",
    focalX: 0.5,
    focalY: 0.45,
  },
  {
    file: "afbd1067-636d-4c26-9a20-cc817ad76e49.JPG",
    category: "woodwork",
    medium: "Pine with ceramic top and terracotta drawer interior",
    description: "Handcrafted bedside nightstand with fluted pine knob and open pull-out drawer showing terracotta interior.",
    alt: "Top angle of handcrafted nightstand with open drawer.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "b2a6499c-e3d5-484f-a7f2-d01e67083a8e.JPG",
    category: "woodwork",
    medium: "Solid pine with dark top and corner inlays",
    description: "Square side table with solid pine legs, lower slatted shelf, dark top, and natural corner inlays.",
    alt: "Handcrafted square pine side table viewed from above.",
    focalX: 0.5,
    focalY: 0.45,
  },
  {
    file: "b35c4ca6-c80f-4607-b5b0-51dda8b879f1.JPG",
    category: "woodwork",
    medium: "Solid pine",
    description: "Four-column slatted wooden wine bottle storage console with smooth solid top.",
    alt: "Handcrafted wooden wine bottle console table.",
    focalX: 0.5,
    focalY: 0.45,
  },
  {
    file: "b612ad5a-6bfc-404a-b48c-a8668d862486.JPG",
    category: "woodwork",
    medium: "Solid pine framing",
    description: "Freestanding multi-tier wine cellar rack frame constructed from clear pine slats.",
    alt: "Freestanding wooden wine storage frame in workshop.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "c0480655-6c15-4245-9360-4ab0f28b03be.JPG",
    category: "woodwork",
    medium: "Exterior coated pine",
    description: "Terracotta painted deck lounge armchair with wide armrests and raked slatted seat and back.",
    alt: "Terracotta wooden lounge armchair on outdoor deck.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "cb03a4a9-5423-4463-8329-e8cf2e2d57d0.JPG",
    category: "woodwork",
    medium: "Solid unfinished pine",
    description: "Handcrafted pine slatted lounge armchair with wide armrests and supportive back angle.",
    alt: "Handcrafted pine lounge armchair in studio.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "d7eb85d7-bda1-4fd2-9164-a3173144e45b.JPG",
    category: "woodwork",
    medium: "Solid pine",
    description: "Top elevation of handcrafted stepped pine display unit showing natural grain alignment.",
    alt: "Top view of stepped pine unit in studio.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "df543c66-b7d9-4a47-9e9d-ba66ee25cc3c.JPG",
    category: "woodwork",
    medium: "Natural pine slats with brass hooks",
    description: "Wall-mounted entryway organizer rack with six horizontal pine slats and three brass key hooks.",
    alt: "Wall-mounted wooden organizer rack with pine slats and brass hooks.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "f1fd1197-a052-4bfc-9bd8-122bc1e3cc85.JPG",
    category: "woodwork",
    medium: "Terracotta finished wood with white dowels",
    description: "Handcrafted slatted drying tray and soap deck with terracotta rails and white cylindrical rungs.",
    alt: "Handcrafted wooden slatted tray with white dowels.",
    focalX: 0.5,
    focalY: 0.5,
  },
  {
    file: "fad4a001-f0bc-45a4-b1b8-942762244266.JPG",
    category: "woodwork",
    medium: "Hand-joined pine",
    description: "Handcrafted bedside nightstand with fluted legs, lower slatted shelf, and fluted pine drawer pull.",
    alt: "Handcrafted pine nightstand with drawer and lower shelf.",
    focalX: 0.5,
    focalY: 0.45,
  },
];

async function main() {
  console.log("Loading categories...");
  const catRows = await sql`select id, slug from categories`;
  const catMap = new Map(catRows.map((c) => [c.slug, c.id]));

  let heroBlobUrl = "";
  let updatedCount = 0;

  for (const item of archiveFolio) {
    const filePath = path.join(assetDir, item.file);
    const bytes = await readFile(filePath);
    const hash = createHash("sha256").update(bytes).digest("hex");

    console.log(`Processing high-res WebP for ${item.file}...`);
    const rotated = await sharp(bytes, { failOn: "none" }).rotate().toBuffer();
    const webp = await sharp(rotated)
      .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 })
      .toBuffer();
    const meta = await sharp(webp).metadata();
    const blur = await sharp(webp).resize(16, 16, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
    const blurData = `data:image/webp;base64,${blur.toString("base64")}`;

    console.log(`Uploading to Blob: archive/${hash.slice(0, 16)}.webp...`);
    const blob = await put(`archive/${hash.slice(0, 16)}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
      token: blobToken,
    });

    if (item.isHero) {
      heroBlobUrl = blob.url;
    }

    const catId = catMap.get(item.category) || null;
    const existing = await sql`select id, slug from products where source_hash = ${hash}`;

    let productId;
    if (existing.length) {
      productId = existing[0].id;
      await sql`update products
        set category_id = ${catId},
            status = 'published',
            title = '',
            description = ${item.description},
            price_minor = null,
            attributes = ${JSON.stringify({
              originalFile: item.file,
              medium: item.medium,
            })}::jsonb,
            show_in_studio = true,
            updated_at = now()
        where id = ${productId}`;

      // Update primary image
      await sql`update product_images
        set url = ${blob.url},
            width = ${meta.width ?? null},
            height = ${meta.height ?? null},
            blur_data = ${blurData},
            alt = ${item.alt},
            focal_x = ${item.focalX.toString()},
            focal_y = ${item.focalY.toString()}
        where product_id = ${productId} and sort_order = 0`;
    } else {
      productId = randomUUID();
      const slug = `piece-${hash.slice(0, 10)}`;
      await sql`insert into products (id, slug, title, description, currency, status, show_in_studio, source_hash, category_id, attributes)
        values (${productId}, ${slug}, '', ${item.description}, 'USD', 'published', true, ${hash}, ${catId}, ${JSON.stringify({
          originalFile: item.file,
          medium: item.medium,
        })}::jsonb)`;

      await sql`insert into product_images (product_id, url, width, height, blur_data, alt, focal_x, focal_y, sort_order)
        values (${productId}, ${blob.url}, ${meta.width ?? null}, ${meta.height ?? null}, ${blurData}, ${item.alt}, ${item.focalX.toString()}, ${item.focalY.toString()}, 0)`;
    }

    updatedCount += 1;
  }

  console.log(`Updated ${updatedCount} products to published.`);

  // Update site_settings
  if (heroBlobUrl) {
    console.log("Updating site_settings with hero image and true Collegeville copy...");
    const existing = await sql`select value from site_settings where key = 'shop'`;
    if (existing.length) {
      const current = existing[0].value || {};
      const updated = {
        ...current,
        heroImage: heroBlobUrl,
        heroFocalX: 0.5,
        heroFocalY: 0.45,
        heroHeadline: "Objects shaped by patience, poured pigment, and timber.",
        heroText:
          "Original poured paintings and fine handcrafted woodwork from our studio in Collegeville, Pennsylvania. Each piece is strictly one of a kind. Inquiries are welcomed directly.",
        story:
          "We make poured paintings and fine woodwork in our Collegeville, Pennsylvania workshop. Each work is one of a kind. When a piece speaks to you, inquire directly to confirm availability and discuss custody.",
      };
      await sql`update site_settings set value = ${JSON.stringify(updated)}::jsonb, updated_at = now() where key = 'shop'`;
    }
  }

  console.log("Archive ingestion complete!");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
