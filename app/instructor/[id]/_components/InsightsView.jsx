"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { closesIn, fmtMoney } from "../_lib/helpers";
import { api } from "../_lib/api";
import { ViewHeader, MiniInfo, FillBar, Pill } from "./ui";

/* Insights view — dark console theme, var(--token, #fallback) throughout.
 *
 * Console semantics used here:
 *   amber       = leader (rank 1), current round column, submitted-waiting ●
 *   ok green    = positive momentum
 *   signal red  = negative momentum, trap flags
 *   blueprint   = informational notice, metric bars, deep-dive links
 *   FIRM_TONES  = the same six console firm colors used in FirmsView and
 *                 the admin detail page, replacing helpers' FIRM_COLORS
 *                 (picked for white backgrounds).
 *
 * One call to the insights endpoint feeds everything; the old three cards
 * survive only as quiet footer links to the deep-dive pages. Logic unchanged. */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const TRACK = "h-2 flex-1 overflow-hidden rounded-[1px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)]";

/* Map a week-14 tier outcome to the intro's tier colors. */
function tierTone(outcome) {
  const s = String(outcome).toLowerCase();
  if (s.includes("triumph")) return "var(--amber,#E8A13C)";
  if (s.includes("disaster")) return "var(--signal-red,#D2564B)";
  if (s.includes("squeak")) return "var(--muted,#8A94A0)";
  if (s.includes("scar") || s.includes("win")) return "var(--paper,#ECEFF2)";
  return "var(--ok,#7FB08A)";
}

const DIM_LABELS = {
  strategic_judgment: "Strategic judgment",
  execution_consequence: "Execution",
  coherence: "Coherence",
  deliverable_quality: "Deliverable quality",
};

function Momentum({ value }) {
  if (value == null) return <span className={`${MONO} text-[9px] text-[var(--muted-dim,#5C6672)]`}>—</span>;
  if (value === 0) return <span className={`${MONO} text-[9px] text-[var(--muted,#8A94A0)]`}>±0</span>;
  const up = value > 0;
  return (
    <span className={`${MONO} text-[9px] font-bold ${up ? "text-[var(--ok,#7FB08A)]" : "text-[var(--signal-red,#D2564B)]"}`}>
      {up ? "▲" : "▼"} {up ? "+" : ""}
      {value}
    </span>
  );
}

/* Drawn either side of a centre line. A negative width is invalid CSS — the
 * element falls back to `auto` and fills its track, which is how a penalty once
 * rendered as the longest bar on screen. Sign becomes offset and colour, never
 * length. The pale band behind the bar is min..max across firm-weeks. */
function SpreadBar({ avg, min, max, scale }) {
  const span = Math.max(1, scale);
  const pct = (v) => Math.min(50, (Math.abs(v) / span) * 50);
  const lo = Math.min(min, 0);
  const hi = Math.max(max, 0);

  return (
    <div className={`relative ${TRACK}`}>
      <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--steel-soft,#363E48)]" />
      {(min !== 0 || max !== 0) && (
        <div
          className="absolute inset-y-0 bg-[rgba(59,126,156,0.22)]"
          style={{ left: `${50 - pct(lo)}%`, width: `${pct(lo) + pct(hi)}%` }}
        />
      )}
      <div
        className={`absolute inset-y-0 ${
          avg < 0 ? "bg-[var(--amber-deep,#C4791F)]" : "bg-[var(--blueprint-deep,#3B7E9C)]"
        }`}
        style={avg < 0 ? { right: "50%", width: `${pct(avg)}%` } : { left: "50%", width: `${pct(avg)}%` }}
      />
    </div>
  );
}

