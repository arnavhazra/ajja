"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/types";

/**
 * The whole photograph, fit-contained on its archival mat plate, with
 * detail thumbnails and a native <dialog> full-screen view.
 */
export function PieceViewer({ images, title, dimensions }: { images: PublicImage[]; title: string; dimensions?: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const image = images[index];

  if (!image) return <div className="plate aspect-[4/3] w-full" />;
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3";

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[2px] border border-line bg-wall-deep p-4 md:p-6">
        <figure className="relative m-0 overflow-hidden rounded-[2px] border border-line/70 bg-wall-sink/40 p-2 sm:p-3">
          <div className="relative w-full" style={{ aspectRatio: ratio }}>
            <Image
              key={image.id}
              src={image.url}
              alt={image.alt || title}
              fill
              sizes="(min-width: 1024px) 56vw, 94vw"
              priority={index === 0}
              placeholder={image.blurData ? "blur" : "empty"}
              blurDataURL={image.blurData ?? undefined}
              className="photo-dissolve object-contain"
            />
          </div>
        </figure>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="ledger flex flex-wrap items-center gap-2 text-xs text-tar-soft">
            <span className="font-bold text-tar">FIG. {String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">—</span>
            <span className="uppercase tracking-wider">Natural light studio view</span>
            {dimensions ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-tar">{dimensions}</span>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="ledger inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[2px] border border-line-strong bg-wall px-3 text-xs uppercase tracking-wider text-tar transition-colors hover:border-tar hover:bg-wall-deep"
            aria-label="View full screen"
            onClick={() => dialogRef.current?.showModal()}
          >
            View full screen ↗
          </button>
        </div>
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Photographs">
          {images.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photograph ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "flex w-full cursor-pointer flex-col gap-1.5 rounded-[2px] border bg-wall-deep p-2 text-left transition-colors",
                  i === index ? "border-tar ring-1 ring-tar" : "border-line opacity-75 hover:border-line-strong hover:opacity-100",
                )}
              >
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-wall-sink/40">
                  <Image src={item.url} alt="" fill sizes="160px" className="object-cover" />
                </span>
                <span className="ledger text-[0.7rem] text-tar-soft">FIG. {String(i + 1).padStart(2, "0")}</span>
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
            <p className="ledger pointer-events-auto rounded-[2px] bg-vat/80 px-4 py-2 text-xs text-vat-ink backdrop-blur">
              {title}
              {images.length > 1 ? <span className="nums ml-2 text-vat-soft">{index + 1}/{images.length}</span> : null}
            </p>
            <div className="pointer-events-auto flex gap-2">
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="btn min-h-11 cursor-pointer bg-vat/80 px-4 text-vat-ink backdrop-blur"
                    onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn min-h-11 cursor-pointer bg-vat/80 px-4 text-vat-ink backdrop-blur"
                    onClick={() => setIndex((i) => (i + 1) % images.length)}
                  >
                    Next
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="btn min-h-11 cursor-pointer bg-wall px-4 text-tar"
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
