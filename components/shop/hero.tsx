"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "./currency-provider";
import { useFolio } from "./collectors-folio";
import { useDossier } from "./dossier-modal";
import { MacroLoupeImage } from "./macro-loupe";
import { PourCanvas } from "./pour-canvas";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

export function Hero({ settings, lead, count }: Props) {
  const { format } = useCurrency();
  const { toggleItem, hasItem, setIsOpen: setFolioOpen } = useFolio();
  const { openDossier } = useDossier();

  const cover = lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const title = lead ? pieceTitle(lead.title, lead.categorySlug, lead.attributes) : "Hand-Gouged Hardwood & Poured Pigment";
  const kind = lead ? pieceKind(lead.categoryName, lead.attributes) : "Original Studio Specimen";
  const dimensions = lead?.attributes?.dimensions || lead?.attributes?.size || "Dimensions on request";
  const priceFormatted = lead?.priceMinor ? format(lead.priceMinor) : "Ask for price";
  const inFolio = lead ? hasItem(lead.id) : false;

  return (
    <section className="hairline-b py-10 sm:py-16 lg:py-20 bg-linen">
      <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column (7 cols): Editorial Curatorial Manifesto & Studio Ledger */}
        <div className="lg:col-span-7 lg:pr-4 pt-2">
          {/* Archival Catalog Stamp */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-bone hairline-box mb-6">
            <span className="size-1.5 rounded-full bg-terracotta" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta font-bold">
              SERIES XI • AUTUMN BATCH // ARCHIVE FOLIO
            </span>
          </div>

          {/* Large Editorial Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] text-ink font-normal leading-[1.06] tracking-[-0.015em] mb-6">
            Objects shaped by sixty years of patience and <span className="italic font-normal text-terracotta">timber dust.</span>
          </h1>

          {/* 2-Sentence Slow-Craft Manifesto */}
          <p className="text-base sm:text-lg text-umber font-normal leading-[1.75] max-w-2xl mb-8 font-sans">
            Every canvas and carved piece in the studio begins as storm-felled hardwood or hand-ground mineral pigment before meeting the gouge or the pour. We make strictly one of each; when a work finds its custodian, its archive number is permanently retired into the studio ledger.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link
              href="/#works"
              className="px-7 py-4 bg-ink text-linen font-mono text-xs uppercase tracking-[0.16em] rounded-sm hover:bg-terracotta transition-colors shadow-sm"
            >
              Explore Available Archive ({count})
            </Link>

            {lead ? (
              <button
                type="button"
                onClick={() => openDossier(lead)}
                className="px-6 py-4 bg-bone hover:bg-boneDark text-ink font-mono text-xs uppercase tracking-[0.15em] rounded-sm hairline-box transition-colors cursor-pointer"
              >
                [Inspect Hero Specimen Dossier]
              </button>
            ) : null}
          </div>

          {/* Archival Provenance Ledger Table */}
          <div className="bg-bone hairline-box rounded-sm p-5 sm:p-6 max-w-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 hairline-b">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-umber">
                STUDIO PROVENANCE SPECIFICATION
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-moss font-bold flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-moss" />
                ONE-OF-ONE STUDIO ORIGINALS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">MASTER ARTISAN</p>
                <p className="font-serif text-xl font-semibold text-ink">Ajja Ramanand Rao</p>
                <p className="font-mono text-[11px] text-umber">B. 1949 • Master Craftsman</p>
              </div>
              <div className="sm:hairline-l sm:pl-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">EDITION POLICY</p>
                <p className="font-serif text-xl font-semibold text-ink">1 of 1 Unrepeatable</p>
                <p className="font-mono text-[11px] text-umber">Zero molds, CNC, or synthetics</p>
              </div>
              <div className="sm:hairline-l sm:pl-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">ARCHIVE LEDGER</p>
                <p className="font-serif text-xl font-semibold text-ink">Serial-Recorded</p>
                <p className="font-mono text-[11px] text-umber">Retired on acquisition</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Hero Specimen Spotlight Card */}
        <div className="lg:col-span-5">
          <div className="bg-bone hairline-box rounded-sm p-4 sm:p-5 shadow-[0_20px_50px_rgba(30,27,24,0.06)]">
            {/* Top Plate Header */}
            <div className="flex items-center justify-between pb-3 mb-3 hairline-b font-mono text-[10px] tracking-widest uppercase">
              <span className="text-ink font-bold">HERO SPECIMEN // FIG 01</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-moss/15 text-moss font-bold rounded-sm">EDITION 1 OF 1</span>
              </div>
            </div>

            {/* Specimen Photograph Stage */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-boneDark archival-vignette hairline-box">
              {cover ? (
                <>
                  <MacroLoupeImage
                    image={cover}
                    title={title}
                    ratio="4 / 3"
                    priority
                    onOpenDialog={() => {
                      if (lead) openDossier(lead);
                    }}
                  />
                  {src ? <PourCanvas src={src} focalX={focalX} focalY={focalY} /> : null}
                </>
              ) : src ? (
                <div className="relative size-full">
                  <Image
                    src={src}
                    alt={title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: `${focalX * 100}% ${(focalY ?? 0.5) * 100}%` }}
                  />
                  <PourCanvas src={src} focalX={focalX} focalY={focalY} />
                </div>
              ) : null}
            </div>

            {/* Specimen Title & Bench Story */}
            <div className="pt-4 pb-3 hairline-b">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h2 className="font-serif text-2xl sm:text-3xl text-ink font-medium leading-tight">
                  {title}
                </h2>
                <span className="font-mono text-sm font-bold text-ink">
                  {priceFormatted}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-umber leading-relaxed font-sans">
                {lead?.description ||
                  "A one-of-one studio piece. Ask the bench about its making and materials."}
              </p>
            </div>

            {/* Monospaced Specimen Metadata Block */}
            <div className="py-3 hairline-b font-mono text-[11px] text-umber leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-y-1">
                <span>Cat No. <strong className="text-ink">{lead?.slug ? lead.slug.toUpperCase() : "AJJA-SPECIMEN"}</strong></span>
                <span>•</span>
                <span>{kind}</span>
                <span>•</span>
                <span className="text-terracotta font-bold">1 of 1</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2.5 hairline-t text-[10px]">
                <div>
                  <span className="block text-umber/70 uppercase">DIMENSIONS</span>
                  <span className="text-ink font-medium">{dimensions}</span>
                </div>
                <div>
                  <span className="block text-umber/70 uppercase">PROVENANCE</span>
                  <span className="text-ink font-medium">Collegeville Studio</span>
                </div>
                <div>
                  <span className="block text-umber/70 uppercase">CUSTODY</span>
                  <span className="text-moss font-bold">Available</span>
                </div>
              </div>
            </div>

            {/* Hero Specimen Action Bar */}
            <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3">
              {lead ? (
                <button
                  type="button"
                  onClick={() => openDossier(lead)}
                  className="flex-1 py-2.5 px-4 bg-linen hover:bg-boneDark text-ink font-mono text-xs uppercase tracking-widest hairline-box rounded-sm transition-colors cursor-pointer text-center"
                >
                  [Inspect Dossier]
                </button>
              ) : null}

              {lead && lead.status !== "sold" ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleItem({
                      id: lead.id,
                      slug: lead.slug,
                      title,
                      priceMinor: lead.priceMinor,
                      imageUrl: cover?.url,
                      kind: kind || undefined,
                      dimensions,
                      stripeUrl: lead.attributes?.stripe_url,
                    });
                    if (!inFolio) setFolioOpen(true);
                  }}
                  className={`py-2.5 px-5 font-mono text-xs uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
                    inFolio ? "bg-moss text-linen" : "bg-terracotta hover:bg-terracottaDark text-linen"
                  }`}
                >
                  {inFolio ? "[✓ In Folio]" : "[+ Reserve Piece]"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
