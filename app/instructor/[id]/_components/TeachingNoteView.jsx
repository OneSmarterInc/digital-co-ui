"use client";

import { useState } from "react";
import { ViewHeader } from "./ui";

/* Teaching Note — the faculty pack's third document, rendered in-app.
 *
 * Faculty-only by placement: this view lives inside the instructor detail
 * shell, which already gates on user.is_instructor before mounting. Nothing
 * here should reach students, so it is never referenced from the student
 * console or any student route.
 *
 * Dark console theme, var(--token, #fallback) throughout, matching the rest
 * of the instructor area. Content is static — fourteen week capsules plus the
 * scaffolding note, the four through-lines, and the companion-document footer.
 * The six weeks carrying quantitative exhibits get a distinct "Exhibit key"
 * callout (amber left rule) so the load-bearing numbers read apart from prose. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";

/* Through-line tag palette — one console color per thread. */
const TAGS = {
  coherence: { label: "Coherence", tone: "var(--blueprint, #5BA3C4)" },
  cloud: { label: "Cloud lock-in", tone: "var(--amber, #E8A13C)" },
  data: { label: "Data & trust", tone: "#9B8AC4" },
  security: { label: "Security / OT", tone: "var(--signal-red, #D2564B)" },
  quant: { label: "Quant exhibit", tone: "var(--ok, #7FB08A)" },
};

/* Minimal inline renderer: **bold** and *italic* → styled spans.
 * The note uses no nested emphasis, so a two-pass split is sufficient. */
function Rich({ text }) {
  const bold = text.split(/(\*\*[^*]+\*\*)/g);
  return bold.map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--paper,#ECEFF2)]">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    const ital = chunk.split(/(\*[^*]+\*)/g);
    return ital.map((seg, j) => {
      if (seg.length > 2 && seg.startsWith("*") && seg.endsWith("*")) {
        return (
          <em key={`${i}-${j}`} className="italic text-[var(--paper,#ECEFF2)]">
            {seg.slice(1, -1)}
          </em>
        );
      }
      return <span key={`${i}-${j}`}>{seg}</span>;
    });
  });
}

function Tag({ id }) {
  const t = TAGS[id];
  if (!t) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.1em]`}
      style={{
        color: t.tone,
        borderColor: `color-mix(in srgb, ${t.tone} 50%, transparent)`,
        background: `color-mix(in srgb, ${t.tone} 8%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.tone }} />
      {t.label}
    </span>
  );
}

const THREADS = [
  ["Coherence", "The Week 1 anchor, audited at Week 13.", "var(--blueprint, #5BA3C4)"],
  ["Cloud lock-in", "Seeded Week 4, squeezed Week 7, billed Week 12.", "var(--amber, #E8A13C)"],
  ["Data rights & trust", "Opened Week 6, decided Week 8, detonated or resolved Week 11.", "#9B8AC4"],
  ["Security / OT", "Signaled from Week 1, gate quietly closes end of Week 7, detonates Week 10 if neglected.", "var(--signal-red, #D2564B)"],
];

/* Each capsule: lead paragraph(s), an optional Exhibit key, then the
 * strong-vs-weak close. `pp` is the two-digit week label. */
