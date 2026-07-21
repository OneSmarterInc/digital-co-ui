"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";

/* Left rail for the whole instructor cohort area — dark console theme,
 * modeled on the student console's .rail / .move-btn--on (near-black rail,
 * amber left bar on the active entry, mono kickers).
 *
 * Used two ways:
 *   - inside the detail page, with setSection driving the section switch
 *   - standalone on the deep-dive pages (Performance, Firm dashboards,
 *     Benchmarks), where section clicks navigate back to the detail page
 *     and the active Insights child is detected from the URL
 *
 * Every color is written as var(--token, #fallback), so the rail renders
 * correctly both inside the themed shell (vars present) and standalone on
 * pages that haven't been converted yet (fallbacks kick in).
 *
 * The Insights group expands/collapses via its chevron and auto-expands
 * whenever the Insights section or any of its child pages is active. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";

function Chevron({ open, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", transition: "transform 160ms ease", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const ITEM_ON =
  "bg-[var(--graphite-raised,#1E2228)] font-medium text-[var(--paper,#ECEFF2)]";
const ITEM_OFF =
  "text-[var(--muted,#8A94A0)] hover:bg-[var(--graphite-raised,#1E2228)] hover:text-[var(--paper,#ECEFF2)]";
const AMBER_BAR = "absolute bottom-0 left-0 top-0 w-[3px] bg-[var(--amber,#E8A13C)]";

export default function DetailSidebar({ section, setSection, queueCount, deploymentStatus }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const goSection = (key) => {
    if (setSection) {
      setSection(key);
    } else {
      router.push(`/instructor/${gameId}${key === "overview" ? "" : `?section=${key}`}`);
    }
  };

  const items = [
    ["overview", "Overview", null],
    ["grading", "Grading", queueCount],
    ["firms", "Firms", null],
    ["invitees", "Invitees", null],
    ["students", "Students", null],
    ["schedule", "Schedule", null],
    ["teaching", "Teaching Note", null],
  ];
  const insightsChildren = [
    ["Performance", `/instructor/${gameId}/performance`],
    ["Firm dashboards", `/instructor/${gameId}/kpis`],
    ["Benchmarks", `/instructor/${gameId}/benchmarks`],
  ];
  const activeChild = insightsChildren.find(([, href]) => pathname === href)?.[1] ?? null;
  const insightsActive = section === "insights" || !!activeChild;

  // Expanded whenever Insights or one of its pages is active; collapsible
  // any time via the chevron without leaving the current screen.
  const [insightsOpen, setInsightsOpen] = useState(insightsActive);
  useEffect(() => {
    if (insightsActive) setInsightsOpen(true);
  }, [insightsActive]);

  const deployLabel =
    { students: "Live for students", faculty: "Ready to deploy", draft: "Draft" }[deploymentStatus] || "Draft";
  const deployTone =
    {
      students: "var(--ok, #7FB08A)",
      faculty: "var(--blueprint, #5BA3C4)",
      draft: "var(--muted, #8A94A0)",
    }[deploymentStatus] || "var(--muted, #8A94A0)";
  const deployGlow = deploymentStatus === "students" ? "0 0 6px -1px var(--ok, #7FB08A)" : "none";

  return (
    <aside className="w-[230px] shrink-0 border-r border-[var(--steel-line,#2C323A)] bg-[#14171B] px-5 py-8 font-['IBM_Plex_Sans',system-ui,sans-serif]">
      <p className={`mb-4 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim,#5C6672)]`}>
        Manage
      </p>
      <nav className="flex flex-col gap-1">
        {items.map(([key, label, count]) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => goSection(key)}
              className={`relative flex items-center justify-between px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                active ? ITEM_ON : ITEM_OFF
              }`}
            >
              {active && <span className={AMBER_BAR} aria-hidden="true" />}
              <span>{label}</span>
              {typeof count === "number" && count > 0 ? (
                <span
                  className={`rounded-[2px] border border-[var(--amber-deep,#C4791F)] px-2 py-0.5 ${MONO} text-[9px] font-bold text-[var(--amber,#E8A13C)]`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Insights group: label navigates to the section, chevron only toggles */}
        <div>
          <div
            className={`relative flex items-center justify-between transition-colors ${
              insightsActive ? ITEM_ON : ITEM_OFF
            }`}
          >
            {insightsActive && <span className={AMBER_BAR} aria-hidden="true" />}
            <button onClick={() => goSection("insights")} className="min-w-0 flex-1 px-3 py-2.5 text-left text-[0.92rem]">
              Insights
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setInsightsOpen((v) => !v);
              }}
              aria-label={insightsOpen ? "Collapse insights" : "Expand insights"}
              aria-expanded={insightsOpen}
              className="flex h-8 w-8 flex-none items-center justify-center text-[var(--muted-dim,#5C6672)] transition hover:text-[var(--paper,#ECEFF2)]"
            >
              <Chevron open={insightsOpen} />
            </button>
          </div>

          {insightsOpen && (
            <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-[var(--steel-line,#2C323A)] pl-2">
              {insightsChildren.map(([label, href]) => {
                const childActive = activeChild === href;
                return (
                  <button
                    key={href}
                    onClick={() => !childActive && router.push(href)}
                    className={`relative px-3 py-2 text-left text-[0.85rem] transition-colors ${
                      childActive ? ITEM_ON : ITEM_OFF
                    }`}
                  >
                    {childActive && <span className={AMBER_BAR} aria-hidden="true" />}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      <p className={`mb-2 mt-8 px-3 ${MONO} text-[9.5px] uppercase tracking-[0.2em] text-[var(--muted-dim,#5C6672)]`}>
        Status
      </p>
      <div className="flex items-center gap-2 px-3">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: deployTone, boxShadow: deployGlow }} />
        <span className="text-[0.85rem]" style={{ color: deployTone }}>
          {deployLabel}
        </span>
      </div>
    </aside>
  );
}