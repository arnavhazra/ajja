import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { Hero } from "@/components/shop/hero";
import { PourMotion } from "@/components/shop/pour-motion";
import { WorksWall } from "@/components/shop/works-wall";
import { ColourIndex } from "@/components/shop/colour-index";
import { StudioIntro } from "@/components/shop/studio-intro";
import { AcquisitionFaq } from "@/components/shop/acquisition-faq";
import { CommissionForm } from "@/components/shop/commission-form";
import { PourFooter } from "@/components/shop/pour-footer";
import { enquiryPrefillMessage, parsePiecesParam } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { hasRealTitle, pieceKind, pieceRef } from "@/lib/piece-title";
import { pourCss, pourData, pourOf } from "@/lib/pour";
import { getSettings, loadManifest, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import type { FolioItem } from "@/components/shop/collectors-folio";
import type { PublicProduct, PublicImage } from "@/lib/types";

function ShopSkeleton() {
  return (
    <main className="shell min-h-[80svh] py-24" aria-busy="true" aria-label="Loading the shop">
      <div className="grid animate-pulse gap-10 lg:grid-cols-12">
        <div className="aspect-[4/5] bg-wall-deep lg:col-span-7 lg:row-span-2" />
        <div className="grid content-start gap-4 py-8 lg:col-span-5">
          <div className="h-4 w-40 bg-wall-sink" />
          <div className="h-16 w-full bg-wall-sink" />
          <div className="h-16 w-3/4 bg-wall-sink" />
          <div className="h-4 w-full bg-wall-deep" />
          <div className="h-4 w-2/3 bg-wall-deep" />
          <div className="mt-6 h-11 w-40 bg-sap" />
        </div>
        <div className="h-24 bg-wall-deep lg:col-span-5" />
      </div>
      <div className="mt-24 grid animate-pulse grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="grid gap-3">
            <div className="aspect-[4/5] bg-wall-deep" />
            <div className="h-4 w-3/4 bg-wall-sink" />
          </div>
        ))}
      </div>
    </main>
  );
}

function pieceLabel(product: PublicProduct) {
  return hasRealTitle(product.title) ? product.title.trim() : `No. ${pieceRef(product.id)}`;
}

function folioItem(product: PublicProduct): FolioItem {
  const cover: PublicImage | undefined = product.images[0];
  const kind = pieceKind(product.categoryName, product.attributes);
  return {
    id: product.id,
    slug: product.slug,
    title: pieceLabel(product),
    priceMinor: product.priceMinor,
    imageUrl: cover?.url,
    kind: kind ?? undefined,
    dimensions: product.attributes.dimensions || product.attributes.size || "",
  };
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pieceSlugs = parsePiecesParam(Array.isArray(params.pieces) ? params.pieces[0] : params.pieces);
  const [settings, products, saved] = await Promise.all([getSettings(), loadManifest(), loadSaved(pieceSlugs)]);

  const ordered = [...products].sort((a, b) => {
    if (a.status === "sold" && b.status !== "sold") return 1;
    if (b.status === "sold" && a.status !== "sold") return -1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return 0;
  });
  const lead =
    ordered.find((product) => product.images.some((image) => image.url === settings.heroImage)) ??
    ordered.find((product) => product.images.length > 0) ??
    null;
  const detail = ordered.find((product) => product.id !== lead?.id && product.images.length > 0) ?? lead;
  const available = products.filter((product) => product.status !== "sold").length;
  const initialMessage = saved.length
    ? enquiryPrefillMessage(
        saved.map((product) => ({
          title: pieceLabel(product),
          slug: product.slug,
          priceMinor: product.priceMinor,
        })),
        (minor) => formatMoney(minor, settings.currency),
      )
    : undefined;
  const leadPour = pourOf(lead?.pigment, lead?.pigmentInk);
  const savedItems = saved.map(folioItem);

  return (
    <main className="pour-room">
      <style>{`html{${pourCss(leadPour)}}`}</style>
      <PourMotion />
      <div className="contents">
        <Hero settings={settings} lead={lead} count={available} />
        <WorksWall products={ordered} />
        <ColourIndex products={ordered.filter((product) => product.images.length > 0)} />
        <StudioIntro settings={settings} detail={detail} />
        <AcquisitionFaq settings={settings} />

        <section
          id="inquire"
          className="pr-section pr-enquire shell scroll-mt-[60px]"
          aria-labelledby="inquire-title"
          {...(detail ? pourData(pourOf(detail.pigment, detail.pigmentInk)) : {})}
        >
          <div className="pr-enquire-copy">
            <p className="pr-label">Ask the studio</p>
            <h2 id="inquire-title" className="pr-h2" data-reveal="">
              Send a note
            </h2>
            <p className="pr-lede">Tell us which piece, or describe what you would like made. Messages go straight to the studio.</p>
            <p className="pr-enquire-note">Studio visits are by appointment in {settings.town}, {settings.region} — mention it in your note.</p>
            <dl className="pr-facts">
              {settings.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a className="pr-link" href={`mailto:${settings.email}`}>
                      {settings.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {settings.phone ? (
                <div>
                  <dt>Phone</dt>
                  <dd className="nums">{settings.phone}</dd>
                </div>
              ) : null}
              {settings.mapUrl ? (
                <div>
                  <dt>Map</dt>
                  <dd>
                    <a className="pr-link" href={settings.mapUrl} rel="noopener noreferrer">
                      {settings.town}, {settings.region}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="pr-enquire-form">
            <CommissionForm responseNote={settings.responseNote} initialMessage={initialMessage} saved={savedItems} />
          </div>
        </section>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": ["ArtGallery", "Store"],
          name: settings.businessName,
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

      <PourFooter settings={settings} />

      <a className="pr-chip-cta no-print" href="#inquire" aria-label="Ask the studio">
        ask <span aria-hidden="true">→</span>
      </a>

      <MotionScan />
    </main>
  );
}
