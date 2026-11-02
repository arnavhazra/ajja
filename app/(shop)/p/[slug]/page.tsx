import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/enquiry-form";
import { EventBeacon } from "@/components/event-beacon";
import { Gallery } from "@/components/gallery";
import { JsonLd } from "@/components/json-ld";
import { ProductCard, pieceTitle } from "@/components/product-card";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { formatMoney } from "@/lib/money";
import { getSettings, loadProduct, loadRelated, loadSold } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import { digits, pieceMessage, whatsAppHref } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  return {
    title: pieceTitle(product.title, product.categorySlug, product.attributes),
    description: product.description || undefined,
    alternates: { canonical: `/p/${product.slug}` },
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="px-4 py-6 md:px-8">Loading this piece.</main>}>
      <ProductBody params={params} />
    </Suspense>
  );
}

async function ProductBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  const [settings, related, sold] = await Promise.all([getSettings(), loadRelated(product), loadSold(4)]);
  const price = formatMoney(product.priceMinor, product.currency);
  const attributes = product.attributes ?? {};
  const title = pieceTitle(product.title, product.categorySlug, attributes);
  const medium = attributes.medium || null;
  const canonical = `${siteUrl()}/p/${product.slug}`;
  const whatsapp = digits(settings.whatsapp)
    ? whatsAppHref(settings.whatsapp, pieceMessage({ shop: settings.businessName, title, price, url: canonical }))
    : null;
  return (
    <main className="pb-24 md:pb-0">
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
            availability: product.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            url: canonical,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Archive", item: siteUrl() },
            { "@type": "ListItem", position: 2, name: title, item: canonical },
          ],
        }}
      />
      <div className="px-4 pt-4 md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center font-mono text-[10px] uppercase tracking-[0.2em] text-umber transition-colors hover:text-ink"
          >
            ← Back to the archive
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">
            Archive / {product.categoryName || "Studio"} / {product.slug}
          </p>
        </div>
      </div>
      <div data-motion="dossier" className="mx-auto mt-4 grid max-w-[1440px] items-start gap-10 px-4 md:grid-cols-12 md:px-8">
        <div className="md:col-span-7" data-motion="dossier-gallery">
          <Gallery images={product.images} title={title} />
        </div>
        <div className="grid content-start gap-6 md:col-span-5" data-motion="dossier-meta">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-terracotta">
              Fig 01 · {product.categoryName || "Studio piece"}
            </p>
            <h1 className="mt-2 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl">{title}</h1>
            <p className="mt-3 font-mono text-xl font-bold tabular-nums text-ink">
              {product.status === "sold" ? <span className="mr-2 text-sold">Acquired ·</span> : null}
              {product.status === "sold" ? "held by a collector" : (price ?? "Inquire for price")}
            </p>
            {product.quantity === 1 && product.status === "published" ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Edition 1 of 1</p>
            ) : null}
          </div>

          <div className="rounded-sm bg-bone p-4 hairline-box">
            <dl className="grid gap-3 font-mono text-[11px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="uppercase tracking-[0.18em] text-umber">Ref no.</dt>
                <dd className="font-bold text-ink">#{product.slug.slice(-6).toUpperCase()}</dd>
              </div>
              {medium ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="uppercase tracking-[0.18em] text-umber">Medium</dt>
                  <dd className="text-ink text-right">{medium}</dd>
                </div>
              ) : null}
              {attributes.size ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="uppercase tracking-[0.18em] text-umber">Size</dt>
                  <dd className="tabular-nums text-ink">{attributes.size}</dd>
                </div>
              ) : null}
              {product.condition ? (
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="uppercase tracking-[0.18em] text-umber">Condition</dt>
                  <dd className="text-ink text-right">{product.condition}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="uppercase tracking-[0.18em] text-umber">Studio</dt>
                <dd className="text-ink">{settings.town}, {settings.region}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="uppercase tracking-[0.18em] text-umber">Custody</dt>
                <dd className={product.status === "sold" ? "text-umber" : "font-bold text-moss"}>
                  {product.status === "sold" ? "Acquired" : "In the studio"}
                </dd>
              </div>
            </dl>
          </div>

          {product.description ? <p className="max-w-prose text-sm leading-relaxed text-umber">{product.description}</p> : null}
          {attributes.details ? <p className="max-w-prose text-sm leading-relaxed text-umber">{attributes.details}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            {product.status !== "sold" ? (
              <a href="#enquire" className="btn btn-terracotta" data-magnetic="0.3">
                Enquire about this piece
              </a>
            ) : null}
            {whatsapp ? (
              <a className="btn btn-secondary" href={whatsapp}>
                Message on WhatsApp
              </a>
            ) : null}
            <SaveButton slug={product.slug} className="rounded-sm hairline-box bg-linen px-4 hover:bg-bone-dark" />
            <ShareButton label={title} />
          </div>

          <section id="enquire" className="scroll-mt-24">
            <EnquiryForm productId={product.id} productName={title} />
          </section>
        </div>
      </div>

      {related.length ? (
        <section className="mx-auto mt-16 max-w-[1440px] px-4 pb-10 md:px-8" aria-labelledby="related-heading">
          <div className="hairline-t pt-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta">Folio · related specimens</p>
            <h2 id="related-heading" className="mt-2 font-serif text-3xl font-medium text-ink">
              More like this
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} href={`/p/${item.slug}`} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {sold.length ? (
        <section className="mx-auto max-w-[1440px] px-4 pb-10 md:px-8" aria-labelledby="sold-heading">
          <div className="hairline-t pt-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-umber">Retired entries</p>
            <h2 id="sold-heading" className="mt-2 font-serif text-3xl font-medium text-ink">
              Recently acquired
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sold.map((item) => (
                <ProductCard key={item.id} product={item} href={`/p/${item.slug}`} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 hairline-t bg-linen/95 p-3 backdrop-blur-sm md:hidden">
        <a className="btn btn-primary w-full" href={product.status === "sold" ? "/" : "#enquire"}>
          {product.status === "sold" ? "Back to the archive" : "Enquire about this piece"}
        </a>
      </div>
    </main>
  );
}
