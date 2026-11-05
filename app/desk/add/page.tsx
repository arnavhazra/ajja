import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { PhotoUpload } from "@/components/desk/upload";
import { requireDesk } from "@/lib/desk-data";

// after()-scheduled photo tidy can outlive the response; give it room.
export const maxDuration = 120;

export default function AddPage() {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Add />
    </Suspense>
  );
}

async function Add() {
  await requireDesk();
  return (
    <main className="desk-page">
      <div className="desk-lead">
        <h1 className="text-4xl">Add a piece</h1>
        <p className="desk-note">Start with a photo. It is saved as a draft right away. JPEG, PNG, WebP, or HEIC, up to 15 MB.</p>
      </div>
      <PhotoUpload />
    </main>
  );
}
