import { Suspense } from "react";
import { MissingPage, NotFoundView } from "@/components/not-found-view";

export default function NotFound() {
  return (
    <Suspense fallback={<MissingPage />}>
      <NotFoundView />
    </Suspense>
  );
}
