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

export function DossierProvider({ children, location = "" }: { children: React.ReactNode; location?: string }) {
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
  const title = activeProduct ? pieceTitle(activeProduct.title, activeProduct.categorySlug, activeProduct.attributes, activeProduct.id) : "";
  const kind = activeProduct ? pieceKind(activeProduct.categoryName, activeProduct.attributes) : "";
  const dimensions = activeProduct?.attributes?.dimensions || activeProduct?.attributes?.size || "";
  const material = activeProduct?.attributes?.material || activeProduct?.attributes?.medium || kind || "";
  const makerNote = activeProduct?.description || activeProduct?.attributes?.details || "";
  const priceFormatted = activeProduct?.priceMinor ? format(activeProduct.priceMinor) : "price on asking";
  const sold = activeProduct?.status === "sold";
  const inFolio = activeProduct ? hasItem(activeProduct.id) : false;

  return (
    <DossierContext.Provider value={{ openDossier, closeDossier }}>
      {children}

      <dialog
        ref={dialogRef}
        aria-label={`Quick look at ${title}`}
        className="fixed inset-0 m-auto h-auto max-h-[92vh] w-[95vw] max-w-5xl rounded-sm bg-wall p-0 text-tar shadow-2xl backdrop:bg-vat/70 backdrop:backdrop-blur-sm hairline-box z-50 overflow-hidden"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDossier();
        }}
      >
        {activeProduct ? (
          <div className="flex flex-col h-full max-h-[92vh]">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-line bg-wall-deep px-6 py-3.5">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-tar-soft">
                <span className="font-bold text-tar truncate">{title}</span>
                {kind ? (
                  <>
                    <span>•</span>
                    <span className="truncate">{kind}</span>
                  </>
                ) : null}
                <span>•</span>
                <span className="font-semibold text-sap">
                  {sold ? "Sold" : activeProduct.quantity === 1 ? "One of one" : "In the studio"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-tar">{sold ? "Sold" : priceFormatted}</span>
                <button
                  type="button"
                  onClick={closeDossier}
                  className="btn btn-quiet min-h-11 px-3 text-xs cursor-pointer"
                  aria-label="Close"
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
                      className={`inline-flex min-h-11 items-center px-3 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "daylight" ? "bg-tar text-wall font-bold" : "text-tar-soft hover:text-tar hairline-box bg-wall-deep"
                      }`}
                    >
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("macro")}
                      className={`inline-flex min-h-11 items-center px-3 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "macro" ? "bg-tar text-wall font-bold" : "text-tar-soft hover:text-tar hairline-box bg-wall-deep"
                      }`}
                    >
                      Close detail
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("scale")}
                      className={`inline-flex min-h-11 items-center px-3 rounded-sm font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                        viewMode === "scale" ? "bg-tar text-wall font-bold" : "text-tar-soft hover:text-tar hairline-box bg-wall-deep"
                      }`}
                    >
                      On a wall
                    </button>
                  </div>

                  {/* Stage Area */}
                  <div className="relative aspect-[4/3] w-full rounded-sm bg-wall-sink overflow-hidden hairline-box">
                    {cover ? (
                      viewMode === "scale" ? (
                        <div className="relative flex h-full w-full items-end justify-center gap-8 bg-wall-deep p-4">
                          <div className="absolute inset-x-0 bottom-4 h-[1px] bg-line-strong" />
                          <div className="flex flex-col items-center z-10">
                            <div className="size-5 rounded-full bg-tar/40" />
                            <div className="w-4 h-24 rounded-t-sm bg-tar/30 mt-1" />
                            <div className="flex gap-1 mt-0.5">
                              <div className="w-1.5 h-16 rounded-b-sm bg-tar/30" />
                              <div className="w-1.5 h-16 rounded-b-sm bg-tar/30" />
                            </div>
                            <span className="font-mono text-[8px] text-tar-soft mt-1">175 cm (5′9″)</span>
                          </div>
                          <div className="relative h-32 w-28 shadow-lg overflow-hidden bg-wall z-10 mb-8 border border-line">
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
                      <div className="absolute top-3 left-3 bg-wall/90 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider text-tar hairline-box">
                        Detail, enlarged
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between font-mono text-[10px] text-tar-soft uppercase tracking-wider">
                  <span>{cover?.width && cover?.height ? `Photo ${cover.width}×${cover.height}` : "Studio photograph"}</span>
                  <Link href={`/p/${activeProduct.slug}`} onClick={closeDossier} className="hover:text-tar underline">
                    See the full page ↗
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): Curatorial Provenance & Bench Specs */}
              <div className="md:col-span-5 p-6 bg-wall-deep flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-wall font-mono text-[10px] uppercase text-sap tracking-wider mb-2 hairline-box">
                    <span>●</span> {sold ? "Sold" : "In the studio"}
                  </div>
                  <h2 className="font-serif text-3xl font-medium text-tar leading-tight mb-2">{title}</h2>
                  <p className="font-mono text-sm font-bold text-tar mb-4">{priceFormatted}</p>

                  {makerNote ? (
                    <p className="text-xs text-tar-soft leading-relaxed mb-6 font-sans">{makerNote}</p>
                  ) : null}

                  {/* Facts */}
                  <div className="space-y-3 font-mono text-xs border-y border-line py-4 my-4">
                    {material ? (
                      <div className="flex justify-between">
                        <span className="text-tar-soft uppercase tracking-wider text-[10px]">Medium</span>
                        <span className="text-tar font-medium text-right max-w-[60%]">{material}</span>
                      </div>
                    ) : null}
                    {dimensions ? (
                      <div className="flex justify-between">
                        <span className="text-tar-soft uppercase tracking-wider text-[10px]">Size</span>
                        <span className="text-tar font-medium">{dimensions}</span>
                      </div>
                    ) : null}
                    {location ? (
                      <div className="flex justify-between">
                        <span className="text-tar-soft uppercase tracking-wider text-[10px]">Made in</span>
                        <span className="text-tar font-medium">{location}</span>
                      </div>
                    ) : null}
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
                        });
                        if (!inFolio) setFolioOpen(true);
                      }}
                      className={`btn w-full text-center ${
                        inFolio ? "bg-ok text-wall border-ok" : "btn-pigment"
                      }`}
                    >
                      {inFolio ? "✓ Saved" : `Save${priceFormatted !== "price on asking" ? ` • ${priceFormatted}` : ""}`}
                    </button>
                  ) : null}

                  <Link
                    href={`/p/${activeProduct.slug}#enquire`}
                    onClick={closeDossier}
                    className="btn btn-secondary w-full text-center text-xs"
                  >
                    Ask about this piece
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
