"use client";

import { useActionState, useState } from "react";
import { EventBeacon } from "./event-beacon";
import { cn } from "@/lib/cn";
import { sendEnquiry } from "@/lib/public-actions";

type Props = { productId?: string; productName?: string; initialMessage?: string };

export function EnquiryForm(props: Props) {
  const [round, setRound] = useState(0);
  return <EnquiryFormInner key={round} {...props} onSendAnother={() => setRound((n) => n + 1)} />;
}

function EnquiryFormInner({ productId, productName, initialMessage, onSendAnother }: Props & { onSendAnother: () => void }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div role="status" className="note-card grid min-h-80 content-center gap-4 rounded-[2px] p-8 md:p-10">
        <span aria-hidden="true" className="size-4 rounded-full bg-pour" />
        <p className="display-wide text-3xl">Thank you. Your note is with the studio.</p>
        <p className="text-ink-soft">{state.message}</p>
        <button type="button" onClick={onSendAnother} className="btn btn-secondary w-fit min-h-11">
          Send another
        </button>
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }
  return (
    <form id="message" action={action} className="note-card grid gap-5 rounded-[2px] p-6 md:p-10">
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
          defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
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
