"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchMe } from "../../../../lib/api";
import ExhibitsPage from "../../../student/[id]/exhibits/page";

/* The instructor's view of the case exhibits: every week, with the design
 * notes that name each trap. This is the only route that passes
 * showDesignNotes — the student route must never do so. */

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
  "--ok": "#7FB08A",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

export default function InstructorExhibitsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) router.replace("/login");
        else setOk(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]`}>Loading exhibits…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--graphite)] text-[var(--paper)] [color-scheme:dark]" style={THEME}>
      <header className="flex items-center justify-between border-b border-[var(--steel-line)] px-7 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}`)}
            aria-label="Back to cohort"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            ‹
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
              <span>FLEXEE</span>
              <span className="font-normal text-[var(--muted-dim)]">·</span>
              <span className="text-[var(--amber)]">DigitalCo</span>
            </span>
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Instructor</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>Exhibits</span>
          </div>
        </div>
        <span className={`${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--amber)]`}>
          Includes design notes — not the student view
        </span>
      </header>
      <ExhibitsPage currentWeek={14} showDesignNotes />
    </div>
  );
}
