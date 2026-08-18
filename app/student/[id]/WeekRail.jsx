"use client";

/* The week's three-move rail: Briefing 01 → War room 02 → Decision 03.
 *
 * It used to live inside WeekConsole, which meant it vanished the moment a
 * student stepped into the war room — the war room is a different section, so
 * the whole console was replaced. A student could then spend the week in there
 * with no visible route to the Decision, which is the required deliverable.
 *
 * So the rail is shared: WeekConsole and AdvisorsConsole both render it, and it
 * navigates across sections rather than only switching a local tab. The active
 * move is carried in the URL (?move=), so a jump from the war room to the
 * Decision lands on the Decision rather than the Briefing.
 */

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

const MOVES = [
  ["brief", "01", "Briefing", "situation report"],
  ["war", "02", "War room", "six advisors"],
  ["dec", "03", "Decision", "commit the week"],
];

export default function WeekRail({ weekNo, title, active, submitted, onMove }) {
  return (
    <nav className="rail">
      <div className="rail__wk">
        <div className="rail__num"><span>W</span>{pad2(weekNo)}</div>
        <div className="rail__title">{title}</div>
        {weekNo === 1 && (
          <div className="rail__mandate">
            &ldquo;Take thirty days, get me a real read, and come back with a direction I
            can take to the board.&rdquo; — Ray Calloway, CEO
          </div>
        )}
      </div>
      <div className="rail__moves">
        {MOVES.map(([key, ix, label, sub]) => (
          <button
            key={key}
            type="button"
            className={`move-btn ${active === key ? "move-btn--on" : ""}`}
            onClick={() => onMove(key)}
          >
            <span className="move-btn__ix">{ix}</span>
            <span>
              <span className="move-btn__label">{label}</span>
              <span className="move-btn__sub">{sub}</span>
            </span>
            {key === "dec" && (
              <span className={`move-btn__flag ${submitted ? "flag--done" : "flag--open"}`}>
                {submitted ? "committed" : "open"}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
