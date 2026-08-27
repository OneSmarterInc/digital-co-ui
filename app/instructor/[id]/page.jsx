"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// Adjust to wherever your api client lives.
import { fetchMe, api, logout } from "../../../lib/api";
import { closesIn, deriveRounds } from "./_lib/helpers";

import DetailSidebar from "./_components/DetailSidebar";
import OverviewView from "./_components/OverviewView";
import GradingView from "./_components/GradingView";
import FirmsView from "./_components/FirmsView";
import InviteesView from "./_components/InviteesView";
import StudentsView from "./_components/StudentsView";
import ScheduleView from "./_components/ScheduleView";
import InsightsView from "./_components/InsightsView";
import TeachingNoteView from "./_components/TeachingNoteView";
import { IconBack } from "./_components/icons";

/* ================================================================== *
 * Instructor simulation detail — dark console theme shell + adapter.
 *
 * The child view components (DetailSidebar, OverviewView, …) still use
 * light-theme utility classes (bg-panel, text-ink, font-display, …).
 * On Tailwind v4 those compile to var(--color-panel), var(--color-ink),
 * var(--font-display), etc. — so instead of editing every child, this
 * wrapper REDEFINES those theme tokens to console values. Every child
 * goes dark automatically:
 *
 *   bg-panel   → graphite-raised      text-ink   → paper
 *   bg-panel2  → graphite-high        text-muted → console muted
 *   border-line→ steel-line           text-go    → ok green
 *   caution    → amber                alarm      → signal red
 *   font-display → Saira Condensed    font-mono  → IBM Plex Mono
 *
 * Two utilities can't be re-tokened cleanly (bg-white and bg-ink are
 * one physical color serving two jobs), so the scoped <style> below
 * handles them: bg-white surfaces (inputs, dropdowns) become graphite,
 * and bg-ink elements (dark badges / "Set up"-style buttons) become
 * amber with dark text — the console's primary-action treatment.
 *
 * All data flow, URL-driven section state, and handlers unchanged.
 * ================================================================== */

const THEME = {
  /* console palette */
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

  /* ---- adapter: remap the light theme's Tailwind v4 tokens ---- */
  "--color-panel": "#1E2228",
  "--color-panel2": "#252B32",
  "--color-ink": "#ECEFF2",
  "--color-muted": "#8A94A0",
  "--color-faint": "#5C6672",
  "--color-line": "#2C323A",
  "--color-linestrong": "#363E48",
  "--color-go": "#7FB08A",
  "--color-caution": "#E8A13C",
  "--color-alarm": "#D2564B",
  "--color-neutral": "#8A94A0",
  "--font-display": "'Saira Condensed', sans-serif",
  "--font-mono": "'IBM Plex Mono', ui-monospace, monospace",
  "--font-sans": "'IBM Plex Sans', system-ui, sans-serif",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

const VALID_SECTIONS = new Set(["overview", "grading", "firms", "invitees", "students", "schedule", "insights", "teaching"]);

export default function SimulationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [queue, setQueue] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Section is derived from the URL; unknown values fall back to overview.
  const rawSection = searchParams.get("section") ?? "overview";
  const section = VALID_SECTIONS.has(rawSection) ? rawSection : "overview";

  const setSection = useCallback(
    (key) => {
      const next = VALID_SECTIONS.has(key) ? key : "overview";
      const qs = next === "overview" ? "" : `?section=${next}`;
      // replace, not push: flipping sidebar entries shouldn't pile up history,
      // but refresh and shared links still land on the right view.
      router.replace(`/instructor/${gameId}${qs}`, { scroll: false });
    },
    [router, gameId]
  );

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const load = useCallback(async () => {
    const res = await api(`/instructor/simulations/${gameId}/`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const d = await res.json();
    setDetail(d);
    try {
      // Scope the grading queue to this simulation server-side (an instructor
      // may teach several). The whole queue, graded and not: GradingView splits
      // it into Waiting / Graded, and reopening a graded week is the only way
      // to read the written answers back or revise the grade.
      const q = await api(`/instructor/queue/?cohort=${gameId}`);
      if (q.ok) {
        // Pass every row through, graded included. This used to filter graded
        // rows out, which silently defeated the Waiting / Graded split below:
        // the Graded tab was always empty, so a graded week could never be
        // reopened and "Revise this grade" was unreachable. The filter and the
        // comment above it had disagreed since the split was built.
        setQueue(await q.json());
      }
    } catch {
      /* queue is optional */
    }
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

  if (phase !== "ready" || !detail) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--graphite)] px-6 text-[var(--paper)]"
        style={THEME}
      >
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>
          {phase === "error"
            ? `Couldn't load this simulation. ${error ?? ""}`
            : phase === "redirect"
              ? "Redirecting…"
              : "Loading simulation…"}
        </p>
      </div>
    );
  }

  const rounds = detail.rounds?.length ? detail.rounds : deriveRounds(detail);
  const deadline = closesIn(rounds[detail.current_round - 1]);
  const viewProps = { gameId, detail, queue, rounds, reload, notify, setSection };

  return (
    <div
      className="dc-scope min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      {/* Structural overrides the token remap can't express:
          bg-white = a surface in the light theme → graphite here;
          bg-ink = a dark badge/button in the light theme → amber primary here.
          Scoped under .dc-scope so nothing outside this page is touched. */}
      <style>{`
        .dc-scope .bg-white { background-color: var(--graphite); }
        .dc-scope .bg-ink { background-color: var(--amber); color: var(--graphite); }
        .dc-scope .bg-ink:hover { background-color: #F0B052; }
        .dc-scope ::selection { background: var(--amber); color: var(--graphite); }
      `}</style>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-[rgba(22,25,29,0.85)] px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push("/instructor")}
            aria-label="Back to console"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconBack size={16} />
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </span>
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Instructor</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--paper)]`}>{detail.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {deadline && (
            <span
              className={`hidden items-center gap-1.5 rounded-[2px] border border-[var(--amber-deep)] px-3 py-1.5 ${MONO} text-[9.5px] uppercase tracking-[0.12em] text-[var(--amber)] md:inline-flex`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]" />
              R{detail.current_round} {deadline}
            </span>
          )}
          <span className={`hidden ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] sm:inline`}>
            {me.first_name || me.username}
          </span>
          <button
            onClick={signOut}
            className={`rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]`}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex">
        <DetailSidebar section={section} setSection={setSection} queueCount={queue.filter((r) => !r.graded).length} deploymentStatus={detail.deployment_status} />
        <main className="min-w-0 flex-1 px-8 py-8">
          <div className="mx-auto max-w-[920px]">
            {section === "overview" && <OverviewView {...viewProps} />}
            {section === "grading" && <GradingView {...viewProps} />}
            {section === "firms" && <FirmsView {...viewProps} />}
            {section === "invitees" && <InviteesView {...viewProps} />}
            {section === "students" && <StudentsView {...viewProps} />}
            {section === "schedule" && <ScheduleView {...viewProps} />}
            {section === "insights" && <InsightsView {...viewProps} />}
            {section === "teaching" && <TeachingNoteView {...viewProps} />}
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}