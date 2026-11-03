import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { MotionScan } from "@/components/motion-scan";
import { BuyingSection } from "@/components/shop/buying-section";
import { ColourIndex } from "@/components/shop/colour-index";
import { Hero } from "@/components/shop/hero";
import { PieceCard } from "@/components/shop/piece-card";
import { SplitWords } from "@/components/shop/split-words";
import { StudioSection } from "@/components/shop/studio-section";
import { VisitSection } from "@/components/shop/visit-section";
import { WorksWall } from "@/components/shop/works-wall";
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
      <Hero settings={settings} lead={lead} count={available} />

      <section id="works" aria-labelledby="works-title" className="shell scroll-mt-20 py-20 md:py-28">
        <div className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
          <SplitWords text="The works" id="works-title" className="display text-[clamp(3rem,8vw,8rem)] md:col-span-7" />
          <p className="caption md:col-span-4 md:col-start-9">
            Each photograph is the piece itself, shown as it hangs in the studio. A piece without a price is one to ask about.
          </p>
        </div>
        {ordered.length ? (
          <WorksWall products={ordered}>
            {ordered.map((product, index) => (
              <PieceCard key={product.id} product={product} index={index} priority={index < 2} />
            ))}
          </WorksWall>
        ) : (
          <p className="prose-serif py-20 text-ink-soft">New pieces are being photographed. Ask below to hear when they are ready.</p>
        )}
      </section>

      <ColourIndex products={ordered.filter((product) => product.images.length > 0)} />
      <StudioSection settings={settings} detail={detail} />
      <BuyingSection settings={settings} />
      <VisitSection settings={settings} />
      <MotionScan />
    </main>
  );
}
