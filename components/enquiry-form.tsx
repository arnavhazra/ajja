"use client";

import { useActionState } from "react";
import { EventBeacon } from "./event-beacon";
import { cn } from "@/lib/cn";
import { sendEnquiry } from "@/lib/public-actions";

export function EnquiryForm({ productId, productName }: { productId?: string; productName?: string }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });
  if (state.ok) {
    return (
      <div role="status" className="grid min-h-80 content-center gap-4 rounded-[2px] bg-gesso p-8 md:p-10">
        <span aria-hidden="true" className="size-4 rounded-full bg-pour" />
        <p className="display-wide text-3xl">Thank you. Your note is with the studio.</p>
        <p className="text-ink-soft">{state.message}</p>
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }
  return (
    <form id="message" action={action} className="grid gap-5 rounded-[2px] bg-gesso p-6 md:p-10">
      {productName ? (
        <p className="display-wide text-2xl">
          About <span className="text-pour">{productName}</span>
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="field-label">Your name</span>
          <input className="field" name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label className="grid gap-1.5">
          <span className="field-label">Phone or email</span>
          <input className="field" name="contact" autoComplete="email" required maxLength={160} />
        </label>
      </div>
      <input type="hidden" name="subject" value={productName ? `Enquiry: ${productName}` : "Question for the studio"} />
      <label className="grid gap-1.5">
        <span className="field-label">Message</span>
        <textarea
          className="field"
          name="message"
          required
          maxLength={2000}
          defaultValue={productName ? `I would like to ask about ${productName}.` : ""}
          placeholder={productName ? undefined : "Which piece, and what would you like to know?"}
        />
      </label>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-ink-soft [&::-webkit-details-marker]:hidden">
          <span className="ink-link">Is it a gift? Add a note</span>
        </summary>
        <textarea className="field mt-2" name="giftNote" maxLength={500} aria-label="Gift note" />
      </details>
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />
      {state.message ? (
        <p role="alert" className={cn("border-l-2 border-sold pl-3 text-sm text-sold")}>
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="field-hint max-w-xs">Nothing is paid on this website.</p>
        <button className="btn btn-pour" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
