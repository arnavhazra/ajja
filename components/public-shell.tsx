import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ShopProviders } from "@/components/shop/shop-providers";
import { brand } from "@/lib/brand";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

export function PublicShell({
  settings,
  products,
  children,
}: {
  settings: ShopSettings;
  products: PublicProduct[];
  children: React.ReactNode;
}) {
  const hasStory = Boolean(settings.story.trim());
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
