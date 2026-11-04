"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { PublicImage } from "@/lib/types";

interface Props {
  image: PublicImage;
  title: string;
  sizeText?: string;
  kind?: string;
}

export function ScaleVisualizer({ image, title, sizeText = "Medium format", kind = "Artwork" }: Props) {
  const [open, setOpen] = useState(false);

  // Try parsing approximate inches or cm from size string e.g. "24 × 36 in" or "60 × 90 cm"
  let displayWidthPx = 140;
  let displayHeightPx = 180;

  if (sizeText) {
    const match = sizeText.match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      if (w > 0 && h > 0) {
        // Normalize so 30 inches ~ 120px
        const scale = w > 60 || h > 60 ? 1.5 : 3.8; // handle cm vs inches
        displayWidthPx = Math.min(220, Math.max(70, Math.round(w * scale)));
        displayHeightPx = Math.min(260, Math.max(70, Math.round(h * scale)));
      }
    }
  }

  return (
    <div className="border border-line rounded-[2px] bg-plate/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="caption text-xs text-ink-soft">Architectural Scale</p>
          <p className="text-sm font-semibold text-ink">{sizeText || "Studio scale reference"}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-full border border-line bg-gesso/70 px-3 py-1 font-mono text-xs text-ink hover:border-line-strong cursor-pointer"
        >
          {open ? "Hide Room Scale" : "View in Room Scale"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="caption text-xs text-ink-soft mb-3">
            Scaled relative to a 175 cm (5&prime;9&Prime;) collector and a 75 cm studio console bench:
          </p>
          <div className="relative flex h-64 w-full items-end justify-center gap-12 overflow-hidden rounded bg-gesso border border-line px-6 pb-4 pt-8">
            {/* Wall baseboard line */}
            <div className="absolute inset-x-0 bottom-4 h-[1px] bg-line-strong" />

            {/* Human silhouette figure (175cm) */}
            <div className="relative flex flex-col items-center z-10">
              {/* Head */}
              <div className="size-6 rounded-full bg-ink-soft/40" />
              {/* Torso & legs */}
              <div className="w-5 h-28 rounded-t-sm bg-ink-soft/30 mt-1" />
              <div className="flex gap-1.5 mt-0.5">
                <div className="w-2 h-20 rounded-b-sm bg-ink-soft/30" />
                <div className="w-2 h-20 rounded-b-sm bg-ink-soft/30" />
              </div>
              <span className="font-mono text-[9px] text-ink-soft mt-1">175 cm (5&prime;9&Prime;)</span>
            </div>

            {/* Studio console table (75cm) */}
            <div className="relative flex flex-col items-center justify-end z-10">
              <div className="w-32 h-2 bg-ink/20 rounded-t-sm" />
              <div className="flex justify-between w-28 h-14 border-x-2 border-ink/20" />
              <span className="font-mono text-[9px] text-ink-soft mt-1">Studio bench</span>
            </div>

            {/* The Artwork hanging on the wall */}
            <div
              className="relative shadow-lg ring-1 ring-black/10 overflow-hidden bg-plate z-10 mb-14"
              style={{
                width: `${displayWidthPx}px`,
                height: `${displayHeightPx}px`,
              }}
            >
              <Image src={image.url} alt={title} fill sizes="200px" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-night/70 py-0.5 text-center">
                <span className="font-mono text-[9px] text-gesso truncate block px-1">{title}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft font-mono">
            <span>{kind}</span>
            <span>{sizeText}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

