"use client";

/* Light/dark switch.
 *
 * Writes `data-theme` on <html>; every colour in the app resolves from tokens
 * defined for both themes in globals.css, so nothing here knows what the
 * palette contains. Dark is the default and the product's own look — this only
 * stores a choice once one is made, so a browser with no stored preference
 * keeps rendering exactly as it always has.
 */

import { useEffect, useState } from "react";

const KEY = "flexee_theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // Site data blocked. The toggle still works for this page view.
    }
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function choose(next) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* nothing to persist to; the attribute above still applies */
    }
  }

  // Render nothing until the stored value is known, so the button never shows
  // the wrong state for a frame.
  if (!theme) return null;

  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => choose(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`inline-flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:text-[var(--paper)] ${className}`}
    >
      {theme === "light" ? (
        // Moon: clicking moves to dark.
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Sun: clicking moves to light.
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
