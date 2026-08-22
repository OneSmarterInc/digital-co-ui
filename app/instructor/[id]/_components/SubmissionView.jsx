"use client";

/* A graded week, reopened read-only.
 *
 * Grading used to be the only route to a firm's written answers, and a graded
 * week left the queue — so the material the course actually assesses became
 * unreadable the moment it was assessed. Week 13's board audit and the Week 14
 * debrief both need it back weeks later, as does any grade query in November.
 *
 * This shows what was submitted and what was recorded: the anchor and its
 * strength as set, the four dimension scores, every structured choice with the
 * label the student saw, and the full written answers.
 */

import { useEffect } from "react";
import { choiceLabel } from "../_lib/choiceLabels";
import { SCORE_LABELS } from "../_lib/helpers";

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

// Written answers are the long values; the structured calls are the short ones.
const isWritten = (v) => typeof v === "string" && v.length > 60;

export function SubmissionView({ row, onClose, onRevise }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const decisions = row.decisions || {};
  const written = Object.entries(decisions).filter(([, v]) => isWritten(v));
  const choices = Object.entries(decisions).filter(([, v]) => !isWritten(v));
  const scores = row.dimension_scores || {};

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(10,12,14,0.72)] px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={`${row.team_name} — Round ${row.week_number}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[760px] rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="border-b border-[var(--steel-line,#2C323A)] px-7 pb-5 pt-6">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim,#5C6672)]`}>
            Graded {fmtDate(row.graded_at)}
            {row.graded_by ? ` · ${row.graded_by}` : ""}
          </p>
          <h2 className={`mt-2 ${DISPLAY} text-[25px] font-bold leading-none`}>
            {row.team_name} · Round {row.week_number}
          </h2>
        </div>

        <div className="max-h-[66vh] overflow-y-auto px-7 py-5">
          {/* recorded scores */}
          <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
            Recorded
          </p>
          <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {Object.entries(SCORE_LABELS).map(([dim, label]) => {
              const v = Number(scores[dim] ?? 0);
              return (
                <div key={dim} className="flex items-baseline justify-between gap-3 border-b border-[var(--steel-line,#2C323A)] py-1.5">
                  <span className="text-[0.85rem] text-[var(--muted,#8A94A0)]">{label}</span>
                  <span
                    className={`${MONO} text-[0.85rem] font-bold ${
                      v > 0
                        ? "text-[var(--ok,#7FB08A)]"
                        : v < 0
                          ? "text-[var(--amber,#E8A13C)]"
                          : "text-[var(--muted-dim,#5C6672)]"
                    }`}
                  >
                    {v > 0 ? `+${v}` : v}
                  </span>
                </div>
              );
            })}
          </div>

          {/* What this firm read above the briefing that round — the only
              firm-specific text on their page, and worth seeing before judging
              what they wrote in response to it. */}
          {row.preamble && (
            <div className="mt-4 border-l-[3px] border-[var(--amber-deep,#C4791F)] bg-[var(--graphite,#16191D)] px-4 py-3">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
                Their briefing opened with
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] italic leading-[1.7] text-[var(--paper,#ECEFF2)]">
                {row.preamble}
              </p>
            </div>
          )}

          {row.feedback && (
            <div className="mt-4 border-l-[3px] border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] px-4 py-3">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
                Written feedback · the firm sees this
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-[1.7] text-[var(--paper,#ECEFF2)]">
                {row.feedback}
              </p>
            </div>
          )}

          {row.week_number === 1 && (
            <p className={`mt-3 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
              Anchor strength as set:{" "}
              <b className="text-[var(--amber,#E8A13C)]">{row.anchor_strength || "not set"}</b>
            </p>
          )}
          {row.coherence_anchor && (
            <div className="mt-3 border-l-[3px] border-[var(--amber-deep,#C4791F)] bg-[var(--graphite,#16191D)] px-4 py-3">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--amber,#E8A13C)]`}>
                The anchor
              </p>
              <p className="mt-1 text-[0.9rem] leading-[1.6] text-[var(--paper,#ECEFF2)]">{row.coherence_anchor}</p>
            </div>
          )}

          {/* structured calls */}
          {choices.length > 0 && (
            <>
              <p className={`mt-6 ${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
                Structured choices
              </p>
              <div className="mt-2 space-y-1">
                {choices.map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--steel-line,#2C323A)] py-1.5">
                    <span className={`${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                      {k.replace(/_/g, " ")}
                    </span>
                    <span className="text-[0.85rem] text-[var(--paper,#ECEFF2)]">
                      {typeof v === "boolean" ? (v ? "Yes" : "No") : choiceLabel(v)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* the written material — the thing the course assesses */}
          {written.map(([k, v]) => (
            <div key={k} className="mt-6">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
                {k.replace(/_/g, " ")}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-[1.7] text-[var(--paper,#ECEFF2)]">{v}</p>
            </div>
          ))}

          {row.deliverable_text && (
            <div className="mt-6">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>
                The firm&rsquo;s written deliverable
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-[1.7] text-[var(--paper,#ECEFF2)]">
                {row.deliverable_text}
              </p>
            </div>
          )}
        </div>

        {/* Week 1's anchor strength drives the coherence audit for the whole
            run, so a mis-click needs a way back. Revising overwrites the
            recorded grade; the backend reverses what it applied before. */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--steel-line,#2C323A)] px-7 py-4">
          {onRevise && (
            <button
              onClick={() => onRevise(row)}
              className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-[var(--amber,#E8A13C)] transition hover:underline`}
            >
              Revise this grade
            </button>
          )}
          <button
            onClick={onClose}
            className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-4 py-2 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:text-[var(--paper,#ECEFF2)]`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionView;
