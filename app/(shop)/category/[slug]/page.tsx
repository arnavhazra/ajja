import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { CategoryWall } from "@/components/shop/category-wall";
import { orderForIndex } from "@/lib/category-index";
import { getSettings, loadCategory, loadCategoryPieces, loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import type { PublicProduct } from "@/lib/types";

const ALL_SLUG = "all";

type Params = { slug: string };

async function resolve(slug: string) {
  const named = await loadCategory(slug);
  if (named) {
    return {
      name: named.name,
      intro: named.intro,
      slug: named.slug,
      pieces: await loadCategoryPieces(named.id),
    };
  }
  if (slug === ALL_SLUG) {
    return {
      name: "All pieces",
      intro: "",
      slug: ALL_SLUG,
      pieces: orderForIndex(await loadManifest()),
    };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();
  const description =
    resolved.intro ||
    `${resolved.name} — ${resolved.pieces.length} ${resolved.pieces.length === 1 ? "piece" : "pieces"} photographed as they are.`;
  const image = resolved.pieces[0]?.images[0]?.url;
  return {
    title: resolved.name,
    description,
    alternates: { canonical: `/category/${resolved.slug}` },
    openGraph: {
      title: resolved.name,
      description,
      url: `${siteUrl()}/category/${resolved.slug}`,
      type: "website",
      // The `images` key must be absent (not undefined) when a category has no
      // photograph, otherwise Next.js treats it as explicitly set and suppresses
      // the file-based fallback share card.
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function CategoryPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryBody params={params} />
    </Suspense>
  );
}

async function CategoryBody({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [resolved, settings] = await Promise.all([resolve(slug), getSettings()]);
  if (!resolved) notFound();
  const pieces: PublicProduct[] = resolved.pieces;
  const canonical = `${siteUrl()}/category/${resolved.slug}`;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: resolved.name,
          url: canonical,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "The index", item: `${siteUrl()}/#index` },
            { "@type": "ListItem", position: 2, name: resolved.name, item: canonical },
          ],
        }}
      />

      <div className="shell pb-20 pt-6 md:pb-28 md:pt-8">
        {/* Folio Header Strip */}
        <header className="border-b border-line pb-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/#index"
              className="micro-label inline-flex min-h-11 items-center gap-2.5 text-tar hover:text-sap"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-5 items-center justify-center rounded-full bg-sap text-[11px] font-bold text-wall"
              >
                §
              </span>
              <span>The index / {resolved.slug} · Monograph folio</span>
            </Link>
            <span className="micro-label text-tar-soft">
              Folio no. 2025/{settings.region.toUpperCase()} · {settings.town}, {settings.region}
            </span>
          </div>

          <div className="grid grid-cols-1 items-baseline gap-5 lg:grid-cols-12">
            <div className="flex flex-wrap items-baseline gap-4 lg:col-span-6">
              <h1 className="disp text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.98] text-tar">{resolved.name}</h1>
              <span className="ledger text-sm text-tar-soft">
                [ {pieces.length} {pieces.length === 1 ? "PIECE" : "PIECES"} ]
              </span>
            </div>
            {resolved.intro ? (
              <div className="lg:col-span-6">
                <p className="type max-w-xl text-base leading-relaxed text-tar-soft md:text-lg">{resolved.intro}</p>
              </div>
            ) : null}
          </div>
        </header>

        <h2 className="sr-only">Pieces</h2>
        {pieces.length ? (
          <CategoryWall pieces={pieces} />
        ) : (
          <p className="type py-12 text-tar-soft">
            Nothing public in this art form yet — ask the studio what is in progress.
          </p>
        )}

        {/* Bottom Studio Dispatch Strip */}
        <section className="mt-6 border-t-2 border-tar pt-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="ledger text-xs text-tar-soft lg:col-span-4">
              <strong className="text-tar">[ {pieces.length} WORKS ]</strong> — {settings.town.toUpperCase()},{" "}
              {settings.region.toUpperCase()}
            </div>
            <p className="type text-sm text-tar-soft lg:col-span-5">
              {settings.paymentNote || "Direct maker contact. No online cart — send a note about any piece."}
            </p>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-3 lg:justify-end">
              <Link
                href="/#index"
                className="ledger inline-flex min-h-11 items-center rounded-[2px] bg-wall-deep px-4 text-xs uppercase tracking-wider text-tar hover:bg-wall-sink"
              >
                ← The index
              </Link>
              <Link
                href="/#inquire"
                className="ledger inline-flex min-h-11 items-center rounded-[2px] bg-tar px-4 text-xs font-bold uppercase tracking-wider text-wall hover:bg-sap"
              >
                Send a note →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CategorySkeleton() {
  return (
    <main className="shell min-h-[70svh] py-12" aria-busy="true" aria-label="Loading this art form">
      <div className="grid animate-pulse gap-3 py-4">
        <div className="h-4 w-28 bg-wall-sink" />
        <div className="h-12 w-1/2 bg-wall-deep" />
      </div>
      <div className="mt-8 grid animate-pulse grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid gap-3">
            <div className="aspect-[4/3] bg-wall-deep" />
            <div className="h-4 w-3/4 bg-wall-deep" />
          </div>
        ))}
      </div>
    </main>
  );
}
