import type { Metadata } from "next";
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
import { displaySize, pieceKind, pieceTitle } from "@/lib/piece-title";
import { getSettings, loadCategories, loadManifest, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Handmade art and woodwork from a family studio in ${settings.town}, ${settings.region}`,
    alternates: { canonical: "/" },
  };
}

function IndexSkeleton() {
  return (
    <main className="shell min-h-[80svh] py-12" aria-busy="true" aria-label="Loading the index">
      <div className="grid animate-pulse gap-3 py-6">
        <div className="h-4 w-40 bg-wall-sink" />
        <div className="h-14 w-2/3 bg-wall-deep" />
      </div>
      <div className="grid animate-pulse border-t border-line-strong">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-6 border-b border-line py-8">
            <div className="grid gap-2">
              <div className="h-8 w-56 bg-wall-deep" />
              <div className="h-4 w-32 bg-wall-deep" />
            </div>
            <div className="aspect-[4/3] w-28 bg-wall-deep" />
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
    <li data-reveal="">
      <Link href={`/category/${entry.slug}`} className="idx-row group">
        <span className="idx-num" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="idx-name block">{entry.name}</span>
        <span className="idx-count ledger whitespace-nowrap text-tar">
          [ {entry.count} {entry.count === 1 ? "PIECE" : "PIECES"} ]
        </span>
        <span className="idx-desc type text-base italic text-tar-soft">
          {entry.intro || "Original works photographed as they are"}
        </span>
        <span className="idx-cover" aria-hidden="true">
          {entry.cover ? (
            <Image
              src={entry.cover.url}
              alt=""
              fill
              sizes="(min-width: 641px) 120px, 92vw"
              placeholder={entry.cover.blurData ? "blur" : "empty"}
              blurDataURL={entry.cover.blurData ?? undefined}
              style={{ objectPosition: `${entry.cover.focalX * 100}% ${entry.cover.focalY * 100}%` }}
            />
          ) : null}
        </span>
        <span className="idx-arrow" aria-hidden="true">
          →
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
  const defaultSubject = saved.length
    ? `Asking about ${saved.length === 1 ? "a saved piece" : `${saved.length} saved pieces`}`
    : undefined;

  const photographed = products.filter((product) => product.images.length > 0);
  const detail =
    (settings.heroImage
      ? photographed.find((product) => product.images.some((image) => image.url === settings.heroImage))
      : undefined) ??
    photographed.find((product) => product.status !== "sold") ??
    photographed[0] ??
    null;

  // Category rows hang first in desk order; the "All pieces" row comes last
  // and yields to them, so no photograph ever hangs on two rows of the index.
  const usedCovers = new Set<string>();
  const entries = buildIndex(categories, products, detail?.id, usedCovers);
  const allEntry: IndexEntry | null = products.length
    ? {
        id: "all",
        slug: "all",
        name: "All pieces",
        intro: "Everything currently documented in the studio archive",
        count: products.length,
        cover: coverForCategory(null, products, detail?.id, usedCovers),
      }
    : null;

  const heroTitle = detail ? pieceTitle(detail.title, detail.categorySlug, detail.attributes, detail.id) : null;
  const heroKind = detail ? pieceKind(detail.categoryName, detail.attributes) : null;
  const heroSize = detail ? displaySize(detail.attributes) || null : null;
  const heroPhoto = detail
    ? (detail.images.find((image) => image.url === settings.heroImage) ?? detail.images[0])
    : null;

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

      {/* HERO / ENTRY MASTHEAD */}
      <section aria-labelledby="index-title" className="pb-14 pt-6 md:pb-20 md:pt-8">
        <div className="shell">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5 md:mb-12">
            <span className="micro-label text-sap">
              A family studio · {settings.town}, {settings.region}
            </span>
            <span className="ledger hidden text-xs text-tar-soft md:inline">
              FOLIO NO. 2025/{settings.region.toUpperCase()} — VOL. IV
            </span>
          </div>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Editorial Display & Ledger Specs */}
            <div className="flex flex-col justify-between lg:col-span-7 lg:pr-4">
              <div>
                <p className="ledger mb-4 inline-flex items-center gap-3 text-xs text-tar-soft">
                  <span>§ 001</span>
                  <span className="inline-block h-px w-8 bg-line-strong" aria-hidden="true" />
                  <span className="uppercase tracking-[0.14em]">Catalogue aperçu</span>
                </p>

                <h1
                  id="index-title"
                  className="disp text-balance text-[clamp(2.75rem,5.4vw,4.85rem)] leading-[0.98] text-tar"
                >
                  {settings.heroHeadline?.trim() || "Objects shaped by patience, poured pigment, and timber."}
                </h1>

                <p className="type mt-6 max-w-xl text-lg leading-relaxed text-tar-soft md:text-[1.2rem]">
                  Original poured paintings and fine handcrafted woodwork from our studio in {settings.town},{" "}
                  {settings.region}. Each piece is strictly one of a kind. Inquiries are welcomed directly.
                </p>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 sm:grid-cols-3">
                <div>
                  <dt className="micro-label text-tar-soft">Studio</dt>
                  <dd className="ledger mt-1 font-bold text-tar">
                    {settings.town}, {settings.region}
                  </dd>
                </div>
                <div>
                  <dt className="micro-label text-tar-soft">Medium</dt>
                  <dd className="ledger mt-1 text-tar">
                    {heroKind || "Paintings · Woodwork"}
                  </dd>
                </div>
                <div>
                  <dt className="micro-label text-tar-soft">Editions</dt>
                  <dd className="ledger mt-1 text-tar">Unique 1 of 1</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a
                  href="#inquire"
                  className="ledger inline-flex min-h-12 items-center justify-center rounded-[2px] bg-tar px-6 text-xs font-bold uppercase tracking-wider text-wall transition-colors hover:bg-sap"
                >
                  Send a note →
                </a>
                <a
                  href="#index"
                  className="ledger inline-flex min-h-12 items-center justify-center rounded-[2px] border border-line-strong px-6 text-xs font-bold uppercase tracking-wider text-tar transition-colors hover:border-tar hover:bg-wall-deep/50"
                >
                  Index ledger [{products.length}]
                </a>
              </div>
            </div>

            {/* Right Column: Flat-Matted Artwork Plate */}
            {detail && heroPhoto && heroTitle ? (
              <div className="flex flex-col lg:col-span-5">
                <figure className="m-0 rounded-[2px] border border-line bg-wall-deep p-3.5">
                  <Link
                    href={`/p/${detail.slug}`}
                    className="relative block aspect-[4/3] w-full overflow-hidden"
                    aria-label={heroTitle}
                  >
                    <Image
                      src={heroPhoto.url}
                      alt={heroPhoto.alt || heroTitle}
                      fill
                      priority
                      sizes="(min-width: 1024px) 40vw, 94vw"
                      placeholder={heroPhoto.blurData ? "blur" : "empty"}
                      blurDataURL={heroPhoto.blurData ?? undefined}
                      className="object-contain transition-transform duration-500 hover:scale-[1.015]"
                    />
                  </Link>

                  <figcaption className="mt-3 border-t border-line pt-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        href={`/p/${detail.slug}`}
                        className="ledger inline-flex min-h-11 items-center gap-1.5 font-bold uppercase tracking-tight text-tar hover:text-sap"
                      >
                        <span className="text-sap" aria-hidden="true">
                          ✓
                        </span>
                        <span className="truncate">{heroTitle}</span>
                      </Link>
                      {heroSize ? (
                        <span className="type shrink-0 text-sm italic text-tar-soft">{heroSize}</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
                      <span className="ledger text-tar-soft">
                        {heroKind || "Original work from the studio"}
                      </span>
                      <span
                        className={`micro-label ${
                          detail.status === "sold" ? "text-sold" : "text-ok"
                        }`}
                      >
                        [ {detail.status === "sold" ? "HELD IN ARCHIVE" : "IN THE STUDIO"} ]
                      </span>
                    </div>
                  </figcaption>
                </figure>

                <div className="mt-3 flex items-start gap-3 rounded-[2px] border border-line bg-surface-low p-3.5">
                  <span className="ledger mt-0.5 text-sm font-bold text-sap" aria-hidden="true">
                    §
                  </span>
                  <p className="type text-sm leading-relaxed text-tar-soft">
                    Every photograph on this site is the piece itself. Transport or studio collection is arranged
                    directly from our {settings.town} workshop.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* THE INDEX SECTION */}
      <section id="index" aria-labelledby="folio-index-heading" className="scroll-mt-[72px] py-14 md:py-20">
        <div className="shell">
          <div className="border-t-2 border-tar pt-10 md:pt-12">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-3.5">
                <span className="micro-label text-sap">Folio catalogue</span>
                <h2 id="folio-index-heading" className="disp text-2xl uppercase tracking-tight text-tar md:text-3xl">
                  The Index
                </h2>
              </div>
              <span className="ledger text-xs uppercase text-tar-soft">
                [ {products.length} {products.length === 1 ? "ACTIVE WORK" : "ACTIVE WORKS"} ]
              </span>
            </div>

            {entries.length || allEntry ? (
              <ol className="idx" id="index-list">
                {entries.map((entry, index) => (
                  <IndexRow key={entry.id} entry={entry} index={index} />
                ))}
                {allEntry ? <IndexRow entry={allEntry} index={entries.length} /> : null}
              </ol>
            ) : (
              <p className="type py-10 text-tar-soft">
                No pieces are on the site yet — ask the studio what is in progress.
              </p>
            )}
          </div>
        </div>
      </section>

      <StudioIntro settings={settings} detail={detail} />

      <AcquisitionFaq settings={settings} />

      {/* SEND A NOTE / DIRECT CORRESPONDENCE */}
      <section id="inquire" className="scroll-mt-[72px] py-14 md:py-20" aria-labelledby="inquire-title">
        <div className="shell">
          <div className="border-t-2 border-tar pt-10 md:pt-14">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col justify-between lg:col-span-5">
                <div>
                  <p className="micro-label text-sap">Direct correspondence</p>
                  <h2 id="inquire-title" className="disp mt-2.5 text-[clamp(2.25rem,4vw,3.5rem)] text-tar" data-reveal="">
                    Send a note
                  </h2>
                  <p className="type mt-4 max-w-md text-lg leading-relaxed text-tar-soft">
                    Ask about a piece, arrange a studio visit in {settings.town}, or discuss something you would like
                    made.
                  </p>

                  <div className="mt-6 rounded-[2px] border border-line bg-wall-deep p-5">
                    <p className="micro-label font-bold text-sap">Studio note</p>
                    <p className="type mt-2 text-base leading-relaxed text-tar">
                      {settings.responseNote || "We write back ourselves — no forms lost to a machine."}
                    </p>
                  </div>
                </div>

                <p className="ledger mt-8 hidden text-xs text-tar-soft lg:block">
                  — {brand.name} · {settings.town}, {settings.region}
                </p>
              </div>

              <div className="lg:col-span-7">
                <CommissionForm
                  responseNote={settings.responseNote}
                  initialMessage={initialMessage}
                  defaultSubject={defaultSubject}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <a className="ask-chip no-print" href="#inquire">
        ask →
      </a>
    </main>
  );
}
