"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/types";

/**
 * The whole photograph, fit-contained on its plate, with thumbnails and a
 * native <dialog> full-screen view. No hover gimmicks — the work stands.
 */
export function PieceViewer({ images, title }: { images: PublicImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const image = images[index];

  if (!image) return <div className="plate aspect-[4/5] w-full" />;
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 5";

  return (
    <div className="grid gap-3">
      <figure className="plate relative m-0" style={{ aspectRatio: ratio }}>
        <Image
          key={image.id}
          src={image.url}
          alt={image.alt || title}
          fill
          sizes="(min-width: 768px) 58vw, 100vw"
          priority={index === 0}
          placeholder={image.blurData ? "blur" : "empty"}
          blurDataURL={image.blurData ?? undefined}
          className="photo-dissolve object-contain p-3"
        />
      </figure>

      <button
        type="button"
        className="btn btn-quiet w-fit min-h-11 cursor-pointer"
        aria-label="View full screen"
        onClick={() => dialogRef.current?.showModal()}
      >
        View full screen
      </button>

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
                  i === index ? "ring-2 ring-pigment" : "opacity-60 hover:opacity-100",
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
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-vat p-0 text-wall backdrop:bg-vat"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={(event) => {
          if (images.length < 2) return;
          if (event.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
          if (event.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
        }}
      >
        <div className="relative size-full">
          <Image src={image.url} alt={image.alt || title} fill sizes="100vw" className="object-contain" />
          <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
            <p className="pointer-events-auto rounded-full bg-vat/70 px-4 py-2 text-sm backdrop-blur">
              {title}
              {images.length > 1 ? <span className="nums ml-2 text-wall/60">{index + 1}/{images.length}</span> : null}
            </p>
            <div className="pointer-events-auto flex gap-2">
              {images.length > 1 ? (
                <>
                  <button type="button" className="btn min-h-11 bg-vat/70 px-4 text-wall backdrop-blur cursor-pointer" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}>
                    Previous
                  </button>
                  <button type="button" className="btn min-h-11 bg-vat/70 px-4 text-wall backdrop-blur cursor-pointer" onClick={() => setIndex((i) => (i + 1) % images.length)}>
                    Next
                  </button>
                </>
              ) : null}
              <button type="button" className="btn min-h-11 bg-wall px-4 text-tar cursor-pointer" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
