import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

export function BuyingSection({ settings }: { settings: ShopSettings }) {
  const steps = [
    { title: "Ask", body: settings.policies.buying },
    { title: "Collect", body: settings.policies.collection },
    { title: "Keep", body: settings.policies.returns },
  ];
  return (
    <section id="buying" aria-labelledby="buying-title" className="shell scroll-mt-20 py-24 md:py-36">
      <div className="grid gap-10 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <h2 id="buying-title" className="display text-[clamp(2.75rem,6vw,5.5rem)]">
            How buying works
          </h2>
          <p className="caption mt-5 max-w-xs">There is no cart and no checkout. Every sale starts with a conversation.</p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-[2px] bg-line md:col-span-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex min-h-72 flex-col justify-between gap-10 bg-gesso p-6 md:p-8" data-reveal="">
              <span className="display nums text-[5rem] leading-none text-pour">{index + 1}</span>
              <div>
                <h3 className="display-wide text-2xl">{step.title}</h3>
                <p className="mt-3 text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {settings.faqs.length ? (
        <div className="mt-20 grid gap-6 md:grid-cols-12">
          <h3 className="display-wide text-2xl md:col-span-4">Questions</h3>
          <div className="md:col-span-8">
            {settings.faqs.map((faq) => (
              <details key={faq.q} className="group border-t border-line last:border-b">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-[560] [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span aria-hidden="true" className="relative size-4 shrink-0">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-ink" />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-ink transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="measure pb-6 text-ink-soft">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
      <p className="mt-10">
        <Link href="/policies" className="ink-link inline-flex min-h-11 items-center">
          Read the full buying, collection, and returns notes
        </Link>
      </p>
    </section>
  );
}
