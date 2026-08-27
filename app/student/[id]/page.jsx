"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Intro from "./Intro";
import WeekConsole from "./WeekConsole";
import DebriefConsole from "./DebriefConsole";
import AdvisorsConsole from "./AdvisorsConsole";
import AdvisorAvatar from "./AdvisorAvatar";
import ExhibitsPage from "./exhibits/page";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// Adjust to wherever your api client lives.
import { fetchMe, api, logout } from "../../../lib/api";
import HelpButton from "../../_help/HelpButton";

/* ================================================================== *
 * Student cohort area: /student/[id]
 * Opens from the cohort list. Sidebar with everything a student can do,
 * landing on the Dashboard:
 *   dashboard — where you stand: round, deadline, firm, week status
 *   week      — the weekly loop: briefing, artifacts, decision form, submit
 *   advisors  — chat with any advisor (bills per started hour when priced)
 *   schedule  — the full round calendar
 *   debrief   — the Week 14 payoff, once available
 * Data comes from /student/simulations/ (cohort meta, rounds, billing)
 * and /run/ (the weekly game payload). Note: the backend resolves a
 * student's single run by team membership, so gameplay sections assume
 * one active cohort per student.
 *
 * Dark console theme. This shell wraps WeekConsole / AdvisorsConsole /
 * DebriefConsole / Intro, which are already console-native (they carry
 * their own .dc-console scope), so the chrome around them was the last
 * light surface a student ever saw. It now IS the console: console-bar
 * header, near-black rail with the amber active bar, arc-segment round
 * track, graphite panels. The vars below duplicate console.css exactly,
 * so this file's own chrome resolves them without depending on the
 * scope class; if your console components turn out to expect an ancestor
 * .dc-console instead of self-scoping, add that class to the root div —
 * the values are identical either way.
 *
 * Grammar: ok green = live, blueprint = starting soon / informational,
 * muted = completed, amber = the round you're in and every commit,
 * signal red = blocked (a gate fired on you). All routing, the run/gate
 * logic, and the one-time intro handling are unchanged.
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
const PANEL =
  "rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const GHOST = `rounded-[2px] border border-[var(--steel-line)] font-['IBM_Plex_Mono',ui-monospace,monospace] uppercase text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]`;

/* ---- helpers ---- */

function closesAt(round) {
  // Prefer the server's exact instant, which carries the cohort's UTC offset.
  // `end` alone is a bare date, and every client that parsed it landed on
  // midnight UTC — the previous evening in New York, the same morning in Delhi.
  const iso = round?.end_at || round?.end;
  if (!iso || iso === "\u2014") return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  if (end.getTime() - Date.now() <= 0) return "deadline passed";
  try {
    // Formatted in the cohort's own zone, and labelled with it, so nobody has
    // to work out whose midnight this is. The abbreviation follows daylight
    // saving on its own — EST in January, EDT in July.
    return `closes ${new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: round.timezone || undefined,
    }).format(end)}`;
  } catch {
    return `closes ${end.toLocaleString()}`;
  }
}
function statusOf(sim) {
  // Completed means the run is actually finished (marked COMPLETE or Week 14
  // submitted) — NOT current_round == total_rounds, which is just the final
  // round in play. The old >= check locked gameplay for all of round 14.
  if (sim.completed) return { label: "Completed", tone: "var(--muted, #8A94A0)", live: false };
  if (sim.deployment_status === "students") return { label: "In progress", tone: "var(--ok, #7FB08A)", live: true };
  return { label: "Starting soon", tone: "var(--blueprint, #5BA3C4)", live: false };
}
const fmtMoney = (n) => `$${Number(n ?? 0).toLocaleString()}`;

/* ---- shared bits (kept local so the student area stays decoupled) ---- */

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
function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--steel-line)] pb-5">
      <div className="min-w-0">
        {eyebrow && <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]`}>{eyebrow}</p>}
        <h1 className={`${DISPLAY} text-[2.1rem] font-bold leading-none`}>{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[0.95rem] leading-[1.55] text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}
function Notice({ tone = "var(--amber)", children }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[3px] border bg-[var(--graphite-raised)] px-4 py-3"
      style={{ borderColor: `color-mix(in srgb, ${tone} 45%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: tone, boxShadow: `0 0 8px -1px ${tone}` }} />
      <span className="text-[0.85rem] text-[var(--muted)]">{children}</span>
    </div>
  );
}

