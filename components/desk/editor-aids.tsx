"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable='true']"));
}

const LEAVE_NOTE = "You have changes that are not saved. Leave without saving?";

export function EditorAids({ formId, prevHref, nextHref }: { formId: string; prevHref: string; nextHref: string }) {
  const router = useRouter();

  useEffect(() => {
    let dirty = false;
    const form = document.getElementById(formId);
    const confirmLeave = () => !dirty || window.confirm(LEAVE_NOTE);
    const go = (href: string) => {
      if (href && confirmLeave()) router.push(href);
    };

    const onInput = (event: Event) => {
      if (form?.contains(event.target as Node)) dirty = true;
    };
    const onSubmit = (event: Event) => {
      if (form?.contains(event.target as Node)) dirty = false;
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    // Guard in-app link clicks while the form has unsaved changes.
    const onClick = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        (form as HTMLFormElement | null)?.requestSubmit();
        return;
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "j") go(nextHref);
      if (event.key === "k") go(prevHref);
    };

    document.addEventListener("input", onInput);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("submit", onSubmit);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("keydown", onKey);
    };
  }, [formId, prevHref, nextHref, router]);

  return null;
}
