"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchMe, api, logout } from "../../../../lib/api";

/* Simulation detail in the dark console theme (matches .dc-console in
 * app/console.css). Same conventions as the restyled AdminConsole:
 * palette as CSS vars on the wrapper, [color-scheme:dark] for native
 * controls, amber = current/primary, ok-green = live/healthy,
 * blueprint = completed progress, signal-red = destructive.
 * Team dot colors are re-picked from the console palette so badges
 * stay legible on graphite. All handlers and data flow unchanged.
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

/* Team identity colors drawn from the console palette (dark-legible). */
const TEAM_DOTS = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const DEPLOY_STATUS_TAG = { draft: "DRAFT", faculty: "FACULTY_DEPLOYED", students: "STUDENT_DEPLOYED" };

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "\u2014";
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="px-5 py-5">
      <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>{label}</p>
      <p
        className={`mt-1.5 ${DISPLAY} text-[2.2rem] font-bold leading-none ${
          accent ? "text-[var(--ok)]" : "text-[var(--paper)]"
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className={`mt-1.5 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>{sub}</p>
      ) : null}
    </div>
  );
}

function PersonBadge({ name, color }) {
  return (
    <span
      className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[2px] border border-[var(--steel-soft)] ${DISPLAY} text-[14px] font-bold`}
      style={color ? { background: color, color: "#16191D" } : { background: "#16191D", color: "var(--amber)" }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

const FLAG = "inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[9px] font-semibold uppercase tracking-[0.1em]";

function RoundStatus({ status }) {
  const map = {
    completed: { cls: "border-[var(--steel-line)] text-[var(--muted)]", dot: "bg-[var(--muted-dim)]" },
    active: {
      cls: "border-[var(--amber-deep)] text-[var(--amber)]",
      dot: "bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]",
    },
    upcoming: { cls: "border-[var(--steel-line)] text-[var(--muted-dim)]", dot: "bg-[var(--steel-soft)]" },
  };
  const s = map[status] || map.upcoming;
  return (
    <span className={`${FLAG} ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className={`mt-6 ${PANEL}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          <h2 className={`${DISPLAY} text-[1.45rem] font-semibold leading-none`}>{title}</h2>
          {subtitle ? <p className="mt-1.5 text-[0.92rem] text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminSimulationDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [me, setMe] = useState(null);
  const [sim, setSim] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_staff && !user.is_superuser) {
          router.replace("/login");
          return;
        }
        const res = await api(`/admin/simulations/${id}/`);
        if (!res.ok) {
          if (active) {
            setPhase("missing");
          }
          return;
        }
        const detail = await res.json();
        if (!active) return;
        setMe(user);
        setSim(detail);
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
  }, [id, router]);

  const teamColor = useMemo(() => {
    const map = {};
    (sim?.teams ?? []).forEach((t, i) => {
      map[t.name] = TEAM_DOTS[i % TEAM_DOTS.length];
    });
    return map;
  }, [sim]);

  const filteredStudents = useMemo(
    () =>
      (sim?.students ?? []).filter((s) => {
        const q = query.trim().toLowerCase();
        return !q || s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.team || "").toLowerCase().includes(q);
      }),
    [sim, query]
  );

  async function reloadSim() {
    const res = await api(`/admin/simulations/${sim.id}/`);
    if (res.ok) setSim(await res.json());
  }

  async function deployFaculty() {
    setDeploying(true);
    try {
      await api(`/admin/simulations/${sim.id}/deploy-faculty/`, { method: "POST" });
      await reloadSim();
    } finally {
      setDeploying(false);
    }
  }

  async function deleteSim() {
    if (!window.confirm(`Delete "${sim.name}" and all its data? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/admin/simulations/${sim.id}/`, { method: "DELETE" });
      router.push("/admin");
    } finally {
      setDeleting(false);
    }
  }

  function signOut() {
    logout();
    router.replace("/login");
  }

  if (phase === "loading" || phase === "redirect") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--graphite)] text-[var(--paper)]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
          {phase === "redirect" ? "Redirecting\u2026" : "Loading simulation\u2026"}
        </p>
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)]"
        style={THEME}
      >
        <p className={`${DISPLAY} text-[1.6rem] font-semibold`}>That simulation doesn&rsquo;t exist.</p>
        <button
          onClick={() => router.push("/admin")}
          className={`rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]`}
        >
          Back to simulations
        </button>
      </div>
    );
  }

  const tierLabel = sim.tier === "GRADUATE" ? "Graduate" : "Undergraduate";
  const remaining = Math.max(0, sim.total_rounds - sim.round);

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
            Admin console
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

      <div className="mx-auto max-w-[1080px] px-6 py-8">
        <button
          onClick={() => router.push("/admin")}
          className={`${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--paper)]`}
        >
          &larr; Simulations
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className={`${FLAG} border-[var(--steel-line)] text-[var(--muted)]`}>Simulation</span>
          <span
            className={`${FLAG} ${
              sim.status === "active"
                ? "border-[#3f5e46] text-[var(--ok)]"
                : "border-[var(--steel-line)] text-[var(--muted)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                sim.status === "active" ? "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]" : "bg-[var(--muted-dim)]"
              }`}
            />
            {sim.status}
          </span>
          <span className={`${FLAG} border-[var(--steel-line)] text-[var(--muted)]`}>{tierLabel}</span>
          <span
            className={`${FLAG} ${
              sim.deployment_status === "students"
                ? "border-[#3f5e46] text-[var(--ok)]"
                : sim.deployment_status === "faculty"
                  ? "border-[var(--amber-deep)] text-[var(--amber)]"
                  : "border-[var(--steel-line)] text-[var(--muted)]"
            }`}
          >
            {sim.deployment_status === "students"
              ? "Live for students"
              : sim.deployment_status === "faculty"
                ? "Faculty only"
                : "Draft"}
          </span>
        </div>
        <h1 className={`mt-3 ${DISPLAY} text-[2.7rem] font-bold leading-none`}>{sim.name}</h1>
        <p className={`mt-3 ${MONO} text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]`}>
          Round <b className="font-semibold text-[var(--amber)]">{sim.round}</b> of {sim.total_rounds} &middot; {tierLabel}
        </p>

        <div className={`mt-7 grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-[var(--steel-line)] ${PANEL}`}>
          <StatTile label="Teams" value={sim.teams.length} sub="Firms formed" />
          <StatTile label="Students" value={sim.students.length} sub="Enrolled total" />
          <StatTile label="Round" value={`${sim.round}/${sim.total_rounds}`} sub="Weeks played" accent={sim.status === "active"} />
          <StatTile label="Faculty" value={sim.faculty.length} sub="Instructors assigned" />
        </div>

        <section className={`mt-6 ${PANEL}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] text-[var(--amber)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.7-.84.7-2.13-.1-2.9a2.18 2.18 0 0 0-2.9-.1z" />
                  <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
              </span>
              <div>
                <h2 className={`${DISPLAY} text-[1.45rem] font-semibold leading-none`}>Deployment</h2>
                <p className="mt-1.5 text-[0.92rem] text-[var(--muted)]">
                  {sim.deployment_status === "students"
                    ? "Simulation is live for students and faculty."
                    : sim.deployment_status === "faculty"
                      ? "Open to faculty. Faculty opens it to students from their screen."
                      : "Not deployed yet. Deploy it to faculty to begin."}
                </p>
              </div>
            </div>
            {sim.deployment_status === "draft" ? (
              <button
                onClick={deployFaculty}
                disabled={deploying}
                className={`shrink-0 rounded-[2px] bg-[var(--amber)] px-5 py-2.5 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-60`}
              >
                {deploying ? "Deploying\u2026" : "Deploy for faculty"}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-6 border-t border-[var(--steel-line)] px-6 py-5 sm:grid-cols-3">
            <div>
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>Deployment status</p>
              <p className={`mt-2 flex items-center gap-2 ${MONO} text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--paper)]`}>
                <span
                  className={`h-2 w-2 rounded-full ${
                    sim.deployment_status === "students"
                      ? "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]"
                      : sim.deployment_status === "faculty"
                        ? "bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]"
                        : "bg-[var(--muted-dim)]"
                  }`}
                />
                {DEPLOY_STATUS_TAG[sim.deployment_status]}
              </p>
            </div>
            <div>
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>Deployed for faculty</p>
              <p className={`mt-2 ${DISPLAY} text-[1.2rem] font-semibold text-[var(--ok)]`}>{fmtDate(sim.deployed_for_faculty_at)}</p>
            </div>
            <div>
              <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>Deployed for students</p>
              <p className={`mt-2 ${DISPLAY} text-[1.2rem] font-semibold text-[var(--ok)]`}>{fmtDate(sim.deployed_for_students_at)}</p>
            </div>
          </div>
        </section>

        <Card title="Round progress" subtitle="How far this simulation has advanced through its fourteen weeks.">
          <div className="border-t border-[var(--steel-line)] px-6 py-5">
            <div className="flex items-baseline justify-between">
              <p className={`${DISPLAY} text-[1.9rem] font-bold`}>
                {sim.round} <span className="text-[1rem] font-normal text-[var(--muted)]">/ {sim.total_rounds} rounds</span>
              </p>
              <p className={`${MONO} text-[1.05rem] font-semibold text-[var(--blueprint)]`}>{sim.progress}%</p>
            </div>
            <div className="mt-3 h-[13px] overflow-hidden rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)]">
              <div className="h-full bg-[var(--blueprint-deep)]" style={{ width: `${sim.progress}%` }} />
            </div>
            <p className={`mt-2 ${MONO} text-[9.5px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>
              {remaining} {remaining === 1 ? "round" : "rounds"} remaining
            </p>
          </div>
        </Card>

        <Card title="Faculty members" subtitle={`${sim.faculty.length} ${sim.faculty.length === 1 ? "instructor has" : "instructors have"} access.`}>
          {sim.faculty.length === 0 ? (
            <div className="border-t border-[var(--steel-line)] px-6 py-8 text-center text-[0.9rem] text-[var(--muted)]">
              No faculty assigned yet.
            </div>
          ) : (
            sim.faculty.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-4 border-t border-[var(--steel-line)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <PersonBadge name={f.username} />
                  <div>
                    <p className="text-[0.98rem] font-semibold">{f.username}</p>
                    <p className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>{f.email || "\u2014"}</p>
                  </div>
                </div>
                <span className={`${FLAG} border-[#3f5e46] text-[var(--ok)]`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]" />
                  Active
                </span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Simulation rounds"
          subtitle="The fourteen weeks and where the cohort stands."
          action={
            <span className={`${FLAG} border-[var(--steel-line)] text-[var(--muted)]`}>
              Week {sim.round} of {sim.total_rounds}
            </span>
          }
        >
          <div className={`grid grid-cols-[1fr_160px] items-center gap-4 border-t border-[var(--steel-line)] px-6 py-3 ${MONO} text-[9.5px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
            <span>Round</span>
            <span>Status</span>
          </div>
          {sim.rounds.map((r) => (
            <div key={r.number} className="grid grid-cols-[1fr_160px] items-center gap-4 border-t border-[var(--steel-line)] px-6 py-3.5">
              <span
                className={`${DISPLAY} text-[1.12rem] font-semibold ${
                  r.status === "active"
                    ? "text-[var(--amber)]"
                    : r.status === "completed"
                      ? "text-[var(--paper)]"
                      : "text-[var(--muted-dim)]"
                }`}
              >
                Round {r.number}
              </span>
              <RoundStatus status={r.status} />
            </div>
          ))}
        </Card>

        <Card
          title="Enrolled students"
          subtitle={`${sim.students.length} ${sim.students.length === 1 ? "student" : "students"} across ${sim.teams.length} ${sim.teams.length === 1 ? "team" : "teams"}.`}
          action={
            <input
              type="text"
              placeholder="Search name, email, team..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[240px] rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2 text-[0.9rem] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:bg-[var(--graphite-high)]"
            />
          }
        >
          {filteredStudents.length === 0 ? (
            <div className="border-t border-[var(--steel-line)] px-6 py-8 text-center text-[0.9rem] text-[var(--muted)]">
              {sim.students.length === 0 ? "No students enrolled yet." : "No students match your search."}
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 border-t border-[var(--steel-line)] px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <PersonBadge name={s.username} color={teamColor[s.team]} />
                  <div>
                    <p className="text-[0.98rem] font-semibold">{s.username}</p>
                    <p className={`${MONO} text-[10px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>{s.email || "\u2014"}</p>
                  </div>
                </div>
                <span className={`${FLAG} border-[var(--steel-line)] text-[var(--muted)]`}>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: teamColor[s.team] || "var(--muted-dim)" }}
                  />
                  {s.team || "No team"}
                </span>
              </div>
            ))
          )}
        </Card>

        <section className="mt-6 mb-4 rounded-[3px] border border-[rgba(210,86,75,0.5)] bg-[rgba(210,86,75,0.07)] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className={`${DISPLAY} text-[1.35rem] font-semibold leading-none text-[var(--signal-red)]`}>
                Delete this simulation
              </h2>
              <p className="mt-2 max-w-[64ch] text-[0.92rem] leading-[1.55] text-[var(--muted)]">
                Permanently removes the simulation and everything tied to it, its teams, runs, and results. This
                can&rsquo;t be undone.
              </p>
            </div>
            <button
              onClick={deleteSim}
              disabled={deleting}
              className={`shrink-0 rounded-[2px] border border-[var(--signal-red)] px-4 py-2.5 ${MONO} text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--signal-red)] transition-colors hover:bg-[rgba(210,86,75,0.12)] disabled:opacity-50`}
            >
              {deleting ? "Deleting\u2026" : "Delete simulation"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}