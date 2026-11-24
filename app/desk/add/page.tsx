import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DraftAboutForm } from "@/components/desk/draft-about-form";
import { Flash, one } from "@/components/desk/flash";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { PhotoUpload } from "@/components/desk/upload";
import { publishPiece } from "@/lib/desk-actions/pieces";
import { loadDeskPiece, loadDeskPieces, requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { formatMoney } from "@/lib/money";
import { canPublishPiece } from "@/lib/piece-readiness";
import { pieceKind, pieceTitle } from "@/lib/piece-title";

// after()-scheduled photo tidy can outlive the response; give it room.
export const maxDuration = 120;

export default function AddPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Add searchParams={searchParams} />
    </Suspense>
  );
}

const STEPS = ["Photo", "About this piece", "Review"] as const;

function StepTrail({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Add a piece, step by step">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true" className="text-tar-soft">→</span> : null}
          <span className={index === current ? "font-bold text-tar" : "text-tar-soft"} aria-current={index === current ? "step" : undefined}>
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

async function Add({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const pieceId = one(params.piece);
  const stage = one(params.stage);
  const prefix = await deskPrefix();

  if (pieceId) {
    const loaded = await loadDeskPiece(pieceId);
    if (loaded) {
      if (stage === "review") return <Review loaded={loaded} prefix={prefix} note={one(params.note)} />;
      return <About loaded={loaded} prefix={prefix} note={one(params.note)} />;
    }
  }

  return <Photo prefix={prefix} note={one(params.note)} />;
}

async function Photo({ prefix, note }: { prefix: string; note: string }) {
  const { rows } = await loadDeskPieces({ status: "draft" });
  const drafts = rows.slice(0, 8);
  return (
    <main className="desk-page">
      <Flash note={note} undo="" back="/add" />
      <div className="desk-lead">
        <h1 className="text-4xl">Add a piece</h1>
        <StepTrail current={0} />
        <p className="desk-note">
          Start with a photo. It is saved as a private draft right away — nothing goes on the site until you say so.
          JPEG, PNG, WebP, or HEIC, up to 15 MB.
        </p>
      </div>
      <PhotoUpload prefix={prefix} />
      {drafts.length ? (
        <section className="grid gap-3">
          <h2 className="text-2xl">Continue a draft</h2>
          <ul className="grid gap-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Link
                  href={`${prefix}/add?piece=${draft.id}`}
                  className="hairline-box flex min-h-14 items-center gap-3 bg-wall px-4 transition-colors hover:bg-wall-deep"
                >
                  {draft.image ? (
                    <Image src={draft.image.url} alt="" width={44} height={44} className="size-11 object-cover" />
                  ) : (
                    <span className="grid size-11 place-items-center bg-wall-deep text-tar-soft">?</span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{draft.title.trim() || "Not named yet"}</span>
                  <span className="text-tar-soft">Continue →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

async function About({
  loaded,
  prefix,
  note,
}: {
  loaded: NonNullable<Awaited<ReturnType<typeof loadDeskPiece>>>;
  prefix: string;
  note: string;
}) {
  const { product, images, groups } = loaded;
  return (
    <main className="desk-page max-w-3xl">
      <Flash note={note} undo="" back={`/add?piece=${product.id}`} />
      <div className="desk-lead">
        <h1 className="text-4xl">About this piece</h1>
        <StepTrail current={1} />
        <p className="desk-note">It stays a private draft. Only “Show on site” at the review step puts it up.</p>
      </div>
      {images[0] ? (
        <div className="plate relative aspect-[4/3] max-w-md overflow-hidden">
          <Image src={images[0].url} alt={images[0].alt || "The photo you just added"} fill sizes="(min-width: 768px) 28rem, 100vw" className="object-contain" />
        </div>
      ) : null}
      <DraftAboutForm
        piece={{
          id: product.id,
          title: product.title,
          categoryId: product.categoryId ?? "",
          description: product.description,
          price: product.priceMinor == null ? "" : String(product.priceMinor / 100),
        }}
        groups={groups.map((group) => ({ id: group.id, name: group.name }))}
        continueHref={`${prefix}/add?piece=${product.id}&stage=review`}
        leaveHref={`${prefix}/pieces`}
      />
    </main>
  );
}

async function Review({
  loaded,
  prefix,
  note,
}: {
  loaded: NonNullable<Awaited<ReturnType<typeof loadDeskPiece>>>;
  prefix: string;
  note: string;
}) {
  const { product, images } = loaded;
  const attributes = (product.attributes ?? {}) as Record<string, string>;
  const groupName = loaded.groups.find((group) => group.id === product.categoryId)?.name ?? null;
  const title = pieceTitle(product.title, loaded.groups.find((group) => group.id === product.categoryId)?.slug ?? null, attributes, product.id);
  const kind = pieceKind(groupName, attributes);
  const price = formatMoney(product.priceMinor, product.currency);
  const cover = images[0];
  const gate = canPublishPiece(product, images.length);

  return (
    <main className="desk-page max-w-3xl">
      <Flash note={note} undo="" back={`/add?piece=${product.id}&stage=review`} />
      <div className="desk-lead">
        <h1 className="text-4xl">Review</h1>
        <StepTrail current={2} />
        <p className="desk-note">This is what visitors will see.</p>
      </div>
      <section className="grid gap-8 md:grid-cols-2" aria-label="What visitors see">
        <div className="plate relative aspect-[4/3] overflow-hidden">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || title}
              fill
              sizes="(min-width: 768px) 36rem, 100vw"
              className="object-contain"
            />
          ) : (
            <span className="grid h-full place-items-center text-tar-soft">No photo</span>
          )}
        </div>
        <div className="grid content-start gap-6">
          <div className="wall-label grid gap-3 p-5">
            <p className="tag">{product.status === "draft" ? "Draft — only you can see this" : "On the site"}</p>
            <h2 className="display text-[clamp(2rem,4vw,3.5rem)]">{title}</h2>
            <p className="nums text-2xl">{product.status === "sold" ? "Sold" : (price ?? "Ask for the price")}</p>
          </div>
          {product.description ? <p className="prose">{product.description}</p> : null}
          {kind ? (
            <p className="tag">
              <span className="tag-strong">Art form:</span> {kind}
            </p>
          ) : null}
        </div>
      </section>
      {!gate.ok ? (
        <p className="desk-note border-l-4 border-sap bg-wall-deep px-4 py-3">
          {gate.reason}{" "}
          <Link className="ink-link" href={`${prefix}/add?piece=${product.id}`}>
            Back to About this piece
          </Link>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <form action={publishPiece}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="back" value="/pieces" />
          <button className="btn btn-primary" type="submit" disabled={!gate.ok}>
            Show on site
          </button>
        </form>
        <Link className="btn btn-secondary" href={`${prefix}/add?piece=${product.id}`}>
          Back to about
        </Link>
        <Link className="btn btn-quiet" href={`${prefix}/pieces`}>
          Keep as private draft
        </Link>
      </div>
    </main>
  );
}
