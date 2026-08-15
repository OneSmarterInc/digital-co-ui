"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, api, logout } from "../../lib/api";

/* Instructor console in the dark console theme (matches .dc-console in
 * app/console.css) and the restyled AdminConsole / AdminSimulationDetail.
 * Status language: blueprint = ready/open, ok-green = in progress (running),
 * muted = completed, amber = needs attention + primary actions.
 * All data flow and handlers unchanged.
 */

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
const FLAG =
  "inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[9px] font-semibold uppercase tracking-[0.1em]";

const NAV = ["Simulations", "Students", "Faculty"];

const RUN_LABEL = { ready: "Ready to start", in_progress: "In progress", completed: "Completed" };

function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`px-6 py-6 ${PANEL}`}>
      <p className={`${MONO} text-[9.5px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>{label}</p>
      <p className={`mt-3 ${DISPLAY} text-[2.5rem] font-bold leading-none`} style={{ color: color || "var(--paper)" }}>
        {value}
      </p>
    </div>
  );
}

function RunBadge({ status }) {
  const map = {
    ready: "border-[var(--blueprint-deep)] text-[var(--blueprint)]",
    in_progress: "border-[#3f5e46] text-[var(--ok)]",
    completed: "border-[var(--steel-line)] text-[var(--muted)]",
  };
  const dot = {
    ready: "bg-[var(--blueprint)]",
    in_progress: "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]",
    completed: "bg-[var(--muted-dim)]",
  };
  return (
    <span className={`${FLAG} ${map[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {RUN_LABEL[status]}
    </span>
  );
}

const fmtMoney = (n) => `$${(Number(n) || 0).toLocaleString("en-US")}`;

function PaidPill({ paid }) {
  return (
    <span className={`${FLAG} ${paid ? "border-[#3f5e46] text-[var(--ok)]" : "border-[var(--steel-line)] text-[var(--muted)]"}`}>
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

function EmptyRow({ children }) {
  return <p className={`mt-6 px-6 py-10 text-center text-[0.95rem] text-[var(--muted)] ${PANEL}`}>{children}</p>;
}

function StudentsTable({ rows }) {
  if (!rows.length) return <EmptyRow>No students are enrolled across your simulations yet.</EmptyRow>;
  return (
    <div className={`mt-6 overflow-x-auto ${PANEL}`}>
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
            <th className="px-5 py-3 font-medium">Student</th>
            <th className="px-3 py-3 font-medium">Simulation</th>
            <th className="px-3 py-3 font-medium">Firm</th>
            <th className="px-3 py-3 font-medium">Payment</th>
            <th className="px-5 py-3 text-right font-medium">Advisor use</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={`${s.cohort_id}-${s.enrollment_id}`} className="border-t border-[var(--steel-line)] text-[0.9rem]">
              <td className="px-5 py-3">
                <span className="block text-[var(--paper)]">{s.name}</span>
                <span className={`${MONO} text-[11px] text-[var(--muted-dim)]`}>{s.email}</span>
              </td>
              <td className="px-3 py-3 text-[var(--muted)]">{s.cohort}</td>
              <td className="px-3 py-3 text-[var(--muted)]">{s.firm || "—"}</td>
              <td className="px-3 py-3"><PaidPill paid={s.paid} /></td>
              <td className="px-5 py-3 text-right tabular-nums text-[var(--muted)]">
                {s.advisor_hours ? `${s.advisor_hours}h · ${fmtMoney(s.advisor_due)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FacultyTable({ rows }) {
  if (!rows.length) return <EmptyRow>No faculty are assigned to your simulations yet.</EmptyRow>;
  return (
    <div className={`mt-6 overflow-x-auto ${PANEL}`}>
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
            <th className="px-5 py-3 font-medium">Faculty</th>
            <th className="px-3 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Simulations</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-t border-[var(--steel-line)] text-[0.9rem]">
              <td className="px-5 py-3 text-[var(--paper)]">
                {f.name}
                {f.is_you ? (
                  <span className={`ml-2 ${FLAG} border-[var(--amber-deep)] text-[var(--amber)]`}>You</span>
                ) : null}
              </td>
              <td className={`px-3 py-3 ${MONO} text-[12px] text-[var(--muted)]`}>{f.email || "—"}</td>
              <td className="px-5 py-3 text-[var(--muted)]">{(f.cohorts || []).join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InstructorConsole() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [sims, setSims] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [section, setSection] = useState("Simulations");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [people, setPeople] = useState(null);
  const [peoplePhase, setPeoplePhase] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          router.replace("/login");
          return;
        }
        const res = await api("/instructor/simulations/");
        const data = res.ok ? await res.json() : [];
        if (!active) return;
        setMe(user);
        setSims(data);
        setPhase("ready");
      } catch {
        if (active) {
          setPhase("redirect");
          router.replace("/login");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  // The Students and Faculty rosters span every cohort the instructor teaches;
  // load them the first time either tab is opened, then keep them. Deps are
  // [section, people] only — depending on peoplePhase would re-run the effect
  // the instant it's set to "loading", and the cleanup would cancel the very
  // fetch that's in flight, leaving the tab stuck on "Loading…".
  useEffect(() => {
    if (section === "Simulations" || people) return;
    let active = true;
    setPeoplePhase("loading");
    (async () => {
      try {
        const res = await api("/instructor/people/");
        const data = res.ok ? await res.json() : { students: [], faculty: [] };
        if (!active) return;
        setPeople(data);
        setPeoplePhase("ready");
      } catch {
        if (active) setPeoplePhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [section, people]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  const list = sims ?? [];
  const stats = useMemo(
    () => ({
      total: list.length,
      in_progress: list.filter((s) => s.run_status === "in_progress").length,
      ready: list.filter((s) => s.run_status === "ready").length,
      completed: list.filter((s) => s.run_status === "completed").length,
    }),
    [list]
  );
  const filtered = useMemo(
    () =>
      list.filter((s) => {
        const okName = s.name.toLowerCase().includes(query.trim().toLowerCase());
        const okStatus = statusFilter === "all" || s.run_status === statusFilter;
        return okName && okStatus;
      }),
    [list, query, statusFilter]
  );

  if (phase !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--graphite)] text-[var(--paper)]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
          {phase === "redirect" ? "Redirecting…" : "Loading console…"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="flex items-center justify-between border-b border-[var(--steel-line)] bg-gradient-to-b from-[#1B1F25] to-[#15181C] px-8 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo-1x.svg" alt="Flexee" className="h-[30px] w-[30px] flex-shrink-0" />
          <span className={`${DISPLAY} text-[19px] font-bold leading-none tracking-[0.02em]`}>FLEXEE</span>
          <span className={`ml-1 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>
            Instructor console
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className={`${MONO} text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]`}>{me.username}</span>
          <button
            onClick={signOut}
            className={`rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]`}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-[230px] shrink-0 border-r border-[var(--steel-line)] bg-[#14171B] px-5 py-7">
          <p className={`mb-4 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Workspace</p>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item}
                onClick={() => setSection(item)}
                className={`border-l-2 px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                  section === item
                    ? "border-[var(--amber)] bg-[var(--graphite-raised)] font-medium text-[var(--paper)]"
                    : "border-transparent text-[var(--muted)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <p className={`mt-8 mb-3 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Quick stats</p>
          <div className="flex flex-col gap-2 px-3">
            {[
              ["Simulations", stats.total],
              ["In progress", stats.in_progress],
              ["Completed", stats.completed],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[0.9rem] text-[var(--muted)]">{label}</span>
                <span className={`${MONO} text-[0.95rem] font-semibold text-[var(--paper)]`}>{value}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 px-8 py-8">
          {section !== "Simulations" ? (
            <div className="max-w-[960px]">
              <h1 className={`${DISPLAY} text-[2.5rem] font-bold leading-none`}>{section}</h1>
              <p className="mt-3 max-w-[64ch] text-[0.98rem] leading-[1.6] text-[var(--muted)]">
                {section === "Students"
                  ? "Every student enrolled across your simulations — their firm, payment status, and advisor usage."
                  : "The faculty teaching alongside you across your simulations."}
              </p>
              {peoplePhase === "loading" && !people ? (
                <EmptyRow>Loading…</EmptyRow>
              ) : peoplePhase === "error" ? (
                <p className={`mt-6 px-6 py-10 text-center text-[0.95rem] text-[var(--signal-red)] ${PANEL}`}>
                  Couldn&rsquo;t load this roster. Try again shortly.
                </p>
              ) : section === "Students" ? (
                <StudentsTable rows={people?.students ?? []} />
              ) : (
                <FacultyTable rows={people?.faculty ?? []} />
              )}
            </div>
          ) : (
            <>
              <h1 className={`${DISPLAY} text-[2.7rem] font-bold leading-none`}>Your simulations</h1>
              <p className="mt-3 max-w-[62ch] text-[0.98rem] leading-[1.6] text-[var(--muted)]">
                Open your simulations to students, watch each round progress, and keep an eye on enrollment across your
                courses.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total simulations" value={stats.total} />
                <StatCard label="In progress" value={stats.in_progress} color="var(--ok)" />
                <StatCard label="Ready to start" value={stats.ready} color="var(--blueprint)" />
                <StatCard label="Completed" value={stats.completed} color="var(--muted)" />
              </div>

              <div className={`mt-6 ${PANEL}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <h2 className={`${DISPLAY} text-[1.45rem] font-semibold leading-none`}>All simulations</h2>
                    <span className={`rounded-[2px] border border-[var(--steel-line)] px-2.5 py-0.5 ${MONO} text-[11px] text-[var(--muted)]`}>
                      {filtered.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-[220px] rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2 text-[0.9rem] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:bg-[var(--graphite-high)]"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3 py-2 text-[0.85rem] text-[var(--paper)] outline-none transition duration-150 focus:border-[var(--blueprint)]"
                    >
                      <option value="all">All status</option>
                      <option value="ready">Ready to start</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className={`grid grid-cols-[1fr_190px_120px_150px_110px_130px] items-center gap-4 border-t border-[var(--steel-line)] px-6 py-3 ${MONO} text-[9.5px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
                  <span>Simulation</span>
                  <span>Status</span>
                  <span>Round</span>
                  <span>Firms / Students</span>
                  <span>Created</span>
                  <span aria-hidden="true" />
                </div>

                {filtered.length === 0 ? (
                  <div className="border-t border-[var(--steel-line)] px-6 py-10 text-center text-[0.9rem] text-[var(--muted)]">
                    No simulations assigned to you yet.
                  </div>
                ) : (
                  filtered.map((sim) => (
                    <div
                      key={sim.id}
                      className="grid grid-cols-[1fr_190px_120px_150px_110px_130px] items-center gap-4 border-t border-[var(--steel-line)] px-6 py-4 transition-colors hover:bg-[var(--graphite-high)]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${DISPLAY} text-[14px] font-bold text-[var(--amber)]`}
                        >
                          {sim.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-[0.98rem] font-semibold leading-tight">{sim.name}</p>
                          <p className={`mt-0.5 ${MONO} text-[9.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                            {sim.total_rounds} rounds &middot; {sim.teams} firms
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-1.5">
                        <RunBadge status={sim.run_status} />
                        {sim.needs_setup ? (
                          <span className={`${FLAG} border-[var(--amber-deep)] text-[var(--amber)]`}>
                            Setup needed
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className={`${MONO} text-[0.95rem]`}>
                          <span className="font-semibold text-[var(--paper)]">R{sim.round}</span>
                          <span className="text-[var(--muted-dim)]"> /{sim.total_rounds}</span>
                        </p>
                        <div className="mt-1.5 h-[9px] w-[90px] overflow-hidden rounded-[1px] border border-[var(--steel-line)] bg-[var(--graphite)]">
                          <div className="h-full bg-[var(--blueprint-deep)]" style={{ width: `${sim.progress}%` }} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-[0.85rem] text-[var(--muted)]">
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--muted-dim)]"><BuildingIcon /></span>
                          <span className="font-semibold text-[var(--paper)]">{sim.teams}</span> firms
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--muted-dim)]"><PeopleIcon /></span>
                          <span className="font-semibold text-[var(--paper)]">{sim.students}</span> students
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className={`${MONO} text-[10px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>
                          {timeAgo(sim.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        {sim.needs_setup ? (
                          <button
                            onClick={() => router.push(`/instructor/${sim.id}/setup`)}
                            className={`rounded-[2px] bg-[var(--amber)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052]`}
                          >
                            Set up
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/instructor/${sim.id}`)}
                            className={`rounded-[2px] border border-[var(--steel-soft)] px-4 py-2 ${MONO} text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] transition-colors hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]`}
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <div className={`border-t border-[var(--steel-line)] px-6 py-3 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
                  Showing {filtered.length} of {list.length} simulations
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}