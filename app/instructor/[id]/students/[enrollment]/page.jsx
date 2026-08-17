"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// Two levels deeper than the detail page.
import { fetchMe, api, logout } from "../../../../../lib/api";
import { initials, fmtMoney } from "../../_lib/helpers";
import { runAction, jsonPost } from "../../_lib/actions";
import { ViewHeader, MiniInfo, Avatar, Pill } from "../../_components/ui";
import { IconBack } from "../../_components/icons";

/* ================================================================== *
 * Student detail: /instructor/[id]/students/[enrollment]
 * One student, everything about them: profile, enrollment and access
 * state, advisor sessions with charges — plus the two account actions:
 * block/unblock (instantly reversible, gates their gameplay) and reset
 * password (generates a temp password shown exactly once).
 *
 * Dark console theme, fully native. Grammar highlights: blocking is a
 * destructive act, so Block and its banner are signal red (Unblock is
 * ok green); the one-time temp password is a "act on this NOW" moment,
 * so its reveal panel is amber; confirm dialogs are dark modals with
 * a red commit for Block and an amber commit for Reset. All endpoints
 * and the show-once password handling unchanged.
 * ================================================================== */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

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
  "--amber-deep": "#C4791F",
  "--signal-red": "#D2564B",
  "--blueprint": "#5BA3C4",
  "--blueprint-deep": "#3B7E9C",
  "--ok": "#7FB08A",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const GHOST = `rounded-[2px] border border-[var(--steel-line)] font-['IBM_Plex_Mono',ui-monospace,monospace] uppercase text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)] disabled:opacity-50`;

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const rawEnr = params?.enrollment;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const enrollmentId = Number(Array.isArray(rawEnr) ? rawEnr[0] : rawEnr);

  const [detail, setDetail] = useState(null); // cohort detail (for firms list)
  const [student, setStudent] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tempPassword, setTempPassword] = useState(null); // shown once, this render only

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const load = useCallback(async () => {
    const [d, s] = await Promise.all([
      api(`/instructor/simulations/${gameId}/`),
      api(`/instructor/simulations/${gameId}/students/${enrollmentId}/`),
    ]);
    if (!d.ok) throw new Error(`Request failed (${d.status})`);
    if (!s.ok) {
      const sj = await s.json().catch(() => ({}));
      throw new Error(sj.detail || `Request failed (${s.status})`);
    }
    setDetail(await d.json());
    setStudent(await s.json());
  }, [gameId, enrollmentId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) router.replace("/login");
          return;
        }
        await load();
        if (alive) setPhase("ready");
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [load, router]);

  const reload = useCallback(async () => {
    try {
      await load();
    } catch (e) {
      notify(`Refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [load, notify]);

  if (phase !== "ready" || !student || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't load this student. ${error ?? ""}` : "Loading student…"}
        </p>
      </div>
    );
  }

  const u = student.user;
  const enr = student.enrollment;
  const adv = student.advisor;
  const firms = (detail.firms ?? []).slice().sort((a, b) => a.number - b.number);
  const color = enr.firm_number ? FIRM_TONES[(enr.firm_number - 1) % FIRM_TONES.length] : "var(--muted-dim)";

  const doMove = async (firmNumber, label) => {
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/enrollments/${enrollmentId}/move/`,
      opts: jsonPost({ firm_number: firmNumber }),
      label: firmNumber === 0 ? "Student unassigned" : `Moved to ${label}`,
      reload,
      notify,
    });
    setBusy(false);
  };
  const doPaid = async (paid) => {
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/enrollments/${enrollmentId}/paid/`,
      opts: jsonPost({ paid }),
      label: paid ? "Marked paid" : "Marked unpaid",
      reload,
      notify,
    });
    setBusy(false);
  };
  const doBlock = async (blocked) => {
    setBusy(true);
    setConfirmBlock(false);
    await runAction({
      path: `/instructor/simulations/${gameId}/students/${enrollmentId}/block/`,
      opts: jsonPost({ blocked }),
      label: blocked ? "Student blocked" : "Student unblocked",
      reload,
      notify,
    });
    setBusy(false);
  };
  const doResetPassword = async () => {
    setBusy(true);
    setConfirmReset(false);
    try {
      const r = await api(`/instructor/simulations/${gameId}/students/${enrollmentId}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      setTempPassword(j.temp_password);
      notify("Password reset ✓");
    } catch (e) {
      notify(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  };

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-[rgba(22,25,29,0.85)] px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}?section=students`)}
            aria-label="Back to students"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconBack size={16} />
          </button>
          <span
            className="grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-[2px] border-[1.5px] border-[var(--amber)]"
            aria-hidden="true"
          >
            <span className="h-[8px] w-[8px] rounded-[1px] border-[1.5px] border-[var(--amber)]" />
          </span>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className={`${DISPLAY} text-[17px] font-bold leading-none tracking-[0.02em]`}>FLEXEE</span>
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Instructor</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--amber)]`}>{detail.name}</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>{u.name}</span>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="mx-auto max-w-[860px] space-y-7">
          <ViewHeader
            eyebrow="Student"
            title={u.name}
            subtitle={u.email}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(true)}
                  disabled={busy}
                  className={`px-3.5 py-2 text-[9.5px] font-semibold tracking-[0.1em] ${GHOST}`}
                >
                  Reset password
                </button>
                <button
                  onClick={() => (enr.blocked ? doBlock(false) : setConfirmBlock(true))}
                  disabled={busy}
                  className={`rounded-[2px] border px-3.5 py-2 ${MONO} text-[9.5px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-50 ${
                    enr.blocked
                      ? "border-[#3f5e46] text-[var(--ok)] hover:bg-[rgba(127,176,138,0.1)]"
                      : "border-[#7a3b35] text-[var(--signal-red)] hover:bg-[rgba(210,86,75,0.1)]"
                  }`}
                >
                  {enr.blocked ? "Unblock student" : "Block student"}
                </button>
              </div>
            }
          />

          {enr.blocked && (
            <div className="flex items-center gap-2.5 rounded-[3px] border border-[#7a3b35] bg-[var(--graphite-raised)] px-4 py-3">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--signal-red)] shadow-[0_0_8px_-1px_var(--signal-red)]" />
              <span className="text-[0.85rem] text-[var(--muted)]">
                This student is blocked{enr.blocked_at ? ` since ${fmtDate(enr.blocked_at)}` : ""} — their portal shows the access-paused
                notice and gameplay is gated. Unblock to restore access instantly.
              </span>
            </div>
          )}

          {/* one-time temp password reveal */}
          {tempPassword && (
            <div className="rounded-[3px] border border-[var(--amber-deep)] bg-[var(--graphite-raised)] p-5">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--amber)]`}>
                New temporary password — shown only once
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <code className={`rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] px-4 py-2.5 ${MONO} text-[1.05rem] font-bold tracking-wider text-[var(--paper)]`}>
                  {tempPassword}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(tempPassword);
                    notify("Copied ✓");
                  }}
                  className={`px-3.5 py-2 text-[9.5px] font-semibold tracking-[0.1em] ${GHOST}`}
                >
                  Copy
                </button>
                <button
                  onClick={() => setTempPassword(null)}
                  className={`${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--paper)]`}
                >
                  Dismiss
                </button>
              </div>
              <p className="mt-2.5 text-sm text-[var(--muted)]">
                Hand this to the student — they log in with it and can change it afterwards. It is not stored and cannot be shown again;
                leaving this page loses it. Any session they already have stays valid until it expires, so use Block to cut off live access.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniInfo label="Firm" value={enr.firm ?? "—"} sub={enr.firm ? `firm ${enr.firm_number}` : "unassigned"} />
            <MiniInfo label="Payment" value={enr.paid ? "Paid" : "Unpaid"} sub={enr.paid_at ? fmtDate(enr.paid_at) : "seat billing"} />
            <MiniInfo label="Access" value={enr.blocked ? "Blocked" : "Active"} sub={enr.blocked ? "gameplay gated" : "portal open"} />
            <MiniInfo label="Advisor time" value={`${adv.hours}h`} sub={adv.billed > 0 ? fmtMoney(adv.billed) : "no charges"} />
          </div>

          {/* profile */}
          <div className={`overflow-hidden ${PANEL}`}>
            <div className="flex items-center gap-4 px-6 py-5">
              <Avatar text={initials(u.name)} size={52} />
              <div className="min-w-0">
                <p className={`truncate ${DISPLAY} text-[19px] font-semibold leading-tight`}>{u.name}</p>
                <p className={`truncate ${MONO} text-[10.5px] text-[var(--muted-dim)]`}>{u.email}</p>
              </div>
              <span
                className="ml-auto h-2.5 w-2.5 flex-none rounded-full"
                style={{ background: color, boxShadow: enr.firm_number ? `0 0 8px -1px ${color}` : "none" }}
                title={enr.firm ?? "Unassigned"}
              />
            </div>
            <div className="grid gap-x-8 gap-y-3 border-t border-[var(--steel-line)] px-6 py-4 sm:grid-cols-2">
              {[
                ["First name", u.first_name || "—"],
                ["Last name", u.last_name || "—"],
                ["Username", u.username],
                ["Joined", fmtDate(u.date_joined)],
                ["Last login", u.last_login ? fmtDate(u.last_login) : "never"],
                ["Amount due", fmtMoney(enr.amount_due)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--steel-line)] pb-2 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
                >
                  <span className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>{k}</span>
                  <span className="truncate text-sm font-medium text-[var(--paper)]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* enrollment management */}
          <div className={`p-6 ${PANEL}`}>
            <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Enrollment</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Firm placement and payment, managed right here.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                className="h-10 w-[180px] rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-2.5 text-[0.85rem] text-[var(--paper)] outline-none transition duration-150 [color-scheme:dark] focus:border-[var(--blueprint)]"
                value={enr.firm_number ?? 0}
                onChange={(e) => doMove(Number(e.target.value), firms.find((f) => f.number === Number(e.target.value))?.name)}
                disabled={busy}
                aria-label="Assign firm"
              >
                <option value={0}>Unassigned</option>
                {firms.map((t) => (
                  <option key={t.number} value={t.number}>
                    {t.name ?? `Firm ${t.number}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => doPaid(!enr.paid)}
                disabled={busy}
                title={enr.paid ? "Click to mark unpaid" : "Click to mark paid"}
                className="rounded-[2px] transition hover:ring-2 hover:ring-[rgba(127,176,138,0.3)] disabled:opacity-50"
              >
                <Pill tone={enr.paid ? "good" : "muted"}>{enr.paid ? "Paid" : "Unpaid"}</Pill>
              </button>
            </div>
          </div>

          {/* advisor sessions */}
          <div className={`overflow-hidden ${PANEL}`}>
            <div className="px-6 py-4">
              <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Advisor sessions</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Each row is one billed hour — the first message opens it, messages within the hour ride free.
                A war-room hour is charged once per advisor in the room.
              </p>
              {(adv.group_hours ?? 0) > 0 && (
                <p className={`mt-2 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
                  Total {adv.hours}h · {fmtMoney(adv.billed)} — of which group chat{" "}
                  <b className="text-[var(--amber)]">
                    {adv.group_hours}h · {fmtMoney(adv.group_billed)}
                  </b>
                </p>
              )}
            </div>
            {adv.sessions.length === 0 ? (
              <p className="border-t border-[var(--steel-line)] px-6 py-6 text-sm text-[var(--muted)]">
                No advisor sessions yet — this student hasn&apos;t consulted anyone.
              </p>
            ) : (
              adv.sessions.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--steel-line)] px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${MONO} text-[9px] font-bold text-[var(--muted)]`}
                    >
                      W{s.week}
                    </span>
                    <span className={`${DISPLAY} text-[16px] font-semibold`}>{s.advisor}</span>
                    {s.mode === "group" && (
                      <span className={`rounded-[2px] border border-[var(--amber-deep)] px-1.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--amber)]`}>
                        Group
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`${MONO} text-[10px] text-[var(--muted-dim)]`}>{fmtDate(s.started_at)}</span>
                    {/* Show the arithmetic on a room hour, not just the total. */}
                    {s.mode === "group" && s.rate > 0 && (
                      <span className={`${MONO} text-[10px] text-[var(--muted-dim)]`}>
                        {fmtMoney(s.rate)} × {s.advisor_count}
                      </span>
                    )}
                    <span className={`${MONO} text-[0.72rem] font-bold text-[var(--paper)]`}>
                      {s.billed > 0 ? fmtMoney(s.billed) : "free"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* block confirmation */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={() => setConfirmBlock(false)}>
          <div
            className="w-full max-w-[420px] rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${DISPLAY} text-[20px] font-semibold`}>Block {u.name}?</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Their portal will show the access-paused notice and gameplay will be gated until you unblock them. Nothing is deleted, and
              this is instantly reversible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmBlock(false)} className={`px-4 py-2 text-[10px] font-semibold tracking-[0.1em] ${GHOST}`}>
                Cancel
              </button>
              <button
                onClick={() => doBlock(true)}
                className={`rounded-[2px] bg-[var(--signal-red)] px-4 py-2 ${DISPLAY} text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--paper)] transition hover:opacity-90`}
              >
                Block student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reset confirmation */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={() => setConfirmReset(false)}>
          <div
            className="w-full max-w-[420px] rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${DISPLAY} text-[20px] font-semibold`}>Reset {u.name.split(" ")[0]}&apos;s password?</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Their current password stops working immediately and a temporary one is generated. You&apos;ll see it exactly once — hand it
              to the student so they can log in and change it.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmReset(false)} className={`px-4 py-2 text-[10px] font-semibold tracking-[0.1em] ${GHOST}`}>
                Cancel
              </button>
              <button
                onClick={doResetPassword}
                className={`rounded-[2px] bg-[var(--amber)] px-4 py-2 ${DISPLAY} text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052]`}
              >
                Reset password
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}