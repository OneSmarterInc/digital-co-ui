"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./deliverable-doc.css";

/* Understanding Your Deliverable — reference behind the "?" hub. Markup is the authored standalone
 * document; its styles live in ./deliverable-doc.css, scoped under .deliverable-doc.
 * The help window passes where it was opened from as ?from=, so the back
 * control returns there; anything unexpected falls back to the cohort list. */

export default function DeliverableGuidePage() {
  const router = useRouter();
  const [backTo, setBackTo] = useState("/student");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && /^\/(?!\/)/.test(from)) setBackTo(from);
  }, []);

  const goBack = () => router.push(backTo);

  return (
    <div className="deliverable-doc">
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
          <div className="top__tag">Your Deliverable</div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="eyebrow">What the decision screen is asking for</div>
          <h1>Understanding your deliverable</h1>
          <p>Every week ends by committing a decision, and the decision screen asks for a mix of the same kinds of fields — written analysis, a strategy statement, structured choices, and a plan. The specific questions change each week, but the <b>types of field</b> don't. This explains what each type is asking for and how to approach it, so you're never guessing at the form. It tells you <b>what goes in each field — never what your answer should be.</b> That part is always yours.</p>
          <div className="rule"></div>
        </div>

        <div className="whatnot">
          <div className="whatnot__cell does"><div className="whatnot__k">This guide does</div><div className="whatnot__v">Explain what each field is asking for, how to approach it, and roughly how much to write.</div></div>
          <div className="whatnot__cell doesnt"><div className="whatnot__k">This guide doesn't</div><div className="whatnot__v">Tell you what a good answer is, which option to pick, or what your strategy should be. The decision is the exercise.</div></div>
        </div>

        {/* CURRENT-STATE ASSESSMENT */}
        <div className="field">
          <div className="field__head"><div className="field__name">Current-state assessment</div><div className="field__type">Written · analysis</div></div>
          <p className="field__what">Your read of the situation as it actually is — what you found when you worked the briefing and the exhibits. It's <b>diagnosis, not plan</b>: what's true right now, what matters, and what the real problem underneath the surface problem is. Think of it as the honest picture you'd give before proposing anything.</p>
          <div className="field__how"><span className="lab">How to approach</span>Base it on evidence you can point to in the exhibits and the reads, not impressions. A few tight paragraphs beat a long list. If your assessment and your strategy don't connect, one of them is wrong.</div>
        </div>

        {/* STRATEGY STATEMENT */}
        <div className="field">
          <div className="field__head"><div className="field__name">Strategy statement</div><div className="field__type">Written · position</div></div>
          <p className="field__what">Your thesis — the direction you're committing to and why. In Week 1 this becomes your <b>anchor</b>, the position every later week is quietly measured against, so it carries more weight than almost anything else you write all term. It should be a <b>real, defensible position</b>, not a hedge that tries to please everyone.</p>
          <div className="field__how"><span className="lab">How to approach</span>State the direction plainly, then say why it's the right one and what you're deliberately <b>not</b> doing. A strategy that keeps every option open isn't a strategy. You'll be asked to defend this in front of the board later — write it like you mean it.</div>
        </div>

        {/* STRUCTURED CHOICES */}
        <div className="field">
          <div className="field__head"><div className="field__name">Structured choices</div><div className="field__type">Buttons · toggles · dropdowns</div></div>
          <p className="field__what">The concrete calls the week forces you to make — a disposition like <b>continue / pause / kill</b>, a toggle to engage or defer something, a dropdown to pick a priority. These turn your strategy into specific commitments. They're deliberately hard because <b>a real strategy shows up as decisions, not intentions.</b></p>
          <div className="field__how"><span className="lab">How to approach</span>Make each choice follow from your strategy statement — if they don't line up, the board (and the scoring) will notice the incoherence. Don't pick the middle option just because it feels safe; sometimes the safe-looking choice is the costly one.</div>
        </div>

        {/* STAKEHOLDER ANCHOR */}
        <div className="field">
          <div className="field__head"><div className="field__name">Stakeholder anchor</div><div className="field__type">Dropdown · choice of person</div></div>
          <p className="field__what">Which executive or relationship you're prioritizing this week. The people around you have their own agendas and their own weight, and <b>who you choose to anchor to has consequences</b> — some relationships protect you later, some cost you if you neglect them. This field makes your political read explicit.</p>
          <div className="field__how"><span className="lab">How to approach</span>Read the executives for what they actually want, not just what they say, and think about which relationships this week's decision lives or dies on. There's rarely a free choice here — every anchor is also a bet about who matters when it counts.</div>
        </div>

        {/* TIME-PHASED PLAN */}
        <div className="field">
          <div className="field__head"><div className="field__name">Time-phased plan (e.g. 30-60-90)</div><div className="field__type">Written · sequencing</div></div>
          <p className="field__what">What you'd actually do, in what order, over a stated horizon. It's the <b>credibility test on your strategy</b> — anyone can name a direction, but a believable early-action plan shows you've thought about sequencing, dependencies, and what has to happen first. "Credible" is the operative word.</p>
          <div className="field__how"><span className="lab">How to approach</span>Front-load what unblocks everything else and be honest about what can't move until something else does. A plan that tries to do everything at once reads as a plan that hasn't been thought through. Tie the phases back to your strategy.</div>
        </div>

        {/* WRITTEN DELIVERABLE */}
        <div className="field">
          <div className="field__head"><div className="field__name">The deliverable</div><div className="field__type">Written · your firm's output</div></div>
          <p className="field__what">Where present, this is your firm's <b>consolidated output for the week</b> — the thing you'd actually hand over, pulling your reasoning together into one coherent piece. Where the other fields capture specific pieces, this is the whole, in your own words, as one voice.</p>
          <div className="field__how"><span className="lab">How to approach</span>Make it read as one firm speaking, not several people stapled together — you're one CIO. It should be consistent with every structured choice you made above; if the deliverable and the toggles disagree, you haven't converged yet.</div>
        </div>

        {/* the meta-note */}
        <div className="note">
          <div className="lab">One rule underneath all of it</div>
          <h3>Your fields should agree with each other</h3>
          <p>The single most common way a strong week falls apart is <b>incoherence</b> — a bold strategy statement paired with timid structured choices, or a stakeholder anchor that contradicts the direction. The scoring and the board both read the whole deliverable as one thing, so before you commit, check that your assessment, your strategy, your choices, and your plan all tell <b>the same story.</b> That coherence is worth more than any single field being brilliant.</p>
        </div>

        <div className="foot">FLEXEE · DigitalCo — Your Deliverable · what each field asks for, never what your answer should be</div>
      </div>
    </div>
  );
}
