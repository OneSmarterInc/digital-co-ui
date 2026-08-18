"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// One level deeper than the detail page.
import { fetchMe, api, logout } from "../../../../lib/api";
import { initials, fmtMoney } from "../_lib/helpers";
import { ViewHeader, MiniInfo, Avatar, Pill } from "../_components/ui";
import { IconBack } from "../_components/icons";
import DetailSidebar from "../_components/DetailSidebar";

/* ================================================================== *
 * Firm dashboards: /instructor/[id]/kpis
 * One firm at a time, straight from the engine — rendered for humans:
 * stakeholder meters, signed score meters, gate pills, through-line
 * chips, the week record, and decisions as readable cards. No raw
 * JSON anywhere on the page.
 *
 * Dark console theme, fully native. The engine-state color grammar,
 * matching the sim's own escalation ladder:
 *   ok green    = intact gates, positive standing, true flags
 *   amber       = trouble brewing — negative meters, engine flags,
 *                 negative through-line values ("negative is trouble
 *                 brewing", as the copy says)
 *   signal red  = consequences that FIRED — detonated gates and traps
 * FIRM_TONES = shared console firm colors. All data flow unchanged.
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
const CHIP = `inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.04em]`;

const DIM_LABELS = {
  strategic_judgment: "Strategic judgment",
  execution_consequence: "Execution",
  coherence: "Coherence",
  deliverable_quality: "Deliverable quality",
};
const STAKEHOLDERS = {
  calloway: "Calloway (CEO)",
  reinhardt: "Reinhardt (CFO)",
  petrillo: "Petrillo (Ops)",
  ferraro: "Ferraro (Channel)",
  fischer: "Fischer (Connected)",
  tran: "Tran (Legal)",
};
const human = (s) => String(s ?? "").replace(/_/g, " ");

/* Diverging meter for values that can go negative — used for both
 * stakeholder standing and accumulated scores. Negative = amber:
 * trouble brewing, not yet a fired consequence. */
