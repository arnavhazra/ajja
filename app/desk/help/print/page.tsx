import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { PrintButton } from "@/components/desk/print-button";
import { requireDesk } from "@/lib/desk-data";

export default function CheatSheetPage() {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <CheatSheet />
    </Suspense>
  );
}

async function CheatSheet() {
  await requireDesk();
  const steps = [
    "Sign in on this private page. Sign out when you are done.",
    "Add a piece starts with a photo. It is saved as a draft.",
    "Open the piece. Write the name, the price, and a short description of the photo.",
    "Choose On the site when you want people to see it. Until then it stays off the shop.",
    "Change a price from the pieces list, or inside the piece. Save.",
    "Mark sold when someone takes it. Hide if you want it off the site for now.",
    "If a save was wrong, press Undo on the note at the top.",
    "Home page is where the headline, hours, phone, and WhatsApp number live.",
    "Messages holds what people sent. Reply on WhatsApp when their number is a phone.",
    "Save a copy once a month from Bring in / Save a copy.",
    "Poster prints a QR code for the shop and for each piece on the site.",
  ];
  return (
    <main className="desk-page max-w-3xl">
      <div className="no-print">
        <PrintButton />
      </div>
      <h1 className="text-4xl">Ajja desk, one page</h1>
      <ol className="grid list-decimal gap-3 pl-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </main>
  );
}
