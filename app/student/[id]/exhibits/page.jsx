"use client";

import styles from "./exhibits.module.css";

/* The case exhibits — the quantitative layer behind each week's briefing.
 *
 * Two things this file has to get right, because getting them wrong breaks the
 * course rather than just looking untidy:
 *
 * 1. DESIGN NOTES ARE INSTRUCTOR-ONLY. Each exhibit carries a note naming the
 *    trap it is wired to (take_accelerator, sweet_deal_as_written, which rows
 *    are inert, where the bait sits). Rendering those to a student pre-announces
 *    every trap in the simulation. They render only when showDesignNotes is
 *    explicitly true, which only the instructor route passes.
 *
 * 2. LATER WEEKS ARE HIDDEN. A firm in Round 3 must not read the Week 8 and
 *    Week 12 exhibits — that leaks what is coming. Exhibits are filtered to
 *    week <= currentWeek, current first, earlier ones below.
 *
 * Passing no props renders the student view of Week 1 only, which is the safe
 * default if a caller forgets.
 */

function Exhibit({ week, title, intent, currentWeek, showDesignNotes, children }) {
  if (week > currentWeek) return null; // never leak a later week
  return (
    <section className={styles.reviewItem}>
      <div className={styles.reviewHead}>
        <h2>{title}</h2>
        {showDesignNotes && intent && (
          <p className={styles.reviewIntent}>
            <b>Instructor note — not shown to students.</b> Design intent: {intent}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function ExhibitsPage({ currentWeek = 1, showDesignNotes = false }) {
  // Give every Exhibit the gate values without threading them through by hand.
  const gate = { currentWeek, showDesignNotes };
  return (
    <div className={styles.dcConsole}>
      <div className={styles.reviewWrap}>
        <div className={styles.reviewTitle}>
          <h1>THE QUANTITATIVE LAYER</h1>
          <div className={styles.sub}>
            {showDesignNotes
              ? "DigitalCo · every exhibit, with design notes — instructor view"
              : `DigitalCo · the reference documents behind your briefings, through Week ${currentWeek}`}
          </div>
        </div>

        {/* Week 1 · Exhibit F5 */}
        <Exhibit {...gate} week={1} title="Week 1 · Exhibit F5 — Industry & Competitive Note" intent={"the HBS-style industry framing. The bait is the associate's \"$12M at Meridian's rate\" claim — checking it against the 31,400 capable units is the first calculation of the course."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              Prepared by a strategy associate before your arrival — the
              industry the way a case writer would frame it. The competitive
              table rewards arithmetic: work out what each rival earns{" "}
              <b>per connected unit</b> before you decide what DigitalCo's fleet
              is worth.
            </p>
            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Industry note — heavy industrial equipment, digital services
                </span>
                <span className={styles.sheetStamp}>briefing</span>
              </div>
              <div className={styles.tblNote} style={{ borderTop: "none", fontSize: "13px" }}>
                The industry sells machines through captive dealer networks and
                increasingly sells <b>outcomes on top of machines</b> — uptime
                contracts, predictive maintenance, fleet optimization — priced as
                subscriptions on connected units. Two economics dominate. First,{" "}
                <b>attach</b>: a connected unit costs roughly the same to serve
                whether or not it pays, so margin lives in the share of the fleet
                that subscribes. Second, <b>channel</b>: dealers own the customer
                relationship and the service bay; every OEM that tried to monetize
                machine data over the dealer's head has paid for it in orders.
                Analysts put industry services attach at 55–70% for leaders, with
                subscription revenue per active unit of $300–$520 a year.
                Consolidation is expected: the capital cost of a competitive
                digital platform is flat regardless of fleet size, which quietly
                favors scale — or partnership.
              </div>
            </div>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Competitive position — installed base &amp; digital services
                </span>
                <span className={styles.sheetStamp}>assoc. estimates</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Regional share</th>
                      <th>Installed base</th>
                      <th>Connected (attach)</th>
                      <th style={{ textAlign: "right" }}>Services ARR</th>
                      <th>Read</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Meridian Equipment Group</td>
                      <td className={styles.num}>31%</td>
                      <td className={styles.num}>142,000</td>
                      <td className={styles.num}>61,000 (43%)</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $26.8M
                      </td>
                      <td>
                        Scale leader; loud digital narrative, spends heavily to
                        keep it
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>DigitalCo</td>
                      <td className={styles.num}>24%</td>
                      <td className={styles.num}>96,000</td>
                      <td className={styles.num}>12,550 (13%)</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $1.9M
                      </td>
                      <td>
                        Best machines, worst monetization; 31,400 units already
                        telematics-capable
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Halberd Industrial</td>
                      <td className={styles.num}>17%</td>
                      <td className={styles.num}>88,000</td>
                      <td className={styles.num}>39,000 (44%)</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $14.6M
                      </td>
                      <td>
                        Low-cost entrant; ships cheap edge-AI boxes on the low
                        end and moves fast
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Regional &amp; others</td>
                      <td className={styles.num}>28%</td>
                      <td className={styles.num}>—</td>
                      <td className={styles.num}>—</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        —
                      </td>
                      <td>
                        Fragmented; several rumored to be shopping for a platform
                        partner
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>Worth computing, worth doubting:</b> Meridian's ARR per
                connected unit is $439; Halberd's is $374; DigitalCo's is $151.
                The associate's note argues DigitalCo could "close to $12M ARR at
                Meridian's rate" — check what attach that requires against the
                31,400 capable units, and ask which number in this table
                DigitalCo actually controls.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 1 · Exhibit F6 */}
        <Exhibit {...gate} week={1} title="Week 1 · Exhibit F6 — Financial Exhibits" intent={"the firm in numbers, with deliberately inert rows (capex, inventory days) among the load-bearing ones. The unit-economics worksheet supports two opposite conclusions on purpose."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              From the finance pack Reinhardt's office circulates to the board —
              the company in numbers, with the digital program inside it. Some of
              these lines matter enormously to your decisions. Some are here
              because finance packs always include them.{" "}
              <b>Telling those apart is part of the job.</b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Summary P&amp;L — last three fiscal years ($M)
                </span>
                <span className={styles.sheetStamp}>CFO office</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th style={{ textAlign: "right" }}>FY-2</th>
                      <th style={{ textAlign: "right" }}>FY-1</th>
                      <th style={{ textAlign: "right" }}>FY (current)</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Equipment revenue</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,046
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,081
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,058
                      </td>
                      <td>Cyclical; flat in real terms</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Parts &amp; service revenue</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        318
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        334
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        352
                      </td>
                      <td>The steady margin engine — dealer-delivered</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Digital services revenue</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        0.8
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1.4
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1.9
                      </td>
                      <td>vs $12M promised by now (see F3)</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Total revenue</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,365
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,416
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        1,412
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>EBITDA</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        156
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        149
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        138
                      </td>
                      <td>Margin 11.4% → 9.8%; the PE firm's favorite row</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        — of which: digital &amp; IT run + program
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        (19.4)
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        (23.8)
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        (27.1)
                      </td>
                      <td>Reconciles to F3</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Inventory (days)</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        118
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        121
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        124
                      </td>
                      <td>
                        The $9M working-capital promise lives here — unrealized
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Capex</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        61
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        58
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        63
                      </td>
                      <td>Mostly plant; ordinary for the industry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>Reading the trend:</b> digital spend nearly doubled across
                three years while EBITDA margin fell 1.6 points — that pairing,
                not any single line, is Reinhardt's skepticism and the PE
                firm's ammunition. The capex and inventory rows are real numbers.
                Neither one decides anything this week.
              </div>
            </div>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Connected products — unit economics worksheet (as circulated)
                </span>
                <span className={styles.sheetStamp}>unaudited</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Measure</th>
                      <th style={{ textAlign: "right" }}>Value</th>
                      <th>Derivation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>
                        Platform run cost / active unit
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $335 / yr
                      </td>
                      <td>$4.2M ÷ 12,550 active</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Subscription revenue / active unit
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $151 / yr
                      </td>
                      <td>$1.9M ÷ 12,550 active</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Contribution / active unit
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        −$184 / yr
                      </td>
                      <td>Every connected unit currently loses money</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Marginal cost of an added unit
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        ~$60 / yr
                      </td>
                      <td>Ingest + support; the platform itself is largely fixed</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        "Breakeven attach" (as circulated)
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        27,800 units
                      </td>
                      <td>
                        $4.2M ÷ $151 —{" "}
                        <b>check the logic before you use it</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>Two calculations, two conclusions:</b> at today's $151 ARPU
                the platform needs 27,800 paying units to cover its run cost —
                nearly 90% of the capable fleet, which reads as hopeless. But the
                fixed-cost structure and the $60 marginal cost mean the same
                platform at Meridian-level ARPU breaks even near 11,000 units —
                fewer than are <b>already active</b>. Whether this business is
                dead or merely mispriced is a pricing-and-rights question, not a
                cost question. Both readings are in these five rows.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 3 · Case Exhibit */}
        <Exhibit {...gate} week={3} title="Week 3 · Case Exhibit — The Integrator's Accelerator Memo" intent={"sunk-cost bait wired to the take_accelerator trap. The memo's arithmetic is correct; the guarantee, the scope exclusion, and the closing paragraph are the lesson."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              Received this morning from the systems integrator's engagement
              partner, copied to Reinhardt. The arithmetic in it is correct.{" "}
              <b>Whether it answers the question in front of you is a different matter.</b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Proposal — S/4 delivery accelerator (integrator letterhead)
                </span>
                <span className={styles.sheetStamp}>vendor</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Basis (as stated)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Accelerator fixed fee</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $4.2M
                      </td>
                      <td>
                        Dedicated senior team, "guaranteed" schedule
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Schedule improvement</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6 months
                      </td>
                      <td>Against current re-baselined plan</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Avoided program burn</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $3.66M
                      </td>
                      <td>6 mo × $610k current monthly burn</td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Earlier benefits capture</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $3.0M
                      </td>
                      <td>
                        Retirement savings ($6.0M/yr) starting 6 mo sooner
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Net position (their total)</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        +$2.46M
                      </td>
                      <td>"The acceleration pays for itself"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                Closing paragraph, verbatim: "DigitalCo has invested $40.3M in
                this program. The fastest way to protect that investment is to
                finish strong."
              </div>
            </div>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  What the memo prices — and what it doesn't
                </span>
                <span className={styles.sheetStamp}>read carefully</span>
              </div>
              <div className={styles.tblNote} style={{ borderTop: "none" }}>
                Three checks separate the two readings.{" "}
                <b>The guarantee:</b> schedule credits are capped at 15% of the
                accelerator fee — $630k — so a six-month guarantee that fails
                costs them $630k and costs you six more months of $610k burn;
                the risk hasn't moved. <b>The scope:</b> interface remediation
                (the +$11–14M estimate from their own assessment, F2 risk 01) is
                excluded — the accelerator speeds up the part of the program
                that isn't the blocker. <b>The savings:</b>the $6.0M/yr
                retirement figure only exists after full cutover, which the
                accelerator doesn't reach; counting it is counting the harvest
                while arguing about the tractor. And the closing paragraph
                prices nothing at all — the $40.3M is spent whether you finish,
                restructure, or stop, and any analysis that uses it as a reason
                is measuring the past instead of the three roads ahead.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 4 · Case Exhibit */}
        <Exhibit {...gate} week={4} title="Week 4 · Case Exhibit — The Sweet Deal TCO Workbook" intent={"the savings are honest; the exhibit is the missing rows. Wired to the sweet_deal_as_written trap and priced again at Week 12."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              The hyperscaler's account team left this workbook after the
              executive briefing. The savings column is real money.{" "}
              <b>The exhibit is what isn't on it.</b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Enterprise agreement — 3-year committed spend ($M)
                </span>
                <span className={styles.sheetStamp}>vendor workbook</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Cloud spend (all workloads)</th>
                      <th style={{ textAlign: "right" }}>Yr 1</th>
                      <th style={{ textAlign: "right" }}>Yr 2</th>
                      <th style={{ textAlign: "right" }}>Yr 3</th>
                      <th style={{ textAlign: "right" }}>3-yr total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>
                        Pay-as-you-go projection
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        7.4
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        8.3
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        9.3
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        25.0
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        With enterprise agreement
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.2
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.2
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.2 + overage
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        18.6
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Headline savings</td>
                      <td
                        className={styles.num}
                        colSpan={3}
                        style={{ textAlign: "right" }}
                      ></td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>6.4</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                Terms in the appendix, small type: the $6.2M annual commit is a{" "}
                <b>floor</b> — billed in full regardless of usage; overage bills
                at list; the discount resets at renewal "subject to
                then-current programs."
              </div>
            </div>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  The rows the workbook doesn't have
                </span>
                <span className={styles.sheetStamp}>compute these</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Missing row</th>
                      <th style={{ textAlign: "right" }}>Estimate</th>
                      <th>Why it matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Egress at fleet scale</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        $0.09 / GB list
                      </td>
                      <td>
                        Telemetry is 6.1 TB/mo and compounding — moving your own
                        data out is priced like a toll road
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Portability layer, built now
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        ~$1.1M one-time
                      </td>
                      <td>
                        Containerized pipeline + open formats while the estate
                        is small
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Repatriation later, at scale
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        $9–14M one-time
                      </td>
                      <td>
                        The same move priced at Year-3 volumes, against the meter
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Renewal leverage</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        not priced
                      </td>
                      <td>
                        A committed floor is a strong position — for the party
                        you're committed to
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>Two readings:</b> compute 3-year TCO and the agreement saves
                $6.4M — that number is honest. Compute the{" "}
                <b>cost of changing your mind</b> and the same agreement
                converts a variable cost into a fixed one and sells your future
                negotiating position back to you at a discount. What a sweet
                deal costs is only visible in the years after it ends.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 6 · Case Exhibit */}
        <Exhibit {...gate} week={6} title="Week 6 · Case Exhibit — Platform Sizing One-Pager" intent={"the same NPV model, three assumption sets. The biggest number on the page is computed on the assumptions that produced the last three years."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              Zoe's team ran the platform options through the same NPV model
              twice — once on the revenue path from Bryce's board deck, once on
              the unit economics from the finance pack (F6).{" "}
              <b>Same spreadsheet. The assumption does all the work.</b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Five-year NPV @ 10% — three investment levels, two assumption
                  sets ($M)
                </span>
                <span className={styles.sheetStamp}>internal model</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th style={{ textAlign: "right" }}>
                        Incremental cost / yr
                      </th>
                      <th style={{ textAlign: "right" }}>NPV on Bryce path*</th>
                      <th style={{ textAlign: "right" }}>
                        NPV on current economics†
                      </th>
                      <th style={{ textAlign: "right" }}>
                        NPV, realistic-improved‡
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>
                        Minimal — keep the lights on
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        2.0
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        +3
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        −6
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        −2
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Connected services, right-sized
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.0
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        +31
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        −14
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>+9</b>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Grand platform</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        15.0
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>+48</b>
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        −31
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        −7
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                *Bryce path: $439 ARPU by Y3, 60% attach — the hockey stick from
                F4, slide 4. †Current: $151 ARPU, attach growing 6 points/yr —
                F6 as it stands. ‡Realistic-improved: $300 ARPU, 40% attach of
                the capable fleet — earned by fixing pricing and rights, not
                assumed. <b>The bait is the +$48M:</b> it's the biggest number
                on the page and it's computed on the assumptions that produced
                the last three years. The defensible case is the one where the
                team can say <i>why</i> its ARPU column is the true one — which
                is a rights-and-pricing argument, not a modeling argument.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 8 · Case Exhibit */}
        <Exhibit {...gate} week={8} title="Week 8 · Case Exhibit — Data Monetization Pro Formas" intent={"Column A wins every comparison ending inside twelve months and loses every one that doesn't. The Week 11 revolt sits in the rows marked 'not modeled'."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              Two pro formas for the data business, prepared to the same
              template. Column A asserts DigitalCo's rights and prices access.
              Column B shares the value with the channel.{" "}
              <b>Year one is where Column A wins. Look at what each column zeroes out.</b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Data services pro forma — two postures ($M ARR unless noted)
                </span>
                <span className={styles.sheetStamp}>draft, privileged</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th style={{ textAlign: "right" }}>A — assert &amp; charge</th>
                      <th style={{ textAlign: "right" }}>B — shared value</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Year-1 ARR</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>6.8</b>
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        4.1
                      </td>
                      <td>
                        A charges dealers for access to machine data; B
                        rev-shares 70/30
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Year-3 ARR</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        7.9
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>11.2</b>
                      </td>
                      <td>
                        B compounds through dealer-pushed attach (+9,000 active
                        units)
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Dealer churn exposure</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        "not modeled"
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        0
                      </td>
                      <td>
                        A's footnote — 47 access tickets last quarter is the
                        leading indicator
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Equipment revenue at risk</td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        up to −25 / yr
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        0
                      </td>
                      <td>
                        An 8% order shift by aggrieved dealers, on $352M parts +
                        channel-sold equipment
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Trust &amp; governance cost</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        "n/a"
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        0.6 / yr
                      </td>
                      <td>B funds joint governance; A treats trust as free</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>The exhibit in one line:</b> Column A wins every comparison
                that ends inside twelve months and loses every one that doesn't.
                The rows Column A marks "not modeled" are not zero — they are
                the part of the model someone chose not to run, and if they come
                due they come due all at once.
              </div>
            </div>
          </div>
        </Exhibit>

        {/* Week 12 · Case Exhibit */}
        <Exhibit {...gate} week={12} title="Week 12 · Case Exhibit — The Bill at Fleet Scale" intent={"one exhibit, two documents. A decision memo to portable firms, a hostage note to locked-in ones — the Week 4 decision, priced."}>
          <div className={styles.artPane}>
            <p className={styles.provenance}>
              Reinhardt's office forwarded the cloud invoice trend with one
              line: "explain." The facing page is the architecture team's
              options memo.{" "}
              <b>
                The same two pages read very differently depending on what your
                firm decided in Week 4.
              </b>
            </p>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Cloud bill trend — data volume ×3 since Week 4 ($M / yr)
                </span>
                <span className={styles.sheetStamp}>CFO office</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Posture (set by your Week 4 call)</th>
                      <th style={{ textAlign: "right" }}>Then</th>
                      <th style={{ textAlign: "right" }}>Now</th>
                      <th style={{ textAlign: "right" }}>Next FY (trend)</th>
                      <th>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>Committed / locked</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.2 floor
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        10.9
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        13.8
                      </td>
                      <td>
                        Floor + overage at list + egress now a visible line
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>Portability protected</td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        7.4
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        9.1
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        9.9
                      </td>
                      <td>
                        Same volumes; leverage intact, unit pricing negotiated
                        twice
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.sheet}>
              <div className={styles.sheetBar}>
                <span className={styles.sheetT}>
                  Options memo — edge processing + selective repatriation
                </span>
                <span className={styles.sheetStamp}>architecture</span>
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>Move</th>
                      <th style={{ textAlign: "right" }}>One-time</th>
                      <th style={{ textAlign: "right" }}>Steady-state / yr</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.sysName}>
                        Edge + repatriate (portable estate)
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        6.5
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        <b>5.8</b>
                      </td>
                      <td>
                        Process telemetry on-machine; move bulk storage; ~80%
                        of F6's $60 marginal unit cost survives
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Edge + repatriate (locked estate)
                      </td>
                      <td className={`${styles.num} ${styles.varNeg}`} style={{ textAlign: "right" }}>
                        14.2
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        5.8
                      </td>
                      <td>
                        Same destination — plus $4.1M egress at meter, $8.9M
                        re-architecture off proprietary services, $1.2M contract
                        breakage
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.sysName}>
                        Deepen commitment instead
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        0
                      </td>
                      <td className={styles.num} style={{ textAlign: "right" }}>
                        11.6 and rising
                      </td>
                      <td>
                        A bigger discount on a bigger meter — the Week 4
                        workbook again, one turn tighter
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.tblNote}>
                <b>Same exhibit, two documents:</b> to a firm that paid ~$1.1M
                for portability in Week 4, this is a decision memo with an
                eighteen-month payback. To a locked-in firm it's a hostage note
                — every exit priced by the party being exited. The lesson isn't
                that clouds are bad; it's that{" "}
                <b>
                  the cost of changing your mind is set years before you want to
                  change it.
                </b>
              </div>
            </div>
          </div>
        </Exhibit>
      </div>
    </div>
  );
}
