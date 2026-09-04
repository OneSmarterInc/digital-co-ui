"use client";

/* Choosing a password from an emailed link.
 *
 * Public: the link is the credential, and the person following it either has no
 * password yet (a new instructor) or has forgotten theirs. The token is
 * Django's password-reset token, derived from the current password hash — so it
 * spends itself the moment a password is set.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE } from "../../../../lib/api";


const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const INPUT =
  "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.95rem] text-[var(--paper)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)]";
const LABEL = `mb-1.5 block ${MONO} text-[9.5px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`;

export default function SetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid;
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  const [account, setAccount] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | ready | gone | done
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const endpoint = `${API_BASE}/set-password/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`;

  useEffect(() => {
    if (!uid || !token) return;
    (async () => {
      try {
        const r = await fetch(endpoint);
        if (!r.ok) {
          setPhase("gone");
          return;
        }
        setAccount(await r.json());
        setPhase("ready");
      } catch {
        setError("Couldn't reach the server. Try again in a moment.");
        setPhase("gone");
      }
    })();
  }, [endpoint, uid, token]);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      setError("");
      setFieldErrors({});
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, password_confirm: confirm }),
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setFieldErrors(body.errors || {});
          setError(body.detail || "Couldn't set your password.");
          setBusy(false);
          return;
        }
        setPhase("done");
        setTimeout(() => router.replace("/login"), 1400);
      } catch {
        setError("Couldn't reach the server. Try again in a moment.");
        setBusy(false);
      }
    },
    [busy, confirm, endpoint, password, router]
  );

  const shell = (children) => (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--graphite)] px-5 py-12 font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased"
    >
      <div className="w-full max-w-[420px]">{children}</div>
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
        <h1 className={`${DISPLAY} text-[24px] font-bold leading-none`}>This link is no longer valid</h1>
        <p className="mt-3 text-[0.92rem] leading-[1.6] text-[var(--muted)]">
          {error || "It may already have been used, or it may have expired. Ask for a new one."}
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
      <div className="rounded-[3px] border border-[var(--ok)] bg-[var(--graphite-raised)] p-7 text-center">
        <h1 className={`${DISPLAY} text-[24px] font-bold leading-none`}>Password set</h1>
        <p className="mt-3 text-[0.92rem] text-[var(--muted)]">Taking you to sign in…</p>
      </div>
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
          {account.has_password ? "Reset your password" : "Choose your password"}
        </p>
        <h1 className={`mt-1.5 ${DISPLAY} text-[26px] font-bold leading-none`}>{account.name}</h1>
        <p className={`mt-2 ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
          Signs in as {account.email}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className={LABEL}>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
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

          {error && <p className="text-[0.88rem] text-[var(--signal-red)]">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className={`w-full rounded-[2px] bg-[var(--amber)] px-5 py-3 ${DISPLAY} text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--graphite)] transition hover:bg-[var(--amber-hover)] disabled:opacity-50`}
          >
            {busy ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    </>
  );
}
