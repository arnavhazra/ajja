"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { draftPiece, duplicatePiece, hidePiece, publishPiece, restorePiece, sellPiece, trashPiece } from "@/lib/desk-actions/pieces-status";
import { moveFeatured, toggleFeatured } from "@/lib/desk-actions/quick-edits";
import type { CellIntent, DeskPieceRow, Group } from "./pieces-table-types";

const STATUS_OPTIONS = [
  ["draft", "Draft"],
  ["scheduled", "Scheduled"],
  ["published", "On the site"],
  ["sold", "Sold"],
  ["hidden", "Hidden"],
] as const;

type Props = {
  row: DeskPieceRow;
  groups: Group[];
  prefix: string;
  trash: boolean;
  selected: boolean;
  valueOf: (row: DeskPieceRow, intent: CellIntent) => string;
  edit: (row: DeskPieceRow, intent: CellIntent, next: string) => void;
  save: (row: DeskPieceRow, intent: CellIntent, override?: string) => void;
  toggle: (id: string) => void;
};

export function PiecesTableRow({ row, groups, prefix, trash, selected, valueOf, edit, save, toggle }: Props) {
  return (
    <div className="desk-trow" role="row">
      <div className="desk-cell-check flex min-h-11 items-center" role="cell">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => toggle(row.id)}
          aria-label={`Select ${row.displayTitle}`}
        />
      </div>
      <Link className="desk-thumb desk-cell-thumb" href={`${prefix}/pieces/${row.id}`} tabIndex={-1} aria-hidden="true" role="cell">
        {row.imageUrl ? <Image src={row.imageUrl} alt="" width={128} height={128} sizes="52px" /> : <span>No photo</span>}
      </Link>
      <div className="desk-cell-main min-w-0" role="cell">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="field min-h-12 min-w-0 flex-1 text-base font-semibold"
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
            className="text-sm text-tar-soft underline hover:text-tar"
            href={`${prefix}/pieces/${row.id}`}
            aria-label={`Edit ${row.displayTitle}`}
          >
            Edit
          </Link>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-tar-soft">
          {!row.title.trim() ? <span className="text-xs">Shown as “{row.displayTitle}” until you name it</span> : null}
          {row.featured ? <span className="desk-pill">Featured</span> : null}
          {!row.ready ? (
            <span className="desk-pill text-xs" data-tone="warn">
              Needs {row.missing.join(", ").toLowerCase()}
            </span>
          ) : null}
          {row.status === "published" ? (
            <a href={`/p/${row.slug}`} target="_blank" rel="noreferrer" className="text-xs text-tar-soft hover:text-tar underline">
              view live ↗
            </a>
          ) : null}
        </p>
      </div>
      <div className="desk-cell-price min-w-0" role="cell">
        <label className="sr-only" htmlFor={`price-${row.id}`}>
          {`Price for ${row.displayTitle}`}
        </label>
        <input
          id={`price-${row.id}`}
          className="field min-h-12 w-full nums"
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
      <div className="desk-cell-status min-w-0" role="cell">
        <label className="sr-only" htmlFor={`status-${row.id}`}>
          {`Status of ${row.displayTitle}`}
        </label>
        <select
          id={`status-${row.id}`}
          className="field min-h-12 w-full"
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
          className="field min-h-12"
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
          <span className="flex flex-wrap items-center gap-1">
            <details className="desk-more">
              <summary className="btn btn-secondary min-h-11 px-3 text-xs">More</summary>
              <span className="desk-more-menu">
                {row.status === "draft" ? (
                  <Link className="btn btn-quiet min-h-11 px-3 text-xs" href={`${prefix}/add?piece=${row.id}`}>
                    Continue draft
                  </Link>
                ) : null}
                <form action={sellPiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="back" value="/pieces" />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Mark as sold
                  </button>
                </form>
                <form action={hidePiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="back" value="/pieces" />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Hide
                  </button>
                </form>
                <form action={publishPiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="back" value="/pieces" />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Put on the site
                  </button>
                </form>
                <form action={draftPiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="back" value="/pieces" />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Move back to draft
                  </button>
                </form>
                <form action={toggleFeatured}>
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    className={cn("btn btn-quiet min-h-11 px-3 text-xs", row.featured && "text-ok")}
                    type="submit"
                    aria-pressed={row.featured}
                  >
                    {row.featured ? "Unfeature" : "Feature"}
                  </button>
                </form>
                {row.featured ? (
                  <>
                    <form action={moveFeatured}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit" aria-label="Move featured up">
                        Move featured up
                      </button>
                    </form>
                    <form action={moveFeatured}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit" aria-label="Move featured down">
                        Move featured down
                      </button>
                    </form>
                  </>
                ) : null}
                <form action={duplicatePiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Duplicate
                  </button>
                </form>
                <form action={trashPiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Move to trash
                  </button>
                </form>
              </span>
            </details>
          </span>
        )}
      </div>
    </div>
  );
}
