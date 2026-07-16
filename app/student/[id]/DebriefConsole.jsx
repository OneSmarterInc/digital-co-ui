"use client";

/* The Week 14 payoff, console edition. Fetches the engine's own debrief from
 * /run/debrief/ and renders the verdict plus the four through-line threads
 * from the trace dicts (coherence, cloud lock-in, data & trust, security/OT).
 * The display logic reads the traces; it computes nothing of its own.
 */

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const TIER = {
  TRIUMPH: ["TRIUMPH", "", "You managed every thread, earned the board, and built something competitors can't easily copy."],
  WIN_WITH_SCARS: ["WIN, WITH SCARS", "", "The strategy held and the board backed it — but a thread you left unattended detonated along the way, and it cost you the clean win."],
  SQUEAK_THROUGH: ["SQUEAK THROUGH", "verdict__tier--squeak", "You survived. Gates closed, trust strained, the ask denied — but the company is still standing."],
  DISASTER: ["DISASTER", "verdict__tier--disaster", "The private-equity firm has its argument for a change of direction, and that direction is not you."],
};

function buildThreads(d) {
  const threads = [];

  const coh = d.coherence_thread || {};
  const drift = (coh.drift_events || []).length;
  if (coh.settled === "strong" && drift === 0) {
    threads.push(["Coherence", "held", "tag--ok",
      <>Your Week 1 anchor was <b>sharp</b>, and you held it under pressure rather than chasing the news. The board audit read a strategy that added up.</>]);
  } else if (drift <= 2) {
    threads.push(["Coherence", "strained", "tag--warn",
      <>The thesis mostly held, but the record shows <b>{drift} moment{drift === 1 ? "" : "s"} of drift</b> — weeks where the choice contradicted the anchor. The audit noticed.</>]);
  } else {
    threads.push(["Coherence", "broke", "tag--bad",
      <>The record accumulated <b>{drift} drift events</b>. By the board audit there was no spine to present — a collection of decisions, not a strategy.</>]);
  }

  const cl = d.lockin_thread || {};
  if (cl.state === "broken") {
    threads.push(["Cloud lock-in", "broke it", "tag--ok",
      <>You protected your position early, so the squeeze found you with room to move — and by Week 12 you <b>broke the cost curve</b> with architecture instead of buying a deeper cage.</>]);
  } else if (cl.state === "locked") {
    threads.push(["Cloud lock-in", "caged", "tag--bad",
      <>The sweet deal became the cage. The squeeze hit at Week 7, the bill came home at fleet scale in Week 12, and the lock-in <b>deepened to level {cl.depth ?? "?"}</b> instead of breaking.</>]);
  } else {
    threads.push(["Cloud lock-in", "managed", "tag--warn",
      <>You never took the deepest deal, and the thread stayed manageable — the squeeze cost you, but the cage never fully closed.</>]);
  }

  const end = (d.data_rights_thread || {}).end_state || {};
  if (end.data_advantage === "preserved" && ["repaired", "partially_repaired"].includes(end.trust_state)) {
    threads.push(["Data & trust", "repaired", "tag--ok",
      <>The shared-value path meant the Week 11 revolt was a tension you could resolve, not a betrayal you had to survive. <b>The advantage held and the channel came back.</b></>]);
  } else if (end.data_advantage === "surrendered") {
    threads.push(["Data & trust", "surrendered", "tag--warn",
      <>Peace was bought by giving up the data advantage — the customers stayed, and the strategy the whole arc was building <b>went with the concession</b>.</>]);
  } else if (end.data_advantage === "won_but_hollow" || end.trust_state === "damaged") {
    threads.push(["Data & trust", "burned", "tag--bad",
      <>The rights were asserted and the revolt was fought — and the trust that made the data worth anything <b>burned in the fight</b>. A win that holds nothing.</>]);
  } else {
    threads.push(["Data & trust", "open", "tag--warn",
      <>The data-rights question never fully resolved — the thread runs to the end of the record still open.</>]);
  }

  const sec = d.security_thread || {};
  if (sec.detonated) {
    threads.push(["Security & OT", "detonated", "tag--bad",
      <>The factory-floor black box was never opened. The gate quietly <b>closed at Week 7</b>, and when the breach reached fielded machines in Week 10 you were blind to it. One neglected thread capped the run.</>]);
  } else if (sec.gate_state === "closed") {
    threads.push(["Security & OT", "exposed", "tag--warn",
      <>The OT signal went unaddressed and the gate closed — the exposure was set even where the worst never landed.</>]);
  } else {
    threads.push(["Security & OT", "held", "tag--ok",
      <>You opened the black box early and built posture on the floor, so when the breach came you <b>saw it, mapped it, and contained it</b>. The cheapest credibility move in the game paid for itself.</>]);
  }

  return threads;
}

export default function DebriefConsole({ cohortId }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api(`/run/debrief/?cohort=${cohortId}`);
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
        if (alive) setData(j);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { alive = false; };
  }, [cohortId]);

  if (err) {
    return (
      <div className="dc-console" style={{ borderRadius: 6, padding: "36px 28px" }}>
        <div className="eyebrow">The debrief</div>
        <p style={{ marginTop: 10, color: "var(--muted)" }}>{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="dc-console" style={{ borderRadius: 6, padding: "36px 28px" }}>
        <div className="eyebrow">The debrief</div>
        <p className="mono" style={{ marginTop: 10, color: "var(--muted-dim)", fontSize: 12 }}>
          Resolving fourteen weeks…
        </p>
      </div>
    );
  }

  const key = String(data.tier || "").toUpperCase();
  const [tierName, tierCls, verdictLine] = TIER[key] || [key, "", ""];
  const threads = buildThreads(data);

  return (
    <div className="dc-console" style={{ borderRadius: 6 }}>
      <div className="debrief">
        <div className="verdict">
          <div className="eyebrow">Week 14 · The Synthesis · final outcome</div>
          <div className={`verdict__tier ${tierCls}`}>{tierName}</div>
          <div className="verdict__line">{verdictLine}</div>
        </div>
        <div className="threads">
          {threads.map(([name, tag, cls, trace]) => (
            <div className="thread" key={name}>
              <div className="thread__cap">
                <span className={`thread__tag ${cls}`}>{tag}</span>
                <span className="thread__name">{name}</span>
              </div>
              <div className="thread__trace">{trace}</div>
            </div>
          ))}
        </div>
        <div className="lesson">
          <div className="eyebrow">The lesson the fourteen weeks were teaching</div>
          <p>
            They were never fourteen separate decisions. They were one continuous strategy —
            and the endgame was being written from the very first week.
          </p>
        </div>
      </div>
    </div>
  );
}
