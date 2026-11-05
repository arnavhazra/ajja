"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCurrency } from "./currency-provider";
import { PourCanvas } from "./pour-canvas";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

/** "The Museum Wall" — the page is the wall: hang-line, pin holes, matted frame, museum label. */
export function Hero({ settings, lead, count }: Props) {
  const { format } = useCurrency();

  const cover = lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const title = lead ? pieceTitle(lead.title, lead.categorySlug, lead.attributes, lead.id) : "";
  const kind = lead ? pieceKind(lead.categoryName, lead.attributes) : null;
  const dimensions = lead?.attributes?.dimensions || lead?.attributes?.size || "";
  const price = lead ? format(lead.priceMinor) : null;
  const sold = lead?.status === "sold";

  return (
    <section
      className="hairline-b relative overflow-hidden"
      style={{ "--pour": lead?.pigment ?? "var(--cobalt)" } as CSSProperties}
    >
      {/* pencil hang-line across the whole wall — sits behind the hung frame */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[54%] z-0 h-px bg-line" />

      <div className="shell relative z-10 grid min-h-[88svh] grid-rows-[auto_1fr_auto] py-8 md:py-10">
        {/* Wordmark row */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="display font-extrabold text-[clamp(4.5rem,15vw,12rem)]">
            {settings.businessName}
            <span className="text-pour">.</span>
          </h1>
          <p className="caption max-w-56 pb-4 text-right text-xl md:text-2xl">
            a family studio in {settings.town}, {settings.region}
          </p>
        </div>

        {/* Hung piece + wall label */}
        <div className="relative flex items-center py-8 md:py-10">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-6 md:grid-cols-[minmax(0,34rem)_16rem] md:gap-10">
            {/* Framed piece on the hang-line */}
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute -top-3 left-8 size-1.5 rounded-full bg-pour"
                style={{ boxShadow: "0 0 0 3px color-mix(in srgb, var(--pour) 20%, transparent)" }}
              />
              <span
                aria-hidden="true"
                className="absolute -top-3 right-8 size-1.5 rounded-full bg-pour"
                style={{ boxShadow: "0 0 0 3px color-mix(in srgb, var(--pour) 20%, transparent)" }}
              />
              <div className="plate-mark relative bg-card p-4 shadow-[0_24px_60px_-20px_rgba(15,18,22,0.45)] sm:p-6 md:p-8">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-plate">
                  {src ? (
                    <>
                      <Image
                        src={src}
                        alt={title || "A piece from the studio"}
                        fill
                        priority
                        fetchPriority="high"
                        quality={72}
                        sizes="(min-width: 768px) 34rem, 90vw"
                        className="object-cover"
                        style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
                      />
                      <PourCanvas src={src} focalX={focalX} focalY={focalY} />
                    </>
                  ) : (
                    <div className="grid h-full place-items-center">
                      <span className="tag">Nothing hung yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Museum wall label + ledger stats, both on the label's grid */}
            <div className="grid gap-4 self-start md:-ml-2">
              {lead ? (
                <div className="wall-label grid gap-3 p-5">
                  <p className="tag">{sold ? "Sold" : "In the studio"}</p>
                  <p className="caption text-2xl leading-tight text-ink">{title}</p>
                  <dl className="grid gap-1.5 text-xs text-ink-soft">
                    {kind ? (
                      <div className="flex justify-between gap-4">
                        <dt className="tag">Medium</dt>
                        <dd>{kind}</dd>
                      </div>
                    ) : null}
                    {dimensions ? (
                      <div className="flex justify-between gap-4">
                        <dt className="tag">Size</dt>
                        <dd>{dimensions}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4">
                      <dt className="tag">Price</dt>
                      <dd className="nums text-ink">{sold ? "Sold" : (price ?? "Ask for the price")}</dd>
                    </div>
                  </dl>
                  <Link
                    href={sold ? `/p/${lead.slug}` : `/p/${lead.slug}#enquire`}
                    className="tag mt-1 inline-flex min-h-11 items-center gap-2 text-cobalt"
                  >
                    {sold ? "See the piece" : "Ask about this piece"} →
                  </Link>
                </div>
              ) : null}

              {/* ledger stats, aligned to the label's width */}
              <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4 pl-5">
                <div>
                  <dt className="tag">On the wall</dt>
                  <dd className="display mt-1 text-3xl nums">{count}</dd>
                </div>
                <div>
                  <dt className="tag">How to buy</dt>
                  <dd className="caption mt-1 text-2xl text-ink">Ask first</dd>
                </div>
                <div>
                  <dt className="tag">Paid online</dt>
                  <dd className="caption mt-1 text-2xl text-ink">Never</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Bottom rail */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="tag">
            {settings.heroText ? null : null}
            Photographed as they are — nothing is paid online
          </p>
          <div className="flex items-center gap-5">
            <Link href="/#inquire" className="tag inline-flex min-h-11 items-center">
              Ask the studio
            </Link>
            <Link href="/#works" className="tag inline-flex min-h-11 items-center gap-2 bg-ink px-5 text-gesso">
              See the works ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
