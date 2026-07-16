"use client";

import { SCORE_SHORT } from "../_lib/helpers";
import { IconArrow } from "./icons";

/* Shared building blocks — dark console theme, var(--token, #fallback)
 * throughout so every component renders correctly inside the themed shell
 * and standalone. Everything here is presentational (no data fetching),
 * so views stay focused on their own actions and state.
 *
 * Console conventions encoded here once, inherited everywhere:
 *   panels     = graphite-raised, steel border, console shadow, 3px radius
 *   pills      = square-cornered bordered flags (color-mix border + wash)
 *   avatars    = bordered graphite squares with amber mono initials
 *   fill bars  = bordered graphite tracks, blueprint-deep default fill
 *   segments   = blueprint-deep done · glowing amber now · steel upcoming
 *                (the arc-track language from the student console)          */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";

export function ViewHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--steel-line,#2C323A)] pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted,#8A94A0)]`}>{eyebrow}</p>
        )}
        <h1 className={`${DISPLAY} text-[2.1rem] font-bold leading-none text-[var(--paper,#ECEFF2)]`}>{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[0.95rem] leading-[1.55] text-[var(--muted,#8A94A0)]">{subtitle}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[3px] border border-dashed border-[var(--steel-soft,#363E48)] px-6 py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-[2px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite-raised,#1E2228)] text-[var(--muted-dim,#5C6672)]">
        {icon}
      </span>
      <p className={`${DISPLAY} text-[19px] font-semibold text-[var(--paper,#ECEFF2)]`}>{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--muted,#8A94A0)]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, accent, pad }) {
  return (
    <div className={`p-5 ${PANEL}`}>
      <div className="flex items-start justify-between">
        <span className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>{label}</span>
        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[2px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] text-[var(--amber,#E8A13C)]">
          {icon}
        </span>
      </div>
      <div
        className={`mt-3 ${DISPLAY} text-[2.1rem] font-bold leading-none`}
        style={{ color: accent || "var(--paper, #ECEFF2)" }}
      >
        {pad ? (value < 10 ? `0${value}` : value) : value}
      </div>
    </div>
  );
}

export function MiniInfo({ label, value, sub }) {
  return (
    <div className={`p-4 ${PANEL}`}>
      <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>{label}</p>
      <p className={`mt-1.5 ${DISPLAY} text-[1.3rem] font-bold leading-tight text-[var(--paper,#ECEFF2)]`}>{value}</p>
      {sub && <p className={`mt-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>{sub}</p>}
    </div>
  );
}

export function AttentionCard({ tone, title, body, cta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] p-4 text-left transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)]"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-2 w-2 flex-none rounded-full"
          style={{ background: tone, boxShadow: `0 0 6px -1px ${tone}` }}
        />
        <div>
          <p className={`${DISPLAY} text-[15px] font-semibold text-[var(--paper,#ECEFF2)]`}>{title}</p>
          <p className="mt-0.5 text-[0.8rem] text-[var(--muted,#8A94A0)]">{body}</p>
        </div>
      </div>
      <span className={`flex-none ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em]`} style={{ color: tone }}>
        {cta}
      </span>
    </button>
  );
}

export function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className={`overflow-hidden ${PANEL}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div>
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight text-[var(--paper,#ECEFF2)]`}>{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function LinkCard({ icon, title, subtitle, onClick, tone = "var(--blueprint, #5BA3C4)" }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] p-6 text-left transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)]"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 flex-none place-items-center rounded-[2px] border"
          style={{
            background: `color-mix(in srgb, ${tone} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${tone} 45%, transparent)`,
            color: tone,
          }}
        >
          {icon}
        </span>
        <div>
          <h3 className={`${DISPLAY} text-[17px] font-semibold text-[var(--paper,#ECEFF2)]`}>{title}</h3>
          <p className="mt-0.5 text-sm text-[var(--muted,#8A94A0)]">{subtitle}</p>
        </div>
      </div>
      <span className="flex-none text-[var(--muted-dim,#5C6672)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--paper,#ECEFF2)]">
        <IconArrow size={18} />
      </span>
    </button>
  );
}

export function StatusPill({ label, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1 ${MONO} text-[9px] uppercase tracking-[0.1em]`}
      style={{
        color: tone,
        borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`,
        background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone, boxShadow: `0 0 6px -1px ${tone}` }} />
      {label}
    </span>
  );
}

export function MetaChip({ label, value }) {
  return (
    <span className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-1 ${MONO} text-[10px] uppercase tracking-[0.1em]`}>
      <span className="text-[var(--muted-dim,#5C6672)]">{label}</span>{" "}
      <span className="text-[var(--paper,#ECEFF2)]">{value}</span>
    </span>
  );
}

export function DeploymentBanner({ status, busy, onDeploy }) {
  if (status === "students") {
    return (
      <div className="flex items-center gap-2.5 rounded-[3px] border border-[#3f5e46] bg-[var(--graphite-raised,#1E2228)] px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-[var(--ok,#7FB08A)] shadow-[0_0_8px_-1px_var(--ok,#7FB08A)]" />
        <span className={`${MONO} text-[10.5px] uppercase tracking-[0.12em] text-[var(--ok,#7FB08A)]`}>Live for students</span>
        <span className="text-sm text-[var(--muted,#8A94A0)]">Students can log in and play this simulation.</span>
      </div>
    );
  }
  if (status === "faculty") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[var(--blueprint-deep,#3B7E9C)] bg-[var(--graphite-raised,#1E2228)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[var(--blueprint,#5BA3C4)]" />
          <span className="text-sm text-[var(--paper,#ECEFF2)]">
            Ready for students. Deploy to open enrollment and let them start.
          </span>
        </div>
        <button
          onClick={onDeploy}
          disabled={busy}
          className={`rounded-[2px] bg-[var(--amber,#E8A13C)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-60`}
        >
          {busy ? "Deploying…" : "Deploy for students"}
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] px-5 py-3.5">
      <span className="h-2 w-2 rounded-full bg-[var(--muted-dim,#5C6672)]" />
      <span className={`${MONO} text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>Draft</span>
      <span className="text-sm text-[var(--muted,#8A94A0)]">Waiting on an admin to deploy this simulation for faculty.</span>
    </div>
  );
}

export function Pill({ tone, children }) {
  const color = tone === "good" ? "var(--ok, #7FB08A)" : "var(--muted, #8A94A0)";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 ${MONO} text-[9px] uppercase tracking-[0.08em]`}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

export function Avatar({ text }) {
  return (
    <span
      className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[2px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] ${MONO} text-[10px] font-semibold text-[var(--amber,#E8A13C)]`}
    >
      {text}
    </span>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th
      className={`px-3 py-3 text-left ${MONO} text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--muted-dim,#5C6672)] ${className}`}
    >
      {children}
    </th>
  );
}

/* ---- newer shared bits used by the improved views ---- */

// A thin proportional fill bar. Used for capacity and paid ratios.
export function FillBar({ value, total, color = "var(--blueprint-deep, #3B7E9C)", track = "var(--graphite, #16191D)" }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-[1px] border border-[var(--steel-line,#2C323A)]" style={{ background: track }}>
      <div className="h-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// One segment per round — the console's arc-track language:
// completed = blueprint-deep, active = glowing amber, upcoming = steel.
export function SegmentedRounds({ rounds }) {
  return (
    <div className="flex gap-1">
      {rounds.map((r) => {
        const done = r.status === "Completed";
        const active = r.status === "Active";
        return (
          <div
            key={r.n}
            className="h-2 min-w-[6px] flex-1 rounded-[1px]"
            style={
              active
                ? {
                    background: "var(--amber, #E8A13C)",
                    boxShadow: "0 0 0 1px var(--amber-deep, #C4791F), 0 0 10px -1px var(--amber, #E8A13C)",
                  }
                : { background: done ? "var(--blueprint-deep, #3B7E9C)" : "var(--steel-line, #2C323A)" }
            }
            title={`Round ${r.n} · ${r.status}${r.extended_days > 0 ? ` (+${r.extended_days}d)` : ""}`}
          />
        );
      })}
    </div>
  );
}

// Received vs pending split for billing: ok green vs blueprint.
export function BillingBar({ received, pending }) {
  const total = (received || 0) + (pending || 0);
  const rPct = total ? Math.round((received / total) * 100) : 0;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-[1px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)]">
      <div className="h-full bg-[var(--ok,#7FB08A)]" style={{ width: `${rPct}%` }} />
      <div className="h-full bg-[var(--blueprint,#5BA3C4)]" style={{ width: `${total ? 100 - rPct : 0}%` }} />
    </div>
  );
}

// Compact engine-score readout for a submission row.
export function ScoreChips({ scores }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(SCORE_SHORT).map(([key, label]) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] px-2 py-1 ${MONO} text-[8.5px] uppercase tracking-[0.06em] text-[var(--muted-dim,#5C6672)]`}
        >
          {label}
          <span className="font-bold text-[var(--paper,#ECEFF2)]">{scores?.[key] ?? "—"}</span>
        </span>
      ))}
    </div>
  );
}

// Dot + label legend. Pass items as [color, label] pairs.
export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map(([color, label]) => (
        <span key={label} className={`inline-flex items-center gap-1.5 ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)]`}>
          <span className="h-2 w-2 rounded-[1px]" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}