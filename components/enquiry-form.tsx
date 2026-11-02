"use client";

import { useActionState } from "react";
import { EventBeacon } from "./event-beacon";
import { cn } from "@/lib/cn";
import { sendEnquiry } from "@/lib/public-actions";

export function EnquiryForm({ productId, productName }: { productId?: string; productName?: string }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });
  return (
    <form id="message" action={action} className="grid gap-4 border-t border-line pt-6">
      <div>
        <h2 className="font-display text-2xl text-ink">Send a message</h2>
        {productName ? <p className="mt-1 text-ink-soft">Regarding {productName}.</p> : null}
      </div>
      <label className="grid gap-1">
        <span>Your name</span>
        <input className="field" name="name" autoComplete="name" required />
      </label>
      <label className="grid gap-1">
        <span>Phone or email</span>
        <input className="field" name="contact" autoComplete="tel" required />
      </label>
      <label className="grid gap-1">
        <span>Message</span>
        <textarea className="field" name="message" required defaultValue={productName ? `I am asking about ${productName}.` : ""} />
      </label>
      <label className="grid gap-1">
        <span>Gift note, if this is a gift</span>
        <textarea className="field" name="giftNote" />
      </label>
      <label className="grid gap-1">
        <span>Quantity</span>
        <input className="field" name="quantity" inputMode="numeric" min={1} />
      </label>
      <label className="flex min-h-12 cursor-pointer items-center gap-3">
        <input type="checkbox" name="bulk" className="size-5 border-line text-accent" />
        Ask for a bulk price
      </label>
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />
      {state.message ? (
        <p role="status" className={cn("border-l-2 pl-3", state.ok ? "border-accent text-accent" : "border-sold text-sold")}>
          {state.message}
        </p>
      ) : null}
      {state.ok ? <EventBeacon type="form" productId={productId} /> : null}
      <button className="btn btn-primary w-fit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send a message"}
      </button>
    </form>
  );
}
