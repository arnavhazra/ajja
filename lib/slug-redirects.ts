/**
 * Redirect rows written when a piece's slug moves. The reverse edges are
 * removed first so /p/a -> /p/b -> /p/a redirect loops can never happen.
 * Pure so the plan is unit-testable without a database.
 */
export function slugRedirectPlan(fromSlug: string, toSlug: string) {
  if (!fromSlug || fromSlug === toSlug) {
    return { writes: [] as { fromPath: string; toPath: string }[], reverse: [] as { fromPath: string; toPath: string }[] };
  }
  return {
    writes: [
      { fromPath: `/p/${fromSlug}`, toPath: `/p/${toSlug}` },
      { fromPath: `/studio/${fromSlug}`, toPath: `/studio/${toSlug}` },
    ],
    reverse: [
      { fromPath: `/p/${toSlug}`, toPath: `/p/${fromSlug}` },
      { fromPath: `/studio/${toSlug}`, toPath: `/studio/${fromSlug}` },
    ],
  };
}
