"use client";

/* The opening sequence — the sim's narrative rollout, shown once per firm
 * before Week 1. Seven scenes: title, the appointment (Calloway's mandate
 * typed live), the company, the estate, the rules (including the one-voice
 * team rule), the bench, the stakes. Renders inside the dark console design
 * system (.dc-console in app/console.css); the rest of the app's light
 * instructor theme is untouched. Arrow keys and Enter advance; Skip jumps
 * to the stakes; "Take the chair" calls onDone.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const MANDATE =
  "\u201CTake thirty days. Get me a real read. And come back with a direction I can take to the board.\u201D";

const NEXT_LABELS = [
  "Begin",
  "Read the room",
  "See the estate",
  "Learn the rules",
  "Meet the bench",
  "See the stakes",
  "Take the chair · Week 01",
];

const BENCH = [
  ["DB", "Diane Brandt", "Executive coach · coherence", "whether you have a thesis or a task list.", "diagnosis that never becomes action."],
  ["MW", "Marcus Webb", "Enterprise architecture", "the dependencies nobody mapped.", "architecture purity that never ships."],
  ["RV", "Renata Voss", "Security & OT", "the exposure nobody costed. She says it once and won't chase you.", "caution that freezes action."],
  ["DS", "Daniel Stern", "Business strategy", "the value sitting in the installed base.", "commitment before you've earned the path."],
  ["FD", "Frank Delgado", "Vendors & sourcing", "the sweet deal that's actually a cage.", "seeing lock-in everywhere."],
  ["ZP", "Zoe Park", "Innovation", "what the fleet could become.", "hype outrunning the foundation."],
];

const TIERS = [
  ["tier--1", "TRIUMPH", "You managed every thread, earned the board, and built something competitors can't easily copy."],
  ["tier--2", "WIN, WITH SCARS", "The strategy held — but something you neglected detonated along the way, and it cost you the clean win."],
  ["tier--3", "SQUEAK THROUGH", "You survived. Gates closed, trust strained, the ask denied — but the company is still standing."],
  ["tier--4", "DISASTER", "The private-equity firm gets its argument for a change of direction. That direction is not you."],
];

export default function Intro({ onDone }) {
  const [at, setAt] = useState(0);
  const [mandate, setMandate] = useState("");
  const [mandateDone, setMandateDone] = useState(false);
  const typedRef = useRef(false);
  const N = 7;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Calloway's mandate, typed when scene 1 first shows.
  useEffect(() => {
    if (at !== 1 || typedRef.current) return;
    typedRef.current = true;
    if (reduced) {
      setMandate(MANDATE);
      setMandateDone(true);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setMandate(MANDATE.slice(0, i));
      if (i >= MANDATE.length) {
        clearInterval(t);
        setMandateDone(true);
      }
    }, 34);
    return () => clearInterval(t);
  }, [at, reduced]);

  const go = useCallback((n) => {
    setAt(Math.max(0, Math.min(N - 1, n)));
    window.scrollTo({ top: 0 });
  }, []);

  const next = useCallback(() => {
    setAt((cur) => {
      if (cur === N - 1) {
        onDone?.();
        return cur;
      }
      window.scrollTo({ top: 0 });
      return cur + 1;
    });
  }, [onDone]);

  const back = useCallback(() => go(at - 1), [at, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  const Scene = ({ n, children }) => (
    <section className={`scene ${at === n ? "scene--on" : ""}`}>
      <div className="scene__inner">{children}</div>
    </section>
  );

  return (
    <div className="dc-console" style={{ minHeight: "100vh" }}>
      <div className="chrome-fixed">
        <div className="brand">
          <div className="brand__mark" />
          <div className="brand__name">DIGITALCO</div>
        </div>
        <div className="right">
          <div className="stepnum mono">
            <b>{String(at + 1).padStart(2, "0")}</b> / 07
          </div>
          <button className="signout" type="button" onClick={() => go(6)}>
            Skip intro
          </button>
        </div>
      </div>

      <Scene n={0}>
        <div className="title-scene">
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            MIS 7000 · Information Systems Strategy
          </div>
          <h1>DIGITALCO</h1>
          <div className="sub">
            A term in the chair. <b>Your team is the Chief Information Officer</b> of a
            company whose last digital bet went sideways — fourteen weeks, one chair,
            one voice.
          </div>
          <div className="title-arc">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="tseg" />
            ))}
          </div>
          <div className="title-arcnote">fourteen decisions · one continuous strategy</div>
        </div>
      </Scene>

      <Scene n={1}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Scene 01 · The appointment
        </div>
        <div className="memo">
          <div className="memo__rule" />
          <div className="memo__head">
            <div className="memo__from">Office of the CEO · R. Calloway</div>
            <div className="memo__stamp">confidential</div>
          </div>
          <div className="memo__body">
            <p>
              The board approved the appointment this morning. Your team is DigitalCo&rsquo;s
              new Chief Information Officer &mdash; one chair, and all of you in it, hired
              from outside. Everyone in the building knows why: your predecessor promised a
              digital transformation, spent heavily, and left before the bill came due.
            </p>
            <p>
              The private-equity firm that took a minority stake wants returns. The founding
              family is wary of what&rsquo;s being done to their company. And the CEO who
              hired you, Ray Calloway, gives you the only mandate you&rsquo;re going to get:
            </p>
            <div className="mandate">
              <span>{mandate}</span>
              {!mandateDone && <span className="cursor" />}
              <div
                className="mandate__attr"
                style={{ opacity: mandateDone ? 1 : 0, transition: "opacity .6s" }}
              >
                &mdash; Ray Calloway, Chief Executive Officer
              </div>
            </div>
          </div>
        </div>
      </Scene>

      <Scene n={2}>
        <div className="eyebrow">Scene 02 · The company</div>
        <h2>What you&rsquo;ve inherited a chair in</h2>
        <p className="co__lede">
          DigitalCo builds heavy industrial equipment, and has for generations.
          Family-founded, regionally dominant, respected on every factory floor that runs
          its machines. Three years ago it started bolting a <b>digital layer</b> onto that
          heritage &mdash; connected machines, telematics, the promise of data services. The
          machines are excellent. The digital layer is why you&rsquo;re here.
        </p>
        <div className="co__facts">
          <div className="fact"><div className="fact__k">Business</div><div className="fact__v">Industrial equipment <span>&mdash; manufacture, dealer channel, service</span></div></div>
          <div className="fact"><div className="fact__k">Ownership</div><div className="fact__v">Family-founded <span>+ private-equity minority stake</span></div></div>
          <div className="fact"><div className="fact__k">Connected fleet</div><div className="fact__v">Telematics on ~40% <span>of eligible machines &mdash; monetization near zero</span></div></div>
          <div className="fact"><div className="fact__k">Your predecessor</div><div className="fact__v">Tom Bryce <span>&mdash; big promises, no sequencing, gone</span></div></div>
        </div>
        <p className="aside">
          The people matter as much as the systems. Six executives are waiting to tell you
          what&rsquo;s really going on &mdash; <b>each through their own agenda.</b>
        </p>
      </Scene>

      <Scene n={3}>
        <div className="eyebrow">Scene 03 · The estate</div>
        <h2>Four problems, one desk</h2>
        <div className="readouts">
          <div className="readout"><div className="readout__lamp lamp--red" /><div className="readout__name">S/4HANA migration</div><div className="readout__stat"><b>RED</b> · ~2 years late · ~$40M spent against a $25M budget · stalled on dependencies nobody mapped</div></div>
          <div className="readout"><div className="readout__lamp lamp--amber" /><div className="readout__name">Connected products</div><div className="readout__stat"><b>AMBER</b> · 3 years in · shipping telematics, monetizing almost none of it · dealers complaining about data access</div></div>
          <div className="readout"><div className="readout__lamp lamp--dim" /><div className="readout__name">The data estate</div><div className="readout__stat"><b>SWAMP</b> · scattered BI tools feeding a lake that became a dumping ground · nothing retired, old and new both running</div></div>
          <div className="readout"><div className="readout__lamp lamp--black" /><div className="readout__name">The factory floor</div><div className="readout__stat"><b>BLACK BOX</b> · plant systems and fleet telemetry sit outside IT&rsquo;s visibility entirely</div></div>
        </div>
        <p className="aside">
          Everything on this panel is a thread, and some threads have <b>long fuses</b>.
          What you do about each of them &mdash; including nothing &mdash; will matter later
          in ways this screen doesn&rsquo;t tell you.
        </p>
      </Scene>

      <Scene n={4}>
        <div className="eyebrow">Scene 04 · The rules</div>
        <h2>Every week, three moves</h2>
        <div className="moves-list">
          <div className="movecard"><div className="movecard__n">1</div><div><div className="movecard__t">The briefing</div><div className="movecard__d">The week&rsquo;s situation lands on your desk &mdash; a cold open, reads from the six executives, and the <b>documents you can examine</b>. The signals you need are in there. Nobody highlights them.</div></div></div>
          <div className="movecard"><div className="movecard__n">2</div><div><div className="movecard__t">The war room</div><div className="movecard__d">Six advisors on call, as long as you like. <b>Nothing said in that room is scored.</b> It&rsquo;s where you think out loud, pressure-test, and let experts argue. Every one of them is worth hearing. None of them is safe to follow blindly.</div></div></div>
          <div className="movecard"><div className="movecard__n">3</div><div><div className="movecard__t">The decision</div><div className="movecard__d">You commit the week &mdash; structured calls plus your written reasoning. <b>This is where every consequence lives.</b> You won&rsquo;t see a score. You&rsquo;ll feel the consequences, some of them weeks from now.</div></div></div>
        </div>
        <div className="rule-callout rule-callout--team">
          <div className="eyebrow">The rule that makes this a team game</div>
          <p>
            DigitalCo gets <b>one CIO, and it&rsquo;s all of you.</b> The firm commits one
            decision each week, and committing is final for the whole team. Split up the
            advisors, bring back what each of them said, and disagree hard in the war room
            &mdash; then find the position you can all sign, because the company only hears
            one voice.
          </p>
        </div>
        <div className="rule-callout">
          <div className="eyebrow">One warning worth carrying</div>
          <p>
            In Week 1 you&rsquo;ll write a strategy statement. It becomes your{" "}
            <b>anchor</b> &mdash; the yardstick every later week is quietly measured
            against. Fourteen locally clever decisions that don&rsquo;t add up to one
            strategy will cost you more than any single mistake.
          </p>
        </div>
      </Scene>

      <Scene n={5}>
        <div className="eyebrow">Scene 05 · Your bench</div>
        <h2>Six advisors. Six lanes. Six blind spots.</h2>
        <div className="bench">
          {BENCH.map(([av, name, lane, listen, discount]) => (
            <div className="bseat" key={av}>
              <div className="bseat__top">
                <div className="bseat__av">{av}</div>
                <div>
                  <div className="bseat__name">{name}</div>
                  <div className="bseat__lane">{lane}</div>
                </div>
              </div>
              <div className="bseat__read">
                Listen for: <b>{listen}</b> Discount for: {discount}
              </div>
            </div>
          ))}
        </div>
        <p className="aside">
          Your real job in that room is never to find the advisor who&rsquo;s right.
          It&rsquo;s to <b>synthesize six biased expert views</b> into a judgment none of
          them would reach alone. Six advisors, one team &mdash; <b>split the bench</b>,
          then argue about what you each heard.
        </p>
      </Scene>

      <Scene n={6}>
        <div className="eyebrow">Scene 06 · The stakes</div>
        <h2>Fourteen weeks from now, this ends one of four ways</h2>
        <div className="tiers">
          {TIERS.map(([cls, name, d]) => (
            <div className={`tierrow ${cls}`} key={name}>
              <div className="tierrow__name">{name}</div>
              <div className="tierrow__d">{d}</div>
            </div>
          ))}
        </div>
        <div className="stakes__close">
          <p className="stakes__line">
            The endgame is being written from your <b>very first decision</b>. Your first
            briefing is on your desk.
          </p>
        </div>
      </Scene>

      <div className="advance">
        {at > 0 && (
          <button className="btn btn--ghost" type="button" onClick={back}>
            Back
          </button>
        )}
        <button className="btn" type="button" onClick={next}>
          {NEXT_LABELS[at]}
        </button>
        <div className="advance__hint mono">← → arrow keys work too</div>
      </div>
    </div>
  );
}
