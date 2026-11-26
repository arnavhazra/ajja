"use client";

import { useActionState, useEffect, useState } from "react";
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
  // `navigator.onLine` is undefined in the Node SSR runtime, so only an explicit
  // `false` counts as offline — this keeps server and client first render in agreement.
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (state.ok) {
    return (
      <div
        role="status"
        className="grid min-h-80 content-center gap-4 border border-line bg-surface-low p-8 md:p-10"
      >
        <span className="micro-label text-ok">● Note received</span>
        <p className="display-wide text-3xl text-tar">Thank you. Your note is with the studio.</p>
        <p className="text-tar-soft">{state.message}</p>
        <button
          type="button"
          onClick={onSendAnother}
          className="micro-label mt-2 inline-flex min-h-11 w-fit items-center justify-center border border-line-strong bg-wall px-5 py-2.5 text-tar transition-colors hover:border-tar hover:bg-plate"
        >
          Send another
        </button>
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }
  return (
    <form
      id="message"
      action={action}
      className="grid gap-5 border border-line bg-surface-low p-6 md:p-8"
    >
      {productName ? (
        <p className="display-wide border-b border-line pb-4 text-xl text-tar md:text-2xl">
          About <span className="text-tar-soft">{productName}</span>
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="micro-label text-tar-soft">
            Your name <span className="text-sold">*</span>
          </span>
          <input
            className="min-h-11 w-full border border-line-strong bg-wall px-3.5 py-2.5 text-base text-tar placeholder:text-tar-soft/60 focus:border-tar focus:outline-none"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Your full name"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="micro-label text-tar-soft">
            Phone or email <span className="text-sold">*</span>
          </span>
          <input
            className="min-h-11 w-full border border-line-strong bg-wall px-3.5 py-2.5 text-base text-tar placeholder:text-tar-soft/60 focus:border-tar focus:outline-none"
            name="contact"
            autoComplete="email"
            required
            maxLength={160}
            placeholder="610 555 0123 or you@example.com"
          />
        </label>
      </div>
      <input type="hidden" name="subject" value={productName ? `Enquiry: ${productName}` : "Question for the studio"} />
      <label className="grid gap-1.5">
        <span className="micro-label text-tar-soft">
          Your note <span className="text-sold">*</span>
        </span>
        <textarea
          className="min-h-[120px] w-full resize-y border border-line-strong bg-wall px-3.5 py-2.5 text-base leading-relaxed text-tar placeholder:text-tar-soft/60 focus:border-tar focus:outline-none"
          name="message"
          required
          maxLength={2000}
          defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
          placeholder={productName ? undefined : "Which piece, and what would you like to know?"}
        />
      </label>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm text-tar-soft [&::-webkit-details-marker]:hidden">
          <span className="ink-link">Adding it as a gift? Tell us here</span>
        </summary>
        <textarea
          className="mt-2 min-h-[84px] w-full resize-y border border-line-strong bg-wall px-3.5 py-2.5 text-base text-tar placeholder:text-tar-soft/60 focus:border-tar focus:outline-none"
          name="giftNote"
          maxLength={500}
          aria-label="Gift note"
          placeholder="Optional gift note or occasion"
        />
      </details>
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />
      {!online ? (
        <p role="status" className="border-l-2 border-warn pl-3 text-sm text-tar-soft">
          You appear to be offline. Reconnect to send your note — nothing has been sent yet.
        </p>
      ) : null}
      {state.message ? (
        <p role="alert" className={cn("border-l-2 border-sold pl-3 text-sm text-sold")}>
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          className="micro-label inline-flex min-h-11 items-center justify-center bg-tar px-6 py-3 font-medium text-wall transition-colors hover:bg-sold disabled:opacity-50"
          type="submit"
          disabled={pending || !online}
        >
          {!online ? "Offline" : pending ? "Sending…" : "Send a note →"}
        </button>
        <p className="ledger text-[11px] text-tar-soft">No online payment. Direct correspondence only.</p>
      </div>
    </form>
  );
}
