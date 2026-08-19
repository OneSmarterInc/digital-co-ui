"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { groupsOf, initials, instructorName } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { ViewHeader, EmptyState, MiniInfo, Avatar, Pill, FillBar } from "./ui";
import { IconExternal, IconUsers } from "./icons";

/* Firms view — dark console theme, var(--token, #fallback) throughout so it
 * renders correctly inside the themed shell and standalone.
 *
 * Firm identity colors are re-picked from the console palette (the shared
 * FIRM_COLORS in helpers was chosen for white backgrounds and goes muddy on
 * graphite) — same six tones as the admin detail page's team dots, so a
 * firm keeps one color across instructor and admin screens.
 * All handlers and the move-student flow unchanged. */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";

/* Local eye icon for the mimic button — kept here so the shared icon set
 * stays untouched. */
function IconEye({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function FirmsView({ gameId, detail, reload, notify }) {
  const router = useRouter();
  const students = detail.students ?? [];
  const enrolled = students.length;
  const inFirms = students.filter((s) => s.firm).length;
  const unassigned = enrolled - inFirms;
  const paid = students.filter((s) => s.paid).length;
  const instructors = detail.instructors ?? [];
  const firms = useMemo(() => (detail.firms ?? []).slice().sort((a, b) => a.number - b.number), [detail.firms]);
  const groups = useMemo(() => groupsOf(detail), [detail]);
  const [busy, setBusy] = useState(false);

  const [newFirm, setNewFirm] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // the firm group

  const doCreateFirm = async () => {
    setBusy(true);
    const name = newFirm.trim();
    await runAction({
      path: `/instructor/simulations/${gameId}/firms/`,
      opts: jsonPost(name ? { name } : {}),
      label: name ? `${name} created` : "Firm created",
      reload,
      notify,
      after: () => {
        setNewFirm("");
        setAdding(false);
      },
    });
    setBusy(false);
  };

  // Deleting a firm takes its run, rounds and grades with it, so the server
  // refuses while anyone is in it or anything has been submitted. Surface that
  // reason rather than a generic failure — it tells the instructor what to do.
  const doDeleteFirm = async (grp) => {
    setBusy(true);
    setConfirmDelete(null);
    await runAction({
      path: `/instructor/simulations/${gameId}/firms/${grp.index + 1}/`,
      opts: { method: "DELETE" },
      label: `${grp.name} deleted`,
      reload,
      notify,
    });
    setBusy(false);
  };

  const doMove = async (enrollmentId, firmNumber, label) => {
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

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Roster"
        title="Firms"
        subtitle={`${firms.length} firm${firms.length === 1 ? "" : "s"} and ${enrolled} student${
          enrolled === 1 ? "" : "s"
        } enrolled. Move a student between firms with the dropdown.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {adding ? (
              <>
                <input
                  value={newFirm}
                  onChange={(e) => setNewFirm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") doCreateFirm();
                    if (e.key === "Escape") setAdding(false);
                  }}
                  placeholder="Firm name (optional)"
                  autoFocus
                  className="h-8 w-[176px] rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] px-2.5 text-[0.8rem] text-[var(--paper,#ECEFF2)] outline-none focus:border-[var(--blueprint,#5BA3C4)]"
                />
                <button
                  onClick={doCreateFirm}
                  disabled={busy}
                  className={`rounded-[2px] bg-[var(--amber,#E8A13C)] px-3 py-1.5 ${MONO} text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--graphite,#16191D)] transition hover:bg-[#F0B052] disabled:opacity-50`}
                >
                  {busy ? "Adding…" : "Add firm"}
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className={`${MONO} text-[9.5px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)] hover:text-[var(--paper,#ECEFF2)]`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-3 py-1.5 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:text-[var(--paper,#ECEFF2)]`}
              >
                + New firm
              </button>
            )}
            {instructors.length > 0 ? (
            <div className="flex items-center gap-2 rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-1.5">
              <span className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>Faculty</span>
              <div className="flex">
                {instructors.slice(0, 4).map((i, idx) => (
                  <span
                    key={i.id}
                    className={`flex h-6 w-6 items-center justify-center rounded-[2px] ${MONO} text-[8px] font-semibold`}
                    style={{
                      background: FIRM_TONES[idx % FIRM_TONES.length],
                      color: "#16191D",
                      marginLeft: idx ? -8 : 0,
                      border: "2px solid var(--graphite-raised, #1E2228)",
                    }}
                    title={instructorName(i)}
                  >
                    {initials(instructorName(i))}
                  </span>
                ))}
              </div>
            </div>
            ) : null}
          </div>
        }
      />

      {groups.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniInfo label="Firms" value={firms.length} sub={`team${firms.length === 1 ? "" : "s"}`} />
          <MiniInfo label="Enrolled" value={enrolled} sub="students" />
          <MiniInfo label="In firms" value={inFirms} sub={`${unassigned} unassigned`} />
          <MiniInfo label="Paid" value={paid} sub={`${enrolled - paid} unpaid`} />
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} />}
          title="No firms yet"
          message="Create a firm to start placing students, or wait for enrolments to arrive."
        />
      ) : (
        <div className="space-y-4">
          {groups.map((grp) => {
            const isUnassigned = grp.name === "Unassigned";
            const color = isUnassigned ? "var(--muted, #8A94A0)" : FIRM_TONES[grp.index % FIRM_TONES.length];
            const paidInFirm = grp.members.filter((m) => m.paid).length;
            return (
              <div
                key={grp.name}
                className={`overflow-hidden ${PANEL}`}
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
                    <div className="min-w-0">
                      <p className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>{grp.name}</p>
                      <p className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>
                        {grp.members.length} member{grp.members.length === 1 ? "" : "s"}
                        {!isUnassigned && ` · ${paidInFirm}/${grp.members.length} paid`}
                      </p>
                    </div>
                  </div>
                  {!isUnassigned && (
                    <div className="flex flex-none items-center gap-2">
                      <button
                        onClick={() => router.push(`/instructor/${gameId}/mimic/${grp.index + 1}`)}
                        title={`See exactly what ${grp.name} students see right now — read-only`}
                        className={`flex items-center gap-1.5 rounded-[2px] border border-[var(--amber-deep,#C4791F)] px-3 py-1.5 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--amber,#E8A13C)] transition hover:bg-[rgba(232,161,60,0.1)]`}
                      >
                        <IconEye size={13} /> Mimic
                      </button>
                      <button
                        onClick={() => router.push(`/instructor/${gameId}/firms/${grp.index + 1}`)}
                        className={`flex items-center gap-1.5 rounded-[2px] border border-[var(--steel-line,#2C323A)] px-3 py-1.5 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--paper,#ECEFF2)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)]`}
                      >
                        View firm <IconExternal size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(grp)}
                        disabled={busy || grp.members.length > 0}
                        title={
                          grp.members.length > 0
                            ? "Move its students out before deleting this firm"
                            : `Delete ${grp.name}`
                        }
                        className={`rounded-[2px] border px-3 py-1.5 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] transition ${
                          grp.members.length > 0
                            ? "cursor-not-allowed border-[var(--steel-line,#2C323A)] text-[var(--muted-dim,#5C6672)]"
                            : "border-[#7a3b35] text-[var(--signal-red,#D2564B)] hover:bg-[rgba(210,86,75,0.1)]"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {!isUnassigned && grp.members.length > 0 && (
                  <div className="px-6 pb-3">
                    <FillBar value={paidInFirm} total={grp.members.length} color={color} />
                  </div>
                )}

                {grp.members.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-3 transition hover:bg-[var(--graphite-high,#252B32)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar text={initials(s.name)} />
                      <span className="truncate text-[0.95rem] font-semibold">{s.name}</span>
                    </div>
                    <div className="flex flex-none items-center gap-4">
                      <span className={`hidden ${MONO} text-[11px] text-[var(--muted-dim,#5C6672)] md:inline`}>{s.email}</span>
                      <select
                        className="h-8 w-[138px] rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] px-2 text-[0.75rem] text-[var(--paper,#ECEFF2)] outline-none transition duration-150 [color-scheme:dark] focus:border-[var(--blueprint,#5BA3C4)]"
                        value={s.firm_index == null ? 0 : s.firm_index + 1}
                        onChange={(e) => doMove(s.enrollment_id, Number(e.target.value), firms.find((f) => f.number === Number(e.target.value))?.name)}
                        disabled={busy}
                        aria-label={`Assign firm for ${s.name}`}
                      >
                        <option value={0}>Unassigned</option>
                        {firms.map((t) => (
                          <option key={t.number} value={t.number}>
                            {t.name ?? `Firm ${t.number}`}
                          </option>
                        ))}
                      </select>
                      <Pill tone={s.paid ? "good" : "muted"}>{s.paid ? "Paid" : "Unpaid"}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,12,14,0.72)] px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className={`w-full max-w-[440px] p-6 ${PANEL}`}>
            <h3 className={`${DISPLAY} text-[20px] font-semibold leading-tight`}>
              Delete {confirmDelete.name}?
            </h3>
            <p className="mt-2 text-[0.9rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
              This removes the firm and the run behind it. It cannot be undone. Firms that
              have students in them, or that have submitted a round, are refused.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)] hover:text-[var(--paper,#ECEFF2)]`}
              >
                Keep it
              </button>
              <button
                onClick={() => doDeleteFirm(confirmDelete)}
                disabled={busy}
                className={`rounded-[2px] bg-[var(--signal-red,#D2564B)] px-4 py-2 ${MONO} text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--paper,#ECEFF2)] transition hover:bg-[#E0655A] disabled:opacity-50`}
              >
                {busy ? "Deleting…" : "Delete firm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}