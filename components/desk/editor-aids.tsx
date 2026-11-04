"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable='true']"));
}

export function EditorAids({ formId, prevHref, nextHref }: { formId: string; prevHref: string; nextHref: string }) {
  const router = useRouter();

  useEffect(() => {
    let dirty = false;
    const form = document.getElementById(formId);

    const onInput = (event: Event) => {
      if (form?.contains(event.target as Node)) dirty = true;
    };
    const onSubmit = (event: Event) => {
      if (form?.contains(event.target as Node)) dirty = false;
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        (form as HTMLFormElement | null)?.requestSubmit();
        return;
      }
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "j" && nextHref) router.push(nextHref);
      if (event.key === "k" && prevHref) router.push(prevHref);
    };

    document.addEventListener("input", onInput);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("keydown", onKey);
    };
  }, [formId, prevHref, nextHref, router]);

  return null;
}
