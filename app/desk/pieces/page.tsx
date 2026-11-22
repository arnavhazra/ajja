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
      <nav className="flex flex-wrap gap-2" aria-label="Which pieces to show">
        {[
          { label: "All", extra: { status: "", trash: "" }, active: !trash && !one(params.status) },
          { label: "Drafts", extra: { status: "draft", trash: "" }, active: !trash && one(params.status) === "draft" },
          { label: "On the site", extra: { status: "published", trash: "" }, active: !trash && one(params.status) === "published" },
          { label: "Sold", extra: { status: "sold", trash: "" }, active: !trash && one(params.status) === "sold" },
          { label: "Hidden", extra: { status: "hidden", trash: "" }, active: !trash && one(params.status) === "hidden" },
          { label: "Trash", extra: { status: "", trash: "1" }, active: trash },
        ].map((tab) => (
          <Link key={tab.label} className="desk-link desk-view min-h-12" aria-current={tab.active ? "page" : undefined} href={href(tab.extra)}>
            {tab.label}
          </Link>
        ))}
      </nav>
      <form className="flex flex-wrap items-end gap-2" method="get">
        <label className="grid gap-1">
          Search
          <input className="field" name="q" defaultValue={one(params.q)} />
        </label>
        {one(params.status) ? <input type="hidden" name="status" value={one(params.status)} /> : null}
        {need ? <input type="hidden" name="need" value={need} /> : null}
        {trash ? <input type="hidden" name="trash" value="1" /> : null}
        <button className="btn btn-primary self-end" type="submit">
          Search
        </button>
      </form>
      {trash ? (
        <>
          <p className="desk-note">Anything in the trash can be restored for 30 days.</p>
          <form action={emptyTrash} className="self-end">
            <button className="btn btn-secondary" type="submit">
              Empty trash older than 30 days
            </button>
          </form>
        </>
      ) : null}
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
