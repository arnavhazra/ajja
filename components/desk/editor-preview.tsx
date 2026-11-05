import { PieceCard } from "@/components/shop/piece-card";
import { draftPiece, duplicatePiece, hidePiece, publishPiece, sellPiece, trashPiece } from "@/lib/desk-actions";
import { hasRealTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";

export function EditorPreview({ productId, preview }: { productId: string; preview: PublicProduct }) {
  return (
    <aside className="grid content-start gap-4 lg:sticky lg:top-6">
      {!hasRealTitle(preview.title) ? (
        <p className="desk-pill w-fit" data-tone="warn">Needs a name</p>
      ) : null}
      <div className="border border-line p-3">
        <p className="caption mb-2">On phones</p>
        <div className="max-w-[390px]">
          <PieceCard product={preview} />
        </div>
      </div>
      <div className="hidden border border-line p-3 lg:block">
        <p className="caption mb-2">On the works wall</p>
        <div className="max-w-xl">
          <PieceCard product={preview} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={publishPiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-secondary" type="submit">
            Put on the site
          </button>
        </form>
        <form action={sellPiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-secondary" type="submit">
            Mark sold
          </button>
        </form>
        <form action={hidePiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-secondary" type="submit">
            Hide
          </button>
        </form>
        <form action={draftPiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-quiet" type="submit">
            Draft
          </button>
        </form>
        <form action={duplicatePiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-quiet" type="submit">
            Duplicate
          </button>
        </form>
        <form action={trashPiece}>
          <input type="hidden" name="id" value={productId} />
          <button className="btn btn-quiet" type="submit">
            Move to trash
          </button>
        </form>
      </div>
    </aside>
  );
}
