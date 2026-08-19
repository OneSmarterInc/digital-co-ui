"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// Two levels deeper than the detail page.
import { fetchMe, api, logout } from "../../../../../lib/api";
import { initials, fmtMoney } from "../../_lib/helpers";
import { runAction, jsonPost } from "../../_lib/actions";
import { ViewHeader, MiniInfo, Avatar, Pill } from "../../_components/ui";
import { IconBack } from "../../_components/icons";

/* ================================================================== *
 * Firm page: /instructor/[id]/firms/[firm]
 * The operational hub for one firm — where Firm dashboards is the
 * engine-state analytics view, this is the working view: who's in the
 * firm (move them, toggle paid, see advisor usage), how their run is
 * going week by week, where they stand in the cohort, and one-click
 * paths into Mimic and Grading.
 *
 * Dark console theme, fully native (standalone route sets its own vars;
 * ui.jsx components are already dark). Console semantics: amber =
 * primary actions, Mimic, and the coherence anchor (the intro's own
 * word for it); ok green = positive stakeholder standing; signal red =
 * negative standing and trap flags; FIRM_TONES = shared console firm
 * colors. All handlers unchanged.
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

const DIM_SHORT = {
  strategic_judgment: "Strategic judgment",
  execution_consequence: "Execution consequence",
  coherence: "Coherence",
  deliverable_quality: "Deliverable quality",
};
const STAKEHOLDERS = {
  calloway: "Calloway",
  reinhardt: "Reinhardt",
  petrillo: "Petrillo",
  ferraro: "Ferraro",
  fischer: "Fischer",
  tran: "Tran",
};
const human = (s) => String(s ?? "").replace(/_/g, " ");

function SignedMeter({ name, value, scale }) {
  const pct = Math.min(50, (Math.abs(value) / Math.max(1, scale)) * 50);
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`w-[92px] flex-none ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>{name}</span>
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

export default function FirmPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const rawFirm = params?.firm;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const firmNo = Number(Array.isArray(rawFirm) ? rawFirm[0] : rawFirm);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [firm, setFirm] = useState(null); // firm insights payload
  const [standings, setStandings] = useState([]); // cohort insights firms, ranked
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const load = useCallback(async () => {
    const [d, f, ins] = await Promise.all([
      api(`/instructor/simulations/${gameId}/`),
      api(`/instructor/simulations/${gameId}/firms/${firmNo}/insights/`),
      api(`/instructor/simulations/${gameId}/insights/`),
    ]);
    if (!d.ok) throw new Error(`Request failed (${d.status})`);
    if (!f.ok) {
      const fj = await f.json().catch(() => ({}));
      throw new Error(fj.detail || `Request failed (${f.status})`);
    }
    setDetail(await d.json());
    setFirm(await f.json());
    if (ins.ok) setStandings((await ins.json()).firms ?? []);
  }, [gameId, firmNo]);

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

  const reload = useCallback(async () => {
    try {
      await load();
    } catch (e) {
      notify(`Refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [load, notify]);

  if (phase !== "ready" || !firm || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't load this firm. ${error ?? ""}` : "Loading firm…"}
        </p>
      </div>
    );
  }

  const color = FIRM_TONES[(firmNo - 1) % FIRM_TONES.length];
  const firms = (detail.firms ?? []).slice().sort((a, b) => a.number - b.number);
  // Roster rows for this firm come from detail.students (they carry enrollment ids).
  const roster = (detail.students ?? []).filter((s) => s.firm_index != null && s.firm_index + 1 === firmNo);
  const usageById = Object.fromEntries((firm.members ?? []).map((m) => [m.id, m]));
  const rank = standings.findIndex((f) => f.number === firmNo);
  const mine = standings.find((f) => f.number === firmNo);
  const rel = firm.state?.relationships ?? {};
  const relScale = Math.max(3, ...Object.values(rel).map((v) => Math.abs(Number(v) || 0)));
  const trapTotal = (firm.weeks ?? []).reduce((a, w) => a + (w.trap_flags?.length ?? 0), 0);
  const anchor = firm.state?.coherence_anchor?.trim();

  const doMove = async (enrollmentId, targetFirm, label) => {
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/enrollments/${enrollmentId}/move/`,
      opts: jsonPost({ firm_number: targetFirm }),
      label: targetFirm === 0 ? "Student unassigned" : `Moved to ${label}`,
      reload,
      notify,
    });
    setBusy(false);
  };
  const doPaid = async (enrollmentId, paid) => {
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

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-[rgba(22,25,29,0.85)] px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}?section=firms`)}
            aria-label="Back to firms"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconBack size={16} />
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          {/* The firm's colour moves to the firm name below, where it identifies
              something; in the logo slot it was standing in for the mark. */}
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
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>{firm.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {firms.map((t) => (
            <button
              key={t.number}
              onClick={() => t.number !== firmNo && router.push(`/instructor/${gameId}/firms/${t.number}`)}
              className={`rounded-[2px] px-2.5 py-1.5 ${MONO} text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                t.number === firmNo
                  ? "border border-[var(--amber-deep)] bg-[var(--amber)] text-[var(--graphite)]"
                  : "border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
              }`}
            >
              {t.name ?? `Firm ${t.number}`}
            </button>
          ))}
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="mx-auto max-w-[920px] space-y-7">
          <ViewHeader
            eyebrow="Firm"
            title={firm.name}
            subtitle={`${roster.length} member${roster.length === 1 ? "" : "s"} · currently in R${firm.current_week ?? "—"} · everything about this firm in one place.`}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/instructor/${gameId}/mimic/${firmNo}`)}
                  className={`rounded-[2px] border border-[var(--amber-deep)] px-3.5 py-2 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--amber)] transition hover:bg-[rgba(232,161,60,0.1)]`}
                >
                  Mimic
                </button>
                <button
                  onClick={() => router.push(`/instructor/${gameId}/kpis`)}
                  className={`rounded-[2px] border border-[var(--steel-line)] px-3.5 py-2 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--paper)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)]`}
                >
                  Engine state
                </button>
                <button
                  onClick={() => router.push(`/instructor/${gameId}?section=grading`)}
                  className={`rounded-[2px] bg-[var(--amber)] px-3.5 py-2 ${DISPLAY} text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052]`}
                >
                  Grading
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniInfo label="Standing" value={rank >= 0 && mine?.graded_count ? `#${rank + 1}` : "—"} sub={`of ${standings.length || firms.length} firms`} />
            <MiniInfo label="Total score" value={mine?.total_score ?? 0} sub={`avg ${mine?.average ?? 0}/round`} />
            <MiniInfo label="Trap flags" value={trapTotal} sub={trapTotal ? "across the run" : "clean so far"} />
            <MiniInfo label="Advisor time" value={`${mine?.advisor_hours ?? 0}h`} sub={mine?.advisor_billed > 0 ? fmtMoney(mine.advisor_billed) : "no charges"} />
          </div>

          {anchor && (
            <div className="rounded-[3px] border border-[var(--steel-line)] border-l-[3px] border-l-[var(--amber-deep)] bg-[var(--graphite-raised)] px-5 py-4">
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--amber)]`}>Coherence anchor</p>
              <p className="mt-1.5 line-clamp-2 text-[0.95rem] italic leading-relaxed text-[var(--paper)]">&ldquo;{anchor}&rdquo;</p>
            </div>
          )}

          {/* members — manage right here */}
          <div className={`overflow-hidden ${PANEL}`}>
            <div className="px-6 py-4">
              <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Members</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Move students between firms or settle payment without leaving this page.</p>
            </div>
            {roster.length === 0 ? (
              <p className="border-t border-[var(--steel-line)] px-6 py-6 text-sm text-[var(--muted)]">
                No students in this firm yet — assign some from the Firms section.
              </p>
            ) : (
              roster.map((s) => {
                const usage = usageById[s.id] ?? {};
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--steel-line)] px-6 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar text={initials(s.name)} />
                      <div className="min-w-0">
                        <p className="truncate text-[0.95rem] font-semibold">{s.name}</p>
                        <p className={`truncate ${MONO} text-[9.5px] text-[var(--muted-dim)]`}>
                          {s.email}
                          {(usage.advisor_hours ?? 0) > 0 && ` · advisor ${usage.advisor_hours}h${usage.advisor_billed > 0 ? ` (${fmtMoney(usage.advisor_billed)})` : ""}`}
                          {(usage.group_hours ?? 0) > 0 && ` · group ${usage.group_hours}h (${fmtMoney(usage.group_billed ?? 0)})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <select
                        className="h-8 w-[132px] rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-2 text-[0.75rem] text-[var(--paper)] outline-none transition duration-150 [color-scheme:dark] focus:border-[var(--blueprint)]"
                        value={firmNo}
                        onChange={(e) => doMove(s.enrollment_id, Number(e.target.value), firms.find((f) => f.number === Number(e.target.value))?.name)}
                        disabled={busy}
                        aria-label={`Move ${s.name}`}
                      >
                        <option value={0}>Unassign</option>
                        {firms.map((t) => (
                          <option key={t.number} value={t.number}>
                            {t.name ?? `Firm ${t.number}`}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => doPaid(s.enrollment_id, !s.paid)}
                        disabled={busy}
                        title={s.paid ? "Click to mark unpaid" : "Click to mark paid"}
                        className="rounded-[2px] transition hover:ring-2 hover:ring-[rgba(127,176,138,0.3)] disabled:opacity-50"
                      >
                        <Pill tone={s.paid ? "good" : "muted"}>{s.paid ? "Paid" : "Unpaid"}</Pill>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* week record */}
          <div className={`overflow-hidden ${PANEL}`}>
            <div className="px-6 py-4">
              <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Week record</h3>
            </div>
            {(firm.weeks ?? []).length === 0 ? (
              <p className="border-t border-[var(--steel-line)] px-6 py-6 text-sm text-[var(--muted)]">No weeks opened yet for this firm.</p>
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
                          .map(([k, v]) => `${DIM_SHORT[k] || k} ${v}`)
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

          {/* stakeholder snapshot */}
          <div className={`p-6 ${PANEL}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Stakeholder standing</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  How the room feels about this firm&apos;s CIO — the full engine state lives in Firm dashboards.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {Object.entries(rel).map(([k, v]) => (
                <SignedMeter key={k} name={STAKEHOLDERS[k] || human(k)} value={Number(v) || 0} scale={relScale} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}