"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// Adjust to wherever your api client lives.
import { fetchMe, api, logout } from "../../lib/api";
import HelpButton from "../_help/HelpButton";

/* ================================================================== *
 * Student home: /student
 * Lands here after login. First login (account created from an email
 * invite, so no name yet): shows a one-time profile form and saves it
 * to /me/profile/. Once a name exists, lists every cohort the student
 * is enrolled in, with round progress, firm, payment state, and the
 * deadline for the round that's currently open.
 *
 * playPath() is the route into the actual simulation — point it at
 * your game screen.
 *
 * Dark console theme, fully native — this is the first screen a
 * student sees after login, so it wears the same console they play
 * in. Grammar: status tones (ok = in progress, blueprint = starting
 * soon, muted = completed) drive each card's left edge; Continue is
 * an amber commit; the arc-segment round track matches the console
 * bar. Blocked access is signal red (a gate fired on them), while
 * pending payment is amber (waiting on resolution). All data flow,
 * the one-time profile gate, and enterable logic unchanged.
 * ================================================================== */

const LIST_PATH = "/student/simulations/";
const PROFILE_PATH = "/me/profile/";
const playPath = (id) => `/student/${id}`;

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
const COMMIT = `flex items-center gap-2 rounded-[2px] bg-[var(--amber)] font-['Saira_Condensed',sans-serif] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50 disabled:hover:bg-[var(--amber)]`;
const GHOST = `rounded-[2px] border border-[var(--steel-line)] font-['IBM_Plex_Mono',ui-monospace,monospace] uppercase text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]`;
const INPUT =
  "w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2 text-[0.9rem] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:shadow-[0_0_0_3px_rgba(91,163,196,0.15)]";

/* ---- small local helpers ---- */

function deriveRounds(sim) {
  const total = sim.total_rounds || 0;
  const current = sim.current_round || 1;
  const days = sim.days_per_round || 7;
  const base = sim.start_date ? new Date(`${sim.start_date}T00:00:00Z`) : null;
  const rows = [];
  for (let n = 1; n <= total; n++) {
    let end = null;
    if (base) {
      const e = new Date(base);
      e.setUTCDate(e.getUTCDate() + n * days);
      end = e.toISOString();
    }
    rows.push({ n, end, status: n < current ? "Completed" : n === current ? "Active" : "Upcoming" });
  }
  return rows;
}
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

