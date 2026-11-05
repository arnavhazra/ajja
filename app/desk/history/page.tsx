import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { loadHistory, requireDesk } from "@/lib/desk-data";

export default function HistoryPage() {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <History />
    </Suspense>
  );
}

async function History() {
  await requireDesk();
  const rows = await loadHistory();
  return (
    <main className="desk-page">
      <div className="desk-lead">
        <h1 className="text-4xl">History</h1>
        <p className="desk-note">What was saved, in plain words.</p>
      </div>
      <ul className="desk-stack">
        {rows.length === 0 ? <li>No changes yet.</li> : null}
        {rows.map((row) => (
          <li key={row.id}>
            {row.action}
            {row.createdAt ? ` · ${row.createdAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
