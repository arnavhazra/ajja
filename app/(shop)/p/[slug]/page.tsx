import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ContactActions } from "@/components/contact-actions";
import { EventBeacon } from "@/components/event-beacon";
import { Gallery } from "@/components/gallery";
import { JsonLd } from "@/components/json-ld";
import { ProductCard, pieceTitle } from "@/components/product-card";
import { formatMoney } from "@/lib/money";
import { getSettings, loadProduct, loadRelated, loadSold } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import type { PublicProduct } from "@/lib/types";
import { digits, pieceMessage, whatsAppHref } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await loadProduct(slug);
  if (!product) return { title: "Piece" };
  return {
    title: pieceTitle(product.title, product.slug),
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
  const title = pieceTitle(product.title, product.slug);
  return (
    <main>
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
            url: `${siteUrl()}/p/${product.slug}`,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Shop", item: `${siteUrl()}/shop` },
            { "@type": "ListItem", position: 2, name: title, item: `${siteUrl()}/p/${product.slug}` },
          ],
        }}
      />
      <div className="px-4 pt-4 md:px-8">
        <Link href="/shop" className="inline-flex min-h-12 items-center text-ink-soft no-underline">
          Back to the shop
        </Link>
      </div>
      <div className="mt-2 grid items-start gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(18rem,24rem)] md:gap-10">
        <Gallery images={product.images} title={title} />
        <div className="grid content-start gap-5 px-4 pb-28 md:px-0 md:pr-8 md:pb-12">
          <div>
            <h1 className="text-4xl text-ink md:text-5xl">{title}</h1>
            {product.categoryName ? <p className="mt-2 text-ink-soft">{product.categoryName}</p> : null}
            <p className="nums mt-3 text-2xl">
              {product.status === "sold" ? <span className="mr-2 text-sold">Sold. </span> : null}
              {price ?? "Inquire for price"}
            </p>
            {product.quantity === 1 && product.status === "published" ? <p className="mt-2 text-ink-soft">Only 1 available</p> : null}
          </div>
          {product.condition || attributes.size || attributes.details ? (
            <div className="grid gap-2 border-t border-line pt-4">
              {product.condition ? (
                <p>
                  <span className="text-ink-soft">Condition. </span>
                  {product.condition}
                </p>
              ) : null}
              {attributes.size ? (
                <p>
                  <span className="text-ink-soft">Size. </span>
                  <span className="nums">{attributes.size}</span>
                </p>
              ) : null}
              {attributes.details ? <p className="measure text-ink-soft">{attributes.details}</p> : null}
            </div>
          ) : null}
          {product.description ? <p className="measure">{product.description}</p> : null}
          <ContactActions product={product} settings={settings} path={`/p/${product.slug}`} />
          {product.status === "sold" ? (
            <Link className="btn btn-secondary w-fit" href={`/search?q=${encodeURIComponent(product.categoryName ?? "similar")}`}>
              Ask for something similar
            </Link>
          ) : null}
        </div>
      </div>
      {related.length ? (
        <section className="mt-12 border-t border-line px-4 py-10 md:px-8">
          <h2 className="text-3xl text-ink">More like this</h2>
          <div className="hang mt-8">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} href={`/p/${item.slug}`} />
            ))}
          </div>
        </section>
      ) : null}
      {sold.length ? (
        <section className="border-t border-line px-4 py-10 md:px-8">
          <h2 className="text-3xl text-ink">Recently sold</h2>
          <div className="hang mt-8">
            {sold.map((item) => (
              <ProductCard key={item.id} product={item} href={`/p/${item.slug}`} />
            ))}
          </div>
        </section>
      ) : null}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper p-3 md:hidden">
        <ContactBar product={product} phone={settings.phone} whatsapp={settings.whatsapp} shop={settings.businessName} />
      </div>
    </main>
  );
}

function ContactBar({ product, phone, whatsapp, shop }: { product: PublicProduct; phone: string; whatsapp: string; shop: string }) {
  const price = formatMoney(product.priceMinor, product.currency);
  const title = pieceTitle(product.title, product.slug);
  const href = digits(whatsapp)
    ? whatsAppHref(whatsapp, pieceMessage({ shop, title, price, url: `${siteUrl()}/p/${product.slug}` }))
    : digits(phone)
      ? `tel:${digits(phone)}`
      : "#message";
  const label = digits(whatsapp) ? "Message on WhatsApp" : digits(phone) ? "Call now" : "Send a message";
  return (
    <a className="btn btn-primary w-full" href={href}>
      {label}
    </a>
  );
}
