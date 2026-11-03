import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { requireDesk, loadReview } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";

export default function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
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
      <Flash note={one(params.note)} undo="" back="/review" />
      <div className="desk-lead">
        <h1 className="text-4xl">Review</h1>
        <p className="desk-note">One draft at a time. Fill in what is missing, then go to the next.</p>
      </div>
      {item ? (
        <article className="desk-review">
          <figure className="photo-frame crop aspect-[4/5] relative grid w-full max-w-2xl place-items-center">
            {item.images[0] ? (
              <Image
                src={item.images[0].url}
                alt={item.images[0].alt || "Draft photograph"}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40rem"
                className="object-cover"
                style={{
                  objectPosition: `${Number(item.images[0].focalX) * 100}% ${Number(item.images[0].focalY) * 100}%`,
                }}
              />
            ) : (
              <p>No photo yet</p>
            )}
          </figure>
          <p className="display text-3xl">{item.product.title.trim() || "Studio Study"}</p>
          <p className="nums text-ink-soft">{item.remaining} still in the queue.</p>
          {item.missing.length ? (
            <p className="desk-note">Still missing: {item.missing.join(", ")}.</p>
          ) : (
            <p className="desk-note">Nothing obvious is missing. You can put it on the site when you are ready.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary w-full sm:w-fit" href={`${prefix}/pieces/${item.product.id}`}>
              Open this piece
            </Link>
            {item.nextId ? (
              <Link className="btn btn-secondary" href={`${prefix}/review?skip=${item.product.id}`}>
                Next
              </Link>
            ) : null}
            {item.nextId ? (
              <Link className="btn btn-quiet" href={`${prefix}/review?skip=${item.product.id}`}>
                Skip
              </Link>
            ) : (
              <p>This is the last draft.</p>
            )}
          </div>
        </article>
      ) : (
        <p className="desk-note">No drafts are waiting.</p>
      )}
    </main>
  );
}
