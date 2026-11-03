import Link from "next/link";
import { CustodialAccordion } from "@/components/custodial-accordion";
import { EnquiryForm } from "@/components/enquiry-form";
import { HeroSpecimen } from "@/components/hero-specimen";
import { JsonLd } from "@/components/json-ld";
import { FolioWalk } from "@/components/folio-walk";
import { ManifestGrid } from "@/components/manifest-grid";
import { getSettings, loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

function HeroHeadline({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <h1
      aria-label={text}
      className="font-serif text-5xl font-medium leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[4.6rem]"
    >
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i} className="hero-word mask-line">
            <span className="hero-word-inner mask-line-inner">
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        ))}
      </span>
    </h1>
  );
}

function MaskedWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span aria-label={text} className={className} data-mask>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={i} className="mask-line">
            <span className="mask-line-inner">
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

function ScrubWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span data-scrub-words>
      {words.map((word, i) => (
        <span key={i} className="scrub-word">
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

export default async function HomePage() {
  const [settings, manifest] = await Promise.all([getSettings(), loadManifest()]);
  const hero =
    manifest.find((product) => product.images[0]?.url === settings.heroImage) ??
    manifest.find((product) => product.categorySlug === "paintings") ??
    manifest[0] ??
    null;

  return (
    <main>
      <div data-motion="intro" className="intro-veil" aria-hidden="true">
        <span data-motion="intro-stamp" className="intro-stamp">
          <span className="font-serif text-3xl font-medium text-ink">Ajja</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-umber">
            Archive Folio · Collegeville
          </span>
        </span>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: settings.businessName,
          address: {
            "@type": "PostalAddress",
            addressLocality: settings.town,
            addressRegion: settings.region,
            addressCountry: "US",
            streetAddress: settings.address || undefined,
          },
          url: siteUrl(),
          image: hero?.images[0]?.url || settings.heroImage || undefined,
          telephone: settings.phone || undefined,
        }}
      />

      <section
        data-motion="hero"
        className="hairline-b px-4 py-10 sm:py-14 md:px-8 lg:py-16"
        aria-label="Archive introduction"
      >
        <div className="mx-auto grid max-w-[1440px] items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p
              data-motion="hero-stamp"
              className="inline-flex items-center gap-2 rounded-sm bg-bone px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-terracotta hairline-box"
            >
              Archive Folio · {settings.town} Studio
            </p>
            <div className="mt-5">
              <HeroHeadline text={settings.heroHeadline} />
            </div>
            {settings.heroText ? (
              <p
                data-motion="hero-manifesto"
                className="mt-6 max-w-xl text-base leading-relaxed text-umber sm:text-lg"
              >
                {settings.heroText}
              </p>
            ) : null}
            <div data-motion="hero-ctas" className="mt-8 flex flex-wrap gap-3">
              <a href="#manifest-grid" className="btn btn-primary" data-magnetic="0.3">
                Explore the archive
              </a>
              {hero ? (
                <Link href={`/p/${hero.slug}`} className="btn btn-secondary" data-magnetic="0.3">
                  Inspect hero specimen
                </Link>
              ) : null}
            </div>

            <div data-motion="hero-ledger" className="mt-10 max-w-xl rounded-sm bg-bone hairline-box">
              <div className="grid grid-cols-3 divide-x divide-[var(--hairline)]">
                <div className="p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-umber">Studio</p>
                  <p className="mt-1 font-mono text-[11px] font-bold text-ink">
                    {settings.town}, {settings.region}
                  </p>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-umber">Holdings</p>
                  <p className="mt-1 font-mono text-[11px] font-bold text-ink">
                    {manifest.length} {manifest.length === 1 ? "piece" : "pieces"} · 1 of 1 each
                  </p>
                </div>
                <div className="p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-umber">Acquisition</p>
                  <p className="mt-1 font-mono text-[11px] font-bold text-ink">Direct enquiry</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5" data-motion="hero-specimen">
            {hero ? <HeroSpecimen product={hero} /> : null}
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="contents">
              {[
                "Original poured paintings",
                "Handcrafted woodwork",
                "Collegeville, Pennsylvania",
                "Every piece one of one",
                "Direct studio enquiry",
                "No cart · No checkout",
              ].map((item) => (
                <span key={item} className="marquee-item">
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <FolioWalk products={manifest} />

      <div data-reveal className="px-4 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <ManifestGrid products={manifest} />
        </div>
      </div>

      <section id="studio-note" data-reveal className="hairline-b px-4 py-16 sm:py-24 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta">
            A note from the studio
          </p>
          <blockquote className="mt-6 font-serif text-2xl italic leading-relaxed text-ink sm:text-3xl">
            <ScrubWords text={settings.story} />
          </blockquote>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-umber">
            {settings.ownerName} · {settings.town}, {settings.region}
          </p>
        </div>
      </section>

      <div data-reveal className="px-4 md:px-8">
        <CustodialAccordion />
      </div>

      <section id="inquiry-section" data-reveal className="px-4 py-16 sm:py-20 md:px-8">
        <div className="mx-auto max-w-2xl rounded-sm bg-bone p-6 hairline-box sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta">
            SEC-04 // Direct studio line
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-ink sm:text-4xl">
            <MaskedWords text="Write to the studio" />
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-umber">
            Ask about a piece, arrange a private inspection in {settings.town}, or commission a
            work. Messages go straight to the family — nothing is bought on this site.
          </p>
          <EnquiryForm />
        </div>
      </section>
    </main>
  );
}
