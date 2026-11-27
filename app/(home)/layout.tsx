import { PublicShell } from "@/components/public-shell";
import { getSettings, loadManifest } from "@/lib/public-data";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const [settings, products] = await Promise.all([getSettings(), loadManifest()]);
  return (
    <PublicShell settings={settings} products={products}>
      {children}
    </PublicShell>
  );
}
