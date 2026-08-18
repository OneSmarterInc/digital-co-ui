"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./advisors-doc.css";

/* Your Advisors — reference behind the "?" hub. Markup is the authored standalone
 * document; its styles live in ./advisors-doc.css, scoped under .advisors-doc.
 * The help window passes where it was opened from as ?from=, so the back
 * control returns there; anything unexpected falls back to the cohort list. */

export default function AdvisorsGuidePage() {
  const router = useRouter();
  const [backTo, setBackTo] = useState("/student");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && /^\/(?!\/)/.test(from)) setBackTo(from);
  }, []);

  const goBack = () => router.push(backTo);

  return (
    <div className="advisors-doc">
      <div className="top">
        <div className="brand">
          <button type="button" onClick={goBack} className="backbtn" aria-label="Back">
            &#8592;
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="mark" />
          <div className="brand__name"><span className="brand__plat">FLEXEE</span><span className="brand__sep">·</span><span className="brand__sim">DigitalCo</span></div>
        </div>
        <div className="top__right">
          <button type="button" onClick={goBack} className="backlink">
            Back to the console
          </button>
          <div className="top__tag">Your Advisors</div>
        </div>
      </div>

      <div className="wrap">
        <div className="hero">
          <div className="eyebrow">Who's on the bench</div>
          <h1>Your six advisors</h1>
          <p>Six advisors are on call every week. Each is <b>sharp inside their lane and biased at its edges</b> — worth hearing, none safe to follow blindly. Use this to remember who's who and decide who a given decision actually calls for. <b>Listen for</b> is what each one catches that others miss; <b>discount for</b> is the pull to weigh against.</p>
          <div className="rule"></div>
        </div>

        {/* DANIEL STERN */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Daniel Stern</div><div className="adv__lane">Business Strategy</div></div>
          <p className="adv__char">Daniel thinks in markets, competitive position, business models, and value, and he speaks the board's language fluently. He's the strongest voice in the room for turning DigitalCo's machines and data into a business — crisp, commercial, and comfortable with a bold direction. <b>He frames every choice as a strategic and financial consequence.</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">The value sitting in the installed base — where the real competitive advantage and the defensible business model actually are.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Commitment before you've earned the path — the bold bet that outruns what you can feasibly deliver.</div></div>
          </div>
          <p className="adv__asks">He tends to ask: <b>How does this make us money or stop us from losing it — and is the advantage actually defensible?</b></p>
        </div>

        {/* DIANE BRANDT */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Diane Brandt</div><div className="adv__lane">Executive Coach</div></div>
          <p className="adv__char">Diane is a former CIO who ran IT at a regional equipment maker for fifteen years and made most of the mistakes already. She has no technical lane and doesn't want one — she talks about judgment, politics, credibility, timing, and your own blind spots, and she answers questions with questions. <b>She's the conscience of coherence: does this choice fit the strategy you set in Week 1?</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">Whether you have a thesis or just a task list — and the gap between the right answer and the one that survives the politics.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Diagnosis that never becomes action — deliberation mistaken for wisdom.</div></div>
          </div>
          <p className="adv__asks">She tends to ask: <b>What problem are you actually solving, and who has to own it with you?</b></p>
        </div>

        {/* MARCUS WEBB */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Marcus Webb</div><div className="adv__lane">Architecture</div></div>
          <p className="adv__char">Marcus is the chief architect who actually understands the stack — the dual ERP, the IBM i nobody else can read, the data architecture, the integration mess, the cloud. He's pragmatic, precise, and allergic to hype, and he speaks in systems and dependencies. <b>He sees the hidden technical reality a business-first read skates over.</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">The dependencies nobody mapped — hidden coupling, technical debt, and how a thing behaves when it scales.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Architecture purity that never ships — the perfectly-mapped plan that arrives late and over budget.</div></div>
          </div>
          <p className="adv__asks">He tends to ask: <b>That's a nice slide. What does it actually run on, and what breaks when it scales?</b></p>
        </div>

        {/* RENATA VOSS */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Renata Voss</div><div className="adv__lane">Security &amp; OT</div></div>
          <p className="adv__char">Renata is the security mind who sees attack surfaces and downside everywhere, and — crucially for a manufacturer — she's OT-aware, so she sees the factory floor and the connected fleet as the real exposure long before anyone funds the fix. She's quiet, concrete, and steady, and she doesn't cry wolf. <b>Worry when she raises her voice, and know she may say the important thing only once.</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">The exposure nobody costed — the operational-security risk hidden inside a strategic choice.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Caution that freezes useful action — perfectly secure and strategically stalled.</div></div>
          </div>
          <p className="adv__asks">She tends to ask: <b>What's the worst case, how bad does it get, and who owns it when it happens?</b></p>
        </div>

        {/* FRANK DELGADO */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Frank Delgado</div><div className="adv__lane">Vendor &amp; Partnership</div></div>
          <p className="adv__char">Frank has negotiated a hundred vendor contracts and knows where the bodies are buried. He sees lock-in, switching costs, and vendor incentives with a clarity the others lack, and he reads the fine print everyone else skips. He's shrewd, transactional, and a little cynical about vendor promises. <b>He sees the bad terms buried in a deal that come due later.</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">The sweet deal that's actually a cage — lock-in, switching costs, and what a vendor really gets out of the arrangement.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Seeing lock-in everywhere — treating every partner as an adversary until you can't commit to anyone.</div></div>
          </div>
          <p className="adv__asks">He tends to ask: <b>What does the vendor get out of this, and what does it cost us to leave once we're in?</b></p>
        </div>

        {/* ZOE PARK */}
        <div className="adv">
          <div className="adv__head"><div className="adv__name">Zoe Park</div><div className="adv__lane">Innovation</div></div>
          <p className="adv__char">Zoe is the scout, tracking emerging technology and what the leaders are piloting. She's energetic, curious, and future-oriented — the one bringing in the digital-twin demo and asking what happens when a technology everyone's dismissing gets good. <b>Beneath the enthusiasm she's sometimes right about a real disruption while it still looks like a toy.</b></p>
          <div className="lens">
            <div className="lens__cell listen"><div className="lens__k">Listen for</div><div className="lens__v">What the fleet could become — the genuine disruption or opportunity others are writing off too early.</div></div>
            <div className="lens__cell discount"><div className="lens__k">Discount for</div><div className="lens__v">Hype outrunning the foundation — novelty mistaken for value, chasing the dazzling demo.</div></div>
          </div>
          <p className="adv__asks">She tends to ask: <b>Forget where this is today — what happens to our business when it gets good, and are we moving fast enough?</b></p>
        </div>

        {/* the meta-note */}
        <div className="note">
          <div className="lab">The point of the bench</div>
          <h3>Your job is never to find the advisor who's right</h3>
          <p>It's to <b>synthesize six biased views into a judgment none of them would reach alone.</b> They'll disagree — Daniel pushes to move, Frank pulls to be careful, Zoe reaches for the future, Marcus insists on the plumbing, Renata weighs the downside, Diane asks whether it all fits. That argument is the point. Weigh them differently as each decision demands, and remember: <b>none of them will tell you what to do — that call is yours.</b></p>
        </div>

        <div className="foot">FLEXEE · DigitalCo — Your Advisors · who's on the bench and what each is good for</div>
      </div>
    </div>
  );
}
