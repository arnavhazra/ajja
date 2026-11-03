import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/enquiry-form";
import { EventBeacon } from "@/components/event-beacon";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { ShareButton } from "@/components/share-button";
import { PieceCard } from "@/components/shop/piece-card";
import { PieceViewer } from "@/components/shop/piece-viewer";
import { formatMoney } from "@/lib/money";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import { getSettings, loadProduct, loadRelated } from "@/lib/public-data";
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
    <Suspense fallback={<main className="shell min-h-[80svh] py-10" aria-busy="true" />}>
      <ProductBody params={params} />
    </Suspense>
  );
}

async function ProductBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  const [settings, related] = await Promise.all([getSettings(), loadRelated(product)]);
  const sold = product.status === "sold";
  const price = formatMoney(product.priceMinor, product.currency);
  const attributes = product.attributes ?? {};
  const title = pieceTitle(product.title, product.categorySlug, attributes);
  const kind = pieceKind(product.categoryName, attributes);
  const canonical = `${siteUrl()}/p/${product.slug}`;
  const whatsapp = digits(settings.whatsapp)
    ? whatsAppHref(settings.whatsapp, pieceMessage({ shop: settings.businessName, title, price, url: canonical }))
    : null;
  const facts = [
    kind ? ["Medium", kind] : null,
    attributes.size ? ["Size", attributes.size] : null,
    product.condition ? ["Condition", product.condition] : null,
    ["Made in", `${settings.town}, ${settings.region}`],
    product.quantity === 1 && !sold ? ["Edition", "One of one"] : null,
  ].filter((item): item is [string, string] => item !== null);

  return (
    <main style={{ "--pour": product.pigment, "--pour-ink": product.pigmentInk } as CSSProperties}>
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
            { "@type": "ListItem", position: 1, name: "Works", item: `${siteUrl()}/#works` },
            { "@type": "ListItem", position: 2, name: title, item: canonical },
          ],
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70svh]"
        style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--pour) 14%, var(--gesso)), var(--gesso))" }}
      />
      <div className="shell pb-24 pt-4 md:pb-32">
        <Link href="/#works" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-soft">
          <span aria-hidden="true">←</span>
          <span className="ink-link">All works</span>
        </Link>
        <div className="mt-4 grid items-start gap-10 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7" data-intro="">
            <div data-unveil="">
              <PieceViewer images={product.images} title={title} />
            </div>
          </div>
          <div className="grid content-start gap-8 md:sticky md:top-24 md:col-span-5 md:col-start-8" data-intro="">
            <div data-reveal="">
              <p className="caption flex items-center gap-2">
                <span aria-hidden="true" className="size-3 rounded-full bg-pour" />
                {sold ? "Sold" : "In the studio"}
              </p>
              <h1 className="display mt-4 text-[clamp(2.75rem,5.6vw,5.5rem)]">{title}</h1>
              <p className="nums mt-5 text-2xl">
                {sold ? <span className="text-sold">Sold</span> : (price ?? "Ask for the price")}
              </p>
            </div>
            {product.description || attributes.details ? (
              <div className="prose-serif grid gap-4 text-ink-soft" data-reveal="">
                {product.description ? <p>{product.description}</p> : null}
                {attributes.details ? <p>{attributes.details}</p> : null}
              </div>
            ) : null}
            <dl className="border-t border-line" data-reveal="">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-line py-3">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3" data-reveal="">
              {!sold ? (
                <a href="#enquire" className="btn btn-pour">
                  Ask about this piece
                </a>
              ) : null}
              {whatsapp && !sold ? (
                <a className="btn btn-secondary" href={whatsapp}>
                  WhatsApp
                </a>
              ) : null}
              <ShareButton label={title} />
            </div>
          </div>
        </div>
      </div>

      {!sold ? (
        <section id="enquire" aria-label={`Ask about ${title}`} className="scroll-mt-20 bg-plate py-20 md:py-28">
          <div className="shell grid gap-10 md:grid-cols-12 md:gap-6">
            <div className="md:col-span-4">
              <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">Ask about it</h2>
              <p className="caption mt-4 max-w-xs">{settings.paymentNote}</p>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <EnquiryForm productId={product.id} productName={title} />
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section aria-labelledby="related-title" className="shell py-20 md:py-28">
          <h2 id="related-title" className="display-wide text-3xl md:text-4xl">
            Also in the studio
          </h2>
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <PieceCard product={item} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!sold ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-gesso/95 px-4 pt-3 backdrop-blur md:hidden">
          <a className="btn btn-pour w-full" href="#enquire">
            Ask about this piece
          </a>
        </div>
      ) : null}
      <MotionScan />
    </main>
  );
}
