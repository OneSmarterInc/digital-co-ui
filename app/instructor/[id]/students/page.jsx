"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// One level deeper than the detail page, so one more hop up to the api client.
import { fetchMe, api, logout } from "../../../../lib/api";
import { initials, FIRM_COLORS, groupsOf } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { ViewHeader, MiniInfo, Avatar, Pill, Th, EmptyState } from "../_components/ui";
import { IconBack, IconUsers, IconDownload } from "../_components/icons";

/* ================================================================== *
 * Cohort student roster: /instructor/[id]/students
 * Full list of enrolled students with search, payment and firm filters,
 * inline firm reassignment, and a CSV export of whatever is filtered.
 * Reads the same detail payload as the detail page; the only write is
 * the existing enrollment move endpoint.
 * ================================================================== */

export default function CohortStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState("all"); // all | paid | unpaid
  const [firmFilter, setFirmFilter] = useState("all"); // all | unassigned | firm name

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const load = useCallback(async () => {
    const res = await api(`/instructor/simulations/${gameId}/`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    setDetail(await res.json());
  }, [gameId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) {
            setPhase("redirect");
            router.replace("/login");
          }
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

  function signOut() {
    logout();
    router.replace("/login");
  }

  const students = detail?.students ?? [];
  const firms = useMemo(() => (detail?.firms ?? []).slice().sort((a, b) => a.number - b.number), [detail?.firms]);
  const groups = useMemo(() => (detail ? groupsOf(detail) : []), [detail]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students
      .filter((s) => {
        if (payFilter === "paid" && !s.paid) return false;
        if (payFilter === "unpaid" && s.paid) return false;
        if (firmFilter === "unassigned" && s.firm) return false;
        if (firmFilter !== "all" && firmFilter !== "unassigned" && s.firm !== firmFilter) return false;
        if (needle && !`${s.name} ${s.email}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [students, q, payFilter, firmFilter]);

  const paid = students.filter((s) => s.paid).length;
  const inFirms = students.filter((s) => s.firm).length;

  const doMove = async (enrollmentId, firmNumber, label) => {
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/enrollments/${enrollmentId}/move/`,
      opts: jsonPost({ firm_number: firmNumber }),
      label: firmNumber === 0 ? "Student unassigned" : `Moved to ${label}`,
      reload,
      notify,
    });
    setBusy(false);
  };

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Email", "Firm", "Payment"],
      ...filtered.map((s) => [s.name, s.email, s.firm ?? "Unassigned", s.paid ? "Paid" : "Unpaid"]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(detail?.name || "cohort").replace(/\s+/g, "-").toLowerCase()}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Roster exported ✓");
  }

  if (phase !== "ready" || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="font-mono text-[0.8rem] uppercase tracking-[0.16em] text-muted">
          {phase === "error"
            ? `Couldn't load this cohort. ${error ?? ""}`
            : phase === "redirect"
              ? "Redirecting…"
              : "Loading students…"}
        </p>
      </div>
    );
  }

  const filtersActive = q.trim() !== "" || payFilter !== "all" || firmFilter !== "all";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white/85 px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}`)}
            aria-label="Back to cohort"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors hover:border-linestrong hover:text-ink"
          >
            <IconBack size={16} />
          </button>
          <span className="h-2 w-2 rounded-full bg-go shadow-[0_0_0_3px_rgba(26,128,79,0.18)]" aria-hidden="true" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="flex items-baseline gap-2 font-display text-[1.15rem] font-semibold tracking-[0.03em]">
              <span>FLEXEE</span>
              <span className="font-normal text-faint">·</span>
              <span className="text-[var(--amber,#E8A13C)]">DigitalCo</span>
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">Instructor</span>
            <span className="text-faint">/</span>
            <span className="truncate font-display text-[1.05rem] font-semibold">{detail.name}</span>
            <span className="text-faint">/</span>
            <span className="font-display text-[1.05rem] font-semibold text-muted">Students</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted sm:inline">{me.first_name || me.username}</span>
          <button
            onClick={signOut}
            className="rounded-md border border-line px-4 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-linestrong hover:bg-panel2"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="mx-auto max-w-[920px] space-y-7">
          <ViewHeader
            eyebrow="Roster"
            title="Students"
            subtitle={`Everyone enrolled in ${detail.name}. Search, filter, reassign firms inline, or export the current view as CSV.`}
            action={
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 rounded-md border border-line px-4 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-linestrong hover:bg-panel2 disabled:opacity-50"
              >
                <IconDownload size={14} /> Export CSV
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniInfo label="Enrolled" value={students.length} sub={`of ${detail.enrollment_capacity ?? 0} seats`} />
            <MiniInfo label="Paid" value={paid} sub={`${students.length - paid} unpaid`} />
            <MiniInfo label="In firms" value={inFirms} sub={`${students.length - inFirms} unassigned`} />
            <MiniInfo label="Showing" value={filtered.length} sub={filtersActive ? "filtered" : "all students"} />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-panel p-4">
            <input
              className="h-10 min-w-[220px] flex-1 rounded-md border border-line bg-white px-3.5 text-[0.9rem] text-ink outline-none transition placeholder:text-faint focus:border-go focus:ring-2 focus:ring-go/25"
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search students"
            />
            <select
              className="h-10 rounded-md border border-line bg-white px-2.5 text-[0.8rem] text-ink outline-none focus:border-go"
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
              aria-label="Filter by payment"
            >
              <option value="all">All payments</option>
              <option value="paid">Paid only</option>
              <option value="unpaid">Unpaid only</option>
            </select>
            <select
              className="h-10 rounded-md border border-line bg-white px-2.5 text-[0.8rem] text-ink outline-none focus:border-go"
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              aria-label="Filter by firm"
            >
              <option value="all">All firms</option>
              <option value="unassigned">Unassigned</option>
              {groups
                .filter((g) => g.name !== "Unassigned")
                .map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
            </select>
            {filtersActive && (
              <button
                onClick={() => {
                  setQ("");
                  setPayFilter("all");
                  setFirmFilter("all");
                }}
                className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-muted transition hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <EmptyState
              icon={<IconUsers size={22} />}
              title="No students yet"
              message="Invite students from the Enrollment tab and they will show up here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<IconUsers size={22} />}
              title="No matches"
              message="No students match the current search and filters. Clear them to see the full roster."
            />
          ) : (
            <div className="overflow-hidden rounded-md border border-line bg-panel shadow-[0_1px_2px_rgba(24,35,47,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <Th className="pl-6">Student</Th>
                      <Th>Email</Th>
                      <Th>Firm</Th>
                      <Th className="pr-6">Payment</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const color = s.firm_index == null ? "var(--color-muted)" : FIRM_COLORS[s.firm_index % FIRM_COLORS.length];
                      return (
                        <tr key={s.id} className="border-b border-line transition last:border-b-0 hover:bg-panel2/60">
                          <td className="py-3 pl-6 pr-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar text={initials(s.name)} />
                              <span className="truncate font-display font-semibold">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-[0.72rem] text-muted">{s.email}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                              <select
                                className="h-8 w-[138px] rounded-md border border-line bg-white px-2 text-[0.75rem] text-ink outline-none focus:border-go"
                                value={s.firm_index == null ? 0 : s.firm_index + 1}
                                onChange={(e) =>
                                  doMove(
                                    s.enrollment_id,
                                    Number(e.target.value),
                                    firms.find((f) => f.number === Number(e.target.value))?.name
                                  )
                                }
                                disabled={busy}
                                aria-label={`Assign firm for ${s.name}`}
                              >
                                <option value={0}>Unassigned</option>
                                {firms.map((t) => (
                                  <option key={t.number} value={t.number}>
                                    {t.name ?? `Firm ${t.number}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="py-3 pl-3 pr-6">
                            <Pill tone={s.paid ? "good" : "muted"}>{s.paid ? "Paid" : "Unpaid"}</Pill>
                          </td>
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

      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      )}
    </div>
  );
}