const WEEKS = [
  {
    n: 1,
    pp: "01",
    title: "The Inheritance",
    tags: ["coherence", "security", "quant"],
    lead: [
      "The cold open: new team in the chair, Calloway's deliberately vague mandate, and six exhibits of estate. The week is really testing whether the team forms a **thesis** or a task list, and whether anyone notices the factory-floor black box that no exhibit headlines. The strategy statement they write becomes the anchor the Week 13 audit measures everything against — grade it as strong, adequate, or weak in the grading screen (the sim requires this), and be honest, because a generous “strong” on a mushy anchor sets the team up to drift without consequence-feedback.",
    ],
    exhibitKey:
      "**Exhibit key (F1–F6):** load-bearing numbers are the $21.7M dual-estate run with zero retirements, the two-RPG-engineer key-person row, the OT-visibility column, and F6's unit-economics worksheet, where the same five rows support “this business is hopeless” (27,800-unit breakeven at today's ARPU) and “this business is mispriced” (the $60 marginal cost puts breakeven below the units already active). F5's bait is the associate's “$12M at Meridian's rate” line — checking it against the 31,400 capable units is the first calculation of the course, and teams that repeat it unchecked have told you how they read documents. Furniture: capex, inventory days, the CRM and HR rows.",
    rest: [
      "A strong deliverable names a direction, sequences it, and engages the OT question; a weak one inventories problems and promises assessment.",
    ],
  },
  {
    n: 2,
    pp: "02",
    title: "The Alignment",
    tags: ["coherence"],
    lead: [
      "Executive interviews and the first governance decision, with Calloway asking what the team will tell the board. The trap is the **balanced split** — funding everything a little, which feels diplomatic and is strategically empty — and its social variant, proposing safe stabilization to please the room.",
      "The week tests whether the team converts last week's anchor into an alignment choice that costs somebody something, and whether they build governance with stage gates and a business voice rather than treating governance as paperwork. Watch also how they position Calloway: the strong move is a team recommendation that gives him cover, not deference that makes him own their strategy.",
    ],
    exhibitKey: null,
    rest: [
      "No quantitative exhibit; the numbers work this week is remembering last week's. Strong deliverables say who loses and why that's acceptable; weak ones distribute investment like peanut butter and call it balance.",
    ],
  },
  {
    n: 3,
    pp: "03",
    title: "The Reckoning (S/4)",
    tags: ["quant"],
    lead: ["The stalled migration comes due: restructure, rescue as-is, or variants — plus the integrator relationship."],
    exhibitKey:
      "**Exhibit key (the accelerator memo):** every number in the memo is arithmetically correct, and the memo is still wrong. The bait is the +$2.46M “net position,” which counts $3.0M of retirement savings the acceleration doesn't reach and prices a “guarantee” whose credits cap at $630k against six months of $610k burn — the risk never moves. The scope exclusion (interface remediation, the actual blocker, the +$11–14M item) is in the appendix. The closing paragraph — “protect your $40.3M investment” — is the sunk-cost trap stated in vendor prose, and teams that echo it in their deliverable have taken the bait even if they decline the offer.",
    rest: [
      "Strong deliverables restructure with an execution plan and communicate ownership transparently; weak ones buy the accelerator, blame the predecessor, or rescue the plan as written. Renata and Marcus both flag pieces of this in the war room if asked; neither volunteers twice.",
    ],
  },
  {
    n: 4,
    pp: "04",
    title: "The Sourcing Question",
    tags: ["cloud", "quant"],
    lead: ["Core-versus-context sourcing and the cloud commitment — the week that quietly prices Weeks 7 and 12."],
    exhibitKey:
      "**Exhibit key (the TCO workbook):** the $6.4M three-year savings figure is honest money and grading should say so; punishing teams for finding real savings teaches cynicism. What separates readings is the second table — the rows the workbook doesn't have. The load-bearing comparison is ~$1.1M for portability now against $9–14M for repatriation later, plus the commit's floor-and-ratchet terms in the small type.",
    rest: [
      "Strong deliverables take savings *and* protect portability (the two aren't exclusive, which is the insight); weak ones sign the sweet deal as written or, at the other pole, build everything in-house out of vendor paranoia — Frank's captured failure mode, worth noting if a team quotes him uncritically. This is also the week the budget-credibility gate can close on teams that have burned trust with finance; the first benchmark publishes after this week.",
    ],
  },
  {
    n: 5,
    pp: "05",
    title: "The Technology Bets",
    tags: [],
    lead: [
      "The hype portfolio — autonomy, digital twins, additive manufacturing, low-end edge AI — against a splashy Meridian announcement. The week tests portfolio discipline under competitive noise: the trap is betting on the loud technologies and ignoring the unglamorous one, and its emotional engine is **chasing Meridian**.",
      "The quiet tell in the canon: Halberd, the low-cost entrant from exhibit F5, is winning with cheap edge boxes on the low end — teams that connected F5 to this week bet on edge AI with conviction and can say why. Innovation capability structure matters too: embedded beats a separate lab that ships demos.",
    ],
    exhibitKey: null,
    rest: [
      "Strong deliverables watch two hyped items, pilot one, bet where the fleet economics point, and answer Meridian with strategic conviction rather than imitation. Zoe will happily hype and, if pressed, discount her own hype — a good stress test of whether teams push back on advisors.",
    ],
  },
  {
    n: 6,
    pp: "06",
    title: "The Platform Decision",
    tags: ["data", "quant"],
    lead: ["What the connected-products platform becomes — and, buried in the openness setting, who gets what data rights, which arms Week 11."],
    exhibitKey:
      "**Exhibit key (the sizing one-pager):** the bait is the +$48M NPV on the grand platform, computed on Bryce's hockey-stick assumptions — the biggest number on the page, built on the assumptions that produced the last three years. The defensible case is the right-sized option on the “realistic-improved” column, and the grading question isn't which cell they picked but whether they can defend **why their ARPU assumption is the true one** — that's a rights-and-pricing argument, not a modeling argument, and it's the bridge to Weeks 8 and 11.",
    rest: [
      "Strong deliverables right-size, scope openness with explicit data rights, and connect the sizing to F6's unit economics; weak ones fund the grand platform on the deck's math or leave openness unguarded because partnership sounds virtuous.",
    ],
  },
  {
    n: 7,
    pp: "07",
    title: "The Squeeze",
    tags: ["cloud", "security"],
    lead: [
      "The hyperscaler turns the screws, and the last OT signal fires before the gate closes at the end of this week. Two tests run at once. On the vendor side, teams that protected portability in Week 4 can renegotiate from strength; locked-in teams discover what the sweet deal actually cost, and the panic move — switching providers mid-squeeze — compounds the damage.",
    ],
    exhibitKey: null,
    rest: [
      "On the OT side, this is the final chance: the signal has now appeared in Weeks 1 and 7, Renata has said her piece once, and teams that still haven't engaged the factory floor have made their Week 10 inevitable, though nothing announces it. Grade the communication posture too — transparent ownership versus spin is a running character test the scoring notices. No new exhibit; the relevant numbers are Week 4's missing rows, now alive.",
    ],
  },
  {
    n: 8,
    pp: "08",
    title: "The Data Play",
    tags: ["data", "quant"],
    lead: ["Rights posture, governance, and analytics architecture — the strategic heart of the data business."],
    exhibitKey:
      "**Exhibit key (the dueling pro formas):** Column A (assert and charge) wins year one at $6.8M against $4.1M, and that's the bait — every comparison that ends inside twelve months favors it. The load-bearing rows are the ones Column A marks “not modeled”: dealer churn with 47 access tickets already on the board, up to −$25M/yr of channel-sold revenue exposure, and the attach growth (+9,000 units) that only dealer goodwill delivers. Column B's $0.6M/yr governance line is the price of trust stated as a number.",
    rest: [
      "Teams that choose shared value *and* build governance *and* push past descriptive analytics have set up the Week 11 resolution; land-grab teams have written Week 11's script. The second benchmark publishes after this week — note for the reveal discussion that trust is not yet in the formula, so a land-grab team may be leading. Let them enjoy it.",
    ],
  },
  {
    n: 9,
    pp: "09",
    title: "The AI Question",
    tags: ["cloud"],
    lead: [
      "Deployment focus, sourcing, vendor concentration, and the discovery of ungoverned shadow AI in the org. The traps are **theater** (scattering pilots for optics), building everything, concentrating on a single hyperscaler (which deepens the lock-in thread), and handling shadow AI with either a blind eye or a ban — the strong answer governs it with a path, because the people using it are telling you where the value is.",
    ],
    exhibitKey: null,
    rest: [
      "Strong deliverables put AI where the fleet economics already pointed (predictive maintenance on the core), build what differentiates and rent what doesn't, and hedge vendors. This week rewards teams whose Weeks 5 and 8 choices gave AI something to stand on — predictive architecture and real data rights — and quietly punishes teams doing AI on a descriptive-analytics foundation, which is worth naming in feedback.",
    ],
  },
  {
    n: 10,
    pp: "10",
    title: "The Breach",
    tags: ["security"],
    lead: [
      "The crisis week: containment, disclosure, the ransom decision, triage approach. For teams that opened the OT black box, this is a hard week they win — they see the breach, map it, contain it, and earn credibility; the debrief will call it the cheapest credibility move in the game.",
      "For teams that neglected the thread, the gate closed quietly at Week 7 and this is where it detonates — containment fails not because of this week's choices but because of thirteen weeks of not looking, which is the lesson to draw in debrief discussion. Grade the crisis conduct on its own terms: refuse the ransom, disclose transparently, triage in parallel.",
    ],
    exhibitKey: null,
    rest: [
      "One design point worth knowing: a detonated gate caps the run at Win-with-scars no matter how well the team plays from here — the ceiling is the pedagogy. No exhibit; the numbers that mattered were security's $0.8M with no OT scope, sitting in F3 since Week 1.",
    ],
  },
  {
    n: 11,
    pp: "11",
    title: "The Revolt",
    tags: ["data"],
    lead: [
      "The dealer channel rises over data access — Week 6's openness and Week 8's rights posture coming due. Shared-value teams face a tension they can resolve with a repair plan and a reframed offer; land-grab teams face a war they can win only hollowly, because fighting the channel burns the trust that made the data worth anything, and surrendering hands back the advantage the strategy was built on.",
    ],
    exhibitKey: null,
    rest: [
      "The legal posture belongs in the deliverable: settle where it serves the strategy, defend only what must be defended. The third benchmark publishes after this week and **trust now enters the formula** — this is the reversal moment where the Week 8 leader can fall, and the reveal is worth staging in class for exactly that conversation. Strong deliverables treat the revolt as a pricing-and-partnership problem; weak ones treat it as a PR problem or a courtroom problem.",
    ],
  },
  {
    n: 12,
    pp: "12",
    title: "The Bill",
    tags: ["cloud", "quant"],
    lead: ["The cloud invoice at three-times data volume, and the architecture options memo."],
    exhibitKey:
      "**Exhibit key (the bill at fleet scale):** the same two pages read as different documents depending on Week 4 — a decision memo with an eighteen-month payback for portable firms ($6.5M one-time to a $5.8M steady state), a hostage note for locked ones ($14.2M, with every exit priced by the party being exited). The bait this week is the third row: deepening the commitment for a bigger discount, which is Week 4's workbook again, one turn tighter, and teams that take it twice have learned nothing — say so. FinOps discipline is a small flag with long memory.",
    rest: [
      "The teaching line the exhibit builds to: the cost of changing your mind is set years before you want to change it. Strong deliverables execute edge-and-repatriate with the math shown; the grading interest is whether locked-in teams own their Week 4 choice honestly in the deliverable, which feeds the coherence audit next week.",
    ],
  },
  {
    n: 13,
    pp: "13",
    title: "The Audit",
    tags: ["coherence"],
    lead: [
      "The board audit: narrative coherence, the business case, the sizing of the ask, and one hostile question. This is the summative quantitative moment by design — there is no new exhibit because **the exhibit is their own record**: fourteen weeks of numbers they did or didn't collect, and the anchor you graded in Week 1.",
      "Coherent narratives survive contact; contradictory ones are named as such by the audit regardless of local quality. Board language beats technical jargon; a well-sized ask beats a grand one; defending the hostile question beats folding, and folding after thirteen good weeks is rarer than folding after thirteen expedient ones — the audit is where drift gets invoiced.",
    ],
    exhibitKey: null,
    rest: [
      "Grade the business case on whether it's built from *their* realized numbers rather than recycled promise arithmetic; a team quoting Bryce-era projections in Week 13 has completed a full circle you should point out gently.",
    ],
  },
  {
    n: 14,
    pp: "14",
    title: "The Synthesis",
    tags: ["coherence", "cloud", "data", "security"],
    lead: [
      "The final deliverable: genuine integration, honest consequence reckoning, and a forward strategy grounded in the company they actually built rather than the one they meant to build. The traps are papering over, the victory narrative, and describing an unbuilt company — all three are dishonesty about the record dressed as leadership, and the scoring treats them that way.",
      "This is the week the one-firm-one-voice rule pays off: the synthesis forces the team to own, jointly, everything the record says. After submission comes the debrief screen — the tier, the four threads, and the line the whole course has been walking toward: they were never fourteen separate decisions.",
    ],
    exhibitKey: null,
    rest: [
      "The final benchmark publishes with tier outcomes; reveal it after teams have seen their own debriefs, so the standings land as epilogue rather than verdict.",
    ],
  },
];

