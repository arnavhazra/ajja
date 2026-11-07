"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCurrency } from "./currency-provider";
import { hasRealTitle, pieceKind, pieceRef } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

type Props = { settings: ShopSettings; lead: PublicProduct | null; count: number };

type HeroLine = { text: string; stencilFirst: boolean };

/**
 * Break the headline at commas into stacked lines; each fragment over three
 * words chunks into pairs. The first word of the second-to-last fragment is
 * the key word and drops into the stencil cut ("poured" in the real copy).
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
      lines.push({ text: fragment + comma, stencilFirst: key });
      return;
    }
    for (let i = 0; i < words.length; i += 2) {
      const last = i + 2 >= words.length;
      lines.push({ text: words.slice(i, i + 2).join(" ") + (last ? comma : ""), stencilFirst: key && i === 0 });
    }
  });
  return lines;
}

function Line({ line, index }: { line: HeroLine; index: number }) {
  const style = { "--i": index } as CSSProperties;
  if (!line.stencilFirst) {
    return (
      <span className="hl-line">
        <span className="hl-word" style={style}>
          {line.text}
        </span>
      </span>
    );
  }
  const [first, ...rest] = line.text.split(" ");
  return (
    <span className="hl-line">
      <span className="hl-word" style={style}>
        <span className="sten">{first}</span> {rest.join(" ")}
      </span>
    </span>
  );
}

/** The piece: a stacked signage headline beside the hero photograph, which the
 *  pour settles onto once — a wet-edge drain, one pigment drip, one drawn thread. */
export function Hero({ settings, lead, count }: Props) {
  const { format } = useCurrency();

  const cover = lead?.images[0];
  const src = settings.heroImage || cover?.url || "";
  const focalX = settings.heroImage ? settings.heroFocalX : (cover?.focalX ?? 0.5);
  const focalY = settings.heroImage ? settings.heroFocalY : (cover?.focalY ?? 0.5);
  const named = lead ? hasRealTitle(lead.title) : false;
  const ref = lead ? pieceRef(lead.id) : "";
  const title = lead && named ? lead.title.trim() : ref ? `no. ${ref}` : "";
  const kind = lead ? pieceKind(lead.categoryName, lead.attributes) : null;
  const price = lead ? format(lead.priceMinor) : null;
  const sold = lead?.status === "sold";
  const lines = stackHeadline(settings.heroHeadline || "Objects shaped by patience, poured pigment, and timber.");
  const pigment = {
    "--pigment": lead?.pigment ?? "var(--sap)",
    "--pigment-ink": lead?.pigmentInk ?? "var(--wall)",
  } as CSSProperties;

  return (
    <>
      {/* turbulence edge for the one-time wet reveal */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id="wavedge" x="-10%" y="-10%" width="120%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.09" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="64" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <section className="hero" style={pigment}>
        <div className="hero-copy flex flex-col justify-center">
          <p className="kicker">fresh off the bench — a family studio in {settings.town}, {settings.region}</p>
          <h1 className="disp hero-h">
            {lines.map((line, index) => (
              <Line key={`${line.text}-${index}`} line={line} index={index} />
            ))}
          </h1>
          {settings.heroText ? <p className="hero-story">{settings.heroText}</p> : null}
          <div className="hero-cta">
            <Link className="ask" href="#inquire">
              ask the studio →
            </Link>
            <Link className="see" href="#works">
              see the works ↓
            </Link>
          </div>
          <div className="ledger" role="list">
            <div role="listitem">
              on the wall<b className="nums">{count}</b>
            </div>
            <div role="listitem">
              how to buy<b>ask first</b>
            </div>
            <div role="listitem">
              paid online<b>never</b>
            </div>
            <div role="listitem">
              photographed<b>as they are</b>
            </div>
          </div>
        </div>

        <div className="hero-media">
          <div className="ph">
            {src ? (
              <Image
                src={src}
                alt={cover?.alt || title || "A piece from the studio"}
                fill
                priority
                fetchPriority="high"
                quality={74}
                sizes="(min-width: 901px) 44vw, 100vw"
                className="object-cover"
                style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
              />
            ) : (
              <div className="grid h-full place-items-center bg-wall-deep">
                <span className="tag">nothing hung yet</span>
              </div>
            )}
          </div>
          <div className="wet" aria-hidden="true" />
          <div className="drip" aria-hidden="true" />
          {lead ? (
            <p className="hero-cap type">
              <span className="tick" aria-hidden="true" />
              <span>
                {title}
                {kind ? ` — ${kind}` : ""}
              </span>
              <em className="not-italic">{sold ? "sold" : (price ?? "price on asking")}</em>
              <Link
                href={`/p/${lead.slug}`}
                className="inline-flex min-h-11 items-center underline underline-offset-[3px]"
              >
                see the piece →
              </Link>
            </p>
          ) : null}
        </div>
      </section>
      <div className="thread" style={pigment} aria-hidden="true" />
    </>
  );
}
