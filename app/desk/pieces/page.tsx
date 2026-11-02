import { Suspense } from "react";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { bulkApply, moveFeatured, restorePiece, saveInline } from "@/lib/desk-actions";
import { loadDeskPieces, requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { minorToDollars } from "@/lib/money";
import { statusLabel } from "@/lib/status";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default function PiecesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Pieces searchParams={searchParams} />
    </Suspense>
  );
}

async function Pieces({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const trash = one(params.trash) === "1";
  const [rows, groups, prefix] = await Promise.all([
    loadDeskPieces({ q: one(params.q), status: one(params.status), trash }),
    getDb().select().from(categories).orderBy(asc(categories.sortOrder)),
    deskPrefix(),
  ]);
  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo={one(params.undo)} back="/pieces" />
      <div className="desk-lead">
        <h1 className="text-4xl">Pieces</h1>
        <p className="desk-note">Search, change a price, or update several pieces at once.</p>
      </div>
      <form className="flex flex-wrap gap-2" method="get">
        <label className="grid gap-1">
          Search
          <input className="field" name="q" defaultValue={one(params.q)} />
        </label>
        <label className="grid gap-1">
          Status
          <select className="field" name="status" defaultValue={one(params.status)}>
            <option value="">Any</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">On the site</option>
            <option value="sold">Sold</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <button className="btn btn-primary self-end" type="submit">
          Show
        </button>
        <Link className="btn btn-quiet self-end" href={trash ? `${prefix}/pieces` : `${prefix}/pieces?trash=1`}>
          {trash ? "Back to pieces" : "Trash"}
        </Link>
      </form>
      <form id="bulk" action={bulkApply} className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          With selected
          <select className="field" name="action" defaultValue="publish">
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
        <label className="grid gap-1">
          Percent or dollars
          <input className="field" name="value" inputMode="decimal" />
        </label>
        <label className="grid gap-1">
          Group
          <select className="field" name="categoryId" defaultValue="">
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary" type="submit">
          Apply
        </button>
      </form>
      <div className="desk-stack">
        {rows.length === 0 ? <p>No pieces in this list.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="grid gap-3 border-b border-line pb-4 md:grid-cols-[auto_1fr_auto]">
            <label className="flex min-h-12 items-center gap-2">
              <input form="bulk" type="checkbox" name="id" value={row.id} />
              Select
            </label>
            <div>
              <Link className="text-2xl" href={`${prefix}/pieces/${row.id}`}>
                {row.title.trim() || "Studio Study"}
              </Link>
              <p>{statusLabel(row.status)}</p>
              {row.image ? <p className="text-ink-soft">Photo added</p> : <p>No photo yet</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {trash ? (
                <form action={restorePiece}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn btn-secondary" type="submit">
                    Restore
                  </button>
                </form>
              ) : (
                <>
                  <form action={saveInline} className="flex gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="intent" value="price" />
                    <label className="sr-only" htmlFor={`price-${row.id}`}>
                      Price
                    </label>
                    <input id={`price-${row.id}`} className="field w-28" name="price" defaultValue={minorToDollars(row.priceMinor)} inputMode="decimal" />
                    <button className="btn btn-quiet" type="submit">
                      Save price
                    </button>
                  </form>
                  <form action={saveInline} className="flex gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="intent" value="status" />
                    <label className="sr-only" htmlFor={`status-${row.id}`}>
                      Status
                    </label>
                    <select id={`status-${row.id}`} className="field" name="status" defaultValue={row.status}>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">On the site</option>
                      <option value="sold">Sold</option>
                      <option value="hidden">Hidden</option>
                    </select>
                    <button className="btn btn-quiet" type="submit">
                      Save status
                    </button>
                  </form>
                  {row.featured ? (
                    <>
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button className="btn btn-quiet" type="submit">
                          Featured up
                        </button>
                      </form>
                      <form action={moveFeatured}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button className="btn btn-quiet" type="submit">
                          Featured down
                        </button>
                      </form>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
