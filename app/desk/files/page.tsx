import { Suspense } from "react";
import { Flash, one } from "@/components/desk/flash";
import { ImportFile } from "@/components/desk/import-file";
import { requireDesk } from "@/lib/desk-data";
import { getSettings } from "@/lib/public-data";

export default function FilesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Files searchParams={searchParams} />
    </Suspense>
  );
}

async function Files({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const settings = await getSettings();
  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo="" back="/files" />
      <div className="desk-lead">
        <h1 className="text-4xl">Bring in / Save a copy</h1>
        <p className="desk-note">Bring in names and prices from a spreadsheet. Save a copy of the words and the photographs.</p>
      </div>
      <p>{settings.lastBackupAt ? `Last copy: ${settings.lastBackupAt.slice(0, 10)}.` : "No copy has been saved yet."}</p>
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-secondary" href="/api/desk/export">
          Download the list
        </a>
        <a className="btn btn-primary" href="/api/desk/backup">
          Save a copy
        </a>
      </div>
      <ImportFile />
    </main>
  );
}