/* ---- icons ---- */
function Svg({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      {children}
    </svg>
  );
}
const IconBack = (p) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
const IconSend = (p) => <Svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Svg>;
const IconCheck = (p) => <Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>;
const IconArrow = (p) => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><path d="M13 6l6 6-6 6" /></Svg>;
const IconChat = (p) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
const IconSound = (p) => <Svg {...p}><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" /></Svg>;
const IconStop = (p) => <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Svg>;
const IconHelp = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>;

/* ================================================================== *
 * Page shell
 * ================================================================== */

// Sections that render the console shell (rail + stage) rather than plain
// prose. These need the width; the rest read better at a fixed measure.
const WIDE_SECTIONS = new Set(["week", "advisors", "exhibits", "debrief", "standings"]);

// Mirrors BENCHMARK_PHASE_WEEKS on the server. Used only to decide whether the
// Standings section is worth showing yet; the server decides what it contains.
const BENCHMARK_ROUNDS = [4, 8, 11, 14];

// Order matters: Advisors is used every week, Performance only occasionally,
// so Performance sits below it rather than above.
const SECTIONS = [
  ["dashboard", "Dashboard"],
  ["week", "This Week"],
  ["advisors", "Advisors"],
  ["performance", "Performance"],
  // Only appears once a checkpoint round exists. The reveal is staged as a
  // class moment, so it earns its own place rather than sitting under the
  // per-round scores where nobody would look for it — but an empty section
  // for the first three rounds would be worse than none.
  ["standings", "Standings"],
  ["exhibits", "Exhibits"],
  ["schedule", "Schedule"],
  ["debrief", "Debrief"],
];

