"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sole smooth-scroll engine (Lenis) wired to GSAP ScrollTrigger.
 * Runs the hero entry sequence — painting opens → words cascade → archive reveals —
 * and reveals [data-reveal] blocks on scroll. Everything is bypassed under
 * prefers-reduced-motion, so the final states are always the no-JS default.
 */
export function MotionRoot() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links scroll through Lenis so ScrollTrigger stays in sync.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a[href]");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href) return;
      const hash = href.startsWith("#") ? href : href.startsWith("/#") ? href.slice(1) : null;
      if (!hash) return;
      if (href.startsWith("/#") && window.location.pathname !== "/") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -16 });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    // Hero entry: the painting opens first, then the words cascade, then the ledger.
    const hero = document.querySelector("[data-motion='hero']");
    let tl: gsap.core.Timeline | null = null;
    if (hero) {
      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-motion='hero-specimen']", {
        autoAlpha: 0,
        scale: 0.96,
        clipPath: "inset(8% 8% 8% 8%)",
        duration: 1.2,
      })
        .from(
          "[data-motion='hero-stamp']",
          { autoAlpha: 0, y: 14, duration: 0.5 },
          "-=0.5",
        )
        .from(
          ".hero-word",
          { autoAlpha: 0, yPercent: 60, duration: 0.7, stagger: 0.045 },
          "-=0.35",
        )
        .from(
          "[data-motion='hero-manifesto']",
          { autoAlpha: 0, y: 20, duration: 0.6 },
          "-=0.4",
        )
        .from(
          "[data-motion='hero-ctas']",
          { autoAlpha: 0, y: 16, duration: 0.5 },
          "-=0.35",
        )
        .from(
          "[data-motion='hero-ledger']",
          { autoAlpha: 0, y: 24, duration: 0.6 },
          "-=0.3",
        );
    }

    // Scroll reveals for the archive sections below the hero.
    const triggers = gsap.utils.toArray<HTMLElement>("[data-reveal]").map((el) =>
      gsap.from(el, {
        autoAlpha: 0,
        y: 28,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      }),
    );

    return () => {
      document.removeEventListener("click", onClick);
      tl?.kill();
      triggers.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
