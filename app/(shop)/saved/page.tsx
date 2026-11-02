import { Suspense } from "react";
import type { Metadata } from "next";
import { SavedList } from "@/components/saved-list";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Saved", robots: { index: false, follow: false } };

export default function SavedPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 md:px-8">Loading saved pieces…</p>}>
      <SavedScreen />
    </Suspense>
  );
}

async function SavedScreen() {
  const settings = await getSettings();
  return (
    <main className="px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Saved</h1>
        <p className="measure mt-3 text-ink-soft">Saved pieces stay on this device. A shared link shows the same list.</p>
      </header>
      <SavedList shop={settings.businessName} whatsapp={settings.whatsapp} />
    </main>
  );
}
