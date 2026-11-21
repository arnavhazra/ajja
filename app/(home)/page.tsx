import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { StudioIntro } from "@/components/shop/studio-intro";
import { AcquisitionFaq } from "@/components/shop/acquisition-faq";
import { CommissionForm } from "@/components/shop/commission-form";
import { brand } from "@/lib/brand";
import { buildIndex, coverForCategory, type IndexEntry } from "@/lib/category-index";
import { enquiryPrefillMessage, parsePiecesParam } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { pieceTitle } from "@/lib/piece-title";
import { getSettings, loadCategories, loadManifest, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

function IndexSkeleton() {
  return (
    <main className="shell min-h-[80svh] py-12" aria-busy="true" aria-label="Loading the index">
      <div className="grid animate-pulse gap-3 py-6">
        <div className="h-4 w-40 bg-wall-sink" />
        <div className="h-10 w-2/3 bg-wall-deep" />
      </div>
      <div className="grid animate-pulse border-t border-line-strong">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-6 border-b border-line py-8">
            <div className="grid gap-2">
              <div className="h-8 w-56 bg-wall-deep" />
              <div className="h-4 w-32 bg-wall-deep" />
            </div>
            <div className="aspect-[4/3] w-36 bg-wall-deep" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<IndexSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

function IndexRow({ entry, index }: { entry: IndexEntry; index: number }) {
  return (
    <li>
      <Link href={`/category/${entry.slug}`} className="idx-row">
        <span className="idx-lead">
          <span className="idx-num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="idx-name block">{entry.name}</span>
            <span className="idx-meta">
              <span className="nums">
                {entry.count} {entry.count === 1 ? "piece" : "pieces"}
              </span>
              {entry.intro ? <span>{entry.intro}</span> : null}
            </span>
          </span>
        </span>
        <span className="idx-cover" aria-hidden="true">
          {entry.cover ? (
            <Image
              src={entry.cover.url}
              alt=""
              fill
              sizes="(min-width: 641px) 18vw, 420px"
              placeholder={entry.cover.blurData ? "blur" : "empty"}
              blurDataURL={entry.cover.blurData ?? undefined}
              style={{ objectPosition: `${entry.cover.focalX * 100}% ${entry.cover.focalY * 100}%` }}
            />
          ) : null}
        </span>
      </Link>
    </li>
  );
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pieceSlugs = parsePiecesParam(Array.isArray(params.pieces) ? params.pieces[0] : params.pieces);
  const [settings, products, categories, saved] = await Promise.all([
    getSettings(),
    loadManifest(),
    loadCategories(),
    loadSaved(pieceSlugs),
  ]);
  const initialMessage = saved.length
    ? enquiryPrefillMessage(
        saved.map((product) => ({
          title: pieceTitle(product.title, product.categorySlug, product.attributes, product.id),
          slug: product.slug,
          priceMinor: product.priceMinor,
        })),
        (minor) => formatMoney(minor, saved[0]?.currency ?? "USD"),
      )
    : undefined;

  const entries = buildIndex(categories, products);
  const allEntry: IndexEntry | null = products.length
    ? {
        id: "all",
        slug: "all",
        name: "All pieces",
        intro: "everything in the studio, including pieces without an art form yet",
        count: products.length,
        cover: coverForCategory(null, products),
      }
    : null;

  const photographed = products.filter((product) => product.images.length > 0);
  const detail = (settings.heroImage ? photographed.find((product) => product.images.some((image) => image.url === settings.heroImage)) : undefined)
    ?? photographed.find((product) => product.status !== "sold")
    ?? photographed[0]
    ?? null;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ArtGallery",
          name: brand.name,
          url: siteUrl(),
          address: {
            "@type": "PostalAddress",
            addressLocality: settings.town,
            addressRegion: settings.region,
            addressCountry: settings.country,
          },
          ...(settings.email ? { email: settings.email } : {}),
          ...(settings.phone ? { telephone: settings.phone } : {}),
        }}
      />

      <section id="index" aria-labelledby="index-title" className="hairline-b">
        <div className="shell">
          <div className="index-head">
            <div>
              <p className="kicker">
                {brand.name} — a family studio in {settings.town}, {settings.region}
              </p>
              <h1 id="index-title" className="disp mt-[10px] text-[clamp(2.6rem,6vw,5.5rem)]">
                {settings.heroHeadline?.trim() || "Handmade paintings, woodwork, and studio pieces."}
              </h1>
              <p className="sub type">
                Pieces grouped by what they are made of and how they are made. Every photograph is the piece itself —
                every piece is one of a kind, asked about directly, and nothing is paid on this site.
              </p>
              <p className="sub type mt-3">
                <a href="#index-list" className="cap-line">Browse the material index</a>
              </p>
            </div>
            {detail?.images[0] ? (
              <figure className="index-hero m-0">
                <Link href={`/p/${detail.slug}`} className="ph plate relative block aspect-[4/3] w-full" aria-label={pieceTitle(detail.title, detail.categorySlug, detail.attributes, detail.id)}>
                  <Image
                    src={detail.images[0].url}
                    alt={detail.images[0].alt || pieceTitle(detail.title, detail.categorySlug, detail.attributes, detail.id)}
                    fill
                    priority
                    sizes="(min-width: 900px) 40vw, 94vw"
                    placeholder={detail.images[0].blurData ? "blur" : "empty"}
                    blurDataURL={detail.images[0].blurData ?? undefined}
                    className="object-contain p-3"
                  />
                </Link>
                <figcaption className="idx-meta mt-2">
                  <Link href={`/p/${detail.slug}`} className="cap-line">{pieceTitle(detail.title, detail.categorySlug, detail.attributes, detail.id)}</Link>
                  <span> — in the studio</span>
                </figcaption>
              </figure>
            ) : null}
          </div>
          {entries.length || allEntry ? (
            <ol className="idx" id="index-list">
              {entries.map((entry, index) => (
                <IndexRow key={entry.id} entry={entry} index={index} />
              ))}
              {allEntry ? <IndexRow entry={allEntry} index={entries.length} /> : null}
            </ol>
          ) : (
            <p className="type py-10 text-tar-soft">No pieces are on the site yet — ask the studio what is in progress.</p>
          )}
        </div>
      </section>

      <StudioIntro settings={settings} detail={detail} />

      <AcquisitionFaq settings={settings} />

      <section id="inquire" className="note-sec scroll-mt-[60px]" aria-labelledby="inquire-title">
        <div className="note-grid shell">
          <div className="note-side">
            <p className="kicker">Send a note</p>
            <h2 id="inquire-title" className="display mt-[10px]" data-reveal="">
              Ask the studio
            </h2>
            <p className="type">A question about a piece, a visit, or something you would like made.</p>
            <p className="comm type">{settings.responseNote || "We write back ourselves — no forms lost to a machine."}</p>
          </div>
          <CommissionForm responseNote={settings.responseNote} initialMessage={initialMessage} />
        </div>
      </section>

      <a className="ask-chip no-print" href="#inquire">
        ask →
      </a>

    </main>
  );
}
