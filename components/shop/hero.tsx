"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCurrency } from "./currency-provider";
import { hasRealTitle, pieceKind, pieceRef } from "@/lib/piece-title";
import { pourData, pourOf } from "@/lib/pour";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

const PourCanvas = dynamic(() => import("./pour-canvas").then((mod) => mod.PourCanvas), { ssr: false });

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

type HeroLine = { text: string; keyFirst: boolean };

/**
 * Break the headline at commas into stacked lines; fragments over three words
 * chunk into pairs. The first word of the second-to-last fragment is the key
 * word and is set wet — italic, in the lead piece's pigment ("poured").
 */
function stackHeadline(headline: string): HeroLine[] {
  const fragments = headline
    .split(",")
    .map((fragment) => fragment.trim())
    .filter(Boolean);
  const lines: HeroLine[] = [];
  fragments.forEach((fragment, index) => {
    const key = fragments.length > 1 && index === fragments.length - 2;
    const comma = index < fragments.length - 1 ? "," : "";
    const words = fragment.split(/\s+/);
    if (words.length <= 3) {
      lines.push({ text: fragment + comma, keyFirst: key });
      return;
    }
    for (let i = 0; i < words.length; i += 2) {
      const last = i + 2 >= words.length;
      lines.push({ text: words.slice(i, i + 2).join(" ") + (last ? comma : ""), keyFirst: key && i === 0 });
    }
  });
  return lines;
}

function Line({ line, index }: { line: HeroLine; index: number }) {
  const style = { "--i": index } as CSSProperties;
  const [first, ...rest] = line.text.split(" ");
  return (
    <span className="pr-hl-line">
      <span className="pr-hl-word" style={style}>
        {line.keyFirst ? (
          <>
            <em className="pr-wet">{first}</em> {rest.join(" ")}
          </>
        ) : (
          line.text
        )}
      </span>
    </span>
  );
}

/** The first painting: the hero photograph hung at its own shape, the wall title beside it. */
export function Hero({ settings, lead, count }: Props) {
  const { format } = useCurrency();

  const cover = lead?.images.find((image) => image.url === settings.heroImage) ?? lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const ratio = cover?.width && cover?.height && cover.url === src ? cover.width / cover.height : 4 / 5;
  const named = lead ? hasRealTitle(lead.title) : false;
  const title = lead ? (named ? lead.title.trim() : `No. ${pieceRef(lead.id)}`) : "";
  const kind = lead ? pieceKind(lead.categoryName, lead.attributes) : null;
  const sold = lead?.status === "sold";
  const price = lead && !sold ? format(lead.priceMinor) : null;
  const lines = stackHeadline(settings.heroHeadline || "Objects shaped by patience, poured pigment, and timber.");
  const pour = pourOf(lead?.pigment, lead?.pigmentInk);

  return (
    <section id="hero" className="pr-hero shell" aria-labelledby="hero-title" {...pourData(pour)}>
      <figure className="pr-hero-media" style={{ "--ratio": ratio } as CSSProperties}>
        <div className="pr-hero-frame">
          {src ? (
            <>
              <Image
                src={src}
                alt={cover?.alt || title || "A piece from the studio"}
                fill
                priority
                fetchPriority="high"
                quality={74}
                sizes="(min-width: 960px) 56vw, 100vw"
                className="object-cover"
                style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
              />
              <PourCanvas src={src} focalX={focalX} focalY={focalY} />
            </>
          ) : (
            <div className="grid h-full place-items-center bg-wall-deep">
              <span className="pr-label">nothing hung yet</span>
            </div>
          )}
        </div>
        {lead ? (
          <figcaption className="pr-hero-cap">
            <span className="pr-dot" aria-hidden="true" style={{ background: pour.pour }} />
            <Link href={`/p/${lead.slug}`} className="pr-hero-cap-title">
              {title}
              {kind ? <span className="pr-cap-kind">, {kind}</span> : null}
            </Link>
            <span className="pr-cap-price nums">{sold ? "Sold" : (price ?? "Ask for the price")}</span>
          </figcaption>
        ) : null}
      </figure>

      <div className="pr-hero-copy">
        <p className="pr-label">
          {settings.businessName} — {settings.town}, {settings.region}
        </p>
        <h1 id="hero-title" className="pr-hero-title">
          {lines.map((line, index) => (
            <Line key={`${line.text}-${index}`} line={line} index={index} />
          ))}
        </h1>
        {settings.heroText ? <p className="pr-hero-text">{settings.heroText}</p> : null}
        <dl className="pr-hero-facts">
          <div>
            <dt>On the wall</dt>
            <dd className="nums">
              {count} {count === 1 ? "work" : "works"} available
            </dd>
          </div>
          <div>
            <dt>Studio</dt>
            <dd>
              {settings.town}, {settings.region}
            </dd>
          </div>
        </dl>
        <div className="pr-hero-actions">
          <Link href="#works" className="pr-btn">
            See the works <span aria-hidden="true">↓</span>
          </Link>
          <Link href="#inquire" className="pr-link">
            Commission a piece
          </Link>
        </div>
      </div>
    </section>
  );
}
