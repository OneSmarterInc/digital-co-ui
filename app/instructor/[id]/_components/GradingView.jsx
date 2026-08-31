"use client";

import { useState } from "react";
import { flagText } from "../_lib/helpers";
import { ViewHeader, EmptyState, MiniInfo, ScoreChips } from "./ui";
import { IconClipboard } from "./icons";
import { GradingModal } from "./modals";
import { SubmissionView } from "./SubmissionView";

/* Grading view — dark console theme, var(--token, #fallback) throughout.
 * Console vocabulary: amber = waiting for you (round chip, anchor-required
 * flag, Grade button), signal-red = trap flags (something in the submission
 * tripped), steel = structure. All grading flow unchanged. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const FLAG = `inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-0.5 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.06em]`;

export default function GradingView({ gameId, queue, reload, notify }) {
  const [gradeScore, setGradeScore] = useState(null);
  const [reading, setReading] = useState(null); // a graded week, reopened read-only
  const [tab, setTab] = useState("waiting");

  // The queue now carries graded weeks too. They used to vanish on grading,
  // taking the written answers with them — but Week 13's audit, the Week 14
  // debrief and any grade query all need them read back later.
  const ungraded = queue.filter((r) => !r.graded);
  const graded = queue.filter((r) => r.graded);
  const rows = tab === "waiting" ? ungraded : graded;

  const waiting = ungraded.length;
  const flags = ungraded.reduce((a, r) => a + (r.trap_flags?.length || 0), 0);
  const needAnchor = ungraded.filter((r) => r.week_number === 1).length;

  const tabBtn = (key, label, n) => (
    <button
      onClick={() => setTab(key)}
      className={`rounded-[2px] border px-3 py-1.5 ${MONO} text-[10px] uppercase tracking-[0.12em] transition ${
        tab === key
          ? "border-[var(--amber-deep,#C4791F)] text-[var(--amber,#E8A13C)]"
          : "border-[var(--steel-line,#2C323A)] text-[var(--muted,#8A94A0)] hover:text-[var(--paper,#ECEFF2)]"
      }`}
    >
      {label} ({n})
    </button>
  );

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Grade submissions"
        title="Grading"
        subtitle={
          waiting
            ? `${waiting} submitted week${waiting === 1 ? "" : "s"} waiting for a grade across your firms.`
            : "Submitted weeks land here for grading. Week 1 asks you to grade the anchor's strength before it can be saved."
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabBtn("waiting", "Waiting", ungraded.length)}
        {tabBtn("graded", "Graded", graded.length)}
      </div>

      {waiting > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <MiniInfo label="Waiting" value={waiting} sub={`week${waiting === 1 ? "" : "s"}`} />
          <MiniInfo label="Trap flags" value={flags} sub="across queue" />
          <MiniInfo label="Anchor to set" value={needAnchor} sub="week 1 rounds" />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<IconClipboard size={22} />}
          title={tab === "waiting" ? "You are all caught up" : "Nothing graded yet"}
          message={
            tab === "waiting"
              ? "Nothing is waiting to grade right now. As teams submit each round, their weeks show up here."
              : "Once you grade a week it stays here — scores, choices and the full written answers, readable for the rest of the term."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const engineTotal = Object.values(row.auto_scores || {}).reduce((a, b) => a + (Number(b) || 0), 0);
            const rowFlags = row.trap_flags || [];
            const showMeta = rowFlags.length > 0 || row.week_number === 1;
            return (
              <div key={row.id} className={`p-4 ${PANEL}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-[2px] border border-[var(--amber-deep,#C4791F)] bg-[var(--graphite,#16191D)] ${MONO} text-[10.5px] font-bold text-[var(--amber,#E8A13C)]`}
                    >
                      R{row.week_number}
                    </span>
                    <div className="min-w-0">
                      <p className={`${DISPLAY} text-[16px] font-semibold leading-tight`}>{row.team_name}</p>
                      <p className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>
                        engine total {engineTotal}
                      </p>
                    </div>
                  </div>
                  {row.graded ? (
                    <button
                      onClick={() => setReading(row)}
                      className={`flex-none rounded-[2px] border border-[var(--steel-line,#2C323A)] px-4 py-2 ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:text-[var(--paper,#ECEFF2)]`}
                    >
                      Read submission
                    </button>
                  ) : (
                    <button
                      onClick={() => setGradeScore(row)}
                      className={`flex-none rounded-[2px] bg-[var(--amber,#E8A13C)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052]`}
                    >
                      Grade
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <ScoreChips scores={row.graded ? row.dimension_scores : row.auto_scores} />
                </div>

                {showMeta && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {/* Not a finding about the submission: this is on every
                        week 1 row. It means the grader must judge the anchor's
                        strength before the grade will save. Read as "this firm
                        failed to name an anchor", which is a different claim
                        and was untrue of a firm that had named one. */}
                    {row.week_number === 1 && (
                      <span className={`${FLAG} border-[var(--amber-deep,#C4791F)] text-[var(--amber,#E8A13C)]`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber,#E8A13C)] shadow-[0_0_6px_-1px_var(--amber,#E8A13C)]" />
                        Set anchor strength
                      </span>
                    )}
                    {rowFlags.map((f, i) => (
                      <span
                        key={i}
                        className={`${FLAG} border-[#7a3b35] text-[var(--signal-red,#D2564B)]`}
                      >
                        {flagText(f)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reading && (
        <SubmissionView
          row={reading}
          onClose={() => setReading(null)}
          onRevise={(row) => {
            setReading(null);
            setGradeScore(row);
          }}
        />
      )}

      {gradeScore && (
        <GradingModal
          score={gradeScore}
          gameId={gameId}
          onClose={() => setGradeScore(null)}
          onGraded={async () => {
            const revised = gradeScore.graded;
            setGradeScore(null);
            await reload();
            notify(revised ? "Grade updated ✓" : "Grade saved ✓");
          }}
        />
      )}
    </div>
  );
}