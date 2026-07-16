"use client";

import { useMemo, useState } from "react";
import { statusOf, closesIn, fmtMoney, groupsOf } from "../_lib/helpers";
import { runAction } from "../_lib/actions";
import { StatCard, StatusPill, DeploymentBanner, AttentionCard, SectionCard, SegmentedRounds, FillBar } from "./ui";
import { IconPlay, IconKey, IconUsers, IconGrid, IconCard, IconAlert, IconClipboard, IconTrendUp, IconClock, IconCheck } from "./icons";
import { ConfirmModal } from "./modals";

/* Overview — dark console theme, var(--token, #fallback) throughout.
 * Console semantics: amber = the primary action (Advance round) and
 * anything waiting on you (grading), ok green = paid / all clear,
 * blueprint = informational (unpaid follow-up, completion %),
 * FIRM_TONES = the shared console firm colors (replacing helpers'
 * FIRM_COLORS, which was picked for white backgrounds).
 * All handlers, the advance confirm, and deploy flow unchanged. */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";

export default function OverviewView({ detail, queue, gameId, rounds, reload, notify, setSection }) {
  const status = statusOf(detail);
  const students = detail.students ?? [];
  const enrolled = students.length;
  const inFirms = students.filter((s) => s.firm).length;
  const paid = students.filter((s) => s.paid).length;
  const unpaid = enrolled - paid;
  const capacity = detail.enrollment_capacity ?? 0;
  const groups = useMemo(() => groupsOf(detail).filter((g) => g.name !== "Unassigned"), [detail]);

  const total = detail.total_rounds || rounds.length || 0;
  const current = detail.current_round || 1;
  const completed = rounds.filter((r) => r.status === "Completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const remaining = Math.max(0, total - completed);
  const deadline = closesIn(rounds[current - 1]?.end);
  const atMax = current >= total;
  const runComplete = Boolean(detail.completed);
  // At the final round the control finalizes the run rather than advancing; once
  // every firm is complete there's nothing left to do.
  const finalizing = atMax && !runComplete;

  const [busy, setBusy] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);

  async function act(path, label) {
    setBusy(true);
    await runAction({ path, opts: { method: "POST" }, label, reload, notify });
    setBusy(false);
  }
  const doAdvance = () => {
    setConfirmAdvance(false);
    act(
      `/instructor/simulations/${gameId}/advance-round/`,
      finalizing ? "Simulation completed" : "Round advanced",
    );
  };
  const doDeploy = () => act(`/instructor/simulations/${gameId}/deploy-students/`, "Deployed to students");

  // Static provisioning, shown once here so nothing is duplicated up top.
  const details = [
    ["Tier", detail.tier ?? "—"],
    ["Time zone", detail.timezone || "UTC"],
    ["Start date", detail.start_date || "Not set"],
    ["Round length", `${detail.days_per_round ?? 7} days`],
    ["Price / student", fmtMoney(detail.price_per_student ?? 0)],
    ["Advisor rate / hr", fmtMoney(detail.advisor_hourly_rate ?? 0)],
  ];

  return (
    <div className="space-y-6 text-[var(--paper,#ECEFF2)]">
      {/* hero */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={`${DISPLAY} text-[2.6rem] font-bold leading-none`}>{detail.name}</h1>
            <StatusPill label={status.label} tone={status.tone} />
          </div>
          <p className="mt-3 max-w-2xl text-[0.98rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
            Where this cohort stands right now, run progress, enrollment, billing, and anything waiting on you. Firm changes lock during
            active rounds.
          </p>
        </div>
        <button
          onClick={() => setConfirmAdvance(true)}
          disabled={busy || runComplete}
          className={`flex flex-none items-center gap-2 rounded-[2px] bg-[var(--amber,#E8A13C)] px-5 py-2.5 ${DISPLAY} text-[15px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50`}
        >
          <IconPlay size={14} /> {runComplete ? "Simulation complete" : finalizing ? "Complete simulation" : "Advance round"}
        </button>
      </div>

      <DeploymentBanner status={detail.deployment_status} busy={busy} onDeploy={doDeploy} />

      {/* the numbers */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<IconKey size={16} />} label="Capacity" value={capacity} />
        <StatCard icon={<IconUsers size={16} />} label="Enrolled" value={enrolled} pad />
        <StatCard icon={<IconGrid size={16} />} label="In firms" value={inFirms} pad />
        <StatCard icon={<IconCard size={16} />} label="Paid" value={paid} pad accent="var(--ok, #7FB08A)" />
        <StatCard icon={<IconAlert size={16} />} label="Unpaid" value={unpaid} pad />
        <StatCard
          icon={<IconClipboard size={16} />}
          label="Waiting to grade"
          value={queue.length}
          pad
          accent={queue.length ? "var(--amber, #E8A13C)" : undefined}
        />
      </div>

      {/* main grid: progress + firms on the left, attention + details on the right */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className={`p-6 ${PANEL}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`flex items-center gap-1.5 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim,#5C6672)]`}>
                  <IconTrendUp size={13} /> Run progress
                </p>
                <p className={`mt-1.5 ${DISPLAY} text-[2rem] font-bold leading-none`}>
                  Round <span className="text-[var(--amber,#E8A13C)]">{current}</span>{" "}
                  <span className="text-[var(--muted-dim,#5C6672)]">of {total}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`${MONO} text-[1.7rem] font-semibold leading-none text-[var(--blueprint,#5BA3C4)]`}>{pct}%</p>
                <p className={`mt-1 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>complete</p>
              </div>
            </div>
            <div className="mt-4">
              <SegmentedRounds rounds={rounds} />
            </div>
            <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={12} /> {deadline || "no active deadline"}
              </span>
              <span>
                {remaining} round{remaining === 1 ? "" : "s"} remaining
              </span>
            </div>
          </div>

          <SectionCard
            title="Firms"
            subtitle={`${groups.length} firm${groups.length === 1 ? "" : "s"} · ${inFirms} of ${enrolled} students placed`}
            action={
              <button
                onClick={() => setSection("firms")}
                className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-3 py-1.5 ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--paper,#ECEFF2)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)]`}
              >
                Manage
              </button>
            }
          >
            {groups.length === 0 ? (
              <div className="border-t border-[var(--steel-line,#2C323A)] px-6 py-8 text-center text-sm text-[var(--muted,#8A94A0)]">
                No firms have students yet.
              </div>
            ) : (
              <div className="border-t border-[var(--steel-line,#2C323A)]">
                {groups.map((grp) => {
                  const color = FIRM_TONES[grp.index % FIRM_TONES.length];
                  const paidInFirm = grp.members.filter((m) => m.paid).length;
                  return (
                    <div
                      key={grp.name}
                      className="flex items-center gap-4 border-b border-[var(--steel-line,#2C323A)] px-6 py-3 last:border-b-0"
                    >
                      <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
                      <span className={`w-24 flex-none truncate ${DISPLAY} text-[15px] font-semibold sm:w-28`}>{grp.name}</span>
                      <div className="min-w-[60px] flex-1">
                        <FillBar value={paidInFirm} total={grp.members.length} color={color} />
                      </div>
                      <span className={`hidden flex-none whitespace-nowrap ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)] sm:inline`}>
                        {grp.members.length} member{grp.members.length === 1 ? "" : "s"} · {paidInFirm} paid
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Needs attention">
            <div className="space-y-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-5">
              {queue.length === 0 && unpaid === 0 ? (
                <div className="flex items-center gap-2.5 text-sm text-[var(--muted,#8A94A0)]">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-[2px] border border-[#3f5e46] bg-[var(--graphite,#16191D)] text-[var(--ok,#7FB08A)]">
                    <IconCheck size={14} />
                  </span>
                  Nothing needs you right now.
                </div>
              ) : (
                <>
                  {queue.length > 0 && (
                    <AttentionCard
                      tone="var(--amber, #E8A13C)"
                      title={`${queue.length} week${queue.length === 1 ? "" : "s"} to grade`}
                      body="Submitted rounds are waiting on you."
                      cta="Grade"
                      onClick={() => setSection("grading")}
                    />
                  )}
                  {unpaid > 0 && (
                    <AttentionCard
                      tone="var(--blueprint, #5BA3C4)"
                      title={`${unpaid} student${unpaid === 1 ? "" : "s"} unpaid`}
                      body="Payment is still outstanding."
                      cta="Students"
                      onClick={() => setSection("students")}
                    />
                  )}
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Cohort details" subtitle="How this sim was provisioned.">
            <dl className="border-t border-[var(--steel-line,#2C323A)]">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 border-b border-[var(--steel-line,#2C323A)] px-6 py-3 last:border-b-0"
                >
                  <dt className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>{label}</dt>
                  <dd className="text-sm font-semibold text-[var(--paper,#ECEFF2)]">{value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </div>

      {confirmAdvance && (
        <ConfirmModal
          title={finalizing ? "Complete the simulation?" : "Advance to the next round?"}
          body={
            finalizing ? (
              <p>
                This closes out <strong className="text-[var(--paper,#ECEFF2)]">R{current}</strong>, the final round, and marks every
                firm&apos;s run complete — unlocking the debrief and final standings. This can&apos;t be undone.
              </p>
            ) : (
              <p>
                This locks decisions for <strong className="text-[var(--paper,#ECEFF2)]">R{current}</strong>, runs the simulation, and opens{" "}
                <strong className="text-[var(--paper,#ECEFF2)]">R{current + 1}</strong>. This can&apos;t be undone.
              </p>
            )
          }
          confirmLabel={busy ? (finalizing ? "Completing…" : "Advancing…") : finalizing ? "Complete simulation" : "Advance round"}
          busy={busy}
          onCancel={() => setConfirmAdvance(false)}
          onConfirm={doAdvance}
        />
      )}
    </div>
  );
}