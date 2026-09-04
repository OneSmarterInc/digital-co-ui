"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "../Reveal";
import { login, fetchMe, canAccess } from "../../lib/api";
import ThemeToggle from "../ThemeToggle";

/* Login in the dark console theme — follows the .login-wrap / .login-card /
 * .login-form patterns from app/console.css: centered Saira Condensed title,
 * mono sub, dark form panel, graphite inputs with blueprint focus, amber
 * commit button, and the rgba-red error treatment from .login-err.
 * Palette is set as CSS vars on the wrapper so this page is self-contained.
 */


const ROLES = [
  { key: "student", label: "Student" },
  { key: "instructor", label: "Instructor" },
  { key: "admin", label: "Admin" },
];

const HINT = {
  student: "Sign in to your team's run and pick up the current week.",
  instructor: "Sign in to grade submissions and read the cohort benchmarks.",
  admin: "Sign in to the administrator tools for cohorts, teams, and users.",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      const me = await fetchMe();
      if (!canAccess(me, role)) {
        setError(`This account can't sign in as ${role}.`);
        setLoading(false);
        return;
      }
      router.push(`/${role}`);
    } catch (err) {
      setError(
        err.status === 401
          ? "That username or email and password don't match."
          : "Couldn't reach the server. Check that the API is running."
      );
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-[11px] text-[15px] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:bg-[var(--graphite-high)]";
  const labelClass = `mb-1.5 block ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]`;

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
    >
      <header className="mx-auto flex h-[72px] w-full max-w-[1080px] items-center justify-between border-b border-[var(--steel-line)] px-6">
        <a href="/" className={`flex items-center gap-3 ${FOCUS}`}>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[30px] w-[30px] flex-shrink-0" />
          {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[19px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </span>
        </a>
        <a
          href="/"
          className={`${MONO} text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] transition-colors hover:text-[var(--paper)] ${FOCUS}`}
        >
          Overview
        </a>
        <ThemeToggle className="ml-3" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <Reveal className="w-full max-w-[400px]">
          <h1 className={`text-center ${DISPLAY} text-[44px] font-bold leading-none`}>Sign in</h1>
          <p className={`mt-1.5 text-center ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
            FLEXEE · DigitalCo &middot; CIO console
          </p>

          <div className="mt-[26px] rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      // Role selects which console to land in after sign-in.
                      // It must never prefill credentials: this bundle is
                      // public, so anything it holds is published to everyone.
                      setRole(r.key);
                      setError("");
                    }}
                    aria-pressed={role === r.key}
                    className={`rounded-[2px] border px-2 py-[10px] text-[13px] transition duration-150 ${
                      role === r.key
                        ? "border-[var(--blueprint)] bg-[var(--graphite-high)] text-[var(--paper)] shadow-[inset_0_0_0_1px_var(--blueprint-deep)]"
                        : "border-[var(--steel-line)] bg-[var(--graphite)] text-[var(--muted)] hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <p className="min-h-[2.6em] text-[13px] leading-[1.5] text-[var(--muted)]">{HINT[role]}</p>

              <label className="block">
                <span className={labelClass}>Username or email</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={labelClass}>Password</span>
                  {/* Sits with the field it concerns, not buried under the
                      button — someone who has forgotten it knows that before
                      they reach the bottom of the form. */}
                  <a
                    href="/forgot-password"
                    className={`mb-1.5 ${MONO} text-[9.5px] uppercase tracking-[0.12em] text-[var(--muted)] transition-colors hover:text-[var(--amber)] ${FOCUS}`}
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              {error ? (
                <p className="rounded-[2px] border border-[var(--signal-red)] bg-[color-mix(in_srgb,var(--signal-red)_12%,transparent)] px-3 py-2.5 text-[13px] text-[var(--paper)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={`mt-1 w-full rounded-[2px] bg-[var(--amber)] px-4 py-[13px] ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.03em] text-[var(--graphite)] transition duration-150 hover:bg-[var(--amber-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
              >
                {loading ? "Signing in\u2026" : "Sign in"}
              </button>
            </form>
          </div>
        </Reveal>
      </main>
    </div>
  );
}