export default function StudentCohortPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const cohortId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [profile, setProfile] = useState(null);
  const [sim, setSim] = useState(null); // this cohort's row from the list endpoint
  const [game, setGame] = useState(null); // /run/ payload, null when no firm yet
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // "Revisit tour" arrives as ?revisit=true, but the URL gets rewritten while the
  // cohort loads (the debrief auto-redirect below replaces the query string), which
  // would drop the flag before the intro ever gets a chance to render. Latch it on
  // the first render that sees it and keep it for the life of this mount.
  const revisitRef = useRef(false);
  if (searchParams.get("revisit") === "true") revisitRef.current = true;
  const revisit = revisitRef.current;

  // The opening sequence plays once per firm per browser; the flag survives refreshes.
  const introKey = `dc_intro_seen_${cohortId}`;
  const [introDone, setIntroDone] = useState(false);
  // Set by the sidebar's "Revisit tour" — replays the intro from inside the console
  // and drops back onto whatever section was open, rather than restarting at Week 1.
  const [replayTour, setReplayTour] = useState(false);
  useEffect(() => {
    try {
      // If revisiting the tour, ignore localStorage flag and show intro
      if (!revisit && localStorage.getItem(introKey)) {
        setIntroDone(true);
      }
    } catch {}
  }, [introKey, revisit]);

  // The active section lives in the URL so refresh and back/forward keep it.
  const VALID = new Set(SECTIONS.map(([k]) => k));
  const rawSection = searchParams.get("section") ?? "dashboard";
  const section = VALID.has(rawSection) ? rawSection : "dashboard";
  const setSection = useCallback(
    // `move` names a step inside This Week (brief | war | dec). It rides in the
    // URL so the war-room rail can send a student straight to the Decision.
    (key, move) => {
      const next = VALID.has(key) ? key : "dashboard";
      const params = [];
      if (next !== "dashboard") params.push(`section=${next}`);
      if (move) params.push(`move=${move}`);
      const qs = params.length ? `?${params.join("&")}` : "";
      router.replace(`/student/${cohortId}${qs}`, { scroll: false });
    },
    // VALID is module-derived and stable
    [router, cohortId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    // /run/ is scoped to this cohort so a student enrolled in several sims gets
    // the right one — the sims list is global, the run is per-cohort.
    const [simsRes, runRes] = await Promise.all([
      api("/student/simulations/"),
      api(`/run/?cohort=${cohortId}`),
    ]);
    if (!simsRes.ok) throw new Error(`Request failed (${simsRes.status})`);
    const rows = await simsRes.json();
    const mine = (Array.isArray(rows) ? rows : []).find((r) => r.id === cohortId);
    if (!mine) throw new Error("You are not enrolled in this cohort.");
    setSim(mine);
    // /run/ 404s until the student is placed in a firm — that's a state, not an error.
    const run = runRes.ok ? await runRes.json() : null;
    setGame(run);
    return run;
  }, [cohortId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (user.is_instructor) {
          if (alive) {
            setPhase("redirect");
            router.replace("/instructor");
          }
          return;
        }
        const pr = await api("/me/profile/");
        if (pr.ok && alive) setProfile(await pr.json());
        const run = await load();
        if (alive) {
          // The run is over and the payoff is ready: land on the debrief —
          // but only when the URL doesn't already name a section, and never over
          // a tour revisit. A refresh on a chosen view stays put.
          if (run?.debrief_available && !revisit && !searchParams.get("section")) setSection("debrief");
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

  const finishTour = useCallback(() => {
    try { localStorage.setItem(introKey, "1"); } catch {}
    setIntroDone(true);
    // A replay came from somewhere inside the console, so put them back there.
    // The first-run tour hands off to Week 1, which is the point of it — unless
    // there is no run yet, in which case the student is still waiting on a firm
    // and Week 1 is an empty locked screen.
    if (replayTour) setReplayTour(false);
    else if (game) setSection("week");
  }, [game, introKey, replayTour, setSection]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  if (phase !== "ready" || !sim) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error" ? `Couldn't open this cohort. ${error ?? ""}` : phase === "redirect" ? "Redirecting…" : "Loading cohort…"}
        </p>
      </div>
    );
  }

  const status = statusOf(sim);
  const rounds = sim.rounds ?? [];
  const current = sim.current_round || 1;
  const playable = status.live && sim.paid !== false && !sim.blocked && !!game;
  const gated = sim.blocked || sim.paid === false;
  const headerName = profile?.first_name?.trim() || profile?.email || "Student";
  const weekMove = searchParams.get("move") || null;
  const sectionProps = {
    sim, game, cohortId, rounds, current, status, playable, gated, reload, notify,
    setSection, weekMove, onRevisitTour: () => setReplayTour(true),
  };

  // Once the instructor finalizes the run, the sim is over: the only thing left
  // for the student is the debrief, so the rest of the sidebar is hidden and the
  // view is pinned to it regardless of what was last open.
  const completed = game?.run?.status === "COMPLETE";

  // Enrolled, but no firm yet. Accepting an invite no longer auto-places a
  // student — an instructor allocates firms — so there is a real gap between
  // joining and playing. There is no run behind them in that gap, so there is
  // no week, no briefing and no advisors: the tour is the whole of what they
  // can do, and the console pins itself to that.
  const awaitingFirm = !game && !sim.firm;
  const displaySection = completed ? "debrief" : awaitingFirm ? "dashboard" : section;

  // A fresh firm gets the narrative rollout before Week 1 — once.
  // Or on demand: the "Revisit tour" buttons (?revisit=true, or the sidebar),
  // regardless of round or completion.
  // Or while waiting on a firm, where it is the only thing there is to see —
  // and that case has no `game`, which is why this is not gated on one.
  const firstRunTour = playable && game?.week && current === 1 && !game.week.submitted;
  if (replayTour || (!introDone && (revisit || awaitingFirm || firstRunTour))) {
    return <Intro onDone={finishTour} />;
  }

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-gradient-to-b from-[#1B1F25] to-[#15181C] px-7 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push("/student")}
            aria-label="Back to your cohorts"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconBack size={16} />
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <div className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </div>
          {/* Secondary chrome — your role, your tier, and which cohort you're in. */}
          <span className="hidden h-[18px] w-px flex-shrink-0 bg-[var(--steel-line)] sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className={`flex-shrink-0 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>
              Student{sim.tier ? ` · ${sim.tier}` : ""}
            </span>
            <span className={`truncate ${DISPLAY} text-[15px] font-semibold text-[var(--paper)]`}>{sim.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status.live && (
            <span
              className={`hidden items-center gap-1.5 rounded-[2px] border border-[var(--amber-deep)] px-3 py-1.5 ${MONO} text-[9.5px] uppercase tracking-[0.12em] text-[var(--amber)] md:inline-flex`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]" />
              R{current} {closesAt(rounds[current - 1]) || "open"}
            </span>
          )}
          <span className={`hidden max-w-[200px] truncate ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] sm:inline`}>
            {headerName}
          </span>
          <HelpButton exitLabel={displaySection === "advisors" ? "Back to the war room" : "Close"} />
          <button onClick={signOut} className={`px-4 py-2 text-[10.5px] font-semibold tracking-[0.14em] ${GHOST}`}>
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-[220px] shrink-0 border-r border-[var(--steel-line)] bg-[#14171B] px-5 py-8">
          <p className={`mb-4 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Cohort</p>
          <nav className="flex flex-col gap-1">
            {SECTIONS.filter(([key]) => {
              if (completed) return key === "debrief" || key === "standings";
              if (awaitingFirm) return key === "dashboard";
              // Checkpoints land after rounds 4, 8, 11 and 14. Before the
              // first one there is nothing to show, and an empty section is
              // worse than no section.
              if (key === "standings") return current >= BENCHMARK_ROUNDS[0];
              return key !== "debrief" || game?.debrief_available;
            }).map(([key, label]) => {
              const active = displaySection === key;
              const locked = (key === "week" || key === "advisors") && !playable;
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
                  {locked && <span className={`${MONO} text-[8.5px] uppercase text-[var(--muted-dim)]`}>🔒</span>}
                </button>
              );
            })}
            {/* Not a section — replays the opening tour in place, then returns here. */}
            {game && (
              <button
                onClick={() => setReplayTour(true)}
                className="mt-2 flex items-center gap-2 border-t border-[var(--steel-line)] px-3 pb-2.5 pt-4 text-left text-[0.92rem] text-[var(--muted)] transition-colors hover:text-[var(--paper)]"
              >
                <IconHelp size={14} />
                <span>Revisit tour</span>
              </button>
            )}
          </nav>
          <p className={`mb-2 mt-8 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Your firm</p>
          <p className={`px-3 ${DISPLAY} text-[17px] font-semibold ${sim.firm ? "text-[var(--amber)]" : "text-[var(--muted-dim)]"}`}>
            {sim.firm || "Not assigned yet"}
          </p>
          <p className={`mb-2 mt-5 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Round</p>
          <p className="px-3 text-[0.85rem] text-[var(--muted)]">
            R{Math.min(current, sim.total_rounds || current)} of {sim.total_rounds ?? "—"}
          </p>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          {/* Prose views read best at a fixed measure; the console views carry
              their own rail plus a two-column layout inside, so 860px squeezed
              them into the middle of a much wider screen — the war-room bench
              and conversation ended up sharing ~270px. They get the room. */}
          <div className={`mx-auto ${WIDE_SECTIONS.has(displaySection) ? "max-w-[1440px]" : "max-w-[860px]"}`}>
            {displaySection === "dashboard" && <DashboardView {...sectionProps} />}
            {displaySection === "week" && <WeekConsole {...sectionProps} />}
            {displaySection === "performance" && <PerformanceView {...sectionProps} />}
            {displaySection === "standings" && <StandingsView {...sectionProps} />}
            {displaySection === "advisors" && <AdvisorsConsole {...sectionProps} />}
            {/* Students get exhibits up to their current week only, and never
                the design notes — those name every trap in the course. */}
            {displaySection === "exhibits" && (
              <ExhibitsPage currentWeek={current} showDesignNotes={false} />
            )}
            {displaySection === "schedule" && <ScheduleView {...sectionProps} />}
            {displaySection === "debrief" && <DebriefConsole {...sectionProps} />}
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * Dashboard — where this cohort stands for you, right now
 * ================================================================== */

function DashboardView({ sim, game, rounds, current, status, playable, gated, setSection, onRevisitTour }) {
  const deadline = closesAt(rounds[current - 1]);
  const week = game?.week;
  const total = sim.total_rounds || rounds.length || 0;
  const completed = rounds.filter((r) => r.status === "Completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className={`${DISPLAY} text-[2.4rem] font-bold leading-none`}>{sim.name}</h1>
        <StatusPill label={status.label} tone={status.tone} />
      </div>

      {sim.blocked && (
        <Notice tone="var(--signal-red)">Your access to this cohort has been paused by your instructor.</Notice>
      )}
      {!sim.blocked && sim.paid === false && (
        <Notice>Your payment is still outstanding — gameplay unlocks once it clears.</Notice>
      )}
      {!game && !sim.firm && (
        <div className="rounded-[3px] border border-[var(--blueprint)] bg-[var(--graphite-raised)] px-6 py-5">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--blueprint)]`}>
            Waiting on a firm
          </p>
          <h2 className={`mt-2 ${DISPLAY} text-[1.5rem] font-semibold leading-tight`}>
            You&rsquo;re enrolled, but not yet placed
          </h2>
          <p className="mt-2 max-w-2xl text-[0.92rem] leading-[1.6] text-[var(--muted)]">
            Your instructor assigns firms once the roster settles. Until then there is no
            briefing, no war room and no decision to make &mdash; the simulation opens the
            moment you&rsquo;re placed.
          </p>
          <p className="mt-3 max-w-2xl text-[0.92rem] leading-[1.6] text-[var(--muted)]">
            Meanwhile the opening tour is worth your time: it explains how a week works, and
            you only get one first read of it.
          </p>
          <button
            onClick={onRevisitTour}
            className={`mt-4 inline-flex items-center gap-2 rounded-[2px] bg-[var(--amber)] px-5 py-2.5 ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.05em] text-[var(--graphite)] transition hover:bg-[#F0B052]`}
          >
            Watch the tour
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Round" value={`R${Math.min(current, total || current)}`} sub={`of ${total}`} />
        <MiniInfo label="Deadline" value={deadline || "—"} sub="this round" />
        <MiniInfo label="Your firm" value={sim.firm || "—"} sub={sim.tier || ""} />
        <MiniInfo
          label="This week"
          value={week ? (week.scored ? "Scored" : week.submitted ? "Submitted" : "Open") : "—"}
          sub={week ? `week ${week.week_number}` : "no run yet"}
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

      {(sim.advisor_hourly_rate > 0 || sim.advisor_hours > 0) && (
        <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] px-5 py-4">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>Advisor time</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            You&apos;ve used{" "}
            <strong className="text-[var(--paper)]">
              {sim.advisor_hours ?? 0} hour{(sim.advisor_hours ?? 0) === 1 ? "" : "s"}
            </strong>
            {sim.advisor_due > 0 && <> ({fmtMoney(sim.advisor_due)} accrued)</>}
            {sim.advisor_hourly_rate > 0 && <> — advisor chat bills {fmtMoney(sim.advisor_hourly_rate)} per started hour.</>}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => playable && setSection("week")}
          disabled={!playable}
          className="group flex items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 text-left transition hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--steel-line)] disabled:hover:bg-[var(--graphite-raised)]"
        >
          <div>
            <h3 className={`${DISPLAY} text-[17px] font-semibold`}>{week?.submitted ? "Review this week" : "Play this week"}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {week?.submitted ? "Your decisions are in — see what you sent." : "Read the briefing and lock in your decisions."}
            </p>
          </div>
          <span className="flex-none text-[var(--muted-dim)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--amber)]">
            <IconArrow size={18} />
          </span>
        </button>
        <button
          onClick={() => playable && setSection("advisors")}
          disabled={!playable}
          className="group flex items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 text-left transition hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--steel-line)] disabled:hover:bg-[var(--graphite-raised)]"
        >
          <div>
            <h3 className={`${DISPLAY} text-[17px] font-semibold`}>Talk to an advisor</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {game?.advisors?.length ?? 0} advisor{(game?.advisors?.length ?? 0) === 1 ? "" : "s"} available for guidance on your decisions.
            </p>
          </div>
          <span className="flex flex-none items-center">
            {(game?.advisors ?? []).slice(0, 4).map((a, i) => (
              <span key={a.id} style={{ marginLeft: i ? -10 : 0, zIndex: 4 - i }} className="rounded-[2px] ring-2 ring-[var(--graphite-raised)]">
                <AdvisorAvatar advisor={a} size={30} />
              </span>
            ))}
            {(game?.advisors?.length ?? 0) === 0 && (
              <span className="text-[var(--muted-dim)]">
                <IconChat size={18} />
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Performance — the firm's graded rounds so far
 * ================================================================== */

// Full names, matching the grade modal and the rubrics handed out in class.
// "Strategy" and "Strategic judgment" are not quite the same idea, and students
// comparing the screen to their rubric should see one set of names.
const DIM_LABELS = {
  strategic_judgment: "Strategic judgment",
  execution_consequence: "Execution consequence",
  coherence: "Coherence",
  deliverable_quality: "Deliverable quality",
};

/* A score that can be negative, drawn from a centre line.
 *
 * The previous bar set width to (value / max) * 100%, which for a negative
 * value is an invalid CSS width — so it fell back to auto and the div filled
 * its track. A student's worst round was drawn as their longest bar. Negative
 * scores are normal in this model, so they get their own side and their own
 * colour rather than being a rendering accident. */
function ScoreBar({ value, scale }) {
  const v = Number(value) || 0;
  const pct = Math.min(50, (Math.abs(v) / Math.max(1, scale)) * 50);
  const positive = v >= 0;
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-[1px] border border-[var(--steel-line)] bg-[var(--graphite)]">
      <span className="absolute left-1/2 top-0 h-full w-px bg-[var(--steel-soft)]" aria-hidden="true" />
      {v !== 0 && (
        <span
          className="absolute top-0 h-full"
          style={{
            left: positive ? "50%" : `${50 - pct}%`,
            width: `${pct}%`,
            background: positive ? "var(--blueprint-deep)" : "var(--amber)",
          }}
        />
      )}
    </div>
  );
}

function PerformanceView({ game, cohortId }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState(game ? "loading" : "norun");

  useEffect(() => {
    if (!game) return;
    let alive = true;
    (async () => {
      try {
        const r = await api(`/student/performance/?cohort=${cohortId}`);
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        const j = await r.json();
        if (alive) {
          setData(j);
          setState("ready");
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [game, cohortId]);

  if (state === "norun") {
    return (
      <div className="space-y-7">
        <SectionHeader eyebrow="Track record" title="Performance" />
        <Notice tone="var(--blueprint)">Your firm&apos;s graded rounds will show here once you&apos;re placed and playing.</Notice>
      </div>
    );
  }
  if (state !== "ready") {
    return (
      <div className="space-y-7">
        <SectionHeader eyebrow="Track record" title="Performance" />
        <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
          {state === "error" ? "Couldn't load performance — try again shortly." : "Loading your firm's record…"}
        </p>
      </div>
    );
  }

  const weeks = data.weeks ?? [];
  // Bars scale against the run's own peak so early rounds still read; 10 is
  // the nominal per-dimension ceiling.
  // Magnitude, so a run of negatives scales the same as a run of positives.
  const dimMax = Math.max(5, ...weeks.flatMap((w) => Object.values(w.scores).map((v) => Math.abs(Number(v) || 0))));

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Track record"
        title="Performance"
        subtitle="Your firm's graded rounds — final instructor scores across the four dimensions, and the written feedback where your instructor left it. Everyone in your firm sees the same record."
      />

      {/* At a checkpoint round, standings are held until every firm has been
          graded. Without saying so, "no standings" is indistinguishable from
          "broken" — which produces exactly the questions the withholding was
          meant to prevent. Says only that it is pending: which firms are
          behind is not a student's business. */}
      {weeks.length === 0 ? (
        <Notice tone="var(--blueprint)">
          Nothing graded yet. Scores appear here once your instructor grades a submitted week — submitted rounds show as
          &ldquo;waiting on grade&rdquo; in This Week until then.
        </Notice>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MiniInfo label="Graded rounds" value={data.graded_count} sub={`of ${weeks.length ? weeks[weeks.length - 1].week_number : 0} played`} />
            <MiniInfo label="Average" value={data.average} sub="per round" />
            <MiniInfo label="Highest round" value={data.best} sub="total score" />
          </div>

          <div className="space-y-3">
            {weeks.map((w) => (
              <div key={w.week_number} className={`p-5 ${PANEL}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-[2px] border border-[#3f5e46] bg-[var(--graphite)] ${MONO} text-[10.5px] font-bold text-[var(--ok)]`}
                    >
                      R{w.week_number}
                    </span>
                    <p className={`${DISPLAY} text-[17px] font-semibold`}>Round {w.week_number}</p>
                  </div>
                  <p className={`${DISPLAY} text-[1.5rem] font-bold leading-none`}>
                    {w.total}
                    {w.total === data.best && weeks.length > 1 && (
                      <span className={`ml-2 align-middle ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[var(--amber)]`}>
                        highest
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {Object.entries(w.scores).map(([dim, value]) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className={`w-[132px] flex-none ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                        {DIM_LABELS[dim] || dim}
                      </span>
                      <ScoreBar value={value} scale={dimMax} />
                      <span
                        className={`w-7 flex-none text-right ${MONO} text-[0.72rem] font-bold ${
                          value > 0 ? "text-[var(--paper)]" : value < 0 ? "text-[var(--amber)]" : "text-[var(--muted-dim)]"
                        }`}
                      >
                        {value > 0 ? `+${value}` : value}
                      </span>
                    </div>
                  ))}
                </div>
                {/* The numbers say what happened; this says why. Only shown when
                    the instructor actually published something. */}
                {w.feedback && (
                  <div className="mt-4 border-t border-[var(--steel-line)] pt-4">
                    <p className={`${MONO} text-[8.5px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
                      From your instructor
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[0.92rem] leading-[1.75] text-[var(--paper)]">
                      {w.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


/* ================================================================== *
 * Standings — the benchmark reveal
 * ================================================================== */

function StandingsView({ game, cohortId }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api(`/student/performance/?cohort=${cohortId}`);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (alive) {
          setData(j);
          setState("ready");
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [cohortId]);

  if (state !== "ready") {
    return (
      <p className={`${MONO} text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
        {state === "error" ? "Couldn't load standings — try again shortly." : "Loading standings…"}
      </p>
    );
  }

  const released = data.standings ?? [];

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Checkpoint"
        title="Standings"
        subtitle="How the cohort's firms compare at each checkpoint. Standings are published only once every firm's round is graded, and released by your instructor."
      />

      {data.benchmark?.status === "pending" && (
        <Notice tone="var(--amber)">
          Round {data.benchmark.after_week} benchmark standings publish once every firm&rsquo;s round is
          graded. They are not out yet.
        </Notice>
      )}
      {data.benchmark?.status === "awaiting_release" && (
        <Notice tone="var(--amber)">
          Round {data.benchmark.after_week} is graded across the cohort. Your instructor will release
          the standings — usually in class.
        </Notice>
      )}

      {/* Released benchmarks, oldest first. All of them, not just the latest:
          the Week 8 discussion turns on comparing against Benchmark 1, and a
          table seen once in class is useless if it cannot be looked up again. */}
      {(data.standings?.length ?? 0) > 0 && (
        <div className="space-y-4">
          {data.standings.map((b) => (
            <div key={b.after_week} className={`overflow-hidden ${PANEL}`}>
              <div className="border-b border-[var(--steel-line)] px-6 py-4">
                <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>
                  {b.after_week === 14 ? "Final reckoning" : "Checkpoint"}
                </p>
                <h3 className={`mt-1 ${DISPLAY} text-[19px] font-semibold leading-tight`}>
                  Standings after Round {b.after_week}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--steel-line)]">
                      {["#", "Firm", "Score", "What showed"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-3 py-3 text-left ${MONO} text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--muted-dim)] ${
                            i === 0 ? "pl-6" : ""
                          } ${i === 3 ? "pr-6" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.standings.map((row) => {
                      const mine = row.team_name === b.your_firm;
                      return (
                        <tr
                          key={row.rank}
                          className={`border-b border-[var(--steel-line)] last:border-b-0 ${
                            mine ? "bg-[rgba(232,161,60,0.07)]" : ""
                          }`}
                        >
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
                          <td className={`px-3 py-3 ${DISPLAY} text-[15px] font-semibold`}>
                            {row.team_name}
                            {mine && (
                              <span className={`ml-2 ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--amber)]`}>
                                your firm
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-3 ${MONO} text-[0.85rem] font-bold`}>{row.benchmark_score}</td>
                          <td className="px-3 py-3 pr-6">
                            <div className="flex flex-wrap gap-1.5">
                              {(row.visible_strengths ?? []).map((v, i) => (
                                <span
                                  key={`s${i}`}
                                  className={`rounded-[2px] border border-[#3f5e46] px-1.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.06em] text-[var(--ok)]`}
                                >
                                  {v}
                                </span>
                              ))}
                              {(row.visible_weaknesses ?? []).map((v, i) => (
                                <span
                                  key={`w${i}`}
                                  className={`rounded-[2px] border border-[var(--amber-deep)] px-1.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.06em] text-[var(--amber)]`}
                                >
                                  {v}
                                </span>
                              ))}
                              {!(row.visible_strengths?.length || row.visible_weaknesses?.length) && (
                                <span className={`${MONO} text-[9px] text-[var(--muted-dim)]`}>&mdash;</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {released.length === 0 && !data.benchmark && (
        <Notice tone="var(--blueprint)">
          Standings appear after checkpoint rounds — 4, 8, 11 and 14. Nothing to show yet.
        </Notice>
      )}
    </div>
  );
}

/* ================================================================== *
 * Schedule — the round calendar
 * ================================================================== */

function ScheduleView({ sim, rounds, current }) {
  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="Timeline"
        title="Schedule"
        subtitle={`${sim.total_rounds ?? rounds.length} rounds, paced from the start date. Deadlines shift if your instructor extends a round.`}
      />
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--steel-line)]">
                {["Round", "Start", "End", "Status"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-left ${MONO} text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--muted-dim)] ${
                      i === 0 ? "pl-6" : ""
                    } ${i === 3 ? "pr-6" : ""}`}
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
                  <tr
                    key={r.n}
                    className={`border-b border-[var(--steel-line)] last:border-b-0 ${active ? "bg-[rgba(232,161,60,0.06)]" : ""}`}
                  >
                    <td className={`py-3 pl-6 pr-3 ${DISPLAY} text-[16px] font-semibold ${active ? "text-[var(--amber)]" : ""}`}>
                      Round {r.n}
                      {r.extended_days > 0 && (
                        <span
                          className={`ml-2 inline-flex items-center rounded-[2px] border border-[var(--amber-deep)] px-2 py-0.5 align-middle ${MONO} text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[var(--amber)]`}
                        >
                          +{r.extended_days} day{r.extended_days === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted)]">{r.start ?? "—"}</td>
                    <td className="px-3 py-3 text-sm text-[var(--muted)]">{r.end ?? "—"}</td>
                    <td className="py-3 pl-3 pr-6">
                      <StatusPill
                        label={active && r.n === current ? `Active · ${closesAt(r) || "open"}` : r.status}
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