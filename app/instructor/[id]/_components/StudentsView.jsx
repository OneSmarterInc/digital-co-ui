"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtMoney, billingOf, initials, groupsOf } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { ViewHeader, MiniInfo, Avatar, Pill, Th, EmptyState, FillBar, BillingBar, Legend } from "./ui";
import { IconUsers, IconDownload } from "./icons";

/* Students view — dark console theme, var(--token, #fallback) throughout.
 * The enrolled roster and everything money-shaped about it: capacity, seat
 * billing, advisor charges, filters, inline firm moves, and CSV export.
 * Click a student to open their detail page (profile, block, password reset).
 * Invitations live in the Invitees section.
 *
 * Console vocabulary: ok green = paid / received money, blueprint = pending
 * money and links (student names link to detail pages), FIRM_TONES = the
 * shared console firm colors replacing helpers' FIRM_COLORS.
 * All handlers, filters, and the CSV export unchanged. */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const INPUT =
  "rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-[var(--paper,#ECEFF2)] outline-none transition duration-150 placeholder:text-[var(--muted-dim,#5C6672)] focus:border-[var(--blueprint,#5BA3C4)] focus:bg-[var(--graphite-high,#252B32)]";

export default function StudentsView({ gameId, detail, reload, notify }) {
  const router = useRouter();
  const students = detail.students ?? [];
  const capacity = detail.enrollment_capacity ?? 0;
  const billing = billingOf(detail);
  const firms = useMemo(() => (detail.firms ?? []).slice().sort((a, b) => a.number - b.number), [detail.firms]);
  const groups = useMemo(() => groupsOf(detail), [detail]);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [firmFilter, setFirmFilter] = useState("all");

  // Advisor rate is editable mid-run: already-billed hours keep the rate they
  // were charged at, so this only prices hours from here on.
  const [rateOpen, setRateOpen] = useState(false);
  const [rateDraft, setRateDraft] = useState(String(detail.advisor_hourly_rate ?? 0));

  const openRate = () => {
    setRateDraft(String(detail.advisor_hourly_rate ?? 0));
    setRateOpen(true);
  };

  const saveRate = async () => {
    const next = Number(rateDraft);
    if (!Number.isInteger(next) || next < 0 || next > 100000) {
      notify("Enter a whole number between 0 and 100000.");
      return;
    }
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/`,
      opts: { ...jsonPost({ advisor_hourly_rate: next }), method: "PATCH" },
      label: `Advisor rate set to ${fmtMoney(next)}/hr`,
      reload,
      notify,
    });
    setBusy(false);
    setRateOpen(false);
  };

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
  const pct = capacity ? Math.min(100, Math.round((students.length / capacity) * 100)) : 0;
  const seatsOpen = Math.max(0, capacity - students.length);
  const hasAdvisorBilling = (billing.advisor_billed ?? 0) > 0 || (billing.advisor_hourly_rate ?? 0) > 0;

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

  const doBulkPaid = async (paid) => {
    if (filtered.length === 0) return;
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/enrollments/paid/`,
      opts: jsonPost({ paid, enrollment_ids: filtered.map((s) => s.enrollment_id) }),
      label: `${filtered.length} student${filtered.length === 1 ? "" : "s"} marked ${paid ? "paid" : "unpaid"}`,
      reload,
      notify,
    });
    setBusy(false);
  };

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      [
        "Name", "Email", "Firm", "Payment",
        "Advisor hours", "Advisor due",
        "Group hours", "Group due", "1:1 hours", "1:1 due",
      ],
      ...filtered.map((s) => [
        s.name,
        s.email,
        s.firm ?? "Unassigned",
        s.paid ? "Paid" : "Unpaid",
        s.advisor_hours ?? 0,
        s.advisor_due ?? 0,
        s.group_hours ?? 0,
        s.group_due ?? 0,
        (s.advisor_hours ?? 0) - (s.group_hours ?? 0),
        (s.advisor_due ?? 0) - (s.group_due ?? 0),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(detail.name || "cohort").replace(/\s+/g, "-").toLowerCase()}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Roster exported ✓");
  }

  const filtersActive = q.trim() !== "" || payFilter !== "all" || firmFilter !== "all";

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Roster"
        title="Students"
        subtitle="Everyone enrolled in this cohort. Click a student for their full detail page, or manage firms and payment inline."
        action={
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className={`flex items-center gap-2 rounded-[2px] border border-[var(--steel-line,#2C323A)] px-4 py-2 ${MONO} text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--paper,#ECEFF2)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)] disabled:opacity-50`}
          >
            <IconDownload size={14} /> Export CSV
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <div className={`p-5 ${PANEL}`}>
          <div className="flex items-center justify-between">
            <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Enrollment</p>
            <span className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)]`}>
              {pct}% full
            </span>
          </div>
          <p className={`mt-1.5 ${DISPLAY} text-[2rem] font-bold leading-none`}>
            {students.length}
            <span className="text-[var(--muted-dim,#5C6672)]"> / {capacity}</span>
          </p>
          <div className="mt-3.5">
            <FillBar value={students.length} total={capacity} />
          </div>
          <p className={`mt-2 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
            {seatsOpen} seat{seatsOpen === 1 ? "" : "s"} open
          </p>
        </div>

        <div className={`p-5 ${PANEL}`}>
          <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Billing</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className={`${DISPLAY} text-[2rem] font-bold leading-none text-[var(--ok,#7FB08A)]`}>{fmtMoney(billing.received)}</p>
            <p className={`${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
              of {fmtMoney(billing.total_billed)} billed
            </p>
          </div>
          <div className="mt-3.5">
            <BillingBar received={billing.received} pending={billing.pending} />
          </div>
          <div className="mt-2.5">
            <Legend
              items={[
                ["var(--ok, #7FB08A)", `Received ${fmtMoney(billing.received)}`],
                ["var(--blueprint, #5BA3C4)", `Pending ${fmtMoney(billing.pending)}`],
              ]}
            />
          </div>
          {hasAdvisorBilling && (
            <>
              <p className={`mt-2 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                incl. advisor time: {billing.advisor_hours ?? 0}h · {fmtMoney(billing.advisor_billed ?? 0)} at {fmtMoney(billing.advisor_hourly_rate ?? 0)}/hr
              </p>
              {/* War-room hours bill per advisor seated, so they cost a multiple of
                  a 1:1 hour — split out rather than buried in the total above. */}
              <p className={`mt-1 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                of which group chat: {billing.group_hours ?? 0}h · {fmtMoney(billing.group_billed ?? 0)}
                {" · "}1:1 {(billing.advisor_hours ?? 0) - (billing.group_hours ?? 0)}h ·{" "}
                {fmtMoney((billing.advisor_billed ?? 0) - (billing.group_billed ?? 0))}
              </p>
            </>
          )}

          {/* Always offered, including at rate 0 — turning advisor billing on
              partway through a term is the same edit as correcting a rate. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!rateOpen ? (
              <>
                <span className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
                  Advisor rate {fmtMoney(detail.advisor_hourly_rate ?? 0)}/hr
                </span>
                <button
                  onClick={openRate}
                  disabled={busy}
                  className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2 py-1 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:text-[var(--paper,#ECEFF2)] disabled:opacity-50`}
                >
                  Edit rate
                </button>
              </>
            ) : (
              <>
                <label
                  htmlFor="advisor-rate"
                  className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}
                >
                  Advisor rate $
                </label>
                <input
                  id="advisor-rate"
                  value={rateDraft}
                  onChange={(e) => setRateDraft(e.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRate();
                    if (e.key === "Escape") setRateOpen(false);
                  }}
                  inputMode="numeric"
                  autoFocus
                  className={`h-7 w-[90px] px-2 text-[0.8rem] ${INPUT}`}
                />
                <span className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
                  / hr
                </span>
                <button
                  onClick={saveRate}
                  disabled={busy}
                  className={`rounded-[2px] border border-[var(--amber-deep,#C4791F)] px-2 py-1 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--amber,#E8A13C)] transition hover:bg-[var(--graphite-high,#252B32)] disabled:opacity-50`}
                >
                  {busy ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setRateOpen(false)}
                  disabled={busy}
                  className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)] underline-offset-2 hover:underline disabled:opacity-50`}
                >
                  Cancel
                </button>
                <span className={`${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                  Applies to new hours — hours already billed keep their old rate
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Enrolled" value={students.length} sub={`of ${capacity} seats`} />
        <MiniInfo label="Paid" value={paid} sub={`${students.length - paid} unpaid`} />
        <MiniInfo label="In firms" value={inFirms} sub={`${students.length - inFirms} unassigned`} />
        <MiniInfo label="Showing" value={filtered.length} sub={filtersActive ? "filtered" : "all students"} />
      </div>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${PANEL}`}>
        <input
          className={`h-10 min-w-[220px] flex-1 px-3.5 text-[0.9rem] ${INPUT}`}
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search students"
        />
        <select
          className={`h-10 px-2.5 text-[0.8rem] [color-scheme:dark] ${INPUT}`}
          value={payFilter}
          onChange={(e) => setPayFilter(e.target.value)}
          aria-label="Filter by payment"
        >
          <option value="all">All payments</option>
          <option value="paid">Paid only</option>
          <option value="unpaid">Unpaid only</option>
        </select>
        <select
          className={`h-10 px-2.5 text-[0.8rem] [color-scheme:dark] ${INPUT}`}
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
            className={`${MONO} text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)] transition hover:text-[var(--paper,#ECEFF2)]`}
          >
            Clear
          </button>
        )}
        <span className="mx-1 hidden h-6 w-px bg-[var(--steel-line,#2C323A)] sm:block" />
        <button
          onClick={() => doBulkPaid(true)}
          disabled={busy || filtered.length === 0}
          className={`rounded-[2px] border border-[#3f5e46] px-3.5 py-2 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--ok,#7FB08A)] transition hover:bg-[rgba(127,176,138,0.1)] disabled:opacity-50`}
        >
          Mark {filtersActive ? "shown" : "all"} paid
        </button>
        <button
          onClick={() => doBulkPaid(false)}
          disabled={busy || filtered.length === 0}
          className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-3.5 py-2 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)] hover:text-[var(--paper,#ECEFF2)] disabled:opacity-50`}
        >
          Mark {filtersActive ? "shown" : "all"} unpaid
        </button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} />}
          title="No students yet"
          message="Invite students from the Invitees tab and they will show up here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} />}
          title="No matches"
          message="No students match the current search and filters. Clear them to see the full roster."
        />
      ) : (
        <div className={`overflow-hidden ${PANEL}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--steel-line,#2C323A)]">
                  <Th className="pl-6">Student</Th>
                  <Th>Email</Th>
                  <Th>Firm</Th>
                  <Th>Advisor</Th>
                  <Th className="pr-6">Payment</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const color = s.firm_index == null ? "var(--muted, #8A94A0)" : FIRM_TONES[s.firm_index % FIRM_TONES.length];
                  const hours = s.advisor_hours ?? 0;
                  const due = s.advisor_due ?? 0;
                  const groupHours = s.group_hours ?? 0;
                  const groupDue = s.group_due ?? 0;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-[var(--steel-line,#2C323A)] transition last:border-b-0 hover:bg-[var(--graphite-high,#252B32)]"
                    >
                      <td className="py-3 pl-6 pr-3">
                        <button
                          onClick={() => router.push(`/instructor/${gameId}/students/${s.enrollment_id}`)}
                          title={`Open ${s.name}'s detail page`}
                          className="group flex min-w-0 items-center gap-3 text-left"
                        >
                          <Avatar text={initials(s.name)} />
                          <span className="truncate text-[0.95rem] font-semibold underline-offset-2 transition group-hover:text-[var(--blueprint,#5BA3C4)] group-hover:underline">
                            {s.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`${MONO} text-[11px] text-[var(--muted,#8A94A0)]`}>{s.email}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                          <select
                            className={`h-8 w-[138px] px-2 text-[0.75rem] [color-scheme:dark] ${INPUT}`}
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
                      <td className="px-3 py-3">
                        <span className={`${MONO} text-[11px] text-[var(--muted,#8A94A0)]`}>
                          {hours > 0 ? `${hours}h · ${fmtMoney(due)}` : "—"}
                        </span>
                        {groupHours > 0 && (
                          <span
                            className={`block ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}
                            title="War-room hours, billed once per advisor in the room"
                          >
                            group {groupHours}h · {fmtMoney(groupDue)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-6">
                        <button
                          onClick={() => doPaid(s.enrollment_id, !s.paid)}
                          disabled={busy}
                          title={s.paid ? "Click to mark unpaid" : "Click to mark paid"}
                          className="group rounded-[2px] transition hover:ring-2 hover:ring-[rgba(127,176,138,0.3)] disabled:opacity-50"
                        >
                          <Pill tone={s.paid ? "good" : "muted"}>
                            {s.paid ? "Paid" : "Unpaid"}
                            <span className={`hidden ${MONO} text-[8px] normal-case tracking-normal opacity-70 group-hover:inline`}>
                              · {s.paid ? "undo" : "mark"}
                            </span>
                          </Pill>
                        </button>
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
  );
}