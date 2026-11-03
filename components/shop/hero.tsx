import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { formatMoney } from "@/lib/money";
import { pieceTitle } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";
import { PourCanvas } from "./pour-canvas";
import { SplitWords } from "./split-words";

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

export function Hero({ settings, lead, count }: Props) {
  const cover = lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const showsLead = Boolean(lead && (!settings.heroImage || lead.images.some((image) => image.url === settings.heroImage)));
  const title = lead ? pieceTitle(lead.title, lead.categorySlug, lead.attributes) : null;
  const price = lead && lead.status !== "sold" ? formatMoney(lead.priceMinor, lead.currency) : null;
  return (
    <section
      data-intro=""
      aria-labelledby="hero-title"
      className="relative -mt-16 overflow-hidden pt-16 md:-mt-20 md:pt-20"
      style={
        lead ? ({ "--pour": lead.pigment, "--pour-ink": lead.pigmentInk } as CSSProperties) : undefined
      }
    >
      <div className="shell grid gap-8 pb-14 pt-6 md:grid-cols-12 md:gap-6 md:pb-20 md:pt-10">
        <div className="flex flex-col justify-center gap-12 md:col-span-6 md:pb-10 lg:col-span-5">
          <div>
            <p className="caption" data-reveal="">
              {settings.town}, {settings.region}
            </p>
            <SplitWords
              as="h1"
              id="hero-title"
              text={settings.heroHeadline}
              className="display mt-5 text-[clamp(3rem,6.4vw,7rem)]"
            />
          </div>
          <div className="grid gap-7" data-reveal="">
            <p className="prose-serif measure text-ink-soft">{settings.heroText}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/#works" className="btn btn-primary">
                See the works{count ? <span className="nums text-gesso/60">{count}</span> : null}
              </Link>
              <Link href="/#visit" className="btn btn-secondary">
                Ask a question
              </Link>
            </div>
          </div>
        </div>

        <figure className="relative md:col-span-6 lg:col-span-7">
          <div
            data-unveil=""
            className="plate relative aspect-[4/5] w-full md:aspect-auto md:h-[min(calc(100svh-9rem),860px)] md:min-h-[520px]"
          >
            {src ? (
              <>
                <Image
                  src={src}
                  alt={showsLead ? cover?.alt || title || settings.businessName : `A poured painting from the ${settings.businessName} studio`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
                  placeholder={cover?.blurData && !settings.heroImage ? "blur" : "empty"}
                  blurDataURL={cover?.blurData ?? undefined}
                  className="object-cover"
                  style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
                />
                <PourCanvas src={src} focalX={focalX} focalY={focalY} />
              </>
            ) : (
              <div className="absolute inset-0 bg-pour" />
            )}
          </div>
          {lead && title && showsLead ? (
            <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1" data-reveal="">
              <Link href={`/p/${lead.slug}`} className="inline-flex min-h-11 items-center gap-3">
                <span aria-hidden="true" className="size-3 rounded-full bg-pour" />
                <span className="ink-link font-[560]">{title}</span>
              </Link>
              <span className="caption nums">{lead.status === "sold" ? "Sold" : (price ?? "Ask for the price")}</span>
            </figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