export default function InsightsView({ gameId, detail, rounds }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  const load = useCallback(async () => {
    try {
      const r = await api(`/instructor/simulations/${gameId}/insights/`);
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      setData(await r.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = detail.total_rounds || rounds.length || 0;
  const current = detail.current_round || 1;
  const students = (detail.students ?? []).length;
  const deadline = closesIn(rounds[current - 1]);

  if (state !== "ready") {
    return (
      <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
        <ViewHeader eyebrow="Analytics" title="Insights" subtitle="How the firms are performing across the run." />
        <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
          {state === "error" ? "Couldn't load insights — refresh to retry." : "Crunching the cohort…"}
        </p>
      </div>
    );
  }

  const firms = data.firms ?? [];
  const leaderTotal = Math.max(1, ...firms.map((f) => f.total_score));
  // Magnitude across averages AND the observed range, so a large negative
  // scales the chart the same way a large positive does.
  const dimMax = Math.max(
    5,
    ...Object.values(data.dimension_averages ?? {}).map((v) => Math.abs(Number(v) || 0)),
    ...Object.values(data.dimension_spread ?? {}).flatMap((sp) => [
      Math.abs(Number(sp.min) || 0),
      Math.abs(Number(sp.max) || 0),
    ]),
  );
  const nothingGraded = (data.graded_weeks_total ?? 0) === 0;
  // Matrix spans every round any firm has touched.
  const maxWeek = Math.max(current, ...firms.flatMap((f) => f.weeks.map((w) => w.week)), 1);
  const weekCols = Array.from({ length: maxWeek }, (_, i) => i + 1);

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Analytics"
        title="Insights"
        subtitle="Standings, momentum, and where the cohort is strong or struggling — updated every time you grade."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Firms" value={firms.length} sub="competing" />
        <MiniInfo label="Students" value={students} sub="enrolled" />
        <MiniInfo label="Round" value={`R${current}`} sub={`of ${total}`} />
        <MiniInfo label="Graded" value={data.graded_weeks_total} sub="firm-weeks" />
      </div>

      {nothingGraded && (
        <div className="flex items-center gap-2.5 rounded-[3px] border border-[var(--blueprint-deep,#3B7E9C)] bg-[var(--graphite-raised,#1E2228)] px-4 py-3">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--blueprint,#5BA3C4)]" />
          <span className="text-[0.85rem] text-[var(--muted,#8A94A0)]">
            Nothing graded yet — standings and averages fill in as you grade submissions. Statuses below are live already.
          </span>
        </div>
      )}

      {/* leaderboard */}
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="px-6 py-4">
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Firm standings</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
            Ranked by total graded score. Momentum compares the last graded round to the one before.
          </p>
        </div>
        {firms.map((f, rank) => {
          const color = FIRM_TONES[(f.number - 1) % FIRM_TONES.length];
          const leader = rank === 0 && !nothingGraded;
          return (
            <div key={f.number} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--steel-line,#2C323A)] px-6 py-3.5">
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-[2px] border ${DISPLAY} text-[15px] font-bold ${
                  leader
                    ? "border-[var(--amber-deep,#C4791F)] bg-[var(--amber,#E8A13C)] text-[var(--graphite,#16191D)]"
                    : "border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] text-[var(--muted,#8A94A0)]"
                }`}
              >
                {rank + 1}
              </span>
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
              <span className={`w-24 flex-none truncate ${DISPLAY} text-[16px] font-semibold`}>{f.name}</span>
              <div className="min-w-[80px] flex-1">
                <FillBar value={f.total_score} total={leaderTotal} color={color} />
              </div>
              <span className={`w-14 flex-none text-right ${MONO} text-[1rem] font-semibold`}>{f.total_score}</span>
              <span className={`w-16 flex-none text-right ${MONO} text-[9px] uppercase tracking-[0.06em] text-[var(--muted-dim,#5C6672)]`}>
                avg {f.average}
              </span>
              <span className="w-12 flex-none text-right">
                <Momentum value={f.momentum} />
              </span>
              <span className="flex flex-none items-center gap-2">
                {f.trap_flags > 0 && (
                  <span className={`rounded-[2px] border border-[#7a3b35] px-2 py-0.5 ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.06em] text-[var(--signal-red,#D2564B)]`}>
                    {f.trap_flags} trap{f.trap_flags === 1 ? "" : "s"}
                  </span>
                )}
                <Pill tone={f.members ? "good" : "muted"}>
                  {f.members} member{f.members === 1 ? "" : "s"}
                </Pill>
              </span>
            </div>
          );
        })}
      </div>

      {/* round-by-round matrix */}
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="px-6 py-4">
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Round by round</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
            Graded totals per round. ● = submitted, waiting on your grade; — = not submitted.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-[var(--steel-line,#2C323A)]">
                <th className={`py-2.5 pl-6 pr-3 text-left ${MONO} text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--muted-dim,#5C6672)]`}>
                  Firm
                </th>
                {weekCols.map((n) => (
                  <th
                    key={n}
                    className={`px-2 py-2.5 text-center ${MONO} text-[9px] font-medium uppercase tracking-[0.1em] ${
                      n === current ? "text-[var(--amber,#E8A13C)]" : "text-[var(--muted-dim,#5C6672)]"
                    }`}
                  >
                    R{n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firms.map((f) => {
                const byWeek = Object.fromEntries(f.weeks.map((w) => [w.week, w]));
                return (
                  <tr key={f.number} className="border-b border-[var(--steel-line,#2C323A)] last:border-b-0">
                    <td className={`py-2.5 pl-6 pr-3 ${DISPLAY} text-[15px] font-semibold`}>{f.name}</td>
                    {weekCols.map((n) => {
                      const cell = byWeek[n];
                      if (cell?.total != null) {
                        return (
                          <td key={n} className={`px-2 py-2.5 text-center ${MONO} text-[0.78rem] font-bold text-[var(--paper,#ECEFF2)]`}>
                            {cell.total}
                          </td>
                        );
                      }
                      if (cell?.status === "SUBMITTED") {
                        return (
                          <td key={n} className="px-2 py-2.5 text-center text-[var(--amber,#E8A13C)]" title="Submitted — waiting to grade">
                            ●
                          </td>
                        );
                      }
                      return (
                        <td key={n} className="px-2 py-2.5 text-center text-[var(--muted-dim,#5C6672)]">
                          —
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* dimension averages */}
        <div className={`p-6 ${PANEL}`}>
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Where the cohort is strong</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
            Per dimension across all graded weeks. The bar is the average; the pale band is the
            range. A wide band on a flat average is the round that separated your firms.
          </p>
          <div className="mt-5 space-y-4">
            {Object.entries(data.dimension_averages ?? {}).map(([dim, value]) => {
              const sp = (data.dimension_spread ?? {})[dim] || {};
              return (
                <div key={dim} className="flex items-center gap-3">
                  <span className={`w-[150px] flex-none ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                    {DIM_LABELS[dim] || dim}
                  </span>
                  <SpreadBar
                    avg={Number(value) || 0}
                    min={Number(sp.min) || 0}
                    max={Number(sp.max) || 0}
                    scale={dimMax}
                  />
                  <span className={`w-9 flex-none text-right ${MONO} text-[0.78rem] font-bold text-[var(--paper,#ECEFF2)]`}>
                    {value}
                  </span>
                  {/* Firms on both sides means the dimension did real work even
                      when the mean says nothing happened. */}
                  <span
                    className={`w-[84px] flex-none ${MONO} text-[8.5px] uppercase leading-[1.4] tracking-[0.06em] ${
                      sp.above > 0 && sp.below > 0
                        ? "text-[var(--amber,#E8A13C)]"
                        : "text-[var(--muted-dim,#5C6672)]"
                    }`}
                  >
                    {sp.count ? `${sp.min} to ${sp.max}` : "—"}
                    {sp.above > 0 && sp.below > 0 && (
                      <span className="block">
                        split {sp.above}/{sp.below}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* advisor engagement */}
        <div className={`p-6 ${PANEL}`}>
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Advisor engagement</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
            Hours of advisor consultation per firm — silence can be as telling as spend.
          </p>
          <div className="mt-5 space-y-3">
            {firms.map((f) => {
              const color = FIRM_TONES[(f.number - 1) % FIRM_TONES.length];
              const maxHours = Math.max(1, ...firms.map((x) => x.advisor_hours));
              return (
                <div key={f.number} className="flex items-center gap-3">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                  <span className={`w-20 flex-none truncate ${DISPLAY} text-[15px] font-semibold`}>{f.name}</span>
                  <div className={TRACK}>
                    <div className="h-full" style={{ width: `${(f.advisor_hours / maxHours) * 100}%`, background: color }} />
                  </div>
                  <span className={`w-[92px] flex-none text-right ${MONO} text-[9px] uppercase tracking-[0.06em] text-[var(--muted-dim,#5C6672)]`}>
                    {f.advisor_hours}h{f.advisor_billed > 0 ? ` · ${fmtMoney(f.advisor_billed)}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* benchmarks */}
      {(data.benchmarks?.length ?? 0) > 0 ? (
        <div className={`p-6 ${PANEL}`}>
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Benchmarks</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">Checkpoint reads at weeks 4, 8, 11, and 14.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.benchmarks.map((b, i) => {
              const week = b.after_week ?? b.week ?? "?";
              const standings = [...(b.standings ?? [])].sort((a, c) => (a.rank ?? 0) - (c.rank ?? 0));
              return (
                <div key={i} className="rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] p-4">
                  <p className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
                    {week === 14 ? "Final reckoning · after week 14" : `After week ${week}`}
                  </p>
                  <div className="mt-3 space-y-3">
                    {standings.map((row) => (
                      <div key={row.rank} className="border-t border-[var(--steel-line,#2C323A)] pt-2.5 first:border-t-0 first:pt-0">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-5 w-5 flex-none items-center justify-center rounded-[2px] border ${DISPLAY} text-[11px] font-bold ${
                              row.rank === 1
                                ? "border-[var(--amber-deep,#C4791F)] bg-[var(--amber,#E8A13C)] text-[var(--graphite,#16191D)]"
                                : "border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] text-[var(--muted,#8A94A0)]"
                            }`}
                          >
                            {row.rank}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${DISPLAY} text-[14px] font-semibold`}>{row.team_name}</span>
                          <span className={`${MONO} text-[0.8rem] font-bold`}>{row.benchmark_score}</span>
                          <span className={`${MONO} text-[9px] text-[var(--muted-dim,#5C6672)]`}>tot {row.total_score}</span>
                        </div>
                        {row.tier_outcome && (
                          <span
                            className={`${MONO} mt-1.5 inline-block rounded-[2px] border px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.06em]`}
                            style={{ color: tierTone(row.tier_outcome), borderColor: tierTone(row.tier_outcome) }}
                          >
                            {row.tier_outcome}
                          </span>
                        )}
                        {(row.visible_strengths ?? []).map((s, si) => (
                          <p key={`s${si}`} className="mt-1 text-[10.5px] leading-snug text-[var(--ok,#7FB08A)]">＋ {s}</p>
                        ))}
                        {(row.visible_weaknesses ?? []).map((w, wi) => (
                          <p key={`w${wi}`} className="mt-1 text-[10.5px] leading-snug text-[var(--amber,#E8A13C)]">− {w}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>
          Benchmarks appear here at the week 4, 8, 11, and 14 checkpoints.
        </p>
      )}

      {/* Standings hold until the whole cohort is graded, because they rank
          firms against each other — an ungraded firm looks identical to one
          that played badly. Without naming who is outstanding, that hold is
          indistinguishable from a broken checkpoint. */}
      {(data.benchmark_status?.pending_firms?.length ?? 0) > 0 && (
        <div className="rounded-[3px] border border-[var(--amber-deep,#C4791F)] bg-[rgba(232,161,60,0.07)] p-4">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--amber,#E8A13C)]`}>
            Week {data.benchmark_status.after_week} standings on hold
          </p>
          <p className="mt-1.5 text-[0.88rem] leading-[1.6] text-[var(--paper,#ECEFF2)]">
            {data.benchmark_status.pending_firms.length === 1
              ? "One firm still needs this round graded: "
              : `${data.benchmark_status.pending_firms.length} firms still need this round graded: `}
            <b>{data.benchmark_status.pending_firms.join(", ")}</b>.
          </p>
          <p className={`mt-1.5 ${MONO} text-[9px] leading-[1.5] text-[var(--muted-dim,#5C6672)]`}>
            Standings rank firms against each other, so they publish only once every firm is graded —
            otherwise an ungraded firm reads as a firm that did badly. They appear for students the
            moment you finish the last one.
          </p>
        </div>
      )}

      {/* deep dives, demoted to footer links */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--steel-line,#2C323A)] pt-4">
        <span className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--muted-dim,#5C6672)]`}>Deep dives:</span>
        {[
          ["Performance overview", `/instructor/${gameId}/performance`],
          ["Firm dashboards", `/instructor/${gameId}/kpis`],
          ["Benchmarks", `/instructor/${gameId}/benchmarks`],
        ].map(([label, href]) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="text-sm font-medium text-[var(--blueprint,#5BA3C4)] transition hover:text-[var(--paper,#ECEFF2)]"
          >
            {label} →
          </button>
        ))}
      </div>
    </div>
  );
}