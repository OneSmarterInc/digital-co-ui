"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// One level deeper than the detail page.
import { fetchMe, api, logout } from "../../../../lib/api";
import { ViewHeader, MiniInfo, Th, Legend } from "../_components/ui";
import { IconBack } from "../_components/icons";
import DetailSidebar from "../_components/DetailSidebar";

/* ================================================================== *
 * Performance overview: /instructor/[id]/performance
 * The deep dive behind Insights' standings: score progression per firm
 * across the run (line chart), the standings table, and a per-round
 * cohort dimension trend. Fed entirely by the insights endpoint.
 *
 * Dark console theme, fully native. The SVG chart draws on graphite:
 * steel grid lines, muted-dim mono axis labels, series in the shared
 * FIRM_TONES with a graphite stroke around each point so overlapping
 * dots stay separable. Rank 1 and the current round are amber, traps
 * are signal red — same grammar as everywhere else.
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

const DIMS = ["strategic_judgment", "execution_consequence", "coherence", "deliverable_quality"];
const DIM_SHORT = { strategic_judgment: "Strat", execution_consequence: "Exec", coherence: "Coher", deliverable_quality: "Deliv" };

function ProgressionChart({ firms, maxWeek }) {
  const W = 720;
  const H = 240;
  const PAD = { l: 34, r: 12, t: 12, b: 26 };
  const maxTotal = Math.max(10, ...firms.flatMap((f) => f.weeks.filter((w) => w.total != null).map((w) => w.total)));
  const x = (week) => PAD.l + ((week - 1) / Math.max(1, maxWeek - 1)) * (W - PAD.l - PAD.r);
  const y = (total) => H - PAD.b - (total / maxTotal) * (H - PAD.t - PAD.b);
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxTotal * p));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score progression per firm">
      {gridY.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--steel-line, #2C323A)" strokeWidth="1" />
          <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted-dim, #5C6672)" fontFamily="IBM Plex Mono, monospace">
            {v}
          </text>
        </g>
      ))}
      {Array.from({ length: maxWeek }, (_, i) => i + 1).map((n) => (
        <text key={n} x={x(n)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--muted-dim, #5C6672)" fontFamily="IBM Plex Mono, monospace">
          R{n}
        </text>
      ))}
      {firms.map((f) => {
        const color = FIRM_TONES[(f.number - 1) % FIRM_TONES.length];
        const pts = f.weeks.filter((w) => w.total != null).map((w) => [x(w.week), y(w.total)]);
        if (pts.length === 0) return null;
        return (
          <g key={f.number}>
            {pts.length > 1 && (
              <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            )}
            {pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r="3.5" fill={color} stroke="var(--graphite-raised, #1E2228)" strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function PerformancePage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [insights, setInsights] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [d, i] = await Promise.all([
      api(`/instructor/simulations/${gameId}/`),
      api(`/instructor/simulations/${gameId}/insights/`),
    ]);
    if (!d.ok || !i.ok) throw new Error(`Request failed (${d.ok ? i.status : d.status})`);
    setDetail(await d.json());
    setInsights(await i.json());
  }, [gameId]);

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
        if (alive) {
          setMe(user);
          setPhase("ready");
        }
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

  if (phase !== "ready" || !insights) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't load performance. ${error ?? ""}` : "Loading performance…"}
        </p>
      </div>
    );
  }

  const firms = insights.firms ?? [];
  const maxWeek = Math.max(insights.current_week || 1, ...firms.flatMap((f) => f.weeks.map((w) => w.week)), 2);
  const nothingGraded = (insights.graded_weeks_total ?? 0) === 0;

  // Per-round cohort dimension averages, computed from the per-firm cells.
  const dimTrend = [];
  for (let n = 1; n <= maxWeek; n++) {
    const cells = firms.map((f) => f.weeks.find((w) => w.week === n)).filter((w) => w?.scores);
    if (cells.length) {
      dimTrend.push({
        week: n,
        firms: cells.length,
        ...Object.fromEntries(DIMS.map((d) => [d, Math.round((cells.reduce((a, c) => a + (c.scores[d] || 0), 0) / cells.length) * 10) / 10])),
      });
    }
  }

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-[rgba(22,25,29,0.85)] px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}`)}
            aria-label="Back to cohort"
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
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>Performance</span>
          </div>
        </div>
        <span className={`hidden ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] sm:inline`}>
          {me.first_name || me.username}
        </span>
      </header>

      <div className="flex">
        <DetailSidebar deploymentStatus={detail.deployment_status} />
        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-[920px] space-y-7">
            <ViewHeader
              eyebrow="Deep dive"
              title="Performance overview"
              subtitle="Every firm's graded trajectory across the run, and how the cohort's four dimensions move round by round."
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniInfo label="Firms" value={firms.length} sub="tracked" />
              <MiniInfo label="Round" value={`R${insights.current_week}`} sub={`of ${insights.total_rounds}`} />
              <MiniInfo label="Graded" value={insights.graded_weeks_total} sub="firm-weeks" />
              <MiniInfo
                label="Leader"
                value={nothingGraded ? "—" : firms[0]?.name ?? "—"}
                sub={nothingGraded ? "nothing graded" : `${firms[0]?.total_score ?? 0} pts`}
              />
            </div>

            <div className={`p-6 ${PANEL}`}>
              <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Score progression</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Graded round totals per firm. Gaps mean a round wasn't graded yet.</p>
              {nothingGraded ? (
                <p className="mt-6 text-sm text-[var(--muted)]">The chart draws itself as you grade — nothing scored yet.</p>
              ) : (
                <>
                  <div className="mt-4">
                    <ProgressionChart firms={firms} maxWeek={maxWeek} />
                  </div>
                  <div className="mt-2">
                    <Legend items={firms.map((f) => [FIRM_TONES[(f.number - 1) % FIRM_TONES.length], f.name])} />
                  </div>
                </>
              )}
            </div>

            <div className={`overflow-hidden ${PANEL}`}>
              <div className="px-6 py-4">
                <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Standings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr className="border-y border-[var(--steel-line)]">
                      <Th className="pl-6">#</Th>
                      <Th>Firm</Th>
                      <Th>Total</Th>
                      <Th>Average</Th>
                      <Th>Last round</Th>
                      <Th className="pr-6">Traps</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {firms.map((f, rank) => (
                      <tr key={f.number} className="border-b border-[var(--steel-line)] transition last:border-b-0 hover:bg-[var(--graphite-high)]">
                        <td
                          className={`py-3 pl-6 pr-3 ${DISPLAY} text-[16px] font-bold ${
                            rank === 0 && !nothingGraded ? "text-[var(--amber)]" : "text-[var(--muted)]"
                          }`}
                        >
                          {rank + 1}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: FIRM_TONES[(f.number - 1) % FIRM_TONES.length] }}
                          />
                          <span className={`${DISPLAY} text-[15px] font-semibold`}>{f.name}</span>
                        </td>
                        <td className={`px-3 py-3 ${MONO} text-[0.85rem] font-bold`}>{f.total_score}</td>
                        <td className={`px-3 py-3 ${MONO} text-[0.78rem] text-[var(--muted)]`}>{f.average}</td>
                        <td className={`px-3 py-3 ${MONO} text-[0.78rem] text-[var(--muted)]`}>{f.last_total ?? "—"}</td>
                        <td className={`py-3 pl-3 pr-6 ${MONO} text-[0.78rem] ${f.trap_flags ? "text-[var(--signal-red)]" : "text-[var(--muted-dim)]"}`}>
                          {f.trap_flags || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {dimTrend.length > 0 && (
              <div className={`overflow-hidden ${PANEL}`}>
                <div className="px-6 py-4">
                  <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Dimension trend</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Cohort average per dimension, per graded round — watch which skill the class is (or isn't) building.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse">
                    <thead>
                      <tr className="border-y border-[var(--steel-line)]">
                        <Th className="pl-6">Round</Th>
                        {DIMS.map((d) => (
                          <Th key={d}>{DIM_SHORT[d]}</Th>
                        ))}
                        <Th className="pr-6">Firms graded</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {dimTrend.map((row) => {
                        const isCurrent = row.week === insights.current_week;
                        return (
                          <tr
                            key={row.week}
                            className={`border-b border-[var(--steel-line)] last:border-b-0 ${isCurrent ? "bg-[rgba(232,161,60,0.06)]" : ""}`}
                          >
                            <td className={`py-2.5 pl-6 pr-3 ${DISPLAY} text-[15px] font-semibold ${isCurrent ? "text-[var(--amber)]" : ""}`}>
                              R{row.week}
                            </td>
                            {DIMS.map((d) => (
                              <td key={d} className={`px-3 py-2.5 ${MONO} text-[0.78rem]`}>{row[d]}</td>
                            ))}
                            <td className={`py-2.5 pl-3 pr-6 ${MONO} text-[0.72rem] text-[var(--muted-dim)]`}>{row.firms}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}