"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// Two levels deeper than the detail page.
import { fetchMe, api, logout } from "../../../../../lib/api";

/* ================================================================== *
 * Mimic student view: /instructor/[id]/mimic/[firm]
 * The ENTIRE student cohort area — same sidebar, same six sections,
 * same layout — rendered exactly as that firm's students see it right
 * now, read-only under an unmissable amber banner:
 *   dashboard   — round, deadline, firm, week status, progress
 *   week        — briefing, artifacts, decision form (their answers when submitted)
 *   performance — the firm's graded record, student-shaped
 *   advisors    — the roster students see (conversations are per-student, so
 *                 chat itself stays private)
 *   schedule    — the round calendar
 *   debrief     — the engine's debrief, once the run is done
 * Backed by the mimic endpoint (built without the status-mutating
 * view_briefing) plus the firm insights endpoint for advisor hours.
 *
 * Dark console theme — and because the REAL student console is the dark
 * .dc-console theme, mimicking it faithfully means going further than the
 * instructor pages: the briefing and artifacts render as light PAPER
 * documents sitting on the graphite console (the student console's
 * signature two-material system), the sidebar is the student rail with
 * the amber active bar, and the round track speaks the arc-segment
 * language. The mimic banner itself is amber — the "special mode" color.
 * All data flow and the section routing unchanged.
 * ================================================================== */

const THEME = {
  "--graphite": "#16191D",
  "--graphite-raised": "#1E2228",
  "--graphite-high": "#252B32",
  "--steel-line": "#2C323A",
  "--steel-soft": "#363E48",
  "--paper": "#ECEFF2",
  "--paper-tint": "#E1E6EB",
  "--ink": "#14171B",
  "--ink-soft": "#3A424C",
  "--ink-faint": "#6B7580",
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
/* Light "paper" documents on the dark console — the student console's dossier material. */
const SHEET =
  "rounded-[3px] bg-[var(--paper)] text-[var(--ink)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";

/* ---- helpers (mirroring the student page) ---- */

function closesIn(endStr) {
  if (!endStr || endStr === "—") return null;
  const end = new Date(endStr);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return "deadline passed";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return `closes in ${d}d ${h}h`;
}
const fmtMoney = (n) => `$${Number(n ?? 0).toLocaleString()}`;

const ADVISOR_IMG_DIR = "/advisor";
const advisorImg = (a, variant = "open") =>
  a?.name ? `${ADVISOR_IMG_DIR}/${a.name.trim().replace(/\s+/g, "_")}_eyes_${variant}.png` : null;

function AdvisorAvatar({ advisor, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (failed || !advisorImg(advisor)) return;
    const closed = new Image();
    closed.src = advisorImg(advisor, "closed");
    let timer;
    let cancelled = false;
    const schedule = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => {
          if (!cancelled) setBlink(false);
          schedule();
        }, 140);
      }, 3500 + Math.random() * 3500);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [advisor, failed]);

  if (!advisorImg(advisor) || failed) {
    return (
      <span
        className={`grid flex-none place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${DISPLAY} font-bold text-[var(--amber)]`}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {(advisor?.name || "?")
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </span>
    );
  }
  return (
    <span className="relative flex-none overflow-hidden rounded-[2px] border border-[var(--steel-soft)]" style={{ width: size, height: size }}>
      <img src={advisorImg(advisor, "open")} alt={advisor.name} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: blink ? 0 : 1 }} />
      <img src={advisorImg(advisor, "closed")} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: blink ? 1 : 0 }} />
    </span>
  );
}

function StatusPill({ label, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1 ${MONO} text-[9px] uppercase tracking-[0.1em]`}
      style={{
        color: tone,
        borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`,
        background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {label}
    </span>
  );
}
function SegmentedRounds({ rounds }) {
  return (
    <div className="flex gap-1">
      {rounds.map((r) => {
        const active = r.status === "Active";
        const done = r.status === "Completed";
        return (
          <div
            key={r.n}
            className="h-2 min-w-[6px] flex-1 rounded-[1px]"
            style={
              active
                ? { background: "var(--amber)", boxShadow: "0 0 0 1px var(--amber-deep), 0 0 10px -1px var(--amber)" }
                : { background: done ? "var(--blueprint-deep)" : "var(--steel-line)" }
            }
            title={`Round ${r.n} · ${r.status}`}
          />
        );
      })}
    </div>
  );
}
function MiniInfo({ label, value, sub }) {
  return (
    <div className={`p-4 ${PANEL}`}>
      <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>{label}</p>
      <p className={`mt-1.5 ${DISPLAY} text-[1.3rem] font-bold leading-tight`}>{value}</p>
      {sub && <p className={`mt-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>{sub}</p>}
    </div>
  );
}
function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="border-b border-[var(--steel-line)] pb-5">
      {eyebrow && <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]`}>{eyebrow}</p>}
      <h1 className={`${DISPLAY} text-[2.1rem] font-bold leading-none`}>{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-[0.95rem] leading-[1.55] text-[var(--muted)]">{subtitle}</p>}
    </div>
  );
}
function Notice({ tone = "var(--amber)", children }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[3px] border bg-[var(--graphite-raised)] px-4 py-3"
      style={{ borderColor: `color-mix(in srgb, ${tone} 45%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: tone }} />
      <span className="text-[0.85rem] text-[var(--muted)]">{children}</span>
    </div>
  );
}
function IconBack({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const SECTIONS = [
  ["dashboard", "Dashboard"],
  ["week", "This Week"],
  ["performance", "Performance"],
  ["advisors", "Advisors"],
  ["schedule", "Schedule"],
  ["debrief", "Debrief"],
];
const DIM_LABELS = {
  strategic_judgment: "Strategy",
  execution_consequence: "Execution",
  coherence: "Coherence",
  deliverable_quality: "Deliverable",
};

/* ================================================================== *
 * Page shell
 * ================================================================== */

export default function MimicStudentViewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const rawFirm = params?.firm;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);
  const firmNo = Number(Array.isArray(rawFirm) ? rawFirm[0] : rawFirm);

  const [detail, setDetail] = useState(null);
  const [game, setGame] = useState(null); // mimic run payload
  const [firmInsights, setFirmInsights] = useState(null); // for advisor hours
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  const VALID = new Set(SECTIONS.map(([k]) => k));
  const rawSection = searchParams.get("section") ?? "dashboard";
  const section = VALID.has(rawSection) ? rawSection : "dashboard";
  const setSection = useCallback(
    (key) => {
      const next = VALID.has(key) ? key : "dashboard";
      const qs = next === "dashboard" ? "" : `?section=${next}`;
      router.replace(`/instructor/${gameId}/mimic/${firmNo}${qs}`, { scroll: false });
    },
    [router, gameId, firmNo] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const goFirm = (n) => {
    const qs = section === "dashboard" ? "" : `?section=${section}`;
    router.push(`/instructor/${gameId}/mimic/${n}${qs}`);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) router.replace("/login");
          return;
        }
        const [d, g, fi] = await Promise.all([
          api(`/instructor/simulations/${gameId}/`),
          api(`/instructor/simulations/${gameId}/firms/${firmNo}/run/`),
          api(`/instructor/simulations/${gameId}/firms/${firmNo}/insights/`),
        ]);
        if (!d.ok) throw new Error(`Request failed (${d.status})`);
        if (!g.ok) {
          const gj = await g.json().catch(() => ({}));
          throw new Error(gj.detail || `Request failed (${g.status})`);
        }
        if (alive) {
          setDetail(await d.json());
          setGame(await g.json());
          setFirmInsights(fi.ok ? await fi.json() : null);
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
  }, [gameId, firmNo, router]);

  if (phase !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't open the student view. ${error ?? ""}` : "Opening student view…"}
        </p>
      </div>
    );
  }

  const rounds = detail.rounds ?? [];
  const current = detail.current_round || 1;
  const total = detail.total_rounds || rounds.length || 0;
  const live = detail.deployment_status === "students";
  const status =
    current >= total && total > 0
      ? { label: "Completed", tone: "var(--muted)" }
      : live
        ? { label: "In progress", tone: "var(--ok)" }
        : { label: "Starting soon", tone: "var(--blueprint)" };
  const firms = (detail.firms ?? []).slice().sort((a, b) => a.number - b.number);
  const advisorHours = (firmInsights?.members ?? []).reduce((a, m) => a + (m.advisor_hours || 0), 0);
  const advisorBilled = (firmInsights?.members ?? []).reduce((a, m) => a + (m.advisor_billed || 0), 0);

  const ctx = { detail, game, rounds, current, total, status, setSection, advisorHours, advisorBilled };

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      {/* mimic banner — unmissable, so this is never mistaken for a real student session */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--amber-deep)] bg-[rgba(232,161,60,0.12)] px-7 py-2 backdrop-blur">
        <span className={`flex items-center gap-2 ${MONO} text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--amber)]`}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)] shadow-[0_0_8px_-1px_var(--amber)]" />
          Mimic — viewing as a {game.firm.name} student · read-only, nothing here touches their run
        </span>
        <div className="flex items-center gap-2">
          {firms.map((t) => (
            <button
              key={t.number}
              onClick={() => goFirm(t.number)}
              className={`rounded-[2px] px-2.5 py-1 ${MONO} text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                t.number === firmNo
                  ? "border border-[var(--amber-deep)] bg-[var(--amber)] text-[var(--graphite)]"
                  : "border border-[var(--amber-deep)] bg-transparent text-[var(--amber)] hover:bg-[rgba(232,161,60,0.12)]"
              }`}
            >
              {t.name ?? `Firm ${t.number}`}
            </button>
          ))}
          <button
            onClick={() => router.push(`/instructor/${gameId}?section=firms`)}
            className={`rounded-[2px] border border-[var(--amber)] px-2.5 py-1 ${MONO} text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--amber)] transition hover:bg-[rgba(232,161,60,0.15)]`}
          >
            Exit mimic
          </button>
        </div>
      </div>

      {/* student header, faithfully — the console bar */}
      <header className="flex items-center justify-between border-b border-[var(--steel-line)] bg-gradient-to-b from-[#1B1F25] to-[#15181C] px-7 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}?section=firms`)}
            aria-label="Back to firms"
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
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Student</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--paper)]`}>{detail.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {live && (
            <span className={`hidden items-center gap-1.5 rounded-[2px] border border-[var(--amber-deep)] px-3 py-1.5 ${MONO} text-[9.5px] uppercase tracking-[0.12em] text-[var(--amber)] md:inline-flex`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]" />
              R{current} {closesIn(rounds[current - 1]?.end) || "open"}
            </span>
          )}
          <span className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>{game.firm.name} student</span>
        </div>
      </header>

      <div className="flex">
        {/* the student rail */}
        <aside className="w-[220px] shrink-0 border-r border-[var(--steel-line)] bg-[#14171B] px-5 py-8">
          <p className={`mb-4 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Cohort</p>
          <nav className="flex flex-col gap-1">
            {SECTIONS.filter(([key]) => key !== "debrief" || game.debrief_available).map(([key, label]) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={`relative flex items-center justify-between px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                    active
                      ? "bg-[var(--graphite-raised)] font-medium text-[var(--paper)]"
                      : "text-[var(--muted)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]"
                  }`}
                >
                  {active && <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-[var(--amber)]" aria-hidden="true" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
          <p className={`mb-2 mt-8 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Your firm</p>
          <p className={`px-3 ${DISPLAY} text-[17px] font-semibold text-[var(--amber)]`}>{game.firm.name}</p>
          <p className={`mb-2 mt-5 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Round</p>
          <p className="px-3 text-[0.85rem] text-[var(--muted)]">
            R{Math.min(current, total || current)} of {total || "—"}
          </p>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-[860px]">
            {section === "dashboard" && <MimicDashboard {...ctx} />}
            {section === "week" && <MimicWeek {...ctx} />}
            {section === "performance" && <MimicPerformance {...ctx} />}
            {section === "advisors" && <MimicAdvisors {...ctx} />}
            {section === "schedule" && <MimicSchedule {...ctx} />}
            {section === "debrief" && <MimicDebrief {...ctx} />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Dashboard
 * ================================================================== */

function MimicDashboard({ detail, game, rounds, current, total, status, setSection, advisorHours, advisorBilled }) {
  const deadline = closesIn(rounds[current - 1]?.end);
  const week = game.week;
  const completed = rounds.filter((r) => r.status === "Completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const rate = detail.advisor_hourly_rate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className={`${DISPLAY} text-[2.4rem] font-bold leading-none`}>{detail.name}</h1>
        <StatusPill label={status.label} tone={status.tone} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Round" value={`R${Math.min(current, total || current)}`} sub={`of ${total}`} />
        <MiniInfo label="Deadline" value={deadline || "—"} sub="this round" />
        <MiniInfo label="Your firm" value={game.firm.name} sub={detail.tier || ""} />
        <MiniInfo
          label="This week"
          value={week.scored ? "Scored" : week.submitted ? "Submitted" : "Open"}
          sub={`week ${week.week_number}`}
        />
      </div>

      <div className={`p-6 ${PANEL}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Run progress</p>
          <p className={`${MONO} text-[1.3rem] font-semibold leading-none text-[var(--blueprint)]`}>{pct}%</p>
        </div>
        <div className="mt-3">
          <SegmentedRounds rounds={rounds} />
        </div>
      </div>

      {(rate > 0 || advisorHours > 0) && (
        <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] px-5 py-4">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>Advisor time (whole firm)</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This firm has used <strong className="text-[var(--paper)]">{advisorHours} hour{advisorHours === 1 ? "" : "s"}</strong>
            {advisorBilled > 0 && <> ({fmtMoney(advisorBilled)} accrued)</>}
            {rate > 0 && <> — advisor chat bills {fmtMoney(rate)} per started hour.</>}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setSection("week")}
          className="group flex items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 text-left transition hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]"
        >
          <div>
            <h3 className={`${DISPLAY} text-[17px] font-semibold`}>{week.submitted ? "Review this week" : "This week"}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {week.submitted ? "Their decisions are in — see what they sent." : "The briefing and decision form they're working from."}
            </p>
          </div>
          <span className="flex-none text-[var(--muted-dim)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--amber)]">→</span>
        </button>
        <button
          onClick={() => setSection("advisors")}
          className="group flex items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 text-left transition hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]"
        >
          <div>
            <h3 className={`${DISPLAY} text-[17px] font-semibold`}>Advisors</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {game.advisors?.length ?? 0} advisor{(game.advisors?.length ?? 0) === 1 ? "" : "s"} available for guidance.
            </p>
          </div>
          <span className="flex flex-none items-center">
            {(game.advisors ?? []).slice(0, 4).map((a, i) => (
              <span key={a.id} style={{ marginLeft: i ? -10 : 0, zIndex: 4 - i }} className="rounded-[2px] ring-2 ring-[var(--graphite-raised)]">
                <AdvisorAvatar advisor={a} size={30} />
              </span>
            ))}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * This Week — read-only, their answers when submitted.
 * The briefing and artifacts render as PAPER documents on the console,
 * exactly like the student dossier.
 * ================================================================== */

function MimicWeek({ game }) {
  const spec = game.decision_spec;
  const week = game.week;
  const submitted = game.submission?.structured_payload ?? {};
  const labelForChoice = (f, v) => {
    const hit = (f.choices ?? []).find((c) => (typeof c === "object" && c !== null ? c.value : c) === v);
    return hit ? (typeof hit === "object" ? hit.label ?? String(hit.value) : String(hit)) : String(v);
  };

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow={`Week ${week.week_number}`}
        title={game.briefing?.title || "This Week"}
        subtitle={
          week.scored
            ? "This firm's week is submitted and scored."
            : week.submitted
              ? "Submitted — their answers are shown in the form below."
              : "The live briefing this firm is working from right now."
        }
      />

      {week.submitted && (
        <Notice tone="var(--ok)">This week is in. {week.scored ? "It has been scored." : "It's waiting on a grade."}</Notice>
      )}

      {game.briefing?.body && (
        <div className={`overflow-hidden ${SHEET}`}>
          <div className="h-1 bg-[var(--amber)]" />
          <div className="p-7">
            <p className="whitespace-pre-wrap text-[1rem] leading-[1.7] text-[var(--ink)]">{game.briefing.body}</p>
            {(game.briefing.exec_reads?.length ?? 0) > 0 && (
              <div className="mt-5 border-t border-[#D4DAE0] pt-4">
                <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--ink-soft)]`}>Exec reads</p>
                {game.briefing.exec_reads.map((r, i) => (
                  <p key={i} className="mt-1.5 text-sm leading-[1.55] text-[var(--ink-soft)]">
                    {r}
                  </p>
                ))}
              </div>
            )}
            {(game.briefing.signals?.length ?? 0) > 0 && (
              <div className="mt-5 border-t border-[#D4DAE0] pt-4">
                <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--ink-soft)]`}>Signals</p>
                <div className="flex flex-wrap gap-1.5">
                  {game.briefing.signals.map((s, i) => (
                    <span key={i} className={`rounded-[2px] border border-[#D4DAE0] bg-[var(--paper-tint)] px-2.5 py-1 ${MONO} text-[10px] text-[var(--ink-soft)]`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(game.artifacts?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]`}>Artifacts</p>
          {game.artifacts.map((a, i) => (
            <details key={i} className={`px-5 py-4 ${SHEET}`}>
              <summary className={`cursor-pointer ${DISPLAY} text-[15px] font-semibold text-[var(--ink)]`}>
                {a.title} <span className={`ml-1 ${MONO} text-[9px] uppercase text-[var(--ink-faint)]`}>{a.kind}</span>
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">{a.body}</p>
            </details>
          ))}
        </div>
      )}

      <div className={`p-6 ${PANEL}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={`${DISPLAY} text-[19px] font-semibold`}>Decisions</h3>
          <span className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
            {week.submitted ? "their submitted answers" : "read-only preview"}
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {(spec?.fields ?? []).map((f) => {
            const val = submitted[f.key] ?? "";
            if (f.field_type === "boolean") {
              return (
                <label key={f.key} className="flex items-center gap-3 rounded-[2px] border border-[var(--steel-line)] px-4 py-3 opacity-90">
                  <input type="checkbox" checked={!!submitted[f.key]} disabled className="h-4 w-4 accent-[#E8A13C]" />
                  <span className="text-sm font-medium text-[var(--paper)]">{f.label}</span>
                </label>
              );
            }
            const label = (
              <span className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>
                {f.label} {f.required && <span className="text-[var(--amber)]">*</span>}
              </span>
            );
            if (f.choices?.length) {
              return (
                <div key={f.key}>
                  {label}
                  <div className="w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.9rem] text-[var(--paper)]">
                    {val === "" ? <span className="text-[var(--muted-dim)]">— not chosen —</span> : labelForChoice(f, val)}
                  </div>
                </div>
              );
            }
            const isLong = typeof val === "string" && val.length > 80;
            return (
              <div key={f.key}>
                {label}
                {isLong ? (
                  <p className="w-full whitespace-pre-wrap rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.88rem] leading-relaxed text-[var(--paper)]">{val}</p>
                ) : (
                  <div className="w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.9rem] text-[var(--paper)]">
                    {val === "" ? <span className="text-[var(--muted-dim)]">— empty —</span> : String(val)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <span className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>Deliverable</span>
          {spec?.deliverable_prompt && <p className="mb-2 text-sm text-[var(--muted)]">{spec.deliverable_prompt}</p>}
          {game.submission?.deliverable_text ? (
            <p className="w-full whitespace-pre-wrap rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.88rem] leading-relaxed text-[var(--paper)]">
              {game.submission.deliverable_text}
            </p>
          ) : (
            <div className={`w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-6 text-center ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
              Not written yet
            </div>
          )}
        </div>
        <p className={`mt-4 text-center ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>
          Mimic is read-only — grading and feedback live in the Grading section.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Performance — the firm's graded record, student-shaped
 * ================================================================== */

function MimicPerformance({ game }) {
  const data = game.performance ?? { weeks: [], graded_count: 0, average: 0, best: 0 };
  const weeks = data.weeks ?? [];
  const dimMax = Math.max(10, ...weeks.flatMap((w) => Object.values(w.scores)));

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Track record"
        title="Performance"
        subtitle="Exactly what this firm's students see: final instructor scores across the four dimensions, graded rounds only."
      />
      {weeks.length === 0 ? (
        <Notice tone="var(--blueprint)">Nothing graded yet — students see this same notice until you grade a submitted week.</Notice>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MiniInfo label="Graded rounds" value={data.graded_count} sub={`of ${weeks.length ? weeks[weeks.length - 1].week_number : 0} played`} />
            <MiniInfo label="Average" value={data.average} sub="per round" />
            <MiniInfo label="Best round" value={data.best} sub="total score" />
          </div>
          <div className="space-y-3">
            {weeks.map((w) => (
              <div key={w.week_number} className={`p-5 ${PANEL}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-[2px] border border-[#3f5e46] bg-[var(--graphite)] ${MONO} text-[10.5px] font-bold text-[var(--ok)]`}>
                      R{w.week_number}
                    </span>
                    <p className={`${DISPLAY} text-[17px] font-semibold`}>Round {w.week_number}</p>
                  </div>
                  <p className={`${DISPLAY} text-[1.5rem] font-bold leading-none`}>
                    {w.total}
                    {w.total === data.best && weeks.length > 1 && (
                      <span className={`ml-2 align-middle ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[var(--amber)]`}>best</span>
                    )}
                  </p>
                </div>
                <div className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {Object.entries(w.scores).map(([dim, value]) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className={`w-[86px] flex-none ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>{DIM_LABELS[dim] || dim}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-[1px] border border-[var(--steel-line)] bg-[var(--graphite)]">
                        <div className="h-full bg-[var(--blueprint-deep)]" style={{ width: `${Math.min(100, Math.max(0, (value / dimMax) * 100))}%` }} />
                      </div>
                      <span className={`w-6 flex-none text-right ${MONO} text-[0.72rem] font-bold text-[var(--paper)]`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== *
 * Advisors — the roster students see; conversations stay private
 * ================================================================== */

function MimicAdvisors({ detail, game }) {
  const advisors = game.advisors ?? [];
  const rate = detail.advisor_hourly_rate ?? 0;
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Guidance"
        title="Advisors"
        subtitle="Each advisor has their own expertise and their own agenda. This is the roster students pick from before submitting."
      />
      {rate > 0 && (
        <Notice>
          Students see this notice: advisor chat bills <strong className="text-[var(--paper)]">{fmtMoney(rate)} per started hour</strong> — the first
          message opens an hour, messages within it are covered.
        </Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {advisors.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-5 transition hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <AdvisorAvatar advisor={a} size={44} />
              <div className="min-w-0">
                <p className="truncate text-[0.95rem] font-semibold">{a.name}</p>
                <p className={`truncate ${MONO} text-[10px] text-[var(--muted)]`}>{a.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Notice tone="var(--blueprint)">
        Conversations are per-student and stay private to their sessions — mimic shows the roster, not the chats. Firm-level advisor hours
        are on the Dashboard; per-student usage is in Firm dashboards.
      </Notice>
    </div>
  );
}

/* ================================================================== *
 * Schedule
 * ================================================================== */

function MimicSchedule({ detail, rounds, current }) {
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Timeline"
        title="Schedule"
        subtitle={`${detail.total_rounds ?? rounds.length} rounds, paced from the start date. Deadlines shift if a round is extended.`}
      />
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--steel-line)]">
                {["Round", "Start", "End", "Status"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-left ${MONO} text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--muted-dim)] ${i === 0 ? "pl-6" : ""} ${i === 3 ? "pr-6" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => {
                const active = r.status === "Active";
                return (
                  <tr key={r.n} className={`border-b border-[var(--steel-line)] last:border-b-0 ${active ? "bg-[rgba(232,161,60,0.06)]" : ""}`}>
                    <td className={`py-3 pl-6 pr-3 ${DISPLAY} text-[16px] font-semibold ${active ? "text-[var(--amber)]" : ""}`}>
                      Round {r.n}
                      {r.extended_days > 0 && (
                        <span className={`ml-2 inline-flex items-center rounded-[2px] border border-[var(--amber-deep)] px-2 py-0.5 align-middle ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[var(--amber)]`}>
                          +{r.extended_days} day{r.extended_days === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted)]">{r.start ?? "—"}</td>
                    <td className="px-3 py-3 text-sm text-[var(--muted)]">{r.end ?? "—"}</td>
                    <td className="py-3 pl-3 pr-6">
                      <StatusPill
                        label={active && r.n === current ? `Active · ${closesIn(r.end) || "open"}` : r.status}
                        tone={active ? "var(--amber)" : r.status === "Completed" ? "var(--muted)" : "var(--blueprint)"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Debrief — the engine's payoff, shape-agnostic
 * ================================================================== */

function MimicDebrief({ game }) {
  if (!game.debrief_available || !game.debrief) {
    return (
      <div className="space-y-7">
        <SectionHeader eyebrow="Finale" title="Debrief" />
        <Notice tone="var(--blueprint)">The debrief unlocks once Week 14 is submitted — students don&apos;t see this section in their sidebar until then.</Notice>
      </div>
    );
  }
  const data = game.debrief;
  const entries = Object.entries(data || {});
  return (
    <div className="space-y-7">
      <SectionHeader eyebrow="Finale" title={data.title || "Debrief"} subtitle="How this firm's run played out — exactly the debrief their students read." />
      <div className="space-y-4">
        {entries
          .filter(([k]) => k !== "title")
          .map(([key, value]) => (
            <div key={key} className={`p-6 ${PANEL}`}>
              <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--amber)]`}>{key.replace(/_/g, " ")}</p>
              {typeof value === "string" || typeof value === "number" ? (
                <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-[var(--paper)]">{value}</p>
              ) : Array.isArray(value) ? (
                <div className="space-y-2">
                  {value.map((item, i) => (
                    <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                      {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
                    </p>
                  ))}
                </div>
              ) : (
                <pre className={`overflow-x-auto whitespace-pre-wrap ${MONO} text-[0.75rem] leading-relaxed text-[var(--muted)]`}>{JSON.stringify(value, null, 2)}</pre>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}