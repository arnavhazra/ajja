import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { Hero } from "@/components/shop/hero";
import { WorksWall } from "@/components/shop/works-wall";
import { ColourIndex } from "@/components/shop/colour-index";
import { StudioIntro } from "@/components/shop/studio-intro";
import { AcquisitionFaq } from "@/components/shop/acquisition-faq";
import { CommissionForm } from "@/components/shop/commission-form";
import { enquiryPrefillMessage, parsePiecesParam } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { pieceTitle } from "@/lib/piece-title";
import { getSettings, loadManifest, loadSaved } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

function ShopSkeleton() {
  return (
    <main className="shell min-h-[80svh] py-24" aria-busy="true" aria-label="Loading the shop">
      <div className="grid animate-pulse gap-10 lg:grid-cols-2">
        <div className="h-[60svh] bg-wall-deep" />
        <div className="grid content-start gap-4 py-8">
          <div className="h-4 w-24 bg-wall-sink" />
          <div className="h-12 w-3/4 bg-wall-sink" />
          <div className="h-4 w-full bg-wall-deep" />
          <div className="h-4 w-2/3 bg-wall-deep" />
          <div className="mt-6 h-11 w-40 bg-wall-sink" />
        </div>
      </div>
      <div className="mt-24 grid animate-pulse grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ArtGallery",
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

      <Hero settings={settings} lead={lead} count={available} />

      <WorksWall products={ordered} />

      <ColourIndex products={ordered.filter((product) => product.images.length > 0)} />

      <StudioIntro settings={settings} detail={detail} />

      <AcquisitionFaq settings={settings} />

      <CommissionForm responseNote={settings.responseNote} initialMessage={initialMessage} />

      <a className="ask-chip no-print" href="#inquire">
        ask →
      </a>

      <MotionScan />
    </main>
  );
}
