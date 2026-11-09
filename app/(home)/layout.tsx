import { SiteHeader } from "@/components/site-header";
import { ShopProviders } from "@/components/shop/shop-providers";
import { getSettings, hasPricedProducts } from "@/lib/public-data";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const [settings, hasPrices] = await Promise.all([getSettings(), hasPricedProducts()]);
  return (
    <ShopProviders location={`${settings.town}, ${settings.region}`}>
      {settings.announcementLive && settings.announcement ? (
        <p className="bg-tar px-4 py-2.5 text-center text-sm text-wall">{settings.announcement}</p>
      ) : null}
      <SiteHeader name={settings.businessName} hasPrices={hasPrices} />
      <div id="content" className="flex-1">
        {children}
      </div>
    </ShopProviders>
  );
}
