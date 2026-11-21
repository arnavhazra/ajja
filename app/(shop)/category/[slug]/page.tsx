import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { PieceCard } from "@/components/shop/piece-card";
import { orderForIndex } from "@/lib/category-index";
import { loadCategory, loadCategoryPieces, loadManifest } from "@/lib/public-data";
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
  return {
    title: resolved.name,
    description: resolved.intro || `${resolved.name} — ${resolved.pieces.length} ${resolved.pieces.length === 1 ? "piece" : "pieces"} photographed as they are.`,
    alternates: { canonical: `/category/${resolved.slug}` },
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
  const resolved = await resolve(slug);
  if (!resolved) notFound();
  const pieces: PublicProduct[] = resolved.pieces;
  const available = pieces.filter((piece) => piece.status !== "sold").length;
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
      <div className="shell pb-24 pt-4 md:pb-32">
        <Link href="/#index" className="inline-flex min-h-11 items-center gap-2 text-sm text-tar-soft">
          <span aria-hidden="true">←</span>
          <span className="ink-link">The index</span>
        </Link>
        <header className="index-head pt-2">
          <div>
            <p className="kicker nums">
              {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
              {available !== pieces.length ? ` — ${available} available` : ""}
            </p>
            <h1 className="disp mt-[10px] text-[clamp(2.6rem,6vw,5.5rem)]">{resolved.name}</h1>
          </div>
          {resolved.intro ? <p className="sub type">{resolved.intro}</p> : null}
        </header>
        <h2 className="sr-only">Pieces</h2>
        {pieces.length ? (
          <div className="wall">
            {pieces.map((product, index) => (
              <PieceCard
                key={product.id}
                product={product}
                index={index}
                priority={index < 3}
                sizes="(min-width: 1180px) 22vw, (min-width: 900px) 30vw, (min-width: 560px) 46vw, 94vw"
              />
            ))}
          </div>
        ) : (
          <p className="type py-10 text-tar-soft">Nothing public in this art form yet — ask the studio what is in progress.</p>
        )}
      </div>
      <MotionScan />
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
      <div className="mt-8 grid animate-pulse grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="grid gap-3">
            <div className="aspect-[4/5] bg-wall-deep" />
            <div className="h-4 w-3/4 bg-wall-deep" />
          </div>
        ))}
      </div>
    </main>
  );
}