function IconArrow({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
function IconBook({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconUser({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconHelp({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/* ---- one-time profile form, shown until a first name is saved ---- */

function ProfileSetup({ profile, onSaved }) {
  const [first, setFirst] = useState(profile.first_name || "");
  const [last, setLast] = useState(profile.last_name || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  async function save(e) {
    e.preventDefault();
    if (!first.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api(PROFILE_PATH, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: first.trim(), last_name: last.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      onSaved(j);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] pt-10">
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="flex items-start gap-3 border-b border-[var(--steel-line)] px-6 py-5">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] text-[var(--amber)]">
            <IconUser size={19} />
          </span>
          <div>
            <h1 className={`${DISPLAY} text-[20px] font-semibold leading-tight`}>Complete your profile</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">Tell us your name so your instructor and teammates can recognize you.</p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4 px-6 py-5">
          <div>
            <label className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>Email</label>
            <input
              type="email"
              value={profile.email || profile.username}
              disabled
              className="w-full rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-high)] px-3.5 py-2 text-[0.9rem] text-[var(--muted)] outline-none"
            />
          </div>
          <div>
            <label htmlFor="first-name" className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>
              First name <span className="text-[var(--amber)]">*</span>
            </label>
            <input
              id="first-name"
              ref={firstRef}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              maxLength={150}
              placeholder="Priya"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="last-name" className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>
              Last name
            </label>
            <input id="last-name" value={last} onChange={(e) => setLast(e.target.value)} maxLength={150} placeholder="Sharma" className={INPUT} />
          </div>
          {err && <p className="text-sm text-[var(--signal-red)]">{err}</p>}
          <button type="submit" disabled={!first.trim() || busy} className={`w-full justify-center px-4 py-2.5 text-[14px] ${COMMIT}`}>
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
      <p className={`mt-4 text-center ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
        You can only do this once here — ask your instructor to fix typos later.
      </p>
    </div>
  );
}

/* ================================================================== *
 * Page
 * ================================================================== */

export default function StudentHomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [sims, setSims] = useState([]);
  // loading -> profile (name missing) -> ready | error | redirect
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  const loadSims = useCallback(async () => {
    const res = await api(LIST_PATH);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const rows = await res.json();
    setSims(Array.isArray(rows) ? rows : rows.results ?? []);
  }, []);

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
        const pr = await api(PROFILE_PATH);
        if (!pr.ok) throw new Error(`Request failed (${pr.status})`);
        const prof = await pr.json();
        if (!alive) return;
        setProfile(prof);
        if (!prof.name_set) {
          // First login: collect a name before showing anything else.
          setPhase("profile");
          return;
        }
        await loadSims();
        if (alive) setPhase("ready");
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
  }, [loadSims, router]);

  const onProfileSaved = useCallback(
    async (prof) => {
      setProfile(prof);
      try {
        await loadSims();
        setPhase("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase("error");
      }
    },
    [loadSims]
  );

  function signOut() {
    logout();
    router.replace("/login");
  }

  function startTour(simId, simName) {
    // Clear the intro flag so it shows again when entering the simulation
    try {
      localStorage.removeItem(`dc_intro_seen_${simId}`);
    } catch (e) {
      // Ignore localStorage errors
    }
    // Navigate to the simulation to trigger the intro, with revisit flag to bypass round check
    router.push(`${playPath(simId)}?revisit=true`);
  }

  if (phase === "loading" || phase === "redirect" || phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error"
            ? `Couldn't load your cohorts. ${error ?? ""}`
            : phase === "redirect"
              ? "Redirecting…"
              : "Loading your cohorts…"}
        </p>
      </div>
    );
  }

  const firstName = profile?.first_name?.trim() || null;
  const headerName = firstName || profile?.email || profile?.username || "Student";
  const active = sims.filter((s) => statusOf(s).live).length;

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-gradient-to-b from-[#1B1F25] to-[#15181C] px-7 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <div className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </div>
          {/* Secondary chrome — role only here; this page spans every cohort. */}
          <span className="hidden h-[18px] w-px flex-shrink-0 bg-[var(--steel-line)] sm:block" aria-hidden="true" />
          <span className={`hidden ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)] sm:inline`}>
            Student
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden max-w-[220px] truncate ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] sm:inline`}>
            {headerName}
          </span>
          <HelpButton />
          <button onClick={signOut} className={`px-4 py-2 text-[10.5px] font-semibold tracking-[0.14em] ${GHOST}`}>
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 py-10">
        {phase === "profile" ? (
          <ProfileSetup profile={profile} onSaved={onProfileSaved} />
        ) : (
          <div className="mx-auto max-w-[860px] space-y-7">
            <div className="border-b border-[var(--steel-line)] pb-5">
              <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]`}>Your simulations</p>
              <h1 className={`${DISPLAY} text-[2.1rem] font-bold leading-none`}>
                {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
              </h1>
              <p className="mt-2 max-w-2xl text-[0.95rem] leading-[1.55] text-[var(--muted)]">
                {sims.length === 0
                  ? "You're not enrolled in any cohorts yet."
                  : `You're enrolled in ${sims.length} cohort${sims.length === 1 ? "" : "s"}${
                      active ? `, ${active} currently in progress` : ""
                    }. Pick one to continue.`}
              </p>
            </div>

            {sims.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[3px] border border-dashed border-[var(--steel-soft)] px-6 py-16 text-center">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite-raised)] text-[var(--muted-dim)]">
                  <IconBook size={22} />
                </span>
                <p className={`${DISPLAY} text-[19px] font-semibold`}>No cohorts yet</p>
                <p className="mt-1.5 max-w-sm text-sm text-[var(--muted)]">
                  When your instructor invites you or you register with a cohort link, your simulation will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sims.map((sim) => {
                  const status = statusOf(sim);
                  const rounds = sim.rounds?.length ? sim.rounds : deriveRounds(sim);
                  const current = sim.current_round || 1;
                  const total = sim.total_rounds || rounds.length || 0;
                  const deadline = status.live ? closesAt(rounds[current - 1]) : null;
                  const finished = status.label === "Completed";
                  const enterable = (status.live || finished) && sim.paid !== false && !sim.blocked;
                  return (
                    <div
                      key={sim.id}
                      className={`overflow-hidden ${PANEL}`}
                      style={{ borderLeftWidth: 3, borderLeftColor: status.tone }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className={`truncate ${DISPLAY} text-[1.4rem] font-semibold leading-tight`}>{sim.name}</h2>
                            <StatusPill label={status.label} tone={status.tone} />
                          </div>
                          <p className={`mt-1.5 ${MONO} text-[9.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                            {sim.tier ? `${sim.tier} · ` : ""}
                            {sim.firm ? `Firm ${sim.firm}` : "No firm assigned yet"}
                            {sim.paid === false ? " · payment pending" : ""}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => enterable && router.push(playPath(sim.id))}
                            disabled={!enterable}
                            className={`flex-none px-4 py-2 text-[13px] ${COMMIT}`}
                          >
                            {status.label === "Completed"
                              ? "View results"
                              : sim.blocked
                                ? "Access paused"
                                : sim.paid === false
                                  ? "Awaiting payment"
                                  : "Continue"}
                            {enterable && <IconArrow size={14} />}
                          </button>
                          <button
                            onClick={() => startTour(sim.id, sim.name)}
                            className={`flex-none flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] rounded-[2px] border border-[var(--steel-line)] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]`}
                          >
                            <IconHelp size={13} />
                            Revisit tour
                          </button>
                        </div>
                      </div>

                      <div className="px-6 pb-5 pt-4">
                        <SegmentedRounds rounds={rounds} />
                        <div className={`mt-2.5 flex flex-wrap items-center justify-between gap-2 ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                          <span>
                            Round {Math.min(current, total)} of {total}
                            {(sim.advisor_hours > 0 || sim.advisor_hourly_rate > 0) &&
                              ` · advisor ${sim.advisor_hours ?? 0}h${sim.advisor_due > 0 ? ` ($${sim.advisor_due})` : ""}`}
                          </span>
                          <span>{deadline || (status.label === "Completed" ? "run complete" : "not started")}</span>
                        </div>
                      </div>

                      {(sim.blocked || sim.paid === false) && (
                        <div
                          className={`flex items-center gap-2.5 border-t px-6 py-3 ${
                            sim.blocked ? "border-[#7a3b35]" : "border-[var(--amber-deep)]"
                          } bg-[var(--graphite)]`}
                        >
                          <span
                            className={`h-1.5 w-1.5 flex-none rounded-full ${
                              sim.blocked
                                ? "bg-[var(--signal-red)] shadow-[0_0_8px_-1px_var(--signal-red)]"
                                : "bg-[var(--amber)] shadow-[0_0_8px_-1px_var(--amber)]"
                            }`}
                          />
                          <span className="text-[0.82rem] text-[var(--muted)]">
                            {sim.blocked
                              ? "Your access to this cohort has been paused by your instructor."
                              : "Your payment for this cohort is still outstanding. You can enter once it clears."}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}