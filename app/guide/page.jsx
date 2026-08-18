"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./guide.css";

/* How to Read a Week — the orientation guide behind the "?" hub's
 * "Read the full walkthrough" link. Markup is the authored standalone document;
 * its styles live in ./guide.css, scoped under .guide-doc.
 *
 * The guide is a full page, not a modal, so it needs its own way out. The help
 * window passes where it was opened from as ?from=, and we return there — an
 * explicit destination rather than history.back(), which can land on a stale or
 * off-site page depending on how the student got here. Anything unexpected
 * falls back to the cohort list, so this control is never a dead end. */

export default function GuidePage() {
  const router = useRouter();
  const [backTo, setBackTo] = useState("/student");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    // Internal, single-slash paths only — "//evil.example" is not a way home.
    if (from && /^\/(?!\/)/.test(from)) setBackTo(from);
  }, []);

  const goBack = () => router.push(backTo);

  return (
    <div className="guide-doc">
      <div className="top">
        <div className="brand">
          <button type="button" onClick={goBack} className="backbtn" aria-label="Back">
            &#8592;
          </button>
          <img src="/logo-1x.svg" alt="Flexee DigitalCo" className="mark" />
          <div className="brand__name"><span className="brand__plat">FLEXEE</span><span className="brand__sep">·</span><span className="brand__sim">DigitalCo</span></div>
        </div>
        <div className="top__right">
          <button type="button" onClick={goBack} className="backlink">
            Back to the console
          </button>
          <div className="top__tag">Student Guide</div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="eyebrow">How to read a week</div>
          <h1>The same four moves, every week</h1>
          <p>Every week of DigitalCo runs the same loop. The situation changes; the way you work it does not. This is not about what to decide — that is yours to figure out. It is about <b>how to operate</b> so your team makes a real decision instead of a guess. Learn the loop once, and you will never again wonder what you are supposed to be doing.</p>
          <div className="rule"></div>
        </div>

        <div className="loop">
          <div className="loop__step"><div className="loop__n">01</div><div className="loop__t">Read</div><div className="loop__s">The briefing &amp; the exhibits. Diagnose before you consult.</div></div>
          <div className="loop__step"><div className="loop__n">02</div><div className="loop__t">Consult</div><div className="loop__s">The war room. Spend advisor time on purpose.</div></div>
          <div className="loop__step"><div className="loop__n">03</div><div className="loop__t">Converge</div><div className="loop__s">As a team, to one position you can all sign.</div></div>
          <div className="loop__step"><div className="loop__n">04</div><div className="loop__t">Commit</div><div className="loop__s">The decision, with your written reasoning. It is final.</div></div>
        </div>

        {/* MOVE 1 */}
        <div className="move">
          <div className="move__head"><div className="move__num">1</div><div><div className="move__title">Read the briefing — and the exhibits</div><div className="move__sub">This Week · Situation Report + Reference Files</div></div></div>
          <p className="move__lead">The briefing hands you the week's situation, six executive reads, and reference files on your desk. <b>Nobody highlights what matters.</b> Your first job is diagnosis: what is actually going on, and what is this decision really about.</p>
          <ul className="do">
            <li><span className="do__k">Do this</span><span className="do__v">Read the situation report for the <b>decision underneath it</b> — not the surface problem, the choice you're actually being asked to make.</span></li>
            <li><span className="do__k">Then this</span><span className="do__v">Read each executive twice: once for what they say, once for <b>what they want</b>. The stated ask and the real ask are different documents. Someone's silence is data too.</span></li>
            <li><span className="do__k">Then this</span><span className="do__v">Open every reference file. Read the numbers <b>skeptically</b> — a figure can be arithmetically perfect and strategically wrong. Ask what the exhibit is <em>not</em> showing you.</span></li>
            <li><span className="do__k">Last step</span><span className="do__v">Write one sentence: <b>"This week is really a decision about ___."</b> If your team can't agree on that sentence, you're not ready for the war room.</span></li>
          </ul>
          <div className="note note--amber"><span className="lab">The discipline</span>Diagnose <b>before</b> you consult. Advisors are expensive and biased — walking in without a read means you'll be led by whoever talks first.</div>
        </div>

        {/* MOVE 2 */}
        <div className="move">
          <div className="move__head"><div className="move__num">2</div><div><div className="move__title">Work the war room</div><div className="move__sub">Advisors · six biased experts, metered time</div></div></div>
          <p className="move__lead">Six advisors are on call. Every one is worth hearing; <b>none is safe to follow blindly.</b> Advisor time is billed, so this is a resource you spend on purpose, not a place to fish for the answer.</p>
          <ul className="do">
            <li><span className="do__k">Do this</span><span className="do__v">Decide <b>which advisors</b> this specific decision needs — not all six, every time. Consulting the wrong expert is wasted money.</span></li>
            <li><span className="do__k">Then this</span><span className="do__v">Bring <b>sharp questions</b>, not open ones. "What would make this fail?" beats "What do you think?" You're testing a read, not requesting a verdict.</span></li>
            <li><span className="do__k">For each advisor</span><span className="do__v">Ask what they're <b>good at catching</b> and where their <b>bias pulls them</b>. Weight the advice by the gap between the two. An advisor with a stake in the answer is giving you a position, not the truth.</span></li>
            <li><span className="do__k">Listen closely</span><span className="do__v">Some advisors say the important thing <b>once</b> and won't repeat it. If you're not paying attention, you'll miss the exposure nobody else costed.</span></li>
          </ul>
          <div className="note"><b>Your real job here is never to find the advisor who's right.</b> It's to synthesize several biased views into a judgment none of them would reach alone. That synthesis is the skill the whole course is testing.</div>
        </div>

        {/* MOVE 3 */}
        <div className="move">
          <div className="move__head"><div className="move__num">3</div><div><div className="move__title">Converge as a team</div><div className="move__sub">Your firm · one chair, one voice</div></div></div>
          <p className="move__lead">Your team is one CIO. The company hears <b>one voice</b>, so you have to disagree hard and then commit together. This is where good teams separate from stuck ones.</p>
          <ul className="do">
            <li><span className="do__k">Do this</span><span className="do__v">Split the work up front — <b>divide the advisors and the exhibits</b> across the team, then reconvene and report back. Don't all read the same thing.</span></li>
            <li><span className="do__k">Then this</span><span className="do__v">Argue the disagreement <b>out loud and early</b>. The middle-ground compromise that offends no one is usually the weakest answer. Take a position.</span></li>
            <li><span className="do__k">Then this</span><span className="do__v">Find the <b>one position you can all sign</b> — and name what it costs and who it disappoints. A decision that pretends to please everyone can't be defended later.</span></li>
            <li><span className="do__k">Guard against</span><span className="do__v">The loudest voice deciding by default. The chair speaks with one voice, but that voice should be the team's judgment, not the most confident person's.</span></li>
          </ul>
        </div>

        {/* MOVE 4 */}
        <div className="move">
          <div className="move__head"><div className="move__num">4</div><div><div className="move__title">Commit the decision</div><div className="move__sub">Decision · structured calls + written reasoning</div></div></div>
          <p className="move__lead">You lock in the week's decision: the structured calls, and — just as important — <b>your written reasoning.</b> Committing is final, and final for the whole team.</p>
          <ul className="do">
            <li><span className="do__k">Do this</span><span className="do__v">Make the calls the week asks for, and write <b>why</b> — the reasoning is graded and remembered, not just the choice.</span></li>
            <li><span className="do__k">Check first</span><span className="do__v">Does this decision serve the <b>thesis you set in Week 1</b>? Every week is measured against that anchor. Drift is visible later.</span></li>
            <li><span className="do__k">Expect</span><span className="do__v"><b>No score.</b> You won't see points. You'll feel the consequences — some of them weeks from now. That's the design, not a bug.</span></li>
            <li><span className="do__k">Then</span><span className="do__v">Commit before the deadline. A week you don't commit decides itself, and never in your favor.</span></li>
          </ul>
          <div className="note note--amber"><span className="lab">Carry this all term</span>Fourteen locally clever decisions that don't add up to one strategy will cost you more than any single mistake. <b>Coherence over time is the whole game.</b></div>
        </div>

        {/* TEAM PANEL */}
        <div className="team">
          <div className="lab">Running the team well</div>
          <h3>You are a team pretending to be one person</h3>
          <p>The hardest part of DigitalCo isn't the strategy — it's that a group has to decide with one voice, on a once-a-week clock. Teams that run themselves well beat teams with better instincts but worse process. A few habits that work:</p>
          <ul>
            <li><b>Assign roles per week.</b> One person drives the briefing, one owns the exhibits, one runs advisor sessions. Rotate.</li>
            <li><b>Meet before you spend advisor time.</b> Walk in with a shared read, or you'll waste metered hours arguing basics.</li>
            <li><b>Write the reasoning together.</b> The person who argued loudest shouldn't be the only one who documents the call.</li>
            <li><b>Decide how you'll decide.</b> Agree in advance how you break a tie, so a split team can still commit on time.</li>
          </ul>
        </div>

        {/* ONE-LINE LAW */}
        <div className="law">
          <p>Read before you consult. Consult before you converge. <b>Converge before you commit.</b></p>
          <div className="law__note">the situation changes every week · the loop never does</div>
        </div>

        <div className="foot">FLEXEE · DigitalCo — Student Guide · How to Read a Week · this guide teaches the process, never the answer</div>
      </div>
    </div>
  );
}
