"use client";

import { useState } from "react";

/** Password input with a large Show password toggle — no typos in the dark. */
export function PasswordField({
  name = "password",
  label = "Password",
  autoComplete = "current-password",
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="grid gap-1.5">
      <label className="grid gap-1.5">
        <span className="field-label">{label}</span>
        <input className="field" name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required />
      </label>
      <button className="btn btn-quiet min-h-11 w-fit px-4 text-sm" type="button" aria-pressed={show} onClick={() => setShow((value) => !value)}>
        {show ? "Hide password" : "Show password"}
      </button>
    </span>
  );
}
