"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./motion-root";

gsap.registerPlugin(ScrollTrigger);

/**
 * Rendered at the end of each page's streamed content so it hydrates after the elements it animates.
 * Under reduced motion nothing runs and every element keeps its final state.
 */
export function MotionScan() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    getLenis()?.scrollTo(window.location.hash ? window.location.hash : 0, { immediate: true, offset: -72 });
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const inner = el.querySelectorAll(".split-inner");
        const immediate = el.closest("[data-intro]") !== null;
        gsap.from(inner, {
          yPercent: 108,
          duration: 1.05,
          ease: "expo.out",
          stagger: 0.05,
          delay: immediate ? 0.15 : 0,
          scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 32,
          duration: 1,
          ease: "expo.out",
          delay: el.closest("[data-intro]") ? 0.45 : 0,
          scrollTrigger: el.closest("[data-intro]") ? undefined : { trigger: el, start: "top 90%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-unveil]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.4,
            ease: "expo.inOut",
            delay: el.closest("[data-intro]") ? 0.05 : 0,
            scrollTrigger: el.closest("[data-intro]") ? undefined : { trigger: el, start: "top 85%" },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
        const amount = Number(el.dataset.drift) || 10;
        gsap.fromTo(
          el,
          { yPercent: -amount / 2 },
          {
            yPercent: amount / 2,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll("[data-word]"),
          { opacity: 0.45 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: true },
          },
        );
      });
    });
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, []);

  return null;
}
