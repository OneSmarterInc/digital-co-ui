"use client";

/* Redeeming a student invitation.
 *
 * The other half of the invite flow: the email lands here. The token is the
 * credential — the student has no account yet — so this page is public, and the
 * API deliberately answers unknown and already-used tokens identically so the
 * link can't be used to probe who was invited.
 *
 * On success it signs the student straight in and drops them into their cohort;
 * asking someone to type the password they just chose into a second form is a
 * step that earns nothing.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE, login } from "../../../lib/api";


const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const INPUT =
  "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.95rem] text-[var(--paper)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)]";
const LABEL = `mb-1.5 block ${MONO} text-[9.5px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`;

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  const [invite, setInvite] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | spent | unreachable | gone | done
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
        const r = await fetch(`${API_BASE}/invites/${encodeURIComponent(token)}/`);
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          // A link that was already redeemed is not a dead end — that student
          // has an account. Send them to sign in rather than to their
          // instructor for an invitation they no longer need.
          if (j.reason === "already_accepted") {
            setInvite({ email: j.email });
            setPhase("spent");
            return;
          }
          setPhase("gone");
          return;
        }
        setInvite(await r.json());
        setPhase("ready");
      } catch {
        // Never say "expired" for a network failure: the link is probably fine
        // and telling a student it is dead sends them to chase a replacement
        // that will behave identically.
        setPhase("unreachable");
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
        const r = await fetch(`${API_BASE}/invites/${encodeURIComponent(token)}/accept/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
            await login(invite.email, password);
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
    [busy, confirm, first, invite, last, password, router, token]
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
        Checking your invitation…
      </p>
    );
  }

  const signIn = (label) => (
    <a
      href="/login"
      className={`mt-5 inline-block rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]`}
    >
      {label}
    </a>
  );

  if (phase === "unreachable") {
    return shell(
      <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-7 text-center">
        <h1 className={`${DISPLAY} text-[26px] font-bold leading-none`}>Couldn&rsquo;t reach the server</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          Your link is fine — we just couldn&rsquo;t load it. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className={`mt-5 inline-block rounded-[2px] border border-[var(--amber-deep)] bg-[var(--amber)] px-4 py-2 ${MONO} text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--graphite)]`}
        >
          Try again
        </button>
      </div>
    );
  }

  if (phase === "spent") {
    return shell(
      <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-7 text-center">
        <h1 className={`${DISPLAY} text-[26px] font-bold leading-none`}>You&rsquo;re already set up</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          This invitation has been used{invite?.email ? <> — your account is <b className="text-[var(--paper)]">{invite.email}</b></> : null}. Sign
          in with the password you chose. If you don&rsquo;t remember it, ask your instructor to reset it.
        </p>
        {signIn("Go to sign in")}
      </div>
    );
  }

  if (phase === "gone") {
    return shell(
      <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-7 text-center">
        <h1 className={`${DISPLAY} text-[26px] font-bold leading-none`}>This link has expired</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          {error ||
            "It may already have been used, or it may have been replaced by a newer invitation. Ask your instructor to send another."}
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
          You have a seat in
        </p>
        <h1 className={`mt-1.5 ${DISPLAY} text-[28px] font-bold leading-none`}>{invite.cohort}</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          Fourteen rounds. Your team runs the IT organisation of a manufacturer called
          DigitalCo — one chair, one voice.
        </p>
        <p className={`mt-3 ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
          {invite.email}
          {invite.firm ? ` · ${invite.firm}` : ""}
        </p>

        <form onSubmit={accept} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={LABEL}>First name</span>
              <input value={first} onChange={(e) => setFirst(e.target.value)} autoFocus className={INPUT} />
              {err("first_name")}
            </label>
            <label className="block">
              <span className={LABEL}>Last name</span>
              <input value={last} onChange={(e) => setLast(e.target.value)} className={INPUT} />
            </label>
          </div>

          {invite.has_account ? (
            <p className="rounded-[2px] border border-[var(--blueprint)] bg-[var(--graphite)] px-3.5 py-3 text-[0.88rem] leading-[1.55] text-[var(--muted)]">
              You already have an account on this address — accepting adds this simulation
              to it. Sign in with your existing password afterwards.
            </p>
          ) : (
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
          )}

          {error && <p className="text-[0.88rem] text-[var(--signal-red)]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className={`w-full rounded-[2px] bg-[var(--amber)] px-5 py-3 ${DISPLAY} text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--graphite)] transition hover:bg-[var(--amber-hover)] disabled:opacity-50`}
          >
            {busy ? "Taking your seat…" : "Take your seat"}
          </button>
        </form>
      </div>
    </>
  );
}
