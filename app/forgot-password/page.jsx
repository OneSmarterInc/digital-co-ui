"use client";

/* Asking for a password reset link.
 *
 * Public, because the person cannot sign in. The confirmation is deliberately
 * the same whether or not the address matched an account — the screen is the
 * only signal available to someone who is not signed in, so varying it would
 * turn this page into a way to test which addresses are enrolled.
 *
 * The link itself lands on /set-password/[uid]/[token], which already exists
 * for new instructors choosing their first password.
 */

import { useState } from "react";
import { API_BASE } from "../../lib/api";

const THEME = {
  "--graphite": "#16191D",
  "--graphite-raised": "#1E2228",
  "--graphite-high": "#252B32",
  "--steel-line": "#2C323A",
  "--steel-soft": "#363E48",
  "--paper": "#ECEFF2",
  "--muted": "#8A94A0",
  "--muted-dim": "#5C6672",
  "--amber": "#E8A13C",
  "--signal-red": "#D2564B",
  "--blueprint": "#5BA3C4",
  "--ok": "#7FB08A",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [phase, setPhase] = useState("ready"); // ready | sending | sent
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (phase === "sending") return;
    setPhase("sending");
    setError("");
    try {
      const r = await fetch(`${API_BASE}/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.detail || "Something went wrong. Try again in a moment.");
        setPhase("ready");
        return;
      }
      setPhase("sent");
    } catch {
      // Never report this as "no such account" — the request never arrived.
      setError("Couldn't reach the server. Check your connection and try again.");
      setPhase("ready");
    }
  }

  const inputClass =
    "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-[11px] text-[15px] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:bg-[var(--graphite-high)]";

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased"
      style={THEME}
    >
      <header className="mx-auto flex h-[72px] w-full max-w-[1080px] items-center justify-between border-b border-[var(--steel-line)] px-6">
        <a href="/" className={`flex items-center gap-3 ${FOCUS}`}>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[30px] w-[30px] flex-shrink-0" />
          <span
            className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[19px] font-bold leading-none tracking-[0.03em]`}
          >
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </span>
        </a>
        <a
          href="/login"
          className={`${MONO} text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] transition-colors hover:text-[var(--paper)] ${FOCUS}`}
        >
          Sign in
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-[400px]">
          <h1 className={`text-center ${DISPLAY} text-[40px] font-bold leading-none`}>
            {phase === "sent" ? "Check your email" : "Reset password"}
          </h1>

          <div className="mt-[26px] rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]">
            {phase === "sent" ? (
              <>
                <p className="text-[14px] leading-[1.65] text-[var(--paper)]">
                  If that account exists, a reset link is on its way. Open it and choose a new
                  password.
                </p>
                <p className={`mt-3 ${MONO} text-[10px] uppercase leading-[1.6] tracking-[0.1em] text-[var(--muted-dim)]`}>
                  The link works once. If nothing arrives in a few minutes, check your spam folder,
                  then ask your instructor.
                </p>
                <a
                  href="/login"
                  className={`mt-5 block rounded-[2px] bg-[var(--amber)] px-4 py-[13px] text-center ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.03em] text-[var(--graphite)] transition hover:bg-[#F0B052] ${FOCUS}`}
                >
                  Back to sign in
                </a>
              </>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                  Enter the email address you use for this course. We&rsquo;ll send you a link to
                  choose a new password.
                </p>

                <label className="block">
                  <span className={`mb-1.5 block ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]`}>
                    Email or username
                  </span>
                  <input
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={inputClass}
                    required
                  />
                </label>

                {error ? (
                  <p className="rounded-[2px] border border-[var(--signal-red)] bg-[rgba(210,86,75,0.12)] px-3 py-2.5 text-[13px] text-[var(--paper)]">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={phase === "sending"}
                  className={`mt-1 w-full rounded-[2px] bg-[var(--amber)] px-4 py-[13px] ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.03em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
                >
                  {phase === "sending" ? "Sending…" : "Send reset link"}
                </button>

                <a
                  href="/login"
                  className={`text-center ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted-dim)] transition-colors hover:text-[var(--paper)] ${FOCUS}`}
                >
                  Back to sign in
                </a>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
