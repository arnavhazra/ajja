import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ShopProviders } from "@/components/shop/shop-providers";
import { getSettings } from "@/lib/public-data";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <ShopProviders>
      {settings.announcementLive && settings.announcement ? (
        <p className="bg-ink px-4 py-2.5 text-center text-sm text-gesso">{settings.announcement}</p>
      ) : null}
      <SiteHeader name={settings.businessName} />
      <div id="content" className="flex-1">
        {children}
      </div>
      <SiteFooter settings={settings} />
    </ShopProviders>
  );
}
