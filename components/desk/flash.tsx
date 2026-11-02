import { undoChange } from "@/lib/desk-actions";

export function Flash({ note, undo, back }: { note: string; undo: string; back: string }) {
  if (!note) return null;
  return (
    <div role="status" className="desk-note">
      {note}
      {undo ? (
        <form action={undoChange} className="mt-3">
          <input type="hidden" name="id" value={undo} />
          <input type="hidden" name="back" value={back} />
          <button className="btn btn-secondary" type="submit">
            Undo
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
