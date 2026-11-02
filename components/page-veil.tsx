"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Transition veil: a linen plate that covers the viewport while an internal
 * navigation commits, then lifts. Mounted once in the root layout so it
 * persists across client navigations. Inert under reduced motion and for
 * anchor/external downloads.
 */
export function PageVeil() {
  const veilRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const veil = veilRef.current;
    if (!veil) return;
    const lift = () =>
      gsap.to(veil, { autoAlpha: 0, duration: 0.45, ease: "power2.out", delay: 0.12, overwrite: "auto" });
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("/#")) return;
      if (/^(mailto|tel|https?):/i.test(href)) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      gsap.to(veil, { autoAlpha: 1, duration: 0.32, ease: "power2.in", overwrite: "auto" });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(lift, 1600);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const veil = veilRef.current;
    if (!veil) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    gsap.to(veil, { autoAlpha: 0, duration: 0.55, ease: "power2.out", delay: 0.1, overwrite: "auto" });
  }, [pathname]);

  return (
    <div ref={veilRef} className="page-veil" aria-hidden="true">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-umber">
        Ajja · Archive
      </span>
    </div>
  );
}
