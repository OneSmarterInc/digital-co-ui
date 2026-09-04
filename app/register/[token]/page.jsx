"use client";

/* Joining a cohort through its shared registration link.
 *
 * The sibling of /invite/[token]. That one is per-address and single-use; this
 * one is the reusable link an instructor posts to the whole class, so the
 * student supplies their own email and the server checks it against the
 * cohort's remaining seats.
 *
 * The instructor console has generated this URL since before there was a page
 * at the end of it — every shared link was a 404 until now.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE, login } from "../../../lib/api";


const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const INPUT =
  "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.95rem] text-[var(--paper)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)]";
const LABEL = `mb-1.5 block ${MONO} text-[9.5px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`;

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  const [invite, setInvite] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | gone | done
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/register/${encodeURIComponent(token)}/`);
        if (!r.ok) {
          setPhase("gone");
          return;
        }
        setInvite(await r.json());
        setPhase("ready");
      } catch {
        setError("Couldn't reach the server. Try again in a moment.");
        setPhase("gone");
      }
    })();
  }, [token]);

  const accept = useCallback(
    async (e) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      setError("");
      setFieldErrors({});
      try {
        const r = await fetch(`${API_BASE}/register/${encodeURIComponent(token)}/accept/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            first_name: first.trim(),
            last_name: last.trim(),
            password,
            password_confirm: confirm,
          }),
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setFieldErrors(body.errors || {});
          setError(body.detail || "Couldn't accept this invitation.");
          setBusy(false);
          return;
        }
        setPhase("done");
        // Sign them in with what they just chose, then straight into the cohort.
        try {
          if (!body.had_account) {
            await login(email.trim().toLowerCase(), password);
            // The cohorts list, not the simulation itself. A new enrollment is
            // unpaid, and the list is where that is stated and gated — dropping
            // a student straight into the sim walks them past it.
            router.replace("/student");
            return;
          }
        } catch {
          /* account exists or auto-login declined — the login page is fine */
        }
        router.replace("/login");
      } catch {
        setError("Couldn't reach the server. Try again in a moment.");
        setBusy(false);
      }
    },
    [busy, confirm, email, first, last, password, router, token]
  );

  const shell = (children) => (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--graphite)] px-5 py-12 font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased"
    >
      <div className="w-full max-w-[440px]">{children}</div>
    </div>
  );

  if (phase === "loading") {
    return shell(
      <p className={`text-center ${MONO} text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
        Checking this link…
      </p>
    );
  }

  if (phase === "gone") {
    return shell(
      <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-7 text-center">
        <h1 className={`${DISPLAY} text-[26px] font-bold leading-none`}>This link is not valid</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          {error ||
            "It may have been replaced by a newer link. Ask your instructor for the current one."}
        </p>
        <a
          href="/login"
          className={`mt-5 inline-block rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]`}
        >
          Go to sign in
        </a>
      </div>
    );
  }

  if (phase === "done") {
    return shell(
      <p className={`text-center ${MONO} text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
        Taking your seat…
      </p>
    );
  }

  const err = (key) =>
    fieldErrors[key] ? (
      <span className="mt-1 block text-[0.78rem] leading-snug text-[var(--signal-red)]">{fieldErrors[key]}</span>
    ) : null;

  return shell(
    <>
      <div className="mb-6 flex items-center justify-center gap-3">
        <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[30px] w-[30px]" />
        <span className={`flex items-baseline gap-2 ${DISPLAY} text-[19px] font-bold tracking-[0.03em]`}>
          <span>FLEXEE</span>
          <span className="font-normal text-[var(--muted-dim)]">·</span>
          <span className="text-[var(--amber)]">DigitalCo</span>
        </span>
      </div>

      <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-7">
        <p className={`${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>
          You are joining
        </p>
        <h1 className={`mt-1.5 ${DISPLAY} text-[28px] font-bold leading-none`}>{invite.cohort}</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          Fourteen rounds. Your team runs the IT organisation of a manufacturer called
          DigitalCo — one chair, one voice.
        </p>
        {invite.seats_left != null && (
          <p className={`mt-3 ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
            {invite.full ? "No seats left" : `${invite.seats_left} seat${invite.seats_left === 1 ? "" : "s"} left`}
          </p>
        )}

        <form onSubmit={accept} className="mt-6 space-y-4">
          <label className="block">
            <span className={LABEL}>Your course email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
              className={INPUT}
            />
            {err("email")}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={LABEL}>First name</span>
              <input value={first} onChange={(e) => setFirst(e.target.value)} className={INPUT} />
              {err("first_name")}
            </label>
            <label className="block">
              <span className={LABEL}>Last name</span>
              <input value={last} onChange={(e) => setLast(e.target.value)} className={INPUT} />
            </label>
          </div>

          <>
              <label className="block">
                <span className={LABEL}>Choose a password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={INPUT}
                />
                {err("password")}
              </label>
              <label className="block">
                <span className={LABEL}>Confirm password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={INPUT}
                />
                {err("password_confirm")}
              </label>
          </>

          {error && <p className="text-[0.88rem] text-[var(--signal-red)]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className={`w-full rounded-[2px] bg-[var(--amber)] px-5 py-3 ${DISPLAY} text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--graphite)] transition hover:bg-[var(--amber-hover)] disabled:opacity-50`}
          >
            {busy ? "Joining…" : "Join this simulation"}
          </button>
        </form>
      </div>
    </>
  );
}
