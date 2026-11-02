"use client";

import { reorderImages } from "@/lib/desk-actions";

export function DragPhoto({ id, productId, ids }: { id: string; productId: string; ids: string[] }) {
  return (
    <button
      type="button"
      className="btn btn-quiet"
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = event.dataTransfer.getData("text/plain");
        if (!from || from === id) return;
        const next = ids.filter((item) => item !== from);
        next.splice(Math.max(0, next.indexOf(id)), 0, from);
        void reorderImages(productId, next).then(() => window.location.reload());
      }}
    >
      Drag
    </button>
  );
}
