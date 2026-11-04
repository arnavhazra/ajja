"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "./currency-provider";
import { useFolio } from "./collectors-folio";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";

interface DossierContextValue {
  openDossier: (product: PublicProduct) => void;
  closeDossier: () => void;
}

const DossierContext = createContext<DossierContextValue>({
  openDossier: () => {},
  closeDossier: () => {},
});

export function useDossier() {
  return useContext(DossierContext);
}

export function DossierProvider({ children }: { children: React.ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<PublicProduct | null>(null);
  const [viewMode, setViewMode] = useState<"daylight" | "macro" | "scale">("daylight");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { format } = useCurrency();
  const { hasItem, toggleItem, setIsOpen: setFolioOpen } = useFolio();

  const openDossier = (product: PublicProduct) => {
    setActiveProduct(product);
    setViewMode("daylight");
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 10);
  };

  const closeDossier = () => {
    dialogRef.current?.close();
    setActiveProduct(null);
  };

  const cover = activeProduct?.images[0];
  const title = activeProduct ? pieceTitle(activeProduct.title, activeProduct.categorySlug, activeProduct.attributes) : "";
  const kind = activeProduct ? pieceKind(activeProduct.categoryName, activeProduct.attributes) : "";
  const dimensions = activeProduct?.attributes?.dimensions || activeProduct?.attributes?.size || "Dimensions on request";
  const material = activeProduct?.attributes?.material || activeProduct?.attributes?.medium || kind || "Poured pigment on panel";
  const makerNote = activeProduct?.description || activeProduct?.attributes?.details || "Handcrafted in the studio with unrepeatable pigment dispersion and seasoned timber.";
  const priceFormatted = activeProduct?.priceMinor ? format(activeProduct.priceMinor) : "Ask for price";
  const sold = activeProduct?.status === "sold";
  const inFolio = activeProduct ? hasItem(activeProduct.id) : false;

  return (
    <DossierContext.Provider value={{ openDossier, closeDossier }}>
      {children}

      <dialog
        ref={dialogRef}
        aria-label="Museum Artwork Dossier"
        className="fixed inset-0 m-auto h-auto max-h-[92vh] w-[95vw] max-w-5xl rounded-sm bg-linen p-0 text-ink shadow-2xl backdrop:bg-night/70 backdrop:backdrop-blur-sm hairline-box z-50 overflow-hidden"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDossier();
        }}
      >
        {activeProduct ? (
          <div className="flex flex-col h-full max-h-[92vh]">
            {/* Top Modal Header Plate */}
            <div className="flex items-center justify-between border-b border-line bg-bone px-6 py-3.5">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-umber">
                <span className="font-bold text-ink">SPECIMEN // {activeProduct.slug.toUpperCase()}</span>
                <span>•</span>
                <span>{kind}</span>
                <span>•</span>
                <span className="font-semibold text-terracotta">{sold ? "RESERVED" : "EDITION 1 OF 1"}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-ink">{sold ? "Sold" : priceFormatted}</span>
                <button
                  type="button"
                  onClick={closeDossier}
                  className="btn btn-quiet min-h-8 px-2 py-1 text-xs cursor-pointer"
                  aria-label="Close dossier"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Dossier Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
              {/* Left Column (7 cols): Artwork Stage & Interactive Tabs */}
              <div className="md:col-span-7 p-6 border-b md:border-b-0 md:border-r border-line flex flex-col justify-between">
                <div>
                  {/* View Mode Tabs */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setViewMode("daylight")}
                      className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "daylight" ? "bg-ink text-linen font-bold" : "text-umber hover:text-ink hairline-box bg-bone"
                      }`}
                    >
                      [1. Daylight View]
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("macro")}
                      className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "macro" ? "bg-ink text-linen font-bold" : "text-umber hover:text-ink hairline-box bg-bone"
                      }`}
                    >
                      [2. 2.6× Macro Loupe]
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("scale")}
                      className={`px-3 py-1 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "scale" ? "bg-ink text-linen font-bold" : "text-umber hover:text-ink hairline-box bg-bone"
                      }`}
                    >
                      [3. Scale in Room]
                    </button>
                  </div>

                  {/* Stage Area */}
                  <div className="relative aspect-[4/3] w-full rounded-sm bg-boneDark overflow-hidden hairline-box">
                    {cover ? (
                      viewMode === "scale" ? (
                        <div className="relative flex h-full w-full items-end justify-center gap-8 bg-bone p-4">
                          <div className="absolute inset-x-0 bottom-4 h-[1px] bg-line-strong" />
                          <div className="flex flex-col items-center z-10">
                            <div className="size-5 rounded-full bg-ink/40" />
                            <div className="w-4 h-24 rounded-t-sm bg-ink/30 mt-1" />
                            <div className="flex gap-1 mt-0.5">
                              <div className="w-1.5 h-16 rounded-b-sm bg-ink/30" />
                              <div className="w-1.5 h-16 rounded-b-sm bg-ink/30" />
                            </div>
                            <span className="font-mono text-[8px] text-umber mt-1">175 cm (5′9″)</span>
                          </div>
                          <div className="relative h-32 w-28 shadow-lg overflow-hidden bg-linen z-10 mb-8 border border-line">
                            <Image src={cover.url} alt={title} fill sizes="180px" className="object-cover" />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={cover.url}
                          alt={title}
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className={`object-cover transition-transform duration-700 ${viewMode === "macro" ? "scale-[2.2] cursor-crosshair" : "scale-100"}`}
                        />
                      )
                    ) : null}

                    {viewMode === "macro" ? (
                      <div className="absolute top-3 left-3 bg-linen/90 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider text-ink hairline-box">
                        2.6× Macro Surface Magnification
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between font-mono text-[10px] text-umber uppercase tracking-wider">
                  <span>Aspect: {cover?.width && cover?.height ? `${cover.width}×${cover.height}` : "Studio Format"}</span>
                  <Link href={`/p/${activeProduct.slug}`} onClick={closeDossier} className="hover:text-ink underline">
                    Full Artwork Page ↗
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): Curatorial Provenance & Bench Specs */}
              <div className="md:col-span-5 p-6 bg-bone flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-linen font-mono text-[10px] uppercase text-terracotta tracking-wider mb-2 hairline-box">
                    <span>●</span> {activeProduct.status === "sold" ? "Archived Custody" : "In Studio Vault"}
                  </div>
                  <h2 className="font-serif text-3xl font-medium text-ink leading-tight mb-2">{title}</h2>
                  <p className="font-mono text-sm font-bold text-ink mb-4">{priceFormatted}</p>

                  <p className="text-xs text-umber leading-relaxed mb-6 font-sans">{makerNote}</p>

                  {/* Provenance Specifications Block */}
                  <div className="space-y-3 font-mono text-xs border-y border-line py-4 my-4">
                    <div className="flex justify-between">
                      <span className="text-umber uppercase tracking-wider text-[10px]">Medium / Material</span>
                      <span className="text-ink font-medium text-right max-w-[60%]">{material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-umber uppercase tracking-wider text-[10px]">Dimensions</span>
                      <span className="text-ink font-medium">{dimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-umber uppercase tracking-wider text-[10px]">Provenance</span>
                      <span className="text-ink font-medium">Mysore &amp; Collegeville Bench</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-umber uppercase tracking-wider text-[10px]">Authenticity</span>
                      <span className="text-moss font-semibold">Hand-Signed Linen Deed</span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-4 space-y-2.5">
                  {!sold ? (
                    <button
                      type="button"
                      onClick={() => {
                        toggleItem({
                          id: activeProduct.id,
                          slug: activeProduct.slug,
                          title,
                          priceMinor: activeProduct.priceMinor,
                          imageUrl: cover?.url,
                          kind: kind || undefined,
                          dimensions,
                          stripeUrl: activeProduct.attributes?.stripe_url,
                        });
                        if (!inFolio) setFolioOpen(true);
                      }}
                      className={`btn w-full text-center ${
                        inFolio ? "bg-moss text-linen border-moss" : "btn-pour"
                      }`}
                    >
                      {inFolio ? "[✓ Reserved in Collector's Bag]" : `[+ Reserve Piece • ${priceFormatted}]`}
                    </button>
                  ) : null}

                  <Link
                    href={`/p/${activeProduct.slug}#enquire`}
                    onClick={closeDossier}
                    className="btn btn-secondary w-full text-center text-xs"
                  >
                    [Inquire on Acquisition / Studio Visit]
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </DossierContext.Provider>
  );
}
