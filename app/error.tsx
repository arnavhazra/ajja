"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Route segment error:", error);
  }, [error]);

  return (
    <main
      className="shell grid min-h-[70svh] content-center py-24 text-center"
      role="alert"
      aria-live="assertive"
    >
      <p className="kicker">Studio interruption</p>
      <h1 className="display-wide mt-4 text-4xl md:text-5xl text-tar">
        Something went wrong
      </h1>
      <p className="prose mt-4 max-w-prose mx-auto text-tar-soft">
        The studio hit an unexpected snag while loading this section. Your saved items and pieces are safe.
        Please try again, or return to the index.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => retry()}
          className="btn btn-primary min-h-14 px-6 text-base cursor-pointer"
        >
          Try again
        </button>
        <Link href="/" className="btn btn-secondary min-h-14 px-6 text-base">
          Back to index
        </Link>
      </div>
      {error?.digest ? (
        <p className="mt-8 text-xs text-tar-soft">
          Reference code: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
