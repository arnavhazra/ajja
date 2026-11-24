"use client";

import { type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { useFolio } from "./collectors-folio";

type Props = {
  id: string;
  slug: string;
  title: string;
  priceMinor: number | null;
  imageUrl?: string;
  kind?: string;
  dimensions?: string;
};

/** The [save] toggle under a piece card — the only client leaf on the card. */
export function PieceSaveButton({ id, slug, title, priceMinor, imageUrl, kind, dimensions }: Props) {
  const { hasItem, toggleItem, setIsOpen: setFolioOpen } = useFolio();
  const inFolio = hasItem(id);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({ id, slug, title, priceMinor, imageUrl, kind, dimensions });
    if (!inFolio) setFolioOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("cap-act", inFolio && "saved")}
      aria-label={inFolio ? `Remove ${title} from saved` : `Save ${title}`}
    >
      {inFolio ? "saved" : "save"}
    </button>
  );
}
