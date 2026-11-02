"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Custom cursor: an ink dot that tracks the pointer and a lagging hairline
 * ring that labels interactive targets ([data-cursor] overrides, links and
 * buttons expand, form fields restore the native I-beam). Mounted only for
 * fine pointers with motion allowed; the native cursor is hidden on the body
 * while active and restored on unmount.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.documentElement.classList.add("custom-cursor");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });

    let visible = false;
    const setVisible = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      gsap.to([dot, ring], { autoAlpha: on ? 1 : 0, duration: 0.18, overwrite: "auto" });
    };

    const onMove = (event: PointerEvent) => {
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
      setVisible(true);
    };

    const onOver = (event: MouseEvent) => {
      const el = event.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) {
        ring.dataset.state = "text";
        label.textContent = "";
        return;
      }
      const tagged = el.closest<HTMLElement>("[data-cursor]");
      if (tagged) {
        ring.dataset.state = "label";
        label.textContent = tagged.dataset.cursor ?? "";
        return;
      }
      if (el.closest("a, button, [role='button'], summary")) {
        ring.dataset.state = "link";
        label.textContent = "";
        return;
      }
      ring.dataset.state = "";
      label.textContent = "";
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    gsap.set([dot, ring], { autoAlpha: 0, xPercent: -50, yPercent: -50 });

    return () => {
      document.documentElement.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="cursor-ring-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
