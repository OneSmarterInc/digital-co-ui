"use client";

/* The "?" itself. Lives in the shared chrome beside the FLEXEE · DigitalCo
 * lockup, so it's present on every student screen and in the tour.
 *
 * exitLabel lets the host name the way out in the student's own words — the
 * war room says "Back to the war room", everywhere else just closes. */

import { useState } from "react";
import HelpHub from "./HelpHub";

export default function HelpButton({ exitLabel = "Close", className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Help — how this works"
        title="How this works"
        className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-[var(--steel-line)] bg-[var(--graphite-raised)] font-['Saira_Condensed',sans-serif] text-[15px] font-bold leading-none text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--amber)] ${className}`}
      >
        ?
      </button>
      <HelpHub open={open} onClose={() => setOpen(false)} exitLabel={exitLabel} />
    </>
  );
}
