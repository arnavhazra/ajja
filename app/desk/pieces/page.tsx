import { Suspense } from "react";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { emptyTrash } from "@/lib/desk-actions";
import { PiecesTable, type DeskPieceRow } from "@/components/desk/pieces-table";
import { loadDeskPieces, loadNeedCounts, requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { evaluatePieceReadiness } from "@/lib/piece-readiness";
import { minorToDollars } from "@/lib/money";
import { pieceTitle } from "@/lib/piece-title";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const NEEDS = [
  { key: "photo", label: "Needs a photo" },
  { key: "title", label: "Needs a name" },
  { key: "group", label: "Needs a group" },
  { key: "size", label: "Needs a size" },
  { key: "price", label: "Needs a price" },
] as const;

export default function PiecesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Pieces searchParams={searchParams} />
    </Suspense>
  );
}

async function Pieces({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const trash = one(params.trash) === "1";
  const need = one(params.need);
  const [{ rows, page, hasMore }, groups, prefix, globalNeeds] = await Promise.all([
    loadDeskPieces({ q: one(params.q), status: one(params.status), trash, page: Math.max(0, Number(one(params.page)) || 0) }),
    getDb().select().from(categories).orderBy(asc(categories.sortOrder)),
    deskPrefix(),
    loadNeedCounts(),
  ]);
  const groupName = new Map(groups.map((group) => [group.id, group.name]));

  const needsOf = (row: (typeof rows)[number]) => {
    const readiness = evaluatePieceReadiness({
      title: row.title,
      categoryId: row.categoryId,
      attributes: row.attributes,
      priceMinor: row.priceMinor,
      hasPhoto: Boolean(row.image),
    });
    const needs = readiness.missing.map((item) => item.toLowerCase());
    if (row.priceMinor == null) needs.push("price");
    return { readiness, needs };
  };

  const all = rows.map((row) => ({ row, ...needsOf(row) }));
  const needCounts = new Map(NEEDS.map(({ key }) => [key, globalNeeds[key]]));
  const visible = need ? all.filter(({ needs }) => needs.includes(need)) : all;

  const tableRows: DeskPieceRow[] = visible.map(({ row, readiness, needs }) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    displayTitle: pieceTitle(row.title, groupName.get(row.categoryId ?? "") ?? null, row.attributes as Record<string, string> | undefined, row.id),
    status: row.status,
    featured: row.featured,
    price: minorToDollars(row.priceMinor),
    categoryId: row.categoryId ?? "",
    ready: readiness.isReady,
    missing: readiness.missing,
    needs,
    imageUrl: row.image?.url ?? "",
  }));

  const href = (extra: Record<string, string>) => {
    const merged = new URLSearchParams();
    for (const [key, value] of Object.entries({
      q: one(params.q),
      status: one(params.status),
      trash: trash ? "1" : "",
      ...extra,
    })) {
      if (value) merged.set(key, value);
    }
    const query = merged.toString();
    return `${prefix}/pieces${query ? `?${query}` : ""}`;
  };

  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo={one(params.undo)} back="/pieces" />
      <div className="desk-lead">
        <h1 className="text-4xl">Pieces</h1>
        <p className="desk-note">Search, change a name, price, group, or status right here — changes save when you leave the field.</p>
      </div>
      <form className="flex flex-wrap items-end gap-2" method="get">
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
        {need ? <input type="hidden" name="need" value={need} /> : null}
        <button className="btn btn-primary self-end" type="submit">
          Show
        </button>
        <Link className="btn btn-quiet self-end" href={trash ? `${prefix}/pieces` : `${prefix}/pieces?trash=1`}>
          {trash ? "Back to pieces" : "Trash"}
        </Link>
        {trash ? (
          <form action={emptyTrash} className="self-end">
            <button className="btn btn-secondary" type="submit">
              Empty trash older than 30 days
            </button>
          </form>
        ) : null}
      </form>
      {!trash ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show pieces that need something">
          <span className="text-sm text-tar-soft">Needs:</span>
          {NEEDS.map(({ key, label }) => (
            <Link
              key={key}
              className="desk-chip"
              aria-current={need === key ? "true" : undefined}
              href={need === key ? href({ need: "" }) : href({ need: key })}
            >
              {label}
              <span className="nums">{needCounts.get(key) ?? 0}</span>
            </Link>
          ))}
        </div>
      ) : null}
      <PiecesTable
        rows={tableRows}
        groups={groups.map((group) => ({ id: group.id, name: group.name }))}
        prefix={prefix}
        trash={trash}
      />
      {page > 0 || hasMore ? (
        <nav className="flex items-center gap-2" aria-label="Pages">
          {page > 0 ? (
            <Link className="btn btn-secondary" href={href({ page: String(page - 1) })}>
              ← Previous
            </Link>
          ) : null}
          <span className="desk-note nums">Page {page + 1}</span>
          {hasMore ? (
            <Link className="btn btn-secondary" href={href({ page: String(page + 1) })}>
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