function ExhibitKey({ text, weekNumber, onOpen }) {
  return (
    <button
      onClick={() => onOpen(weekNumber)}
      className="mt-4 w-full text-left rounded-[2px] border border-[var(--steel-line,#2C323A)] border-l-[3px] border-l-[var(--amber,#E8A13C)] bg-[var(--graphite,#16191D)] px-4 py-3.5 transition hover:bg-[var(--graphite-raised,#1E2228)] hover:border-[var(--amber-deep,#C4791F)]"
    >
      <p className={`mb-2 ${MONO} text-[8.5px] uppercase tracking-[0.16em] text-[var(--amber,#E8A13C)]`}>
        Exhibit key · click to view full exhibit
      </p>
      <p className="text-[0.9rem] leading-[1.65] text-[var(--muted,#8A94A0)]">
        <Rich text={text} />
      </p>
    </button>
  );
}

export default function TeachingNoteView() {
  const [openExhibit, setOpenExhibit] = useState(null);

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Faculty pack · confidential"
        title="Teaching Note"
        subtitle="Fourteen capsules — what each week is really testing, where the traps are and what bait they use, a strong deliverable against a weak one, and for the six quantitative weeks which numbers are load-bearing versus furniture versus seductive-and-wrong."
      />

      {/* confidentiality notice */}
      <div className="flex items-center gap-2.5 rounded-[3px] border border-[var(--blueprint-deep,#3B7E9C)] bg-[var(--graphite-raised,#1E2228)] px-4 py-3">
        <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--blueprint,#5BA3C4)]" />
        <span className="text-[0.85rem] text-[var(--muted,#8A94A0)]">
          Faculty only. Nothing in this note should reach students — the sim's pedagogy depends on the signals being findable rather than highlighted.
        </span>
      </div>

      {/* the one piece of scaffolding to give students */}
      <div className="rounded-[3px] border border-[var(--amber-deep,#C4791F)] bg-[var(--graphite-raised,#1E2228)] px-6 py-5">
        <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--amber,#E8A13C)]`}>
          The one piece of scaffolding to give students
        </p>
        <p className="text-[0.95rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
          In the syllabus and rubric rather than in any assignment:
        </p>
        <blockquote className="my-3 border-l-[3px] border-[var(--amber,#E8A13C)] pl-4 text-[1.05rem] italic leading-[1.55] text-[var(--paper,#ECEFF2)]">
          “Support your recommendation with the numbers available to you, and state which figures you relied on, which you deliberately set aside, and why.”
        </blockquote>
        <p className="text-[0.95rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
          That sentence makes a numberless memo visibly weak without ever saying which numbers matter — the noise-versus-signal judgment stays theirs, and their stated reasoning about it becomes gradable. The <span className="font-medium text-[var(--paper,#ECEFF2)]">rubric-notes field in the grading screen</span> is the natural place to record how well a team used the quantitative material each week.
        </p>
      </div>

      {/* the four through-lines */}
      <div className={`p-6 ${PANEL}`}>
        <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>The four through-lines</h2>
        <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
          Four threads run the length of the course and the endgame is computed from them.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {THREADS.map(([name, trace, tone]) => (
            <div
              key={name}
              className="rounded-[2px] border border-[var(--steel-line,#2C323A)] border-l-[3px] bg-[var(--graphite,#16191D)] p-4"
              style={{ borderLeftColor: tone }}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: tone }} />
                <span className={`${DISPLAY} text-[17px] font-semibold`} style={{ color: tone }}>
                  {name}
                </span>
              </div>
              <p className="mt-1.5 text-[0.85rem] leading-[1.5] text-[var(--muted,#8A94A0)]">{trace}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-[var(--steel-line,#2C323A)] pt-4 text-[0.85rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
          Benchmarks publish after Weeks 4, 8, 11, and 14; trust enters the benchmark formula only at Week 11, which is why a team can lead at Week 8 and be overtaken later by a firm that played the channel honestly —{" "}
          <span className="font-medium text-[var(--paper,#ECEFF2)]">that reversal is a teaching moment, not a bug.</span>
        </p>
      </div>

      {/* week index */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`mr-1 ${MONO} text-[9px] uppercase tracking-[0.14em] text-[var(--muted-dim,#5C6672)]`}>Jump to week:</span>
        {WEEKS.map((w) => (
          <a
            key={w.n}
            href={`#week-${w.n}`}
            className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] px-2 py-1 ${MONO} text-[10px] text-[var(--muted,#8A94A0)] transition hover:border-[var(--amber-deep,#C4791F)] hover:text-[var(--amber,#E8A13C)]`}
          >
            {w.pp}
          </a>
        ))}
      </div>

      {/* the fourteen capsules */}
      <div className="space-y-5">
        {WEEKS.map((w) => (
          <section key={w.n} id={`week-${w.n}`} className={`scroll-mt-24 overflow-hidden ${PANEL}`}>
            <div className="flex items-start gap-4 border-b border-[var(--steel-line,#2C323A)] px-6 py-4">
              <span
                className={`grid h-12 w-12 flex-none place-items-center rounded-[2px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] ${DISPLAY} text-[24px] font-bold leading-none text-[var(--amber,#E8A13C)]`}
              >
                {w.pp}
              </span>
              <div className="min-w-0">
                <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Week {w.n}</p>
                <h2 className={`${DISPLAY} text-[24px] font-semibold leading-tight text-[var(--amber,#E8A13C)]`}>{w.title}</h2>
                {w.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {w.tags.map((t) => (
                      <Tag key={t} id={t} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-5">
              {w.lead.map((p, i) => (
                <p key={`l${i}`} className={`text-[0.95rem] leading-[1.7] text-[var(--muted,#8A94A0)] ${i > 0 ? "mt-3.5" : ""}`}>
                  <Rich text={p} />
                </p>
              ))}
              {w.exhibitKey && <ExhibitKey text={w.exhibitKey} weekNumber={w.n} onOpen={setOpenExhibit} />}
              {w.rest.map((p, i) => (
                <p key={`r${i}`} className="mt-3.5 text-[0.95rem] leading-[1.7] text-[var(--muted,#8A94A0)]">
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* companion documents */}
      <div className="rounded-[3px] border border-dashed border-[var(--steel-soft,#363E48)] px-6 py-5">
        <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Companion documents</p>
        <p className="text-[0.9rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
          The case canon ledger (every number reconciled, plus the exhibit design principle) and the exhibits review copy (all seven rendered as students see them). This note, the ledger, and the review copy together are the faculty pack.
        </p>
      </div>

      {/* modal for exhibit details */}
      <ExhibitModal weekNumber={openExhibit} onClose={() => setOpenExhibit(null)} />
    </div>
  );
}

/* Exhibit content data for modal — maps week numbers to full exhibit sections */
const EXHIBIT_CONTENT = {
  1: {
    title: "Week 1 · Exhibit F5 — Industry & Competitive Note",
    description: "HBS-style industry framing. The bait is the associate's '$12M at Meridian's rate' claim.",
    sections: [
      {
        heading: "Industry Context",
        content: "The industry sells machines through captive dealer networks and increasingly sells outcomes on top of machines — uptime contracts, predictive maintenance, fleet optimization — priced as subscriptions on connected units. Two economics dominate. First, attach: a connected unit costs roughly the same to serve whether or not it pays, so margin lives in the share of the fleet that subscribes. Second, channel: dealers own the customer relationship and the service bay; every OEM that tried to monetize machine data over the dealer's head has paid for it in orders. Analysts put industry services attach at 55–70% for leaders, with subscription revenue per active unit of $300–$520 a year."
      },
      {
        heading: "Competitive Position",
        table: {
          headers: ["Player", "Regional share", "Installed base", "Connected (attach)", "Services ARR"],
          rows: [
            ["Meridian Equipment Group", "31%", "142,000", "61,000 (43%)", "$26.8M"],
            ["DigitalCo", "24%", "96,000", "12,550 (13%)", "$1.9M"],
            ["Halberd Industrial", "17%", "88,000", "39,000 (44%)", "$14.6M"],
          ]
        }
      },
      {
        heading: "Key Calculation",
        content: "Meridian's ARR per connected unit is $439; Halberd's is $374; DigitalCo's is $151. The associate's note argues DigitalCo could 'close to $12M ARR at Meridian's rate' — check what attach that requires against the 31,400 capable units, and ask which number in this table DigitalCo actually controls."
      }
    ]
  },
  3: {
    title: "Week 3 · Case Exhibit — The Integrator's Accelerator Memo",
    description: "Sunk-cost bait wired to the take_accelerator trap. The memo's arithmetic is correct; the guarantee, the scope exclusion, and the closing paragraph are the lesson.",
    sections: [
      {
        heading: "Proposal Summary",
        table: {
          headers: ["Line", "Amount", "Basis (as stated)"],
          rows: [
            ["Accelerator fixed fee", "$4.2M", "Dedicated senior team, 'guaranteed' schedule"],
            ["Schedule improvement", "6 months", "Against current re-baselined plan"],
            ["Avoided program burn", "$3.66M", "6 mo × $610k current monthly burn"],
            ["Earlier benefits capture", "$3.0M", "Retirement savings ($6.0M/yr) starting 6 mo sooner"],
            ["Net position (their total)", "+$2.46M", "'The acceleration pays for itself'"]
          ]
        }
      },
      {
        heading: "What the Memo Prices",
        content: "Three checks separate the readings. The guarantee: schedule credits are capped at 15% of the accelerator fee — $630k — so a six-month guarantee that fails costs them $630k and costs you six more months of $610k burn. The scope: interface remediation (+$11–14M estimate) is excluded — the accelerator speeds up the part that isn't the blocker. The savings: the $6.0M/yr retirement figure only exists after full cutover, which the accelerator doesn't reach. Closing paragraph: '$40.3M investment protection' prices nothing at all — that $40.3M is spent whether you finish, restructure, or stop."
      }
    ]
  },
  4: {
    title: "Week 4 · Case Exhibit — The Sweet Deal TCO Workbook",
    description: "The savings are honest; the exhibit is the missing rows. Wired to the sweet_deal_as_written trap and priced again at Week 12.",
    sections: [
      {
        heading: "Enterprise Agreement",
        table: {
          headers: ["Cloud spend (all workloads)", "Yr 1", "Yr 2", "Yr 3", "3-yr total"],
          rows: [
            ["Pay-as-you-go projection", "$7.4M", "$8.3M", "$9.3M", "$25.0M"],
            ["With enterprise agreement", "$6.2M", "$6.2M", "$6.2M + overage", "$18.6M"],
            ["Headline savings", "", "", "", "$6.4M"]
          ]
        }
      },
      {
        heading: "Missing Rows",
        content: "The workbook doesn't include: Egress at fleet scale ($0.09/GB list — telemetry is 6.1 TB/mo and compounding). Portability layer, built now (~$1.1M one-time). Repatriation later, at scale ($9–14M one-time at Year-3 volumes, against the meter). Renewal leverage: a committed floor is a strong position — for the party you're committed to."
      },
      {
        heading: "The Lesson",
        content: "Compute 3-year TCO and the agreement saves $6.4M — that number is honest. Compute the cost of changing your mind and the same agreement converts a variable cost into a fixed one and sells your future negotiating position back to you at a discount. What a sweet deal costs is only visible in the years after it ends."
      }
    ]
  },
  6: {
    title: "Week 6 · Case Exhibit — Platform Sizing One-Pager",
    description: "The same NPV model, three assumption sets. The biggest number on the page is computed on the assumptions that produced the last three years.",
    sections: [
      {
        heading: "Five-Year NPV @ 10%",
        table: {
          headers: ["Option", "Incremental cost/yr", "NPV on Bryce path", "NPV on current", "NPV realistic-improved"],
          rows: [
            ["Minimal — keep the lights on", "$2.0M", "+$3M", "−$6M", "−$2M"],
            ["Connected services, right-sized", "$6.0M", "+$31M", "−$14M", "+$9M"],
            ["Grand platform", "$15.0M", "+$48M", "−$31M", "−$7M"]
          ]
        }
      },
      {
        heading: "Assumption Sets",
        content: "Bryce path: $439 ARPU by Y3, 60% attach. Current: $151 ARPU, attach growing 6 points/yr. Realistic-improved: $300 ARPU, 40% attach of capable fleet — earned by fixing pricing and rights, not assumed."
      },
      {
        heading: "The Bait",
        content: "The +$48M is the biggest number on the page and it's computed on the assumptions that produced the last three years. The defensible case is where the team can say why its ARPU column is the true one — which is a rights-and-pricing argument, not a modeling argument."
      }
    ]
  },
  8: {
    title: "Week 8 · Case Exhibit — Data Monetization Pro Formas",
    description: "Column A wins every comparison ending inside twelve months and loses every one that doesn't. The Week 11 revolt sits in the rows marked 'not modeled'.",
    sections: [
      {
        heading: "Two Postures",
        table: {
          headers: ["Line", "A — assert & charge", "B — shared value", "Note"],
          rows: [
            ["Year-1 ARR", "$6.8M", "$4.1M", "A charges dealers; B rev-shares 70/30"],
            ["Year-3 ARR", "$7.9M", "$11.2M", "B compounds through dealer-pushed attach"],
            ["Dealer churn exposure", "'not modeled'", "0", "A's footnote — 47 access tickets last quarter"],
            ["Equipment revenue at risk", "up to −$25M/yr", "0", "8% order shift by aggrieved dealers"],
            ["Trust & governance cost", "'n/a'", "$0.6M/yr", "B funds joint governance"]
          ]
        }
      },
      {
        heading: "The Core Insight",
        content: "Column A wins every comparison that ends inside twelve months and loses every one that doesn't. The rows Column A marks 'not modeled' are not zero — they are the part of the model someone chose not to run. If they come due, they come due all at once."
      }
    ]
  },
  12: {
    title: "Week 12 · Case Exhibit — The Bill at Fleet Scale",
    description: "One exhibit, two documents. A decision memo to portable firms, a hostage note to locked-in ones — the Week 4 decision, priced.",
    sections: [
      {
        heading: "Cloud Bill Trend",
        table: {
          headers: ["Posture (set by your Week 4 call)", "Then", "Now", "Next FY", "Driver"],
          rows: [
            ["Committed / locked", "$6.2M floor", "$10.9M", "$13.8M", "Floor + overage + egress"],
            ["Portability protected", "$7.4M", "$9.1M", "$9.9M", "Same volumes; leverage intact"]
          ]
        }
      },
      {
        heading: "Options Memo",
        table: {
          headers: ["Move", "One-time", "Steady-state/yr", "Note"],
          rows: [
            ["Edge + repatriate (portable estate)", "$6.5M", "$5.8M", "Process on-machine; move bulk storage"],
            ["Edge + repatriate (locked estate)", "$14.2M", "$5.8M", "Plus $4.1M egress + $8.9M re-architecture + $1.2M breakage"],
            ["Deepen commitment instead", "$0", "$11.6M and rising", "Bigger discount on bigger meter"]
          ]
        }
      },
      {
        heading: "The Teaching Line",
        content: "To a firm that paid ~$1.1M for portability in Week 4, this is a decision memo with an eighteen-month payback. To a locked-in firm it's a hostage note — every exit priced by the party being exited. The cost of changing your mind is set years before you want to change it."
      }
    ]
  },
};

function ExhibitModal({ weekNumber, onClose }) {
  if (!weekNumber || !EXHIBIT_CONTENT[weekNumber]) return null;

  const exhibit = EXHIBIT_CONTENT[weekNumber];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] px-6 py-5 flex items-center justify-between">
          <div className="flex-1">
            <h2 className={`${DISPLAY} text-[20px] font-semibold text-[var(--amber,#E8A13C)]`}>{exhibit.title}</h2>
            <p className="mt-1 text-[0.85rem] text-[var(--muted,#8A94A0)]">{exhibit.description}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-none flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--steel-line,#2C323A)] text-[var(--muted,#8A94A0)] transition hover:bg-[var(--graphite,#16191D)] hover:text-[var(--paper,#ECEFF2)] ml-4`}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {exhibit.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className={`${DISPLAY} text-[16px] font-semibold text-[var(--amber,#E8A13C)] mb-3`}>
                {section.heading}
              </h3>

              {section.table && (
                <div className="overflow-x-auto bg-[var(--graphite,#16191D)] border border-[var(--steel-line,#2C323A)] rounded-[2px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--steel-line,#2C323A)] bg-[#1B1F24]">
                        {section.table.headers.map((header, i) => (
                          <th
                            key={i}
                            className={`${MONO} text-[9px] uppercase tracking-[0.1em] font-semibold text-[var(--muted-dim,#5C6672)] px-3 py-2 text-left`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={`border-b border-[var(--steel-line,#2C323A)] ${
                            rowIdx % 2 === 1 ? "bg-[#1E2228]" : ""
                          }`}
                        >
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className={`px-3 py-2.5 text-[0.85rem] text-[var(--muted,#8A94A0)] ${
                                cellIdx === 0 ? "font-semibold text-[var(--paper,#ECEFF2)]" : MONO
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.content && (
                <p className="text-[0.9rem] leading-[1.6] text-[var(--muted,#8A94A0)]">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
