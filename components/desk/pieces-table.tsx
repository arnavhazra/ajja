"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { bulkApply, moveFeatured, restorePiece, saveInlineField, toggleFeatured, undoInline } from "@/lib/desk-actions";

export type DeskPieceRow = {
  id: string;
  slug: string;
  title: string;
  displayTitle: string;
  status: string;
  featured: boolean;
  price: string;
  categoryId: string;
  ready: boolean;
  missing: string[];
  needs: string[];
  imageUrl: string;
};

type Group = { id: string; name: string };

type CellIntent = "title" | "price" | "status" | "category";

const STATUS_OPTIONS = [
  ["draft", "Draft"],
  ["scheduled", "Scheduled"],
  ["published", "On the site"],
  ["sold", "Sold"],
  ["hidden", "Hidden"],
] as const;

type Toast = {
  message: string;
  undoId: string;
  rowId: string;
  intent: CellIntent;
  prev: string;
};

export function PiecesTable({
  rows,
  groups,
  prefix,
  trash,
}: {
  rows: DeskPieceRow[];
  groups: Group[];
  prefix: string;
  trash: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, Partial<Record<CellIntent, string>>>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [bulkAction, setBulkAction] = useState("publish");
  const [pending, startTransition] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const propOf = (row: DeskPieceRow, intent: CellIntent) =>
    intent === "category" ? row.categoryId : intent === "title" ? row.title : intent === "price" ? row.price : row.status;

  const valueOf = (row: DeskPieceRow, intent: CellIntent) => values[row.id]?.[intent] ?? propOf(row, intent);

  const edit = (row: DeskPieceRow, intent: CellIntent, next: string) => {
    setValues((current) => ({ ...current, [row.id]: { ...current[row.id], [intent]: next } }));
  };

  const showToast = (next: Toast | null, ms = 9000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const save = (row: DeskPieceRow, intent: CellIntent, override?: string) => {
    const prev = propOf(row, intent);
    const next = override ?? valueOf(row, intent);
    if (next === prev) return;
    startTransition(async () => {
      const result = await saveInlineField({ id: row.id, intent, value: next });
      if (result.ok) {
        showToast({ message: result.message, undoId: result.undoId, rowId: row.id, intent, prev });
      } else {
        edit(row, intent, prev);
        showToast({ message: result.message, undoId: "", rowId: row.id, intent, prev });
      }
    });
  };

  const undo = () => {
    if (!toast?.undoId) return;
    const { undoId, rowId, intent, prev } = toast;
    setToast(null);
    startTransition(async () => {
      const result = await undoInline(undoId);
      if (result.ok) {
        setValues((current) => ({ ...current, [rowId]: { ...current[rowId], [intent]: prev } }));
        showToast({ message: "Change undone.", undoId: "", rowId: "", intent: "title", prev: "" }, 4000);
      } else {
        showToast({ message: result.message, undoId: "", rowId: "", intent: "title", prev: "" });
      }
    });
  };

  const toggleAll = () => {
    setSelected((current) => (current.size === rows.length ? new Set() : new Set(rows.map((row) => row.id))));
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulk = () => {
    const fd = new FormData();
    for (const id of selected) fd.append("id", id);
    fd.append("action", bulkAction);
    const form = bulkFormRef.current;
    if (form) {
      for (const input of Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[name]"))) {
        if (input.name === "action" || input.name === "id") continue;
        if (input.value) fd.append(input.name, input.value);
      }
    }
    startTransition(async () => {
      await bulkApply(fd);
    });
  };

  if (!rows.length) {
    return (
      <div className="grid gap-3 border-t border-line pt-8">
        <p className="text-lg font-semibold">No pieces in this list.</p>
        <p className="text-ink-soft">
          {trash ? "The trash is empty." : "Try clearing the search or filters, or add a new piece."}
        </p>
        {!trash ? (
          <Link className="btn btn-primary w-fit" href={`${prefix}/add`}>
            Add a piece
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="desk-table" role="table" aria-label="Pieces">
        {rows.map((row) => (
          <div key={row.id} className="desk-trow" role="row">
            <div className="flex min-h-11 items-center" role="cell">
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
                aria-label={`Select ${row.displayTitle}`}
              />
            </div>
            <Link className="desk-thumb" href={`${prefix}/pieces/${row.id}`} tabIndex={-1} aria-hidden="true" role="cell">
              {row.imageUrl ? <Image src={row.imageUrl} alt="" width={128} height={128} sizes="52px" /> : <span>No photo</span>}
            </Link>
            <div className="min-w-0" role="cell">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="field h-9 min-w-40 flex-1 text-base font-semibold"
                  value={valueOf(row, "title")}
                  placeholder="Name this piece"
                  aria-label={`Name of ${row.displayTitle}`}
                  onChange={(e) => edit(row, "title", e.target.value)}
                  onBlur={() => save(row, "title")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <Link
                  className="text-sm text-ink-soft underline hover:text-ink"
                  href={`${prefix}/pieces/${row.id}`}
                  aria-label={`Open ${row.displayTitle}`}
                >
                  Open
                </Link>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                {!propOf(row, "title").trim() ? <span className="text-xs">Shown as “{row.displayTitle}” until you name it</span> : null}
                {row.featured ? <span className="desk-pill">Featured</span> : null}
                {!row.ready ? (
                  <span className="desk-pill text-xs" data-tone="warn">
                    Needs {row.missing.join(", ").toLowerCase()}
                  </span>
                ) : null}
                {row.status === "published" ? (
                  <a href={`/p/${row.slug}`} target="_blank" rel="noreferrer" className="text-xs text-ink-soft hover:text-ink underline">
                    view live ↗
                  </a>
                ) : null}
              </p>
            </div>
            <div role="cell">
              <label className="sr-only" htmlFor={`price-${row.id}`}>
                {`Price for ${row.displayTitle}`}
              </label>
              <input
                id={`price-${row.id}`}
                className="field h-9 w-full nums"
                inputMode="decimal"
                placeholder="Ask"
                value={valueOf(row, "price")}
                onChange={(e) => edit(row, "price", e.target.value)}
                onBlur={() => save(row, "price")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
            </div>
            <div role="cell">
              <label className="sr-only" htmlFor={`status-${row.id}`}>
                {`Status of ${row.displayTitle}`}
              </label>
              <select
                id={`status-${row.id}`}
                className="field h-9 w-full"
                value={valueOf(row, "status")}
                onChange={(e) => {
                  edit(row, "status", e.target.value);
                  save(row, "status", e.target.value);
                }}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="desk-trow-tail" role="cell">
              <label className="sr-only" htmlFor={`group-${row.id}`}>
                {`Group of ${row.displayTitle}`}
              </label>
              <select
                id={`group-${row.id}`}
                className="field h-9"
                value={valueOf(row, "category")}
                onChange={(e) => {
                  edit(row, "category", e.target.value);
                  save(row, "category", e.target.value);
                }}
              >
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {trash ? (
                <form action={restorePiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn btn-secondary min-h-11 px-3 text-xs" type="submit">
                    Restore
                  </button>
                </form>
              ) : (
                <span className="flex gap-1">
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      className={cn("btn btn-quiet min-h-11 px-2 text-xs", row.featured && "text-ok")}
                      type="submit"
                      aria-label={row.featured ? `Unfeature ${row.displayTitle}` : `Feature ${row.displayTitle}`}
                      aria-pressed={row.featured}
                    >
                      ★
                    </button>
                  </form>
                  {row.featured ? (
                    <>
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button className="btn btn-quiet min-h-11 px-2 text-xs" type="submit" aria-label="Move featured up">
                          ↑
                        </button>
                      </form>
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button className="btn btn-quiet min-h-11 px-2 text-xs" type="submit" aria-label="Move featured down">
                          ↓
                        </button>
                      </form>
                    </>
                  ) : null}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!trash ? (
        <div className="flex items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} />
            Select all
          </label>
        </div>
      ) : null}

      {selected.size > 0 && !trash ? (
        <form
          ref={bulkFormRef}
          className="desk-bulk"
          onSubmit={(e) => {
            e.preventDefault();
            applyBulk();
          }}
        >
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <label className="grid gap-1 text-sm">
            With them
            <select className="field h-9" name="action" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
              <option value="publish">Put on the site</option>
              <option value="hide">Hide</option>
              <option value="sold">Mark sold</option>
              <option value="draft">Move to draft</option>
              <option value="category">Change group</option>
              <option value="percent">Change price by percent</option>
              <option value="amount">Change price by dollars</option>
              <option value="trash">Move to trash</option>
            </select>
          </label>
          {bulkAction === "percent" || bulkAction === "amount" ? (
            <label className="grid gap-1 text-sm">
              {bulkAction === "percent" ? "Percent, like 10 or -15" : "Dollars, like 25 or -10"}
              <input className="field h-9 w-32" name="value" inputMode="decimal" />
            </label>
          ) : null}
          {bulkAction === "category" ? (
            <label className="grid gap-1 text-sm">
              Group
              <select className="field h-9" name="categoryId" defaultValue="">
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="btn btn-primary min-h-11 px-4" type="submit" disabled={pending}>
            Apply
          </button>
          <button className="btn btn-quiet min-h-11 px-3" type="button" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </form>
      ) : null}

      {toast ? (
        <div
          role="status"
          className={cn(
            "desk-note fixed bottom-4 left-1/2 z-30 flex w-[min(30rem,90vw)] -translate-x-1/2 items-center justify-between gap-3 shadow-lg",
          )}
        >
          <span>{toast.message}</span>
          {toast.undoId ? (
            <button className="btn btn-secondary min-h-11 px-3 text-xs" type="button" onClick={undo}>
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
