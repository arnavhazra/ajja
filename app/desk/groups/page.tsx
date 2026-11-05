import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { Flash, one } from "@/components/desk/flash";
import { moveCategory, removeCategory, removeCollection, saveCategory, saveCollection } from "@/lib/desk-actions";
import { loadGroups, requireDesk } from "@/lib/desk-data";

export default function GroupsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Groups searchParams={searchParams} />
    </Suspense>
  );
}

async function Groups({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const { groups, sets, links, pieces } = await loadGroups();
  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo="" back="/groups" />
      <div className="desk-lead">
        <h1 className="text-4xl">Groups</h1>
        <p className="desk-note">Groups are labels, like Paintings or Woodwork. Collections are smaller sets you choose by hand.</p>
      </div>
      <section className="grid gap-4">
        <h2 className="text-3xl">Add a group</h2>
        <form action={saveCategory} className="grid max-w-xl gap-3">
          <label className="grid gap-1">
            Name
            <input className="field" name="name" required />
          </label>
          <label className="grid gap-1">
            Intro
            <textarea className="field" name="intro" />
          </label>
          <label className="grid gap-1">
            Extra questions, separated by commas
            <input className="field" name="fields" />
          </label>
          <button className="btn btn-primary w-fit" type="submit">
            Add group
          </button>
        </form>
        {groups.map((group) => {
          const fields = Array.isArray(group.fieldSchema) ? (group.fieldSchema as { label?: string }[]) : [];
          return (
            <form key={group.id} action={saveCategory} className="grid max-w-xl gap-2 border-b border-line pb-4">
              <input type="hidden" name="id" value={group.id} />
              <label className="grid gap-1">
                Name
                <input className="field" name="name" defaultValue={group.name} />
              </label>
              <label className="grid gap-1">
                Intro
                <textarea className="field" name="intro" defaultValue={group.intro} />
              </label>
              <label className="grid gap-1">
                Image address
                <input className="field" name="imageUrl" defaultValue={group.imageUrl ?? ""} />
              </label>
              <label className="grid gap-1">
                Extra questions
                <input className="field" name="fields" defaultValue={fields.map((field) => field.label ?? "").filter(Boolean).join(", ")} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-secondary" type="submit">
                  Save group
                </button>
                <button className="btn btn-quiet" type="submit" formAction={moveCategory.bind(null, "up")}>
                  Move up
                </button>
                <button className="btn btn-quiet" type="submit" formAction={moveCategory.bind(null, "down")}>
                  Move down
                </button>
                <button className="btn btn-quiet" type="submit" formAction={removeCategory}>
                  Remove
                </button>
              </div>
            </form>
          );
        })}
      </section>
      <section className="grid gap-4">
        <h2 className="text-3xl">Add a collection</h2>
        <CollectionForm pieces={pieces} selected={[]} />
        {sets.map((set) => (
          <div key={set.id} className="grid gap-2 border-b border-line pb-4">
            <CollectionForm
              pieces={pieces}
              selected={links.filter((link) => link.collectionId === set.id).sort((a, b) => a.sortOrder - b.sortOrder).map((link) => link.productId)}
              collection={set}
            />
            <form action={removeCollection}>
              <input type="hidden" name="id" value={set.id} />
              <button className="btn btn-quiet" type="submit">
                Remove collection
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}

function CollectionForm({
  pieces,
  selected,
  collection,
}: {
  pieces: { id: string; title: string; slug: string }[];
  selected: string[];
  collection?: { id: string; name: string; intro: string; imageUrl: string | null };
}) {
  return (
    <form action={saveCollection} className="grid max-w-xl gap-2">
      {collection ? <input type="hidden" name="id" value={collection.id} /> : null}
      <label className="grid gap-1">
        Name
        <input className="field" name="name" defaultValue={collection?.name ?? ""} required />
      </label>
      <label className="grid gap-1">
        Intro
        <textarea className="field" name="intro" defaultValue={collection?.intro ?? ""} />
      </label>
      <label className="grid gap-1">
        Image address
        <input className="field" name="imageUrl" defaultValue={collection?.imageUrl ?? ""} />
      </label>
      <fieldset className="grid max-h-64 gap-2 overflow-auto">
        <legend>Pieces in this collection</legend>
        {pieces.map((piece) => (
          <label key={piece.id} className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="productId" value={piece.id} defaultChecked={selected.includes(piece.id)} />
            {piece.title.trim() || "Studio Study"}
          </label>
        ))}
      </fieldset>
      <button className="btn btn-primary w-fit" type="submit">
        Save collection
      </button>
    </form>
  );
}
