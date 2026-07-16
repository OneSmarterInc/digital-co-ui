"use client";

import { useState } from "react";
import { billingOf, closesIn, fmtMoney } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { ViewHeader, SectionCard, MiniInfo, Pill, Th, Legend } from "./ui";
import { NumberPromptModal } from "./modals";

/* Schedule view — dark console theme, var(--token, #fallback) throughout.
 * The round chips speak the console's segment language: the active round is
 * solid glowing amber (seg--now), completed rounds recede into steel,
 * upcoming rounds carry a blueprint dot (open/scheduled) and warm to an
 * amber border on hover since they're clickable. Extension markers are
 * paper dots — visible on both amber and graphite chips.
 * Extend flow and round math unchanged. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

export default function ScheduleView({ gameId, detail, rounds, reload, notify }) {
  const billing = billingOf(detail);
  const [extendFor, setExtendFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const doExtend = async (n, days) => {
    setExtendFor(null);
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/rounds/${n}/extend/`,
      opts: jsonPost({ days }),
      label: `R${n} extended`,
      reload,
      notify,
    });
    setBusy(false);
  };

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Timeline"
        title="Schedule"
        subtitle="Rounds are paced from the start date. Click a current or future round to extend its deadline, and later rounds shift to match."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Current round" value={`R${detail.current_round}`} sub={`of ${detail.total_rounds}`} />
        <MiniInfo label="Remaining" value={Math.max(0, detail.total_rounds - detail.current_round)} sub="rounds left" />
        <MiniInfo label="This round" value={closesIn(rounds[detail.current_round - 1]?.end) || "—"} sub="deadline" />
        <MiniInfo label="Per student" value={fmtMoney(billing.price_per_student)} sub="billing rate" />
      </div>

      <SectionCard
        title="Round schedule"
        subtitle={`Currently in R${detail.current_round} of ${detail.total_rounds}`}
        action={
          <span className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-1 ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)]`}>
            {rounds.filter((r) => r.status === "Upcoming").length} scheduled
          </span>
        }
      >
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-2 pt-1">
            {rounds.map((r) => {
              const isCurrent = r.status === "Active";
              const isPast = r.status === "Completed";
              const clickable = !isPast;
              return (
                <button
                  key={r.n}
                  disabled={!clickable || busy}
                  onClick={() => clickable && setExtendFor(r.n)}
                  title={clickable ? `Extend R${r.n} deadline` : undefined}
                  className={`relative min-w-[64px] rounded-[2px] border py-2 text-center ${MONO} text-[0.8rem] transition duration-150 ${
                    isCurrent
                      ? "border-[var(--amber-deep,#C4791F)] bg-[var(--amber,#E8A13C)] font-bold text-[var(--graphite,#16191D)] shadow-[0_0_10px_-2px_var(--amber,#E8A13C)]"
                      : isPast
                        ? "border-[var(--steel-line,#2C323A)] bg-[var(--graphite-high,#252B32)] text-[var(--muted-dim,#5C6672)]"
                        : "border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-[var(--paper,#ECEFF2)] hover:border-[var(--amber-deep,#C4791F)]"
                  } ${clickable && !busy ? "cursor-pointer" : "cursor-default"}`}
                >
                  R{r.n}
                  {r.status === "Upcoming" && (
                    <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--blueprint,#5BA3C4)]" />
                  )}
                  {r.extended_days > 0 && (
                    <span
                      className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--paper,#ECEFF2)]"
                      title={`Extended by ${r.extended_days} day${r.extended_days === 1 ? "" : "s"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Legend
              items={[
                ["var(--amber, #E8A13C)", "Active"],
                ["var(--muted-dim, #5C6672)", "Completed"],
                ["var(--blueprint, #5BA3C4)", "Upcoming"],
                ["var(--paper, #ECEFF2)", "Extended"],
              ]}
            />
          </div>
          <p className={`mt-3 ${MONO} text-[10px] text-[var(--muted-dim,#5C6672)]`}>
            Tip: click any current or future round to extend its deadline. Later rounds shift forward automatically.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-y border-[var(--steel-line,#2C323A)]">
                <Th className="pl-6">Round</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th className="pr-6">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => {
                const active = r.status === "Active";
                return (
                  <tr
                    key={r.n}
                    className={`border-b border-[var(--steel-line,#2C323A)] ${active ? "bg-[rgba(232,161,60,0.06)]" : ""}`}
                  >
                    <td className={`py-3 pl-6 pr-3 ${DISPLAY} text-[16px] font-semibold ${active ? "text-[var(--amber,#E8A13C)]" : ""}`}>
                      Round {r.n}
                      {r.extended_days > 0 && (
                        <span className={`ml-2 inline-flex items-center rounded-[2px] border border-[var(--amber-deep,#C4791F)] px-2 py-0.5 align-middle ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[var(--amber,#E8A13C)]`}>
                          +{r.extended_days} day{r.extended_days === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted,#8A94A0)]">{r.start}</td>
                    <td className="px-3 py-3 text-sm text-[var(--muted,#8A94A0)]">{r.end}</td>
                    <td className="py-3 pl-3 pr-6">
                      <Pill tone={active ? "good" : "muted"}>{r.status}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {extendFor !== null && (
        <NumberPromptModal
          title={`Extend Round ${extendFor}`}
          label="Days to add (later rounds shift to match)"
          initial={7}
          min={1}
          confirmLabel="Extend"
          onClose={() => setExtendFor(null)}
          onSubmit={(d) => doExtend(extendFor, d)}
        />
      )}
    </div>
  );
}