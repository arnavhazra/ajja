"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { readSavedSlugs } from "./share-save";
import { formatMoney } from "@/lib/money";
import type { PublicProduct } from "@/lib/types";
import { pieceMessage, whatsAppHref } from "@/lib/whatsapp";

type SavedPiece = {
  slug: string;
  title: string;
  priceMinor: number | null;
  currency: string;
  status: string;
  image: string | null;
  alt: string;
  focalX: number;
  focalY: number;
  categoryName: string | null;
};

function asProduct(piece: SavedPiece): PublicProduct {
  return {
    id: piece.slug,
    slug: piece.slug,
    title: piece.title,
    description: "",
    priceMinor: piece.priceMinor,
    comparePriceMinor: null,
    currency: piece.currency,
    condition: "",
    quantity: null,
    sku: null,
    attributes: {},
    tags: [],
    status: piece.status,
    featured: false,
    showInStudio: piece.status === "hidden",
    categoryId: null,
    categoryName: piece.categoryName,
    categorySlug: null,
    images: piece.image
      ? [
          {
            id: piece.slug,
            url: piece.image,
            width: null,
            height: null,
            blurData: null,
            focalX: piece.focalX,
            focalY: piece.focalY,
            alt: piece.alt,
            sortOrder: 0,
          },
        ]
      : [],
    createdAt: "",
  };
}

export function SavedList({ shop, whatsapp }: { shop: string; whatsapp: string }) {
  const [pieces, setPieces] = useState<SavedPiece[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLink = params.get("slugs")?.split(",").filter(Boolean) ?? [];
    const slugs = fromLink.length ? fromLink : readSavedSlugs();
    if (!slugs.length) return;
    void fetch(`/api/saved?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((response) => response.json())
      .then((body: { products?: SavedPiece[] }) => setPieces(body.products ?? []));
  }, []);

  async function copyLink() {
    const slugs = pieces.map((piece) => piece.slug).join(",");
    const url = `${window.location.origin}/saved?slugs=${encodeURIComponent(slugs)}`;
    await navigator.clipboard.writeText(url);
    setNote("Link copied.");
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "share", path: "/saved" }),
    });
  }

  const lines = pieces
    .map((piece) => {
      const price = formatMoney(piece.priceMinor, piece.currency);
      return pieceMessage({ shop, title: piece.title, price, url: `${window.location.origin}/p/${piece.slug}` });
    })
    .join("\n");

  return (
    <div className="mt-8 grid gap-6">
      {pieces.length === 0 ? (
        <div className="border-t border-line py-10">
          <p>Nothing is saved on this device yet.</p>
          <Link href="/studio" className="btn btn-secondary mt-6">
            See the studio
          </Link>
        </div>
      ) : (
        <div className="hang">
          {pieces.map((piece) => (
            <ProductCard
              key={piece.slug}
              product={asProduct(piece)}
              href={piece.status === "hidden" ? `/studio/${piece.slug}` : `/p/${piece.slug}`}
            />
          ))}
        </div>
      )}
      {pieces.length ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => void copyLink()}>
            Copy link
          </button>
          {whatsapp ? (
            <a className="btn btn-primary" href={whatsAppHref(whatsapp, `Hello ${shop}, here is my list.\n${lines}`)}>
              Send my list on WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
      {note ? (
        <p role="status" className="text-accent">
          {note}
        </p>
      ) : null}
    </div>
  );
}
