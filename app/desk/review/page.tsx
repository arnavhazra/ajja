import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { sprintSave } from "@/lib/desk-actions";
import { requireDesk, loadReview } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { minorToDollars } from "@/lib/money";

export default function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Review searchParams={searchParams} />
    </Suspense>
  );
}

async function Review({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const [item, prefix] = await Promise.all([loadReview(one(params.skip)), deskPrefix()]);
  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo={one(params.undo)} back="/review" />
      <div className="desk-lead">
        <h1 className="text-4xl">Name &amp; price sprint</h1>
        <p className="desk-note">One piece at a time. Name it, price it if you can, press Enter — the next one loads.</p>
      </div>
      {item ? (
        <article className="desk-review grid gap-5">
          <figure className="photo-frame crop relative grid aspect-[4/3] w-full max-w-3xl place-items-center">
            {item.images[0] ? (
              <Image
                src={item.images[0].url}
                alt={item.images[0].alt || "Draft photograph"}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 48rem"
                className="object-cover"
                style={{
                  objectPosition: `${Number(item.images[0].focalX) * 100}% ${Number(item.images[0].focalY) * 100}%`,
                }}
              />
            ) : (
              <p>No photo yet</p>
            )}
          </figure>
          <p className="nums text-tar-soft">{item.remaining} still in the queue.</p>
          {item.missing.length ? (
            <p className="desk-note">Still missing: {item.missing.join(", ")}.</p>
          ) : (
            <p className="desk-note">Nothing obvious is missing.</p>
          )}
          <form action={sprintSave} className="grid max-w-xl gap-3" key={item.product.id}>
            <input type="hidden" name="id" value={item.product.id} />
            <label className="grid gap-1">
              <span className="field-label">Name</span>
              <input
                className="field text-lg"
                name="title"
                defaultValue={item.product.title}
                placeholder="e.g. Cobalt pour no. 3"
                autoFocus
              />
            </label>
            <label className="grid gap-1">
              <span className="field-label">Price in dollars — leave blank to keep it a question</span>
              <input
                className="field nums"
                name="price"
                defaultValue={minorToDollars(item.product.priceMinor)}
                inputMode="decimal"
                placeholder="e.g. 180"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="submit">
                Save &amp; next →
              </button>
              <Link className="btn btn-secondary" href={`${prefix}/pieces/${item.product.id}`}>
                Open full editor
              </Link>
              {item.nextId ? (
                <Link className="btn btn-quiet" href={`${prefix}/review?skip=${item.product.id}`}>
                  Skip
                </Link>
              ) : null}
            </div>
          </form>
        </article>
      ) : (
        <p className="desk-note">No drafts are waiting — the queue is clear.</p>
      )}
    </main>
  );
}
