"use client";

import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "./currency-provider";
import { PourCanvas } from "./pour-canvas";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

export function Hero({ settings, lead, count }: Props) {
  const { format } = useCurrency();

  const cover = lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const title = lead ? pieceTitle(lead.title, lead.categorySlug, lead.attributes) : "";
  const kind = lead ? pieceKind(lead.categoryName, lead.attributes) : null;
  const dimensions = lead?.attributes?.dimensions || lead?.attributes?.size || "";
  const priceFormatted = lead?.priceMinor ? format(lead.priceMinor) : null;

  return (
    <section className="hairline-b py-10 sm:py-16 lg:py-20 bg-linen">
      <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-7 lg:pr-4 pt-2">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="size-1.5 rounded-full bg-terracotta" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta font-bold">
              Made by hand in {settings.town}, {settings.region}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] text-ink font-normal leading-[1.06] tracking-[-0.015em] mb-6">
            {settings.heroHeadline}
          </h1>

          <p className="text-base sm:text-lg text-umber font-normal leading-[1.75] max-w-2xl mb-8 font-sans">
            {settings.heroText}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link
              href="/#works"
              className="px-7 py-4 bg-ink text-linen font-mono text-xs uppercase tracking-[0.16em] rounded-sm hover:bg-terracotta transition-colors shadow-sm"
            >
              See the works ({count})
            </Link>

            {lead ? (
              <Link
                href={`/p/${lead.slug}`}
                className="px-6 py-4 bg-bone hover:bg-boneDark text-ink font-mono text-xs uppercase tracking-[0.15em] rounded-sm hairline-box transition-colors"
              >
                See this piece
              </Link>
            ) : null}
          </div>

          <div className="bg-bone hairline-box rounded-sm p-5 sm:p-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">The maker</p>
                <p className="font-serif text-xl font-semibold text-ink">{settings.ownerName}</p>
                <p className="font-mono text-[11px] text-umber">{settings.town}, {settings.region}</p>
              </div>
              <div className="sm:hairline-l sm:pl-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">The pieces</p>
                <p className="font-serif text-xl font-semibold text-ink nums">{count} in the studio</p>
                <p className="font-mono text-[11px] text-umber">Photographed as they are</p>
              </div>
              <div className="sm:hairline-l sm:pl-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-umber mb-1">How to buy</p>
                <p className="font-serif text-xl font-semibold text-ink">Ask first</p>
                <p className="font-mono text-[11px] text-umber">Nothing is paid online</p>
              </div>
            </div>
          </div>
        </div>

        {lead ? (
          <div className="lg:col-span-5">
            <div className="bg-bone hairline-box rounded-sm p-4 sm:p-5 shadow-[0_20px_50px_rgba(30,27,24,0.06)]">
              <div className="flex items-center justify-between pb-3 mb-3 hairline-b font-mono text-[10px] tracking-widest uppercase">
                <span className="text-ink font-bold">{kind || "Studio piece"}</span>
                <span className={lead.status === "sold" ? "px-2 py-0.5 bg-sold/15 text-sold font-bold rounded-sm" : "px-2 py-0.5 bg-moss/15 text-moss font-bold rounded-sm"}>
                  {lead.status === "sold" ? "Sold" : lead.quantity === 1 ? "One of one" : "In the studio"}
                </span>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-boneDark archival-vignette hairline-box">
                {src ? (
                  <>
                    <Image
                      src={src}
                      alt={title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover"
                      style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
                    />
                    <PourCanvas src={src} focalX={focalX} focalY={focalY} />
                  </>
                ) : null}
              </div>

              <div className="pt-4 pb-3 hairline-b">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h2 className="font-serif text-2xl sm:text-3xl text-ink font-medium leading-tight">
                    <Link href={`/p/${lead.slug}`} className="hover:text-terracotta transition-colors">
                      {title}
                    </Link>
                  </h2>
                  <span className="font-mono text-sm font-bold text-ink">
                    {priceFormatted ?? "Ask for price"}
                  </span>
                </div>
                {lead.description ? (
                  <p className="text-xs sm:text-sm text-umber leading-relaxed font-sans line-clamp-2">
                    {lead.description}
                  </p>
                ) : null}
              </div>

              <div className="py-3 hairline-b font-mono text-[11px] text-umber leading-relaxed">
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {dimensions ? (
                    <div>
                      <span className="block text-umber uppercase">Size</span>
                      <span className="text-ink font-medium">{dimensions}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="block text-umber uppercase">Where</span>
                    <span className="text-ink font-medium">{settings.town} studio</span>
                  </div>
                  <div>
                    <span className="block text-umber uppercase">Status</span>
                    <span className="text-moss font-bold">{lead.status === "sold" ? "Sold" : "Available"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5">
                <Link
                  href={`/p/${lead.slug}#enquire`}
                  className="block w-full py-2.5 px-4 bg-terracotta hover:bg-terracottaDark text-linen font-mono text-xs uppercase tracking-widest rounded-sm transition-colors text-center"
                >
                  Ask about this piece
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
