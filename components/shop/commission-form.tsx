"use client";

import { useActionState } from "react";
import { sendEnquiry } from "@/lib/public-actions";
import { EventBeacon } from "@/components/event-beacon";

export function CommissionForm({
  productId,
  productName,
}: {
  productId?: string;
  productName?: string;
}) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div role="status" className="bg-bone hairline-box rounded-sm p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
        <span className="inline-block size-3 rounded-full bg-moss mb-4" />
        <h3 className="font-serif text-3xl font-medium text-ink mb-2">Note Transmitted to Studio Ledger</h3>
        <p className="text-sm text-umber leading-relaxed font-sans max-w-md mx-auto">
          {state.message || "Thank you. Your inquiry has been delivered directly to the workshop bench. We will respond within 48 hours."}
        </p>
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }

  return (
    <section id="inquire" className="py-16 sm:py-24 bg-linen hairline-b">
      <div className="shell max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2 font-bold">
            DIRECT INQUIRY &amp; COMMISSION WAITLIST
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-ink font-normal mb-3">
            Initiate Custody of a Work
          </h2>
          <p className="text-sm text-umber max-w-lg mx-auto font-sans leading-relaxed">
            Please indicate which specimen or custom dimensions you wish to discuss. Inquiries are reviewed directly at the studio bench.
          </p>
        </div>

        <form action={action} className="bg-bone hairline-box rounded-sm p-6 sm:p-10 shadow-sm space-y-5">
          {productName ? (
            <div className="p-3 bg-linen hairline-box rounded-sm font-mono text-xs text-ink flex items-center justify-between">
              <span>Regarding Specimen:</span>
              <strong className="text-terracotta">{productName}</strong>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
                PATRON FULL NAME *
              </span>
              <input
                type="text"
                name="name"
                required
                maxLength={120}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
                EMAIL OR TELEPHONE *
              </span>
              <input
                type="text"
                name="contact"
                required
                maxLength={160}
                placeholder="e.g. eleanor@collection.art"
                className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta"
              />
            </label>
          </div>

          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
              INQUIRY SUBJECT
            </span>
            <input
              type="text"
              name="subject"
              defaultValue={productName ? `Inquiry on ${productName}` : "Studio Acquisition / Commission Inquiry"}
              className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm focus:outline-none focus:border-terracotta"
            />
          </label>

          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
              SPECIMEN DETAILS / QUESTIONS *
            </span>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={2500}
              defaultValue={productName ? `I would like to inquire about acquiring ${productName}. Please let me know regarding shipping arrangements and framing.` : ""}
              placeholder="State the archive catalogue numbers or your architectural requirements (desired dimensions, wood species, delivery destination)..."
              className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta leading-relaxed"
            />
          </label>

          <input type="hidden" name="productId" value={productId ?? ""} />
          <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />

          {state.message ? (
            <p role="alert" className="border-l-2 border-sold pl-3 text-xs text-sold font-mono">
              {state.message}
            </p>
          ) : null}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="font-mono text-[10px] text-umber uppercase tracking-wider">
              ● All transactions verified via custodial deed. Zero spam.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary px-8 py-3.5 shadow-sm"
            >
              {pending ? "[Transmitting to Bench…]" : "[Transmit to Studio Ledger ↗]"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
