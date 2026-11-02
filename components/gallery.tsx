"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/types";

export function Gallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const pinch = useRef(0);
  const image = images[index];

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const onClose = () => {
      setOpen(false);
      setScale(1);
    };
    node.addEventListener("close", onClose);
    return () => node.removeEventListener("close", onClose);
  }, []);

  if (!image) return <div className="photo-frame crop relative grid place-items-center text-ink-soft" style={{ position: "relative" }}>Studio study</div>;

  const displayTitle = title && !/^title not written yet$/i.test(title) ? title : "Studio Study";

  function move(step: number) {
    setIndex((current) => (current + step + images.length) % images.length);
    setScale(1);
  }

  return (
    <div>
      <div className="photo-frame crop relative" style={{ position: "relative" }}>
        <Image
          src={image.url}
          alt={image.alt || `${displayTitle}, photograph ${index + 1}`}
          fill
          priority={index === 0}
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
          style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
          placeholder={image.blurData ? "blur" : "empty"}
          blurDataURL={image.blurData ?? undefined}
        />
        <button type="button" className="btn btn-quiet absolute bottom-3 right-3 bg-paper" onClick={() => setOpen(true)}>
          Larger photo
        </button>
      </div>
      {images.length > 1 ? <p className="nums mt-3 px-4 text-ink-soft">{index + 1} of {images.length}</p> : null}
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {images.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "photo-frame relative size-16 shrink-0 overflow-hidden transition-opacity duration-200 ease-out",
                itemIndex === index ? "opacity-100" : "opacity-60",
              )}
              style={{ position: "relative" }}
              aria-label={`Photo ${itemIndex + 1}`}
              aria-current={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
            >
              <Image src={item.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
      <dialog
        ref={dialog}
        className="sheet m-auto max-h-[100dvh] w-[min(100%,960px)] bg-paper p-4"
        aria-label={displayTitle}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(1);
          if (event.key === "ArrowLeft") move(-1);
        }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="nums text-ink-soft">
            {index + 1} of {images.length}
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => move(-1)}>
            Previous
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => move(1)}>
            Next
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setScale((value) => Math.min(3, value + 0.5))}>
            Closer
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setScale((value) => Math.max(1, value - 0.5))}>
            Farther
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <div
          className="relative h-[70dvh] overflow-auto"
          style={{ position: "relative" }}
          onDoubleClick={() => setScale((value) => (value > 1 ? 1 : 2))}
          onPointerUp={(event) => {
            if (event.detail === 2) setScale((value) => (value > 1 ? 1 : 2));
          }}
          onTouchMove={(event) => {
            if (event.touches.length !== 2) return;
            const distance = Math.hypot(
              event.touches[0].clientX - event.touches[1].clientX,
              event.touches[0].clientY - event.touches[1].clientY,
            );
            if (pinch.current) {
              const ratio = distance / pinch.current;
              setScale((value) => Math.min(3, Math.max(1, value * ratio)));
            }
            pinch.current = distance;
          }}
          onTouchEnd={() => {
            pinch.current = 0;
          }}
        >
          <Image
            src={image.url}
            alt={image.alt || displayTitle}
            fill
            sizes="100vw"
            className="object-contain"
            style={{ transform: `scale(${scale})`, transformOrigin: `${image.focalX * 100}% ${image.focalY * 100}%` }}
          />
        </div>
      </dialog>
    </div>
  );
}
