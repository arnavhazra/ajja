import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ViewTransition, type CSSProperties } from "react";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/enquiry-form";
import { EventBeacon } from "@/components/event-beacon";
import { JsonLd } from "@/components/json-ld";
import { ShareButton } from "@/components/share-button";
import { PieceCard } from "@/components/shop/piece-card";
import { PieceSaveButton } from "@/components/shop/piece-save-button";
import { PieceViewer } from "@/components/shop/piece-viewer";
import { enquiryPrefillMessage, parsePiecesParam } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { displaySize, hasRealTitle, pieceKind, pieceRef, pieceTitle } from "@/lib/piece-title";
import { getSettings, loadProduct, loadRelated, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  const named = hasRealTitle(product.title);
  const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  const description =
    product.description ||
    (named ? undefined : `${title} — a piece in the studio in Collegeville, not yet named. Ask about it directly.`);
  return {
    title,
    description,
    robots: named ? undefined : { index: false, follow: true },
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/p/${product.slug}`,
      type: "website",
      images: product.images.map((image) => image.url),
    },
  };
}

export default function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  const pieceSlugs = parsePiecesParam(Array.isArray(query.pieces) ? query.pieces[0] : query.pieces);
  const [settings, related, saved] = await Promise.all([getSettings(), loadRelated(product), loadSaved(pieceSlugs)]);
  const initialMessage = saved.length
    ? enquiryPrefillMessage(
        saved.map((item) => ({
          title: pieceTitle(item.title, item.categorySlug, item.attributes, item.id),
          slug: item.slug,
          priceMinor: item.priceMinor,
        })),
        (minor) => formatMoney(minor, product.currency),
      )
    : undefined;
  const sold = product.status === "sold";
  const price = formatMoney(product.priceMinor, product.currency);
  const attributes = product.attributes ?? {};
  const title = pieceTitle(product.title, product.categorySlug, attributes, product.id);
  const kind = pieceKind(product.categoryName, attributes);
  const dimensions = displaySize(attributes) || undefined;
  const refCode = (product.sku || pieceRef(product.id)).toUpperCase();
  const canonical = `${siteUrl()}/p/${product.slug}`;
  const facts = [
    kind ? ["Medium", kind] : null,
    dimensions ? ["Dimensions", dimensions] : null,
    product.condition ? ["Condition", product.condition] : null,
    ["Made in", `${settings.town}, ${settings.region}`],
    product.quantity === 1 && !sold ? ["Edition", "Unique 1 of 1"] : null,
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main style={{ "--pigment": product.pigment, "--pigment-ink": product.pigmentInk } as CSSProperties}>
      <EventBeacon type="view" productId={product.id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: title,
          description: product.description || undefined,
          image: product.images.map((image) => image.url),
          sku: product.sku || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: product.currency,
            price: product.priceMinor != null ? (product.priceMinor / 100).toFixed(2) : undefined,
            availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            url: canonical,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "The index", item: `${siteUrl()}/#index` },
            {
              "@type": "ListItem",
              position: 2,
              name: product.categoryName ?? "All pieces",
              item: `${siteUrl()}/category/${product.categorySlug ?? "all"}`,
            },
            { "@type": "ListItem", position: 3, name: title, item: canonical },
          ],
        }}
      />

      <div className="shell pb-20 pt-4 md:pb-28 md:pt-6">
        {/* Folio Breadcrumb & Status Strip */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
          <nav aria-label="Breadcrumb" className="ledger flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-tar-soft">
            <Link href="/#index" className="inline-flex min-h-11 items-center hover:text-tar">
              Folio catalogue
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={product.categorySlug ? `/category/${product.categorySlug}` : "/category/all"}
              className="inline-flex min-h-11 items-center hover:text-tar"
            >
              {product.categoryName ?? "All pieces"}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-bold text-tar">REF. {refCode}</span>
          </nav>

          <div className="flex items-center gap-3">
            <span
              className={`micro-label inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 ${
                sold ? "border-sold/30 bg-wall-deep text-sold" : "border-ok/30 bg-wall-deep text-ok"
              }`}
            >
              <span className={`size-1.5 rounded-full ${sold ? "bg-sold" : "bg-ok"}`} aria-hidden="true" />
              {sold ? "Held in archive" : "In the studio"}
            </span>
            <span className="ledger hidden text-xs uppercase text-tar-soft sm:inline">
              {settings.town}, {settings.region}
            </span>
          </div>
        </div>

        {/* Main 12-Col Asymmetric Stage */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ViewTransition name={`piece-${product.id}`}>
              <PieceViewer images={product.images} title={title} dimensions={dimensions} />
            </ViewTransition>
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-5">
            {/* Identity & Nomenclature */}
            <ViewTransition name={`piece-label-${product.id}`}>
              <div className="border-b border-line pb-5" data-reveal="">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="micro-label font-bold text-sap">
                    {(product.categoryName || "Studio work").toUpperCase()} · NO. {refCode}
                  </span>
                  <span aria-hidden="true" className="size-3 rounded-full bg-pigment" />
                </div>
                <h1 className="disp text-[clamp(2.1rem,3.6vw,3.1rem)] leading-[1.02] text-tar">{title}</h1>
                {kind ? <p className="type mt-2 text-lg italic text-tar-soft">{kind}</p> : null}
              </div>
            </ViewTransition>

            {/* Status & Valuation Ledger Row */}
            <div
              className="flex flex-wrap items-baseline justify-between gap-4 rounded-[2px] border border-line bg-surface-low p-4"
              data-reveal=""
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`micro-label inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 ${
                    sold ? "border-sold/30 bg-sold/10 text-sold" : "border-ok/30 bg-ok/10 text-ok"
                  }`}
                >
                  ● {sold ? "Sold" : "Available"}
                </span>
                <span className="ledger text-xs text-tar-soft">Single original</span>
              </div>
              <div className="text-right">
                <p className="ledger nums text-xl font-bold text-tar">
                  {sold ? "Sold" : (price ?? "Price on inquiry")}
                </p>
                <p className="ledger text-[0.72rem] text-tar-soft">(direct from studio)</p>
              </div>
            </div>

            {/* Curatorial Narrative */}
            {product.description || attributes.details ? (
              <div className="prose story grid gap-3.5 text-tar" data-reveal="">
                {product.description ? <p>{product.description}</p> : null}
                {attributes.details ? <p className="text-base text-tar-soft">{attributes.details}</p> : null}
              </div>
            ) : null}

            {/* Primary Actions */}
            <div className="flex flex-col gap-3" data-reveal="">
              <div className="flex flex-wrap items-center gap-3">
                {!sold ? (
                  <a
                    href="#enquire"
                    className="ledger inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[2px] bg-tar px-5 text-xs font-bold uppercase tracking-wider text-wall transition-colors hover:bg-sap"
                  >
                    Ask about this piece →
                  </a>
                ) : null}
                {!sold ? (
                  <PieceSaveButton
                    id={product.id}
                    slug={product.slug}
                    title={title}
                    priceMinor={product.priceMinor}
                    imageUrl={product.images[0]?.url}
                    kind={kind ?? undefined}
                    dimensions={dimensions}
                  />
                ) : null}
                <ShareButton label={title} />
              </div>

              <p className="ledger rounded-[2px] border border-line bg-wall-deep/55 px-3.5 py-2.5 text-center text-[0.72rem] text-tar-soft">
                Direct maker contact · No online cart · {settings.town}, {settings.region}
              </p>
            </div>

            {/* Archival Specifications Table */}
            <div className="border-t border-line pt-5" data-reveal="">
              <p className="micro-label mb-2 text-tar-soft">Archival specifications</p>
              <dl className="ledger divide-y divide-line text-sm">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-tar-soft">{label}</dt>
                    <dd className="text-right text-tar">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Inquiry Section */}
      {!sold ? (
        <section id="enquire" aria-label={`Ask about ${title}`} className="scroll-mt-20 border-t-2 border-tar bg-wall-deep/45 py-16 md:py-24">
          <div className="shell grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="micro-label text-sap">Direct correspondence</p>
              <h2 className="disp mt-2.5 text-[clamp(2.2rem,4vw,3.5rem)] text-tar">Ask the studio</h2>
              <p className="type mt-4 max-w-sm text-base leading-relaxed text-tar-soft">{settings.paymentNote}</p>
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm productId={product.id} productName={title} initialMessage={initialMessage} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Companion Works */}
      {related.length ? (
        <section aria-labelledby="related-title" className="shell border-t border-line py-16 md:py-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="micro-label text-sap">Monograph selections</p>
              <h2 id="related-title" className="disp mt-1.5 text-2xl text-tar md:text-3xl">
                Also in the studio
              </h2>
            </div>
            <Link
              href={product.categorySlug ? `/category/${product.categorySlug}` : "/category/all"}
              className="ledger inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-wider text-tar hover:text-sap"
            >
              View all works →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <PieceCard product={item} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 94vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!sold ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-wall/95 p-3 backdrop-blur md:hidden has-[:target]:hidden">
          <a className="btn btn-primary flex-1 text-center" href="#enquire">
            Ask about piece
          </a>
        </div>
      ) : null}
    </main>
  );
}

/** Skeleton that mirrors the page structure so the streamed swap doesn't shift the footer. */
function ProductSkeleton() {
  const bar = "bg-wall-deep";
  return (
    <main className="relative" aria-busy="true">
      <div className="shell pb-24 pt-4 md:pb-32">
        <div className="min-h-11" />
        <div className="mt-4 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className={`aspect-[4/3] w-full ${bar}`} />
          </div>
          <div className="grid content-start gap-6 lg:col-span-5">
            <div className="grid gap-3 border-b border-line pb-5">
              <div className={`h-4 w-28 ${bar}`} />
              <div className={`h-12 w-3/4 ${bar}`} />
              <div className={`h-6 w-32 ${bar}`} />
            </div>
            <div className="grid gap-3">
              <div className={`h-5 w-full ${bar}`} />
              <div className={`h-5 w-5/6 ${bar}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-12 w-44 ${bar}`} />
              <div className={`h-12 w-24 ${bar}`} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
