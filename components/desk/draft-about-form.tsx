"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAboutPiece } from "@/lib/desk-actions";

type Draft = { id: string; title: string; categoryId: string; description: string; price: string };
type Group = { id: string; name: string };
type Intent = "continue" | "leave";

/**
 * About stage — saves the four fields it owns and keeps them on failure.
 * A failed save announces, focuses the problem, and the same button retries.
 */
export function DraftAboutForm({
  piece,
  groups,
  continueHref,
  leaveHref,
}: {
  piece: Draft;
  groups: Group[];
  continueHref: string;
  leaveHref: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (intent: Intent) => {
    const form = formRef.current;
    if (!form) return;
    setError("");
    const data = new FormData(form);
    startTransition(async () => {
      const result = await saveAboutPiece({
        id: piece.id,
        title: String(data.get("title") ?? ""),
        categoryId: String(data.get("categoryId") ?? ""),
        description: String(data.get("description") ?? ""),
        price: String(data.get("price") ?? ""),
      });
      if (result.ok) {
        router.push(intent === "continue" ? continueHref : leaveHref);
        return;
      }
      setError(result.message);
      requestAnimationFrame(() => {
        if (result.field) {
          (form.elements.namedItem(result.field) as HTMLElement | null)?.focus();
        } else {
          alertRef.current?.focus();
        }
      });
    });
  };

  return (
    <form
      ref={formRef}
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit("continue");
      }}
    >
      <label className="grid gap-1">
        Name
        <input className="field" name="title" defaultValue={piece.title} required maxLength={160} />
      </label>
      <label className="grid gap-1">
        One art form
        <select className="field" name="categoryId" defaultValue={piece.categoryId}>
          <option value="">No art form yet</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        Description, optional
        <textarea className="field" name="description" defaultValue={piece.description} maxLength={5000} />
      </label>
      <label className="grid gap-1">
        Price in dollars, optional
        <input className="field" name="price" inputMode="decimal" defaultValue={piece.price} />
      </label>
      {error ? (
        <p role="alert" ref={alertRef} tabIndex={-1} className="desk-note border-l-4 border-sold text-sold">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : error ? "Retry — save and continue" : "Save and continue"}
        </button>
        <button className="btn btn-secondary" type="button" disabled={pending} onClick={() => submit("leave")}>
          Save and leave
        </button>
      </div>
    </form>
  );
}
