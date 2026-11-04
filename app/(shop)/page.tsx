import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { Hero } from "@/components/shop/hero";
import { WorksWall } from "@/components/shop/works-wall";
import { ColourIndex } from "@/components/shop/colour-index";
import { StudioIntro } from "@/components/shop/studio-intro";
import { AcquisitionFaq } from "@/components/shop/acquisition-faq";
import { CommissionForm } from "@/components/shop/commission-form";
import { getSettings, loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

function ShopSkeleton() {
  return (
    <main className="shell min-h-[80svh] py-24" aria-busy="true" aria-label="Loading the shop">
      <div className="grid animate-pulse gap-10 lg:grid-cols-2">
        <div className="h-[60svh] bg-bone" />
        <div className="grid content-start gap-4 py-8">
          <div className="h-4 w-24 bg-bone-dark" />
          <div className="h-12 w-3/4 bg-bone-dark" />
          <div className="h-4 w-full bg-bone" />
          <div className="h-4 w-2/3 bg-bone" />
          <div className="mt-6 h-11 w-40 bg-bone-dark" />
        </div>
      </div>
      <div className="mt-24 grid animate-pulse grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="grid gap-3">
            <div className="aspect-[4/5] bg-bone" />
            <div className="h-4 w-3/4 bg-bone" />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const [settings, products] = await Promise.all([getSettings(), loadManifest()]);
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

      <AcquisitionFaq />

      <CommissionForm responseNote={settings.responseNote} />

      <MotionScan />
    </main>
  );
}
