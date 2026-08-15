"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// One level deeper than the detail page.
import { fetchMe, api, logout } from "../../../../lib/api";
import { ViewHeader, MiniInfo, Th, StatusPill, EmptyState } from "../_components/ui";
import { IconBack, IconChart } from "../_components/icons";
import DetailSidebar from "../_components/DetailSidebar";

/* ================================================================== *
 * Benchmarks: /instructor/[id]/benchmarks
 * The checkpoint reads the engine takes after weeks 4, 8, 11, and 14 —
 * standings per checkpoint with visible strengths and weaknesses, and
 * tier outcomes at the week-14 finale. Uses the existing benchmarks
 * endpoint.
 *
 * Dark console theme. This is a standalone route (no themed shell above
 * it), so the page wrapper sets the console vars itself; DetailSidebar
 * and the ui.jsx components are natively dark, so no token adapter is
 * needed here. Week-14 tier outcomes render in the intro's own tier
 * colors: Triumph amber, Win-with-scars paper, Squeak muted, Disaster
 * signal red.
 * ================================================================== */

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
const FLAG = `inline-flex items-center rounded-[2px] border px-2 py-0.5 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[8.5px] uppercase tracking-[0.04em]`;

/* Map a tier outcome string to the intro's tier colors. */
function tierTone(outcome) {
  const s = String(outcome).toLowerCase();
  if (s.includes("triumph")) return "var(--amber, #E8A13C)";
  if (s.includes("disaster")) return "var(--signal-red, #D2564B)";
  if (s.includes("squeak")) return "var(--muted, #8A94A0)";
  if (s.includes("scar") || s.includes("win")) return "var(--paper, #ECEFF2)";
  return "var(--ok, #7FB08A)";
}

export default function BenchmarksPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [benchmarks, setBenchmarks] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) router.replace("/login");
          return;
        }
        const [d, b] = await Promise.all([
          api(`/instructor/simulations/${gameId}/`),
          api(`/instructor/benchmarks/${gameId}/`),
        ]);
        if (!d.ok || !b.ok) throw new Error(`Request failed (${d.ok ? b.status : d.status})`);
        if (alive) {
          setDetail(await d.json());
          setBenchmarks(await b.json());
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
  }, [gameId, router]);

  if (phase !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--graphite)] px-6 text-[var(--paper)]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
          {phase === "error" ? `Couldn't load benchmarks. ${error ?? ""}` : "Loading benchmarks…"}
        </p>
      </div>
    );
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
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>Benchmarks</span>
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
              title="Benchmarks"
              subtitle="Checkpoint reads the engine takes after weeks 4, 8, 11, and 14 — where each firm stood, what showed, and how the run resolved."
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[4, 8, 11, 14].map((wk) => {
                const hit = benchmarks.find((b) => b.after_week === wk);
                return (
                  <MiniInfo
                    key={wk}
                    label={`Week ${wk}`}
                    value={hit ? "Taken" : "—"}
                    sub={hit ? `${hit.standings.length} firms` : wk === 14 ? "finale" : "checkpoint"}
                  />
                );
              })}
            </div>

            {benchmarks.length === 0 ? (
              <EmptyState
                icon={<IconChart size={22} />}
                title="No benchmarks yet"
                message="The engine records a benchmark as the run passes weeks 4, 8, 11, and 14. Advance the cohort past week 4 and the first checkpoint appears here."
              />
            ) : (
              benchmarks.map((b) => (
                <div
                  key={b.after_week}
                  className="overflow-hidden rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>
                        {b.after_week === 14 ? "Final reckoning" : `Checkpoint`} — after week {b.after_week}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {b.after_week === 14
                          ? "The run's resolution: final standings and tier outcomes."
                          : "A phase read: standings plus what each firm's play made visible."}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse">
                      <thead>
                        <tr className="border-y border-[var(--steel-line)]">
                          <Th className="pl-6">#</Th>
                          <Th>Firm</Th>
                          <Th>Benchmark</Th>
                          <Th>Total</Th>
                          <Th className={b.after_week === 14 ? "" : "pr-6"}>Visible read</Th>
                          {b.after_week === 14 && <Th className="pr-6">Outcome</Th>}
                        </tr>
                      </thead>
                      <tbody>
                        {b.standings.map((row) => (
                          <tr key={row.rank} className="border-b border-[var(--steel-line)] last:border-b-0">
                            <td className="py-3 pl-6 pr-3">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-[2px] border ${DISPLAY} text-[14px] font-bold ${
                                  row.rank === 1
                                    ? "border-[var(--amber-deep)] bg-[var(--amber)] text-[var(--graphite)]"
                                    : "border-[var(--steel-soft)] bg-[var(--graphite)] text-[var(--muted)]"
                                }`}
                              >
                                {row.rank}
                              </span>
                            </td>
                            <td className={`px-3 py-3 ${DISPLAY} text-[15px] font-semibold`}>{row.team_name}</td>
                            <td className={`px-3 py-3 ${MONO} text-[0.85rem] font-bold`}>{row.benchmark_score}</td>
                            <td className={`px-3 py-3 ${MONO} text-[0.78rem] text-[var(--muted)]`}>{row.total_score}</td>
                            <td className={`px-3 py-3 ${b.after_week === 14 ? "" : "pr-6"}`}>
                              <div className="flex flex-wrap gap-1.5">
                                {(row.visible_strengths ?? []).map((s, i) => (
                                  <span key={`s${i}`} className={`${FLAG} border-[#3f5e46] text-[var(--ok)]`}>
                                    {s}
                                  </span>
                                ))}
                                {(row.visible_weaknesses ?? []).map((w, i) => (
                                  <span key={`w${i}`} className={`${FLAG} border-[var(--amber-deep)] text-[var(--amber)]`}>
                                    {w}
                                  </span>
                                ))}
                                {!(row.visible_strengths?.length || row.visible_weaknesses?.length) && (
                                  <span className={`${MONO} text-[9px] text-[var(--muted-dim)]`}>—</span>
                                )}
                              </div>
                            </td>
                            {b.after_week === 14 && (
                              <td className="py-3 pl-3 pr-6">
                                {row.tier_outcome ? (
                                  <StatusPill label={String(row.tier_outcome)} tone={tierTone(row.tier_outcome)} />
                                ) : (
                                  <span className={`${MONO} text-[9px] text-[var(--muted-dim)]`}>—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}