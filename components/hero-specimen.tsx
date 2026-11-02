"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { pieceTitle } from "./product-card";
import { useSaved } from "./saved-context";
import { SpecimenCanvas } from "./specimen-canvas";
import type { PublicProduct } from "@/lib/types";

export function HeroSpecimen({ product }: { product: PublicProduct }) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(product.slug);
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, bgX: 50, bgY: 50 });
  const [loupeLocked, setLoupeLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const image = product.images[0];
  const price = product.priceMinor != null ? formatMoney(product.priceMinor, product.currency) : null;
  const title = pieceTitle(product.title, product.categorySlug, product.attributes);
  const medium = product.attributes?.medium || "Studio piece";

  const updateLoupe = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    setLoupePos({ x, y, bgX, bgY });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loupeLocked) return;
    setLoupeActive(true);
    updateLoupe(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!loupeLocked) {
      setLoupeActive(true);
      updateLoupe(e.clientX, e.clientY);
    }
  };

  const handleMouseLeave = () => {
    if (!loupeLocked) {
      setLoupeActive(false);
    }
  };

  const toggleLoupeLock = () => {
    if (!loupeActive && !loupeLocked) {
      // Default to center if activated via button
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setLoupePos({
          x: rect.width / 2,
          y: rect.height / 2,
          bgX: 50,
          bgY: 50,
        });
      }
      setLoupeActive(true);
      setLoupeLocked(true);
    } else {
      setLoupeLocked(!loupeLocked);
      if (loupeLocked) {
        setLoupeActive(false);
      }
    }
  };

  return (
    <div className="weave-overlay bg-bone hairline-box rounded-sm p-4 sm:p-5 shadow-[0_20px_50px_rgba(30,27,24,0.05)]">
      {/* Top Specimen Plate Header */}
      <div className="flex items-center justify-between pb-3 mb-3 hairline-b font-mono text-[10px] tracking-widest uppercase">
        <span className="text-ink font-bold">HERO SPECIMEN // AJJA ARCHIVE</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLoupeLock}
            className={`px-2 py-0.5 rounded-sm hairline-box font-mono text-[10px] uppercase transition-colors cursor-pointer ${
              loupeLocked
                ? "bg-terracotta text-linen border-terracotta"
                : "bg-linen text-ink hover:bg-terracotta hover:text-linen"
            }`}
            title="Toggle 2.5x Magnifying Grain Loupe"
          >
            {loupeLocked ? "[LOUPE PINNED]" : "[2.5× LOUPE]"}
          </button>
          <span className="px-2 py-0.5 bg-moss/15 text-moss font-bold rounded-sm">EDITION 1 OF 1</span>
        </div>
      </div>

      {/* Interactive Hero Image Container with 2.5x Macro Grain Loupe */}
      <div
        ref={containerRef}
        id="heroImageContainer"
        data-cursor="Loupe"
        className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-bone-dark cursor-crosshair select-none archival-vignette deckled-b"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || `${title} in natural daylight.`}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
          />
        ) : null}
        {image ? <SpecimenCanvas src={image.url} focalX={image.focalX} focalY={image.focalY} /> : null}

        {/* Floating Caption Badge */}
        <div className="absolute top-3 left-3 bg-linen/90 backdrop-blur-sm px-2.5 py-1 rounded-sm hairline-box pointer-events-none z-10">
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink">
            FIG 01. {medium} — hover for grain loupe
          </span>
        </div>

        {/* Magnifying Loupe Lens */}
        {image ? (
          <div
            className={`loupe-lens ${loupeActive ? "active" : ""}`}
            style={{
              left: `${loupePos.x}px`,
              top: `${loupePos.y}px`,
              backgroundImage: `url(${image.url})`,
              backgroundPosition: `${loupePos.bgX}% ${loupePos.bgY}%`,
              backgroundSize: "250% 250%",
            }}
          />
        ) : null}
      </div>

      {/* Specimen Title & Craft Story */}
      <div className="pt-4 pb-3 hairline-b">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="font-serif text-2xl sm:text-3xl text-ink font-medium">
            {title}
          </h2>
          <span className="font-mono text-sm font-bold text-ink">
            {price ?? "Inquire for price"}
          </span>
        </div>
        {product.description ? (
          <p className="text-xs sm:text-sm text-umber leading-relaxed">{product.description}</p>
        ) : null}
      </div>

      {/* Monospaced Metadata Block Underneath */}
      <div className="py-3 hairline-b font-mono text-[11px] text-umber leading-relaxed">
        <div className="flex flex-wrap items-center justify-between gap-y-1">
          <span>Ref No. <strong className="text-ink">#{product.slug.slice(-6).toUpperCase()}</strong></span>
          <span>|</span>
          <span>{medium}</span>
          <span>|</span>
          <span className="text-terracotta font-bold">1 of 1</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5 mt-2.5 hairline-t text-[10px]">
          <div>
            <span className="block text-umber/70 uppercase">MEDIUM</span>
            <span className="text-ink">{medium}</span>
          </div>
          <div>
            <span className="block text-umber/70 uppercase">STUDIO</span>
            <span className="text-ink">Collegeville, PA</span>
          </div>
          <div>
            <span className="block text-umber/70 uppercase">CUSTODY</span>
            <span className="text-moss font-bold">
              {product.status === "sold" ? "Acquired" : "In the studio"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar: [Inspect & Inquire] + Quick Save */}
      <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/p/${product.slug}`}
          className="flex-1 py-2.5 px-4 bg-linen hover:bg-bone-dark text-ink font-mono text-xs uppercase tracking-widest hairline-box rounded-sm transition-colors text-center"
        >
          [Inspect Piece Details]
        </Link>
        <button
          type="button"
          onClick={() => toggleSave(product.slug)}
          aria-pressed={saved}
          className={`py-2.5 px-5 font-mono text-xs uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
            saved
              ? "bg-ink text-linen hover:bg-terracotta"
              : "bg-terracotta hover:bg-terracotta-dark text-linen"
          }`}
        >
          {saved ? "[Saved ✓]" : "[+ Save Piece]"}
        </button>
      </div>
    </div>
  );
}