function SignedMeter({ name, value, scale }) {
  const pct = Math.min(50, (Math.abs(value) / Math.max(1, scale)) * 50);
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`w-[150px] flex-none ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>{name}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-[1px] border border-[var(--steel-line)] bg-[var(--graphite)]">
        <span className="absolute left-1/2 top-0 h-full w-px bg-[var(--steel-soft)]" />
        {value !== 0 && (
          <span
            className="absolute top-0 h-full"
            style={{
              left: positive ? "50%" : `${50 - pct}%`,
              width: `${pct}%`,
              background: positive ? "var(--ok)" : "var(--amber)",
            }}
          />
        )}
      </div>
      <span
        className={`w-9 flex-none text-right ${MONO} text-[0.75rem] font-bold ${
          value > 0 ? "text-[var(--ok)]" : value < 0 ? "text-[var(--amber)]" : "text-[var(--muted-dim)]"
        }`}
      >
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

/* One value from the engine, rendered as a small readable chip. */
function ValueChip({ label, value }) {
  let tone = "border-[var(--steel-line)] text-[var(--muted)]";
  let display = String(value);
  if (value === true) {
    tone = "border-[#3f5e46] text-[var(--ok)]";
    display = "yes";
  } else if (value === false) {
    display = "no";
  } else if (value === "" || value === "unset" || value == null) {
    display = "unset";
  } else if (typeof value === "number" && value < 0) {
    tone = "border-[var(--amber-deep)] text-[var(--amber)]";
  }
  return (
    <span className={`${CHIP} ${tone}`}>
      <span className="opacity-70">{human(label)}</span> {display}
    </span>
  );
}

function ThroughLines({ blob }) {
  const entries = Object.entries(blob || {});
  if (!entries.length) return null;
  return (
    <div className={`p-6 ${PANEL}`}>
      <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Through-lines</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">The long threads the engine tracks across the whole run.</p>
      <div className="mt-4 space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--steel-line)] pb-2.5 last:border-b-0 last:pb-0">
            <span className={`w-[110px] flex-none ${MONO} text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--paper)]`}>
              {human(key)}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {typeof value === "object" && value !== null ? (
                Object.entries(value)
                  .filter(([, v]) => typeof v !== "object")
                  .map(([k, v]) => <ValueChip key={k} label={k} value={v} />)
              ) : (
                <ValueChip label="value" value={value} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gates({ blob }) {
  const entries = Object.entries(blob || {});
  if (!entries.length) return null;
  return (
    <div className={`p-6 ${PANEL}`}>
      <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Gates</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Tripwires — a detonated gate means a consequence has fired.</p>
      <div className="mt-4 space-y-3">
        {entries.map(([key, value]) => {
          const detonated = value?.detonated === true;
          const state = value?.state != null ? String(value.state) : null;
          return (
            <div key={key} className="flex items-center justify-between gap-3 border-b border-[var(--steel-line)] pb-2.5 last:border-b-0 last:pb-0">
              <span className={`${MONO} text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--paper)]`}>{human(key)}</span>
              <span className="flex items-center gap-2">
                {state && (
                  <span className={`${CHIP} border-[var(--steel-line)] text-[var(--muted)]`}>{human(state)}</span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-0.5 ${MONO} text-[9px] font-semibold uppercase tracking-[0.06em] ${
                    detonated ? "border-[#7a3b35] text-[var(--signal-red)]" : "border-[#3f5e46] text-[var(--ok)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      detonated
                        ? "bg-[var(--signal-red)] shadow-[0_0_8px_-1px_var(--signal-red)]"
                        : "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]"
                    }`}
                  />
                  {detonated ? "Detonated" : "Intact"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* A decision from history, humanized: week, decision name, short choices as
 * chips, written answers summarized by count, traps flagged. */
function DecisionCard({ decision }) {
  if (typeof decision !== "object" || decision === null) {
    return (
      <p className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] px-4 py-3 text-sm text-[var(--muted)]">
        {String(decision)}
      </p>
    );
  }
  const choices = decision.choices || {};
  const shortChoices = Object.entries(choices).filter(([, v]) => typeof v !== "string" || v.length <= 32);
  const written = Object.entries(choices).filter(([, v]) => typeof v === "string" && v.length > 32);
  const traps = decision.trap_flags || [];
  return (
    <div className={`p-4 ${PANEL}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`flex h-7 w-7 flex-none items-center justify-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${MONO} text-[9px] font-bold text-[var(--muted)]`}
        >
          R{decision.week ?? "?"}
        </span>
        <span className={`${DISPLAY} text-[16px] font-semibold capitalize`}>{human(decision.decision_key ?? "decision")}</span>
        {traps.map((t) => (
          <span key={t} className={`rounded-[2px] border border-[#7a3b35] px-2 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.06em] text-[var(--signal-red)]`}>
            trap: {human(t)}
          </span>
        ))}
      </div>
      {shortChoices.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shortChoices.map(([k, v]) => (
            <ValueChip key={k} label={k} value={v} />
          ))}
        </div>
      )}
      {written.length > 0 && (
        <p className={`mt-2 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>
          + {written.length} written response{written.length === 1 ? "" : "s"} — full text in Grading
        </p>
      )}
    </div>
  );
}

export default function FirmDashboardsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [firmNo, setFirmNo] = useState(1);
  const [firm, setFirm] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [firmState, setFirmState] = useState("loading");
  const [error, setError] = useState(null);
  const [anchorOpen, setAnchorOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) router.replace("/login");
          return;
        }
        const d = await api(`/instructor/simulations/${gameId}/`);
        if (!d.ok) throw new Error(`Request failed (${d.status})`);
        if (alive) {
          setDetail(await d.json());
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

  const loadFirm = useCallback(
    async (n) => {
      setFirmState("loading");
      setAnchorOpen(false);
      try {
        const r = await api(`/instructor/simulations/${gameId}/firms/${n}/insights/`);
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        setFirm(await r.json());
        setFirmState("ready");
      } catch {
        setFirmState("error");
      }
    },
    [gameId]
  );

  useEffect(() => {
    if (phase === "ready") loadFirm(firmNo);
  }, [phase, firmNo, loadFirm]);

  if (phase !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't load this cohort. ${error ?? ""}` : "Loading firm dashboards…"}
        </p>
      </div>
    );
  }

  const firms = (detail.firms ?? []).slice().sort((a, b) => a.number - b.number);
  const rel = firm?.state?.relationships ?? {};
  const relScale = Math.max(3, ...Object.values(rel).map((v) => Math.abs(Number(v) || 0)));
  const acc = firm?.state?.accumulated_scores ?? {};
  const accScale = Math.max(5, ...Object.values(acc).map((v) => Math.abs(Number(v) || 0)));
  const flags = Object.entries(firm?.state?.flags ?? {});
  const trapTotal = (firm?.weeks ?? []).reduce((a, w) => a + (w.trap_flags?.length ?? 0), 0);
  const anchor = firm?.state?.coherence_anchor?.trim();

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
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
              <span>FLEXEE</span>
              <span className="font-normal text-[var(--muted-dim)]">·</span>
              <span className="text-[var(--amber)]">DigitalCo</span>
            </span>
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Instructor</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--paper)]`}>{detail.name}</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>Firm dashboards</span>
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
              title="Firm dashboards"
              subtitle="One firm at a time, straight from the engine: stakeholder standing, through-lines, and the record behind the score."
            />

            <div className="flex flex-wrap gap-2">
              {firms.map((t) => {
                const active = t.number === firmNo;
                const color = FIRM_TONES[(t.number - 1) % FIRM_TONES.length];
                return (
                  <button
                    key={t.number}
                    onClick={() => setFirmNo(t.number)}
                    className={`flex items-center gap-2 rounded-[2px] border px-3.5 py-2 ${MONO} text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
                      active
                        ? "border-[var(--amber-deep)] bg-[var(--amber)] text-[var(--graphite)]"
                        : "border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color, boxShadow: active ? "0 0 0 1.5px rgba(22,25,29,0.5)" : "none" }}
                    />
                    {t.name ?? `Firm ${t.number}`}
                  </button>
                );
              })}
            </div>

            {firmState !== "ready" ? (
              <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
                {firmState === "error" ? "Couldn't load this firm — try another or refresh." : "Loading firm…"}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <MiniInfo label="Firm" value={firm.name} sub={`${firm.members.length} member${firm.members.length === 1 ? "" : "s"}`} />
                  <MiniInfo label="Week" value={firm.current_week ? `R${firm.current_week}` : "—"} sub="current" />
                  <MiniInfo label="Decisions" value={firm.state.decision_count} sub="recorded" />
                  <MiniInfo label="Trap flags" value={trapTotal} sub={trapTotal ? "across the run" : "clean so far"} />
                </div>

                {/* coherence anchor: its own quote card, clamped until expanded */}
                <div className="rounded-[3px] border border-[var(--steel-line)] border-l-[3px] border-l-[var(--amber-deep)] bg-[var(--graphite-raised)] px-5 py-4">
                  <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--amber)]`}>
                    Coherence anchor — what the run audits against
                  </p>
                  {anchor ? (
                    <>
                      <p className={`mt-1.5 text-[0.95rem] italic leading-relaxed text-[var(--paper)] ${anchorOpen ? "" : "line-clamp-3"}`}>
                        &ldquo;{anchor}&rdquo;
                      </p>
                      {anchor.length > 220 && (
                        <button
                          onClick={() => setAnchorOpen((v) => !v)}
                          className="mt-1.5 text-sm font-medium text-[var(--blueprint)] transition hover:text-[var(--paper)]"
                        >
                          {anchorOpen ? "Show less" : "Show full anchor"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="mt-1.5 text-sm text-[var(--muted)]">Not set yet — the anchor locks in when you grade Week 1.</p>
                  )}
                </div>

                {flags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {flags.map(([k, v]) => (
                      <span
                        key={k}
                        className={`inline-flex items-center rounded-[2px] border border-[var(--amber-deep)] px-2.5 py-0.5 ${MONO} text-[9px] uppercase tracking-[0.06em] text-[var(--amber)]`}
                      >
                        {human(k)}
                        {v !== true ? `: ${String(v)}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className={`p-6 ${PANEL}`}>
                    <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Stakeholder standing</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">How the room feels about this CIO — negative is trouble brewing.</p>
                    <div className="mt-4 space-y-3">
                      {Object.entries(rel).map(([k, v]) => (
                        <SignedMeter key={k} name={STAKEHOLDERS[k] || human(k)} value={Number(v) || 0} scale={relScale} />
                      ))}
                    </div>
                  </div>

                  <div className={`p-6 ${PANEL}`}>
                    <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Accumulated score</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">Engine totals per dimension — these can run negative when a firm hits traps.</p>
                    <div className="mt-4 space-y-3">
                      {Object.entries(acc).map(([dim, value]) => (
                        <SignedMeter key={dim} name={DIM_LABELS[dim] || human(dim)} value={Number(value) || 0} scale={accScale} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ThroughLines blob={firm.state.through_lines} />
                  <Gates blob={firm.state.gates} />
                </div>

                {/* week record */}
                <div className={`overflow-hidden ${PANEL}`}>
                  <div className="px-6 py-4">
                    <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Week record</h3>
                  </div>
                  {firm.weeks.length === 0 ? (
                    <p className="border-t border-[var(--steel-line)] px-6 py-6 text-sm text-[var(--muted)]">
                      No weeks opened yet for this firm.
                    </p>
                  ) : (
                    firm.weeks.map((w) => (
                      <div key={w.week} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--steel-line)] px-6 py-3">
                        <span
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${MONO} text-[10px] font-bold text-[var(--muted)]`}
                        >
                          R{w.week}
                        </span>
                        <Pill tone={w.total != null ? "good" : "muted"}>{human(w.status).toLowerCase()}</Pill>
                        {w.total != null && (
                          <span className={`${MONO} text-[1rem] font-semibold`}>
                            {w.total}
                            <span className={`ml-2 ${MONO} text-[8.5px] font-normal uppercase tracking-[0.06em] text-[var(--muted-dim)]`}>
                              {Object.entries(w.scores)
                                .map(([k, v]) => `${(DIM_LABELS[k] || k).split(" ")[0].slice(0, 5)} ${v}`)
                                .join(" · ")}
                            </span>
                          </span>
                        )}
                        {(w.trap_flags?.length ?? 0) > 0 && (
                          <span className={`rounded-[2px] border border-[#7a3b35] px-2.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.06em] text-[var(--signal-red)]`}>
                            {w.trap_flags.length} trap{w.trap_flags.length === 1 ? "" : "s"}: {w.trap_flags.map(human).join(", ")}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* members */}
                <div className={`overflow-hidden ${PANEL}`}>
                  <div className="px-6 py-4">
                    <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Members</h3>
                  </div>
                  {firm.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 border-t border-[var(--steel-line)] px-6 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar text={initials(m.name)} />
                        <div className="min-w-0">
                          <p className="truncate text-[0.95rem] font-semibold">{m.name}</p>
                          <p className={`truncate ${MONO} text-[9.5px] text-[var(--muted-dim)]`}>{m.email}</p>
                        </div>
                      </div>
                      <span className={`flex-none ${MONO} text-[9.5px] uppercase tracking-[0.06em] text-[var(--muted-dim)]`}>
                        advisor {m.advisor_hours}h{m.advisor_billed > 0 ? ` · ${fmtMoney(m.advisor_billed)}` : ""}
                        {(m.group_hours ?? 0) > 0 && ` · group ${m.group_hours}h (${fmtMoney(m.group_billed ?? 0)})`}
                      </span>
                    </div>
                  ))}
                </div>

                {(firm.state.recent_decisions?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <div>
                      <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Recent decisions</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        The structured choices from the last {firm.state.recent_decisions.length} recorded decision
                        {firm.state.recent_decisions.length === 1 ? "" : "s"} — written answers live in Grading.
                      </p>
                    </div>
                    {[...firm.state.recent_decisions].reverse().map((d, i) => (
                      <DecisionCard key={i} decision={d} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}