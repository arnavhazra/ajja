"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/types";
import { MacroLoupeImage } from "./macro-loupe";

/**
 * Large photograph with 2.6x Optical Macro Loupe, thumbnails,
 * and a full-screen view where pointer/drag navigates fine pigment detail.
 */
export function PieceViewer({ images, title }: { images: PublicImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const image = images[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!dialogRef.current?.open || images.length < 2) return;
      if (event.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  if (!image) return <div className="plate aspect-[4/5] w-full" />;
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 5";

  return (
    <div className="grid gap-3">
      <MacroLoupeImage
        image={image}
        title={title}
        ratio={ratio}
        priority={index === 0}
        onOpenDialog={() => dialogRef.current?.showModal()}
      />

      {images.length > 1 ? (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pt-1" aria-label="Photographs">
          {images.map((item, i) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photograph ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-[2px] outline-offset-2 transition-opacity md:size-20 cursor-pointer",
                  i === index ? "ring-2 ring-pour" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={item.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-label={`${title}, full screen`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-night p-0 text-gesso backdrop:bg-night"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="relative size-full">
          <div
            className="absolute inset-0 cursor-zoom-out overflow-hidden"
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setOrigin({
                x: ((event.clientX - rect.left) / rect.width) * 100,
                y: ((event.clientY - rect.top) / rect.height) * 100,
              });
            }}
            onClick={() => dialogRef.current?.close()}
          >
            <Image
              src={image.url}
              alt={image.alt || title}
              fill
              sizes="100vw"
              className="object-contain transition-transform duration-300 ease-out md:scale-[1.6]"
              style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
            />
          </div>
          <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
            <p className="pointer-events-auto rounded-full bg-night/70 px-4 py-2 text-sm backdrop-blur">
              {title}
              {images.length > 1 ? <span className="nums ml-2 text-gesso/60">{index + 1}/{images.length}</span> : null}
            </p>
            <div className="pointer-events-auto flex gap-2">
              {images.length > 1 ? (
                <>
                  <button type="button" className="btn min-h-11 bg-night/70 px-4 text-gesso backdrop-blur cursor-pointer" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}>
                    Previous
                  </button>
                  <button type="button" className="btn min-h-11 bg-night/70 px-4 text-gesso backdrop-blur cursor-pointer" onClick={() => setIndex((i) => (i + 1) % images.length)}>
                    Next
                  </button>
                </>
              ) : null}
              <button type="button" className="btn min-h-11 bg-gesso px-4 text-ink cursor-pointer" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
