import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ShopProviders } from "@/components/shop/shop-providers";
import { brand } from "@/lib/brand";
import { getSettings, loadManifest } from "@/lib/public-data";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, products] = await Promise.all([getSettings(), loadManifest()]);
  const hasStory = Boolean(settings.story.trim());
  // The footer ribbon is every piece's sampled pigment, in wall order.
  const pigments = products.map((product) => product.pigment);
  return (
    <ShopProviders>
      {settings.announcementLive && settings.announcement ? (
        <p className="bg-tar px-4 py-2.5 text-center text-sm text-wall">{settings.announcement}</p>
      ) : null}
      <SiteHeader name={brand.name} hasStory={hasStory} />
      <div id="content" className="flex-1">
        {children}
      </div>
      <SiteFooter settings={settings} pigments={pigments} hasStory={hasStory} />
    </ShopProviders>
  );
}
