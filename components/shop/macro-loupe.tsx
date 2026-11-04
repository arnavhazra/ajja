"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/types";

interface Props {
  image: PublicImage;
  title: string;
  ratio: string;
  priority?: boolean;
  onOpenDialog?: () => void;
}

export function MacroLoupeImage({ image, title, ratio, priority = false, onOpenDialog }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [zoomLevel] = useState(2.6);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    const lens = lensRef.current;
    if (!container || !lens) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

    const lensWidth = lens.offsetWidth || 170;
    const lensHeight = lens.offsetHeight || 170;

    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;
    lens.style.backgroundImage = `url('${image.url}')`;
    lens.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;

    const bgX = -(x * zoomLevel - lensWidth / 2);
    const bgY = -(y * zoomLevel - lensHeight / 2);
    lens.style.backgroundPosition = `${bgX}px ${bgY}px`;
  }, [image.url, zoomLevel]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" && !isLocked) return;
    setIsActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") {
      setIsActive(true);
      updatePosition(e.clientX, e.clientY);
    }
  };

  const handlePointerLeave = () => {
    if (!isLocked) {
      setIsActive(false);
    }
  };

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLocked;
    setIsLocked(next);
    setIsActive(next);

    if (next && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      updatePosition(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45);
    }
  };

  // Re-center if locked on resize
  useEffect(() => {
    if (isLocked && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      updatePosition(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45);
    }
  }, [isLocked, updatePosition]);

  return (
    <div className="relative group select-none">
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={() => {
          if (!isLocked && onOpenDialog) onOpenDialog();
        }}
        className={cn(
          "plate relative block w-full overflow-hidden transition-shadow duration-300",
          isLocked ? "cursor-crosshair" : "cursor-zoom-in",
        )}
        style={{ aspectRatio: ratio }}
      >
        <Image
          key={image.id}
          src={image.url}
          alt={image.alt || title}
          fill
          priority={priority}
          sizes="(min-width: 768px) 58vw, 100vw"
          placeholder={image.blurData ? "blur" : "empty"}
          blurDataURL={image.blurData ?? undefined}
          className="object-cover"
          style={{ objectPosition: `${(image.focalX ?? 0.5) * 100}% ${(image.focalY ?? 0.5) * 100}%` }}
        />

        {/* 2.6x Optical Macro Lens */}
        <div
          ref={lensRef}
          className={cn("loupe-lens", (isActive || isLocked) && "active")}
          aria-hidden="true"
        >
          {/* Subtle crosshair in the center of the loupe */}
          <span className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <span className="w-2.5 h-[1px] bg-ink" />
            <span className="h-2.5 w-[1px] bg-ink" />
          </span>
        </div>

        {/* Floating Macro Loupe Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
          <span className="rounded-full bg-gesso/90 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-ink backdrop-blur-sm border border-line">
            {isLocked ? "2.6× Loupe [Locked]" : "2.6× Macro Loupe (Hover)"}
          </span>
        </div>
      </div>

      {/* Control bar under image */}
      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <button
          type="button"
          onClick={toggleLock}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors cursor-pointer",
            isLocked
              ? "border-pour bg-pour text-pour-ink font-semibold"
              : "border-line bg-gesso/70 text-ink hover:border-line-strong",
          )}
        >
          <span className="size-2 rounded-full bg-current" />
          {isLocked ? "Release Loupe Lock" : "Lock Macro Loupe"}
        </button>

        {onOpenDialog ? (
          <button
            type="button"
            onClick={onOpenDialog}
            className="font-mono text-[11px] text-ink-soft hover:text-ink underline cursor-pointer"
          >
            Full screen ↗
          </button>
        ) : null}
      </div>
    </div>
  );
}

