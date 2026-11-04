import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { Hero } from "@/components/shop/hero";
import { WorksWall } from "@/components/shop/works-wall";
import { ColourIndex } from "@/components/shop/colour-index";
import { AtelierSection } from "@/components/shop/atelier-section";
import { AcquisitionFaq } from "@/components/shop/acquisition-faq";
import { CommissionForm } from "@/components/shop/commission-form";
import { getSettings, loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export default function HomePage() {
  return (
    <Suspense fallback={<main className="shell min-h-[80svh] py-24" aria-busy="true" />}>
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

      {/* 1. Asymmetric Curatorial Hero Exhibition */}
      <Hero settings={settings} lead={lead} count={available} />

      {/* 2. Staggered Studio Manifest Grid & Bespoke Patronage Callout */}
      <WorksWall products={ordered} />

      {/* 3. Studio Mineral Pigments Index Marquee */}
      <ColourIndex products={ordered.filter((product) => product.images.length > 0)} />

      {/* 4. The Maker's Credo, Hands at the Bench, Signature & Mysore Guild Wax Seal */}
      <AtelierSection detail={detail} />

      {/* 5. Deed of Transfer & Archival Crating Accordion FAQ */}
      <AcquisitionFaq />

      {/* 6. Direct Inquiry & Commission Waitlist Form */}
      <CommissionForm />

      <MotionScan />
    </main>
  );
}
