"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, api, logout } from "../../lib/api";

/* Admin console in the dark console theme (matches .dc-console in app/console.css).
 * Palette exposed as CSS vars on the page wrapper; [color-scheme:dark] makes
 * native selects, date pickers, and scrollbars render dark. All data flow,
 * modals, and handlers are unchanged from the light version.
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

const NAV = ["Simulations", "Admins", "Faculty", "Students", "Billing"];

const SECTION_META = {
  Simulations: {
    title: "Simulations",
    subtitle: "View and manage all Flexee simulations. Open the instructor console to run rounds.",
  },
  Admins: { title: "Admins", subtitle: "Everyone with administrator access to this workspace." },
  Faculty: { title: "Faculty", subtitle: "Instructors and the cohorts they teach." },
  Students: { title: "Students", subtitle: "Students enrolled across every simulation." },
  Billing: { title: "Billing", subtitle: "Usage across the workspace for the current period." },
};

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore",
  "Asia/Tokyo", "Australia/Sydney",
];
const BROWSER_TZ = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
const TZ_OPTIONS = TIMEZONES.includes(BROWSER_TZ) ? TIMEZONES : [BROWSER_TZ, ...TIMEZONES];
const TODAY = new Date().toISOString().slice(0, 10);

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

const fmtMoney = (n) => `$${(Number(n) || 0).toLocaleString("en-US")}`;

function StatCard({ label, value, accent }) {
  return (
    <div className="px-6 py-6">
      <p className={`${MONO} text-[9.5px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>{label}</p>
      <p
        className={`mt-2 ${DISPLAY} text-[2.7rem] font-bold leading-none ${
          accent ? "text-[var(--ok)]" : "text-[var(--paper)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em] ${
        active ? "border-[#3f5e46] text-[var(--ok)]" : "border-[var(--steel-line)] text-[var(--muted)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]" : "bg-[var(--muted-dim)]"
        }`}
      />
      {status}
    </span>
  );
}

function PersonBadge({ name }) {
  return (
    <span
      className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${DISPLAY} text-[15px] font-bold text-[var(--amber)]`}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function TableCard({ title, count, children }) {
  return (
    <div className={`mt-6 ${PANEL}`}>
      <div className="flex items-center gap-3 px-6 py-5">
        <h2 className={`${DISPLAY} text-[1.45rem] font-semibold leading-none`}>{title}</h2>
        <span className={`rounded-[2px] border border-[var(--steel-line)] px-2.5 py-0.5 ${MONO} text-[11px] text-[var(--muted)]`}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="border-t border-[var(--steel-line)] px-6 py-10 text-center text-[0.9rem] text-[var(--muted)]">{text}</div>
  );
}

function FooterRow({ n }) {
  return (
    <div className={`border-t border-[var(--steel-line)] px-6 py-3 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
      Showing {n} of {n}
    </div>
  );
}

const HEAD = `border-t border-[var(--steel-line)] px-6 py-3 font-['IBM_Plex_Mono',ui-monospace,monospace] text-[9.5px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`;
const ROW = "border-t border-[var(--steel-line)] px-6 py-4";

function AdminsView({ admins }) {
  const cols = "grid grid-cols-[1fr_1.2fr_140px] items-center gap-4";
  return (
    <TableCard title="All admins" count={admins.length}>
      <div className={`${cols} ${HEAD}`}>
        <span>Person</span>
        <span>Email</span>
        <span>Access</span>
      </div>
      {admins.length === 0 ? (
        <EmptyRow text="No admins yet." />
      ) : (
        admins.map((a) => (
          <div key={a.id} className={`${cols} ${ROW}`}>
            <div className="flex items-center gap-3">
              <PersonBadge name={a.username} />
              <p className="text-[0.98rem] font-semibold">{a.username}</p>
            </div>
            <span className="text-[0.92rem] text-[var(--muted)]">{a.email || "\u2014"}</span>
            <span
              className={`inline-flex w-fit items-center rounded-[2px] border px-2.5 py-1 ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em] ${
                a.is_superuser
                  ? "border-[var(--amber-deep)] text-[var(--amber)]"
                  : "border-[var(--steel-line)] text-[var(--muted)]"
              }`}
            >
              {a.is_superuser ? "Superuser" : "Staff"}
            </span>
          </div>
        ))
      )}
      <FooterRow n={admins.length} />
    </TableCard>
  );
}

function FacultyView({ faculty }) {
  const cols = "grid grid-cols-[1fr_1fr_1.4fr] items-center gap-4";
  return (
    <TableCard title="All faculty" count={faculty.length}>
      <div className={`${cols} ${HEAD}`}>
        <span>Instructor</span>
        <span>Email</span>
        <span>Cohorts</span>
      </div>
      {faculty.length === 0 ? (
        <EmptyRow text="No instructors yet." />
      ) : (
        faculty.map((f) => (
          <div key={f.id} className={`${cols} ${ROW}`}>
            <div className="flex items-center gap-3">
              <PersonBadge name={f.username} />
              <p className="text-[0.98rem] font-semibold">{f.username}</p>
            </div>
            <span className="text-[0.92rem] text-[var(--muted)]">{f.email || "\u2014"}</span>
            <div className="flex flex-wrap gap-1.5">
              {f.cohorts.length ? (
                f.cohorts.map((c) => (
                  <span
                    key={c}
                    className={`rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-2 py-0.5 ${MONO} text-[10px] text-[var(--muted)]`}
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-[0.9rem] text-[var(--muted-dim)]">No cohorts</span>
              )}
            </div>
          </div>
        ))
      )}
      <FooterRow n={faculty.length} />
    </TableCard>
  );
}

function StudentsView({ students }) {
  const cols = "grid grid-cols-[1fr_1.3fr_1fr_1fr] items-center gap-4";
  return (
    <TableCard title="All students" count={students.length}>
      <div className={`${cols} ${HEAD}`}>
        <span>Student</span>
        <span>Email</span>
        <span>Team</span>
        <span>Cohort</span>
      </div>
      {students.length === 0 ? (
        <EmptyRow text="No students enrolled yet." />
      ) : (
        students.map((s) => (
          <div key={s.id} className={`${cols} ${ROW}`}>
            <div className="flex items-center gap-3">
              <PersonBadge name={s.username} />
              <p className="text-[0.98rem] font-semibold">{s.username}</p>
            </div>
            <span className="text-[0.92rem] text-[var(--muted)]">{s.email || "\u2014"}</span>
            <span className="text-[0.92rem] text-[var(--paper)]">{s.team || "\u2014"}</span>
            <span className="text-[0.92rem] text-[var(--muted)]">{s.cohort || "\u2014"}</span>
          </div>
        ))
      )}
      <FooterRow n={students.length} />
    </TableCard>
  );
}

function BillingView({ stats, people, billing, simulations }) {
  const usage = [
    { label: "Simulations", value: stats.total_games },
    { label: "Teams", value: stats.total_teams },
    { label: "Students", value: people.students.length },
    { label: "Instructors", value: people.faculty.length },
  ];
  const b = billing ?? {};
  const rows = simulations ?? [];
  const charges = [
    { label: "Total billed", value: fmtMoney(b.total_billed) },
    { label: "Received", value: fmtMoney(b.received), accent: true },
    { label: "Pending", value: fmtMoney(b.pending) },
    { label: "Advisor charges", value: fmtMoney(b.advisor_billed) },
  ];
  return (
    <>
      <div className={`mt-8 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-[var(--steel-line)] ${PANEL}`}>
        {usage.map((u) => (
          <StatCard key={u.label} label={u.label} value={u.value} />
        ))}
      </div>

      {!b.rates_configured ? (
        <div className={`mt-6 p-6 ${PANEL}`}>
          <h2 className={`${DISPLAY} text-[1.45rem] font-semibold leading-none`}>No billing rates set yet</h2>
          <p className="mt-3 max-w-[72ch] text-[0.98rem] leading-[1.6] text-[var(--muted)]">
            Every simulation is currently free. Set a per-student price or an advisor hourly rate when you create or
            edit a simulation, and per-seat and advisor charges will total up here automatically.
          </p>
        </div>
      ) : (
        <>
          <p className={`mt-8 mb-3 ${MONO} text-[10px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>
            Charges · current period
          </p>
          <div className={`grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-[var(--steel-line)] ${PANEL}`}>
            {charges.map((c) => (
              <StatCard key={c.label} label={c.label} value={c.value} accent={c.accent} />
            ))}
          </div>

          <div className={`mt-6 overflow-x-auto ${PANEL}`}>
            <table className="w-full min-w-[660px] text-left">
              <thead>
                <tr className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
                  <th className="px-5 py-3 font-medium">Simulation</th>
                  <th className="px-3 py-3 text-right font-medium">Paid seats</th>
                  <th className="px-3 py-3 text-right font-medium">Per student</th>
                  <th className="px-3 py-3 text-right font-medium">Advisor</th>
                  <th className="px-3 py-3 text-right font-medium">Billed</th>
                  <th className="px-3 py-3 text-right font-medium">Received</th>
                  <th className="px-5 py-3 text-right font-medium">Pending</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const sb = s.billing ?? {};
                  return (
                    <tr key={s.id} className="border-t border-[var(--steel-line)] text-[0.9rem]">
                      <td className="px-5 py-3 text-[var(--paper)]">{s.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--muted)]">
                        {sb.paid_count}/{sb.total_count}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--muted)]">
                        {fmtMoney(sb.price_per_student)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--muted)]">
                        {sb.advisor_hours}h · {fmtMoney(sb.advisor_billed)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--paper)]">
                        {fmtMoney(sb.total_billed)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[var(--ok)]">{fmtMoney(sb.received)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-[var(--muted)]">{fmtMoney(sb.pending)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 max-w-[80ch] text-[0.85rem] leading-[1.55] text-[var(--muted-dim)]">
            Seat charges bill each enrolled student at the simulation&rsquo;s per-student price; advisor charges accrue
            per started hour of one-on-one advisor chat. <b className="text-[var(--muted)]">Received</b> reflects seats
            an instructor has marked paid. Figures update as students enroll, pay, and consult advisors.
          </p>
        </>
      )}
    </>
  );
}

export default function AdminConsole() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [people, setPeople] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [section, setSection] = useState("Simulations");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState("UNDERGRAD");
  const [newTeams, setNewTeams] = useState(4);
  const [newFaculty, setNewFaculty] = useState([]);
  const toggleFaculty = (id) =>
    setNewFaculty((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const [newTimezone, setNewTimezone] = useState(BROWSER_TZ);
  const [newStartDate, setNewStartDate] = useState(TODAY);
  // Provisioning the instructor console reads: schedule pacing, firm size,
  // seat count, and the billing rate. Backed by the extended create endpoint.
  const [newDaysPerRound, setNewDaysPerRound] = useState(7);
  const [newTeamSize, setNewTeamSize] = useState(4);
  const [newCapacity, setNewCapacity] = useState(30);
  const [newPrice, setNewPrice] = useState(0);
  const [newAdvisorRate, setNewAdvisorRate] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [simToDelete, setSimToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_staff && !user.is_superuser) {
          router.replace("/login");
          return;
        }
        const [simRes, peopleRes] = await Promise.all([api("/admin/simulations/"), api("/admin/people/")]);
        const sims = await simRes.json();
        const peopleData = await peopleRes.json();
        if (!active) return;
        setMe(user);
        setData(sims);
        setPeople(peopleData);
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

  async function reload() {
    const res = await api("/admin/simulations/");
    if (res.ok) setData(await res.json());
  }

  async function createSimulation(event) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await api("/admin/simulations/", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          tier: newTier,
          teams: Number(newTeams) || 0,
          faculty: newFaculty,
          timezone: newTimezone,
          start_date: newStartDate || null,
          days_per_round: Number(newDaysPerRound) || 7,
          team_size: Number(newTeamSize) || 4,
          enrollment_capacity: Number(newCapacity) || 30,
          price_per_student: Number(newPrice) || 0,
          advisor_hourly_rate: Number(newAdvisorRate) || 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCreateError(body.detail || "Couldn't create the simulation.");
        setCreating(false);
        return;
      }
      setModalOpen(false);
      setNewName("");
      setNewTeams(4);
      setNewTier("UNDERGRAD");
      setNewFaculty([]);
      setNewTimezone(BROWSER_TZ);
      setNewStartDate(TODAY);
      setNewDaysPerRound(7);
      setNewTeamSize(4);
      setNewCapacity(30);
      setNewPrice(0);
      setNewAdvisorRate(0);
      await reload();
    } catch {
      setCreateError("Couldn't reach the server.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSimulation(sim) {
    setSimToDelete(sim);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!simToDelete) return;
    setDeleting(true);
    try {
      await api(`/admin/simulations/${simToDelete.id}/`, { method: "DELETE" });
      await reload();
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setSimToDelete(null);
    }
  }

  async function addTeam(sim) {
    setBusy(true);
    try {
      await api(`/admin/simulations/${sim.id}/teams/`, { method: "POST" });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  function openDetail(sim) {
    router.push(`/admin/simulations/${sim.id}`);
  }

  function signOut() {
    logout();
    router.replace("/login");
  }

  const simulations = data?.simulations ?? [];
  const filtered = useMemo(
    () =>
      simulations.filter((s) => {
        const matchesName = s.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        return matchesName && matchesStatus;
      }),
    [simulations, query, statusFilter]
  );

  if (phase !== "ready") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--graphite)] text-[var(--paper)]"
        style={THEME}
      >
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
          {phase === "redirect" ? "Redirecting\u2026" : "Loading console\u2026"}
        </p>
      </div>
    );
  }

  const stats = data.stats;
  const meta = SECTION_META[section];
  const iconBtn =
    "rounded-[2px] border border-[var(--steel-line)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)] disabled:opacity-40";
  const inputClass =
    "rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 py-2.5 text-[0.95rem] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:bg-[var(--graphite-high)]";
  const selectClass =
    "rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3 py-2.5 text-[0.9rem] text-[var(--paper)] outline-none transition duration-150 focus:border-[var(--blueprint)]";
  const fieldLabel = `mb-1.5 block ${MONO} text-[9.5px] uppercase tracking-[0.14em] text-[var(--muted)]`;
  const ghostBtn = `rounded-[2px] border border-[var(--steel-line)] px-4 py-2.5 ${MONO} text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]`;

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
        </aside>

        <main className="flex-1 px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className={`${DISPLAY} text-[2.7rem] font-bold leading-none`}>{meta.title}</h1>
              <p className="mt-3 text-[0.98rem] text-[var(--muted)]">{meta.subtitle}</p>
            </div>
            {section === "Simulations" ? (
              <button
                onClick={() => {
                  setCreateError("");
                  setModalOpen(true);
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-[2px] bg-[var(--amber)] px-5 py-3 ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052]`}
              >
                <span className="text-[1.15em] leading-none">+</span> New simulation
              </button>
            ) : null}
          </div>

          {section === "Simulations" ? (
            <>
              <div className={`mt-8 grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-[var(--steel-line)] ${PANEL}`}>
                <StatCard label="Total games" value={stats.total_games} />
                <StatCard label="Active" value={stats.active} accent />
                <StatCard label="Total teams" value={stats.total_teams} />
                <StatCard label="Total rounds" value={stats.total_rounds} />
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
                      className={`w-[220px] ${inputClass} py-2 text-[0.9rem]`}
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`${selectClass} py-2 text-[0.85rem]`}
                    >
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                </div>

                <div className={`grid grid-cols-[1fr_120px_90px_70px_190px_150px] items-center gap-4 ${HEAD}`}>
                  <span>Simulation</span>
                  <span>Status</span>
                  <span>Round</span>
                  <span>Teams</span>
                  <span>Progress</span>
                  <span />
                </div>

                {filtered.length === 0 ? (
                  <EmptyRow text="No simulations match. Create one to get started." />
                ) : (
                  filtered.map((sim, index) => (
                    <div
                      key={sim.id}
                      className="grid grid-cols-[1fr_120px_90px_70px_190px_150px] items-center gap-4 border-t border-[var(--steel-line)] px-6 py-4 transition-colors hover:bg-[var(--graphite-high)]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] ${DISPLAY} text-[14px] font-bold text-[var(--amber)]`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-[0.98rem] font-semibold leading-tight">{sim.name}</p>
                          <p className={`mt-0.5 ${MONO} text-[9.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                            {sim.total_rounds} rounds &middot; {sim.teams} teams
                          </p>
                        </div>
                      </div>

                      <div>
                        <StatusPill status={sim.status} />
                      </div>

                      <div className={`${MONO} text-[0.95rem]`}>
                        <span className="font-semibold text-[var(--paper)]">{sim.round}</span>
                        <span className="text-[var(--muted-dim)]"> / {sim.total_rounds}</span>
                      </div>

                      <div className={`${DISPLAY} text-[1.15rem] font-bold`}>{sim.teams}</div>

                      <div className="flex items-center gap-3">
                        <div className="h-[9px] w-[110px] overflow-hidden rounded-[1px] border border-[var(--steel-line)] bg-[var(--graphite)]">
                          <div className="h-full bg-[var(--blueprint-deep)]" style={{ width: `${sim.progress}%` }} />
                        </div>
                        <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{sim.progress}%</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => addTeam(sim)} disabled={busy} title="Add a team" className={iconBtn}>
                          <PersonIcon />
                        </button>
                        <button onClick={() => deleteSimulation(sim)} disabled={busy} title="Delete simulation" className={iconBtn}>
                          <TrashIcon />
                        </button>
                        <button
                          onClick={() => openDetail(sim)}
                          className={`rounded-[2px] border border-[var(--steel-soft)] px-3 py-1.5 ${MONO} text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--paper)] transition-colors hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]`}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className={`border-t border-[var(--steel-line)] px-6 py-3 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>
                  Showing {filtered.length} of {simulations.length}
                </div>
              </div>
            </>
          ) : null}

          {section === "Admins" ? <AdminsView admins={people.admins} /> : null}
          {section === "Faculty" ? <FacultyView faculty={people.faculty} /> : null}
          {section === "Students" ? <StudentsView students={people.students} /> : null}
          {section === "Billing" ? (
            <BillingView stats={stats} people={people} billing={data.billing} simulations={data.simulations} />
          ) : null}
        </main>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !creating && setModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createSimulation}
            className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.8)]"
          >
            <h3 className={`${DISPLAY} text-[1.6rem] font-bold leading-none`}>New simulation</h3>
            <p className="mt-2 text-[0.9rem] text-[var(--muted)]">
              Creates a cohort with the teams you choose, each starting at round 1.
            </p>
            <div className="mt-5 flex flex-col gap-4">
              <label className="block">
                <span className={fieldLabel}>Name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  placeholder="e.g. Fall 2026 MIS"
                  className={`w-full ${inputClass}`}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabel}>Tier</span>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className={`w-full ${selectClass}`}
                  >
                    <option value="UNDERGRAD">Undergraduate</option>
                    <option value="GRADUATE">Graduate</option>
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Teams</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={newTeams}
                    onChange={(e) => setNewTeams(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabel}>Students / team</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newTeamSize}
                    onChange={(e) => setNewTeamSize(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Round length (days)</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newDaysPerRound}
                    onChange={(e) => setNewDaysPerRound(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
              </div>
              <label className="block">
                <span className={fieldLabel}>
                  Faculty{newFaculty.length > 0 ? ` — ${newFaculty.length} selected` : " (assign later if none)"}
                </span>
                <div className="max-h-[132px] overflow-y-auto rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)]">
                  {(people.instructors ?? []).length === 0 ? (
                    <p className="px-3.5 py-3 text-[0.85rem] text-[var(--muted-dim)]">No instructors in the workspace yet.</p>
                  ) : (
                    (people.instructors ?? []).map((i) => {
                      const checked = newFaculty.includes(i.id);
                      return (
                        <label
                          key={i.id}
                          className={`flex cursor-pointer items-center gap-2.5 border-b border-[var(--steel-line)] px-3.5 py-2 transition-colors last:border-b-0 ${
                            checked ? "bg-[rgba(232,161,60,0.08)]" : "hover:bg-[var(--graphite-high)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFaculty(i.id)}
                            className="h-3.5 w-3.5 accent-[#E8A13C]"
                          />
                          <span
                            className={`text-[0.9rem] ${
                              checked ? "font-semibold text-[var(--paper)]" : "text-[var(--muted)]"
                            }`}
                          >
                            {i.username}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabel}>Timezone</span>
                  <select
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    className={`w-full ${selectClass}`}
                  >
                    {TZ_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Start date</span>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabel}>Enrollment capacity</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Price / student</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className={`w-full ${inputClass}`}
                  />
                </label>
              </div>
              <label className="block">
                <span className={fieldLabel}>Advisor rate / hour</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={newAdvisorRate}
                  onChange={(e) => setNewAdvisorRate(e.target.value)}
                  className={`w-full ${inputClass}`}
                />
                <span className={`mt-1.5 block ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>
                  Charged per started hour of advisor chat. 0 = advisors included.
                </span>
              </label>
              {createError ? (
                <p className="rounded-[2px] border border-[var(--signal-red)] bg-[rgba(210,86,75,0.12)] px-3 py-2.5 text-[0.85rem] text-[var(--paper)]">
                  {createError}
                </p>
              ) : null}
              <div className="mt-1 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className={ghostBtn}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`rounded-[2px] bg-[var(--amber)] px-5 py-2.5 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-60`}
                >
                  {creating ? "Creating\u2026" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !deleting && setDeleteModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.8)]"
          >
            <h3 className={`${DISPLAY} text-[1.6rem] font-bold leading-none`}>Delete simulation?</h3>
            <p className="mt-2 text-[0.9rem] leading-[1.55] text-[var(--muted)]">
              This will delete <span className="font-semibold text-[var(--paper)]">"{simToDelete?.name}"</span> and its{" "}
              {simToDelete?.teams} team(s). This action can't be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !deleting && setDeleteModalOpen(false)}
                disabled={deleting}
                className={`${ghostBtn} disabled:opacity-40`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className={`rounded-[2px] bg-[var(--signal-red)] px-5 py-2.5 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-white transition duration-150 hover:bg-[#DD685E] disabled:opacity-60`}
              >
                {deleting ? "Deleting\u2026" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}