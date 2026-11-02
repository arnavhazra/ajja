"use client";

import { useActionState } from "react";
import { EventBeacon } from "./event-beacon";
import { cn } from "@/lib/cn";
import { sendEnquiry } from "@/lib/public-actions";

export function EnquiryForm({ productId, productName }: { productId?: string; productName?: string }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });
  return (
    <form id="message" action={action} className="grid gap-5 pt-6 hairline-t">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-terracotta font-bold">
          Studio correspondence
        </p>
        <h2 className="mt-1 font-serif text-2xl text-ink">Send a message</h2>
        {productName ? <p className="mt-1 text-sm text-umber">Regarding {productName}.</p> : null}
      </div>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Your name</span>
        <input id="inquiryName" className="field" name="name" autoComplete="name" required />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Phone or email</span>
        <input id="inquiryContact" className="field" name="contact" autoComplete="tel" required />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Piece or subject</span>
        <input
          id="inquirySubject"
          className="field"
          name="subject"
          defaultValue={productName ? `Enquiry: ${productName}` : ""}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Message</span>
        <textarea
          id="inquiryMessage"
          className="field"
          name="message"
          required
          defaultValue={productName ? `I am asking about ${productName}.` : ""}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Gift note, if this is a gift</span>
        <textarea className="field" name="giftNote" />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">Quantity</span>
        <input className="field" name="quantity" inputMode="numeric" min={1} />
      </label>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink">
        <input type="checkbox" name="bulk" className="size-5 border-line accent-terracotta" />
        Ask for a bulk price
      </label>
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />
      {state.message ? (
        <p role="status" className={cn("border-l-2 pl-3 text-sm", state.ok ? "border-moss text-moss" : "border-sold text-sold")}>
          {state.message}
        </p>
      ) : null}
      {state.ok ? <EventBeacon type="form" productId={productId} /> : null}
      <button className="btn btn-terracotta w-fit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send a message"}
      </button>
    </form>
  );
}
