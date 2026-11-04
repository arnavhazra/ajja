"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = {
  url: string;
  initialX?: number;
  initialY?: number;
  alt?: string;
};

export function FocalPicker({ url, initialX = 0.5, initialY = 0.5, alt = "Artwork photo" }: Props) {
  const [focal, setFocal] = useState({
    x: Math.min(1, Math.max(0, Number(initialX) || 0.5)),
    y: Math.min(1, Math.max(0, Number(initialY) || 0.5)),
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setFocal({
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already lost
    }
  };

  return (
    <div className="grid gap-3">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="group relative h-64 w-full cursor-crosshair select-none overflow-hidden rounded-sm border border-line bg-plate md:h-72"
        title="Click or drag to position the focal center"
      >
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(min-width: 768px) 400px, 100vw"
          className="pointer-events-none object-cover"
        />

        {/* Semi-transparent scrim on hover to make crosshair pop */}
        <div className="pointer-events-none absolute inset-0 bg-ink/5 transition-opacity group-hover:bg-ink/15" />

        {/* Visual crosshair indicator */}
        <div
          className="pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
        >
          {/* Outer focus ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.6)]" />
          {/* Inner targeting dot */}
          <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pour shadow-[0_0_3px_#000]" />
          {/* Crosshair guidelines */}
          <div className="absolute -left-2 top-1/2 h-0.5 w-2 -translate-y-1/2 bg-white/80 shadow-[0_0_2px_#000]" />
          <div className="absolute -right-2 top-1/2 h-0.5 w-2 -translate-y-1/2 bg-white/80 shadow-[0_0_2px_#000]" />
          <div className="absolute -top-2 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_2px_#000]" />
          <div className="absolute -bottom-2 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_2px_#000]" />
        </div>

        {/* Coordinate badge badge */}
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-ink/75 px-2 py-0.5 text-xs text-gesso backdrop-blur-xs">
          Center: {Math.round(focal.x * 100)}% × {Math.round(focal.y * 100)}%
        </div>
      </div>

      <p className="caption text-xs">
        Click or drag on the artwork above to lock what stays in frame on phones and banners.
      </p>

      {/* Synchronized inputs for form submission */}
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs">
          Focus across (0–1)
          <input
            className="field h-10 text-sm"
            name="focalX"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={focal.x}
            onChange={(e) => setFocal((prev) => ({ ...prev, x: Math.min(1, Math.max(0, Number(e.target.value) || 0)) }))}
          />
        </label>
        <label className="grid gap-1 text-xs">
          Focus down (0–1)
          <input
            className="field h-10 text-sm"
            name="focalY"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={focal.y}
            onChange={(e) => setFocal((prev) => ({ ...prev, y: Math.min(1, Math.max(0, Number(e.target.value) || 0)) }))}
          />
        </label>
      </div>
    </div>
  );
}

