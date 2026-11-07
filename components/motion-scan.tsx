"use client";

import { useEffect } from "react";

/**
 * One IntersectionObserver for every [data-reveal] on the page, plus a
 * MutationObserver so nodes mounted later (filters, streamed content)
 * still get their entry reveal. Reduced motion: never runs.
 */
export function MotionScan() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const watch = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        observer.observe(el);
      });
    };
    watch(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches("[data-reveal]") && !seen.has(node)) {
              seen.add(node);
              observer.observe(node);
            }
            watch(node);
          }
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
