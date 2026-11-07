import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ViewTransition, type CSSProperties } from "react";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/enquiry-form";
import { EventBeacon } from "@/components/event-beacon";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { ShareButton } from "@/components/share-button";
import { PieceCard } from "@/components/shop/piece-card";
import { PieceViewer } from "@/components/shop/piece-viewer";
import { DynamicPrice } from "@/components/shop/dynamic-price";
import { FolioActionButton } from "@/components/shop/folio-action-button";
import { ScaleVisualizer } from "@/components/shop/scale-visualizer";
import { enquiryPrefillMessage, parsePiecesParam } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { hasRealTitle, pieceKind, pieceTitle } from "@/lib/piece-title";
import { getSettings, loadProduct, loadRelated, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import { digits, pieceMessage, whatsAppHref } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product, redirect } = await loadProduct(slug);
  if (redirect) permanentRedirect(redirect);
  if (!product) notFound();
  const named = hasRealTitle(product.title);
  const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  return {
    title,
    description: product.description || (named ? undefined : `${title} — a piece in the Ajja studio in Collegeville, not yet named. Ask about it directly.`),
    robots: named ? undefined : { index: false, follow: true },
    alternates: { canonical: `/p/${product.slug}` },
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
            { "@type": "ListItem", position: 1, name: "Works", item: `${siteUrl()}/#works` },
            { "@type": "ListItem", position: 2, name: title, item: canonical },
          ],
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70svh]"
        style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--pigment) 14%, var(--wall)), var(--wall))" }}
      />
      <div className="shell pb-24 pt-4 md:pb-32">
        <Link href="/#works" className="inline-flex min-h-11 items-center gap-2 text-sm text-tar-soft">
          <span aria-hidden="true">←</span>
          <span className="ink-link">All works</span>
        </Link>
        <div className="mt-4 grid items-start gap-10 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
            <ViewTransition name={`piece-${product.id}`}>
              <PieceViewer images={product.images} title={title} />
            </ViewTransition>
          </div>
          <div className="grid content-start gap-8 md:sticky md:top-24 md:col-span-5 md:col-start-8">
            <ViewTransition name={`piece-label-${product.id}`}>
              <div className="wall-label grid gap-3 p-5" data-reveal="">
                <p className="tag flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded-full bg-pigment" />
                  {sold ? "Sold" : "In the studio"}
                </p>
                <h1 className="display text-[clamp(2.5rem,4.5vw,4.25rem)]">{title}</h1>
                <p className="nums text-2xl">
                  <DynamicPrice priceMinor={product.priceMinor} fallback={price ?? "price on asking"} sold={sold} />
                </p>
              </div>
            </ViewTransition>
            {product.description || attributes.details ? (
              <div className="prose grid gap-4 text-tar-soft" data-reveal="">
                {product.description ? <p>{product.description}</p> : null}
                {attributes.details ? <p>{attributes.details}</p> : null}
              </div>
            ) : null}
            <dl className="wall-label grid gap-0 p-5" data-reveal="">
              {facts.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 border-b border-line py-3 last:border-b-0">
                  <dt className="tag">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {product.images[0] ? (
              <div data-reveal="">
                <ScaleVisualizer
                  image={product.images[0]}
                  title={title}
                  sizeText={attributes.size || attributes.dimensions}
                  kind={kind ?? undefined}
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3" data-reveal="">
              {!sold ? (
                <a href="#enquire" className="btn btn-pigment">
                  Ask about this piece
                </a>
              ) : null}
              {!sold ? (
                <FolioActionButton product={product} title={title} kind={kind ?? undefined} />
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
        <section id="enquire" aria-label={`Ask about ${title}`} className="scroll-mt-20 bg-wall-deep py-20 md:py-28">
          <div className="shell grid gap-10 md:grid-cols-12 md:gap-6">
            <div className="md:col-span-4">
              <h2 className="display text-[clamp(2.5rem,5vw,4.5rem)]">Ask about it</h2>
              <p className="caption mt-4 max-w-xs">{settings.paymentNote}</p>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <EnquiryForm productId={product.id} productName={title} initialMessage={initialMessage} />
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section aria-labelledby="related-title" className="shell py-20 md:py-28">
          <h2 id="related-title" className="display-wide text-3xl md:text-4xl">
            Also in the studio
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <PieceCard product={item} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!sold ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-wall/95 p-3 backdrop-blur md:hidden">
          <a className="btn btn-pigment flex-1 text-center" href="#enquire">
            Ask about piece
          </a>
          <FolioActionButton product={product} title={title} kind={kind ?? undefined} className="flex-none" />
        </div>
      ) : null}
      <MotionScan />
    </main>
  );
}

/** Skeleton that mirrors the page structure so the streamed swap doesn't shift
 *  the footer — blocks match the real layout heights per breakpoint. */
function ProductSkeleton() {
  const bar = "bg-wall-deep";
  return (
    <main className="relative" aria-busy="true">
      <div className="shell pb-24 pt-4 md:pb-32">
        <div className="min-h-11" />
        <div className="mt-4 grid items-start gap-10 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
            <div className={`aspect-[4/5] w-full ${bar}`} />
          </div>
          <div className="grid content-start gap-8 md:col-span-5 md:col-start-8">
            <div className="wall-label grid gap-3 p-5">
              <div className={`h-4 w-24 ${bar}`} />
              <div className={`h-14 w-3/4 ${bar}`} />
              <div className={`h-8 w-28 ${bar}`} />
            </div>
            <div className="grid gap-4">
              <div className={`h-5 w-full ${bar}`} />
              <div className={`h-5 w-5/6 ${bar}`} />
              <div className={`h-5 w-2/3 ${bar}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-11 w-40 ${bar}`} />
              <div className={`h-11 w-24 ${bar}`} />
            </div>
          </div>
        </div>
      </div>
      <section className="bg-wall-deep py-20 md:py-28" aria-hidden="true">
        <div className="shell grid gap-10 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-4">
            <div className="h-14 w-56 bg-wall" />
            <div className="mt-4 h-5 w-40 bg-wall" />
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <div className="h-40 w-full bg-wall" />
          </div>
        </div>
      </section>
      <section className="shell py-20 md:py-28" aria-hidden="true">
        <div className={`h-10 w-64 ${bar}`} />
        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="grid gap-3">
              <div className={`aspect-[4/5] w-full ${bar}`} />
              <div className={`h-5 w-2/3 ${bar}`} />
              <div className={`h-4 w-24 ${bar}`} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
