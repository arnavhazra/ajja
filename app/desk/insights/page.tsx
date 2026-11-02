import { Suspense } from "react";
import { loadInsights, requireDesk } from "@/lib/desk-data";

export default function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Insights searchParams={searchParams} />
    </Suspense>
  );
}

async function Insights({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const raw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = raw === "30" ? 30 : 7;
  const data = await loadInsights(days);
  return (
    <main className="desk-page">
      <div className="desk-lead">
        <h1 className="text-4xl">How it is going</h1>
        <p className="desk-note">Counts for the last {days} days. No chart tool, just bars.</p>
      </div>
      <nav className="flex gap-2">
        <a className="btn btn-quiet" href="?days=7">
          7 days
        </a>
        <a className="btn btn-quiet" href="?days=30">
          30 days
        </a>
      </nav>
      <Bars title="Activity" rows={data.counts.map((row) => ({ label: row.type, count: Number(row.count) }))} />
      <Bars title="Most looked at" rows={data.top.map((row) => ({ label: row.title, count: Number(row.count) }))} />
      <Bars title="Searches" rows={data.searches.map((row) => ({ label: row.term, count: Number(row.count) }))} />
      <Bars title="Searches with no results" rows={data.empty.map((row) => ({ label: row.term, count: Number(row.count) }))} />
    </main>
  );
}

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section>
      <h2 className="text-2xl">{title}</h2>
      {rows.length === 0 ? <p>Nothing yet.</p> : null}
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.label}>
            <p>
              {row.label}: {row.count}
            </p>
            <div className="h-3 bg-paper-2">
              <div className="h-3 bg-accent" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
