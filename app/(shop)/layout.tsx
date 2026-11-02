import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/public-data";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader settings={settings} />
      <div id="content" className="flex-1">
        {children}
      </div>
      <SiteFooter settings={settings} />
    </>
  );
}
