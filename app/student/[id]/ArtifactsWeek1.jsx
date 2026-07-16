"use client";

/* Week 1's reference files as real documents — F1 portfolio map, F2 project
 * dashboards, F3 spend & return, F4 the inherited Bryce deck. Static by
 * design: Week 1 is the same inheritance for every firm. Weeks 2–14 render
 * their artifacts from the API's generic file cards instead.
 * Styles come from the .dc-console system in app/console.css.
 *
 * Two fixes over the previous version, no content changed:
 *   1. The slide wrapper is a module-level component. It used to be declared
 *      inside F4's render body, which gave it a new identity on every render,
 *      so React tore down and rebuilt all seven slides on each Prev/Next
 *      instead of flipping a class.
 *   2. Deck nav disables at the ends rather than clicking into a no-op.
 */

import { useState } from "react";

const TABS = [
  ["f1", "F1", "Application Portfolio Map"],
  ["f2", "F2", "Project Dashboards"],
  ["f3", "F3", "Digital Spend & Return"],
  ["f4", "F4", "Bryce Transformation Deck"],
];

const F1_ROWS = [
  ["Order management core", "IBM i · RPG · Aldon change control", "Order-to-cash, pricing, core plant interfaces", "IT (legacy team)", "$3.1M", "24 yrs", ["ok", "live"], ["ok", "full"], "none planned — S/4 target, stalled"],
  ["Plant MES — 3 plants", "Mixed vendor · plant-managed", "Production execution, machine control interfaces", "Operations (Petrillo)", "$2.4M", "11–19 yrs", ["ok", "live"], ["none", "none"], "not in scope of any program"],
  ["S/4HANA", "SAP cloud + systems integrator", "Target ERP core — finance live, supply chain stalled", "Transformation office", "$6.8M", "3 yrs", ["red", "partial"], ["ok", "full"], "—"],
  ["Connected-products platform", "Hyperscaler-hosted · own pipeline", "Telematics ingest, customer & dealer portal", "Product (Fischer)", "$4.2M ▲", "3 yrs", ["amber", "live · 40% fleet"], ["dim", "partial"], "—"],
  ["Fleet telemetry pipeline", "Hyperscaler streaming · built by platform team", "Machine data ingest from fielded equipment", "Product (Fischer)", "incl. above", "3 yrs", ["ok", "live"], ["none", "none"], "never security-reviewed by IT"],
  ["Data lake", "Hyperscaler object store", "Analytics landing zone — ungoverned accumulation", "unclear", "$1.9M ▲", "4 yrs", ["amber", "live"], ["dim", "partial"], "—"],
  ["BI tooling — 5 products", "Departmental · overlapping licenses", "Reporting sprawl across functions", "Departments", "$1.1M", "2–9 yrs", ["amber", "sprawl"], ["dim", "partial"], "consolidation proposed twice, never funded"],
  ["Dealer portal", "Legacy web · in-house", "Dealer orders, warranty, parts — data-access complaints rising", "Sales (Ferraro)", "$0.9M", "9 yrs", ["ok", "live"], ["ok", "full"], "—"],
  ["CRM", "SaaS", "Sales pipeline & accounts", "Sales (Ferraro)", "$0.7M", "6 yrs", ["ok", "live"], ["ok", "full"], "—"],
  ["HR / payroll", "SaaS", "HR core", "HR", "$0.6M", "5 yrs", ["ok", "live"], ["ok", "full"], "—"],
];

const Pill = ({ tone, children }) => <span className={`pill pill--${tone}`}>{children}</span>;

function F1() {
  return (
    <>
      <p className="provenance">
        The estate, system by system. Read the <b>run cost</b> column against what each
        system does, read the <b>IT visibility</b> column against what could go wrong, and
        notice what the retirement column says about why DigitalCo pays for two estates at
        once.
      </p>
      <div className="sheet">
        <div className="sheet__bar">
          <span className="sheet__t">Systems of record &amp; platforms — annual run view</span>
          <span className="sheet__stamp">internal</span>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>System</th><th>Function</th><th>Owner</th>
                <th style={{ textAlign: "right" }}>Annual run</th>
                <th>Age</th><th>Status</th><th>IT visibility</th><th>Retirement</th>
              </tr>
            </thead>
            <tbody>
              {F1_ROWS.map(([name, plat, fn, owner, run, age, status, vis, ret]) => (
                <tr key={name}>
                  <td><span className="sysname">{name}</span><span className="sysplat">{plat}</span></td>
                  <td>{fn}</td>
                  <td>{owner}</td>
                  <td className="num" style={{ textAlign: "right" }}>{run}</td>
                  <td className="num">{age}</td>
                  <td><Pill tone={status[0]}>{status[1]}</Pill></td>
                  <td><Pill tone={vis[0]}>{vis[1]}</Pill></td>
                  <td>{ret}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total annual run — old and new estates, both live</td>
                <td className="num" style={{ textAlign: "right" }}>$21.7M</td>
                <td colSpan={3}></td>
                <td>Systems retired in last 3 years: <b>0</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="tblnote">
          <b>PMO note:</b> the order-management core and the plant interfaces are documented
          only in the code itself. Two RPG engineers on staff understand the interface layer;
          one is retirement-eligible. Plant MES and the fleet telemetry pipeline sit outside
          IT&rsquo;s monitoring, patching, and review — Operations and Product respectively
          administer their own. Duplicate capability is carried in eight of the ten rows above
          because nothing has been decommissioned since the transformation began.
        </div>
      </div>
    </>
  );
}

const KPI = ({ k, v, tone, small }) => (
  <div className="kpi">
    <div className="kpi__k">{k}</div>
    <div className={`kpi__v${tone ? ` v-${tone}` : ""}`}>
      {v} {small && <small>{small}</small>}
    </div>
  </div>
);

function F2() {
  return (
    <>
      <p className="provenance">
        The two programs your predecessor staked the transformation on, plus the organization
        carrying them. The numbers here are the ones <b>Bryce&rsquo;s deck (F4) promised
        against</b> — read them side by side.
      </p>
      <div className="dash">
        <div className="panel">
          <div className="panel__head">
            <span className="lamp lamp--red" /><span className="panel__t">S/4HANA Program</span>
            <span className="panel__tag">status: RED</span>
          </div>
          <div className="panel__body">
            <div className="kpis">
              <KPI k="Approved budget" v="$25.0M" />
              <KPI k="Spent to date" v="$40.3M" tone="red" />
              <KPI k="Schedule vs baseline" v="~24 mo" small="late" tone="red" />
              <KPI k="Integrator burn" v="$610k" small="/ mo" tone="amber" />
            </div>
            <div className="bar">
              <div className="bar__label"><span>BUDGET CONSUMPTION</span><span>161% of approved</span></div>
              <div className="bar__track">
                <div className="bar__fill" style={{ width: "62%", background: "var(--blueprint-deep)" }} />
                <div className="bar__fill" style={{ left: "62%", width: "38%", background: "var(--signal-red)" }} />
                <div className="bar__mark" style={{ left: "62%" }} />
                <div className="bar__marklabel" style={{ left: "62%" }}>$25M approved</div>
              </div>
            </div>
            <div className="milestones">
              <div className="ms"><span className="ms__date mono">14 mo late</span><span className="ms__what">Finance module live <span>— the only conversion completed</span></span></div>
              <div className="ms"><span className="ms__date mono">stalled 7 mo</span><span className="ms__what">Supply-chain conversion <span>— blocked, see risk 01</span></span></div>
              <div className="ms"><span className="ms__date mono">no date</span><span className="ms__what">Plant &amp; order-management cutover <span>— not yet planned</span></span></div>
            </div>
            <div className="risklist">
              <div className="risk"><span className="risk__n mono">01</span><span><b>Legacy dependency mapping.</b> 300+ undocumented interfaces between the IBM i order core and plant systems. Two engineers understand the layer. The integrator&rsquo;s remediation estimate: <b>+$11–14M and 9–12 months</b>, confidence low.</span></div>
              <div className="risk"><span className="risk__n mono">02</span><span><b>Key-person risk.</b> One of the two RPG interface engineers is retirement-eligible this year.</span></div>
              <div className="risk"><span className="risk__n mono">03</span><span><b>Dual-run cost.</b> Legacy and S/4 estates both fully funded until cutover — no retirement savings realized to date.</span></div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <span className="lamp lamp--amber" /><span className="panel__t">Connected Products</span>
            <span className="panel__tag">status: AMBER · yr 3</span>
          </div>
          <div className="panel__body">
            <div className="kpis">
              <KPI k="Eligible fleet" v="31,400" />
              <KPI k="Telematics active" v="12,550" small="= 40%" tone="blue" />
              <KPI k="Subscription revenue" v="$1.9M" small="ARR" tone="red" />
              <KPI k="Platform run cost" v="$4.2M" small="/ yr ▲" tone="amber" />
            </div>
            <div className="bar">
              <div className="bar__label"><span>FLEET ATTACH</span><span>new units 78% · retrofit 9%</span></div>
              <div className="bar__track">
                <div className="bar__fill" style={{ width: "40%", background: "var(--blueprint-deep)" }} />
                <div className="bar__mark" style={{ left: "40%" }} />
                <div className="bar__marklabel" style={{ left: "40%" }}>40% of eligible fleet</div>
              </div>
            </div>
            <div className="milestones">
              <div className="ms"><span className="ms__date mono">net / yr</span><span className="ms__what" style={{ color: "var(--red-deep)" }}>−$2.3M <span>— run cost against subscription revenue</span></span></div>
              <div className="ms"><span className="ms__date mono">90 days</span><span className="ms__what">47 dealer tickets <span>— data access to their own customers&rsquo; machines</span></span></div>
              <div className="ms"><span className="ms__date mono">monthly</span><span className="ms__what">6.1 TB telemetry ingested <span>— accumulating in the lake, largely unused</span></span></div>
            </div>
            <div className="risklist">
              <div className="risk"><span className="risk__n mono">01</span><span><b>Monetization gap.</b> 214 paying customers three years in. The data is collected; the business model isn&rsquo;t.</span></div>
              <div className="risk"><span className="risk__n mono">02</span><span><b>Channel friction.</b> Dealer complaints about data access rising quarter over quarter — see F1, dealer portal.</span></div>
            </div>
          </div>
        </div>

        <div className="panel panel--wide">
          <div className="panel__head">
            <span className="lamp lamp--dim" /><span className="panel__t">IT Organization</span>
            <span className="panel__tag">the people carrying it</span>
          </div>
          <div className="panel__body">
            <div className="kpis">
              <KPI k="Attrition, trailing 12 mo" v="19%" tone="amber" />
              <KPI k="Open requisitions" v="14" />
              <KPI k="RPG engineers (IBM i core)" v="2" small="1 retirement-elig." tone="red" />
              <KPI k="Security function" v="3 FTE" small="IT-side only — no OT scope" />
              <KPI k="Contractor share of program work" v="64%" tone="amber" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function F3() {
  return (
    <>
      <p className="provenance">
        The schedule Reinhardt reads before every conversation with you. The first table is
        what digital actually costs this year. The second is what the transformation{" "}
        <b>promised</b> at approval, against what has been <b>realized</b>. His skepticism
        lives in the variance column.
      </p>
      <div className="sheet">
        <div className="sheet__bar">
          <span className="sheet__t">Annual digital &amp; run spend — current FY</span>
          <span className="sheet__stamp">CFO office</span>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead><tr><th>Line</th><th>Description</th><th style={{ textAlign: "right" }}>This FY</th><th>Trend</th></tr></thead>
            <tbody>
              <tr><td className="sysname">S/4 program</td><td>License, cloud, and integrator (avg burn annualized)</td><td className="num" style={{ textAlign: "right" }}>$13.6M</td><td>▲ third consecutive year above plan</td></tr>
              <tr><td className="sysname">Connected-products run</td><td>Hyperscaler hosting, pipeline, portal</td><td className="num" style={{ textAlign: "right" }}>$4.2M</td><td>▲ scales with fleet</td></tr>
              <tr><td className="sysname">Data lake &amp; analytics</td><td>Storage, compute, five BI products</td><td className="num" style={{ textAlign: "right" }}>$3.0M</td><td>▲ storage compounding</td></tr>
              <tr><td className="sysname">Legacy estate run</td><td>IBM i core, plant systems, dealer portal</td><td className="num" style={{ textAlign: "right" }}>$5.5M</td><td>— flat; nothing retired</td></tr>
              <tr><td className="sysname">Security</td><td>IT-side only — plant &amp; fleet OT explicitly out of scope</td><td className="num" style={{ textAlign: "right" }}>$0.8M</td><td>— flat</td></tr>
            </tbody>
            <tfoot><tr><td colSpan={2}>Total digital &amp; run</td><td className="num" style={{ textAlign: "right" }}>$27.1M</td><td></td></tr></tfoot>
          </table>
        </div>
      </div>
      <div className="sheet">
        <div className="sheet__bar">
          <span className="sheet__t">Benefits case — promised at approval vs realized to date</span>
          <span className="sheet__stamp">variance</span>
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <thead><tr><th>Promised benefit (source: Bryce transformation case, board-approved)</th><th style={{ textAlign: "right" }}>Promised</th><th style={{ textAlign: "right" }}>Realized</th><th style={{ textAlign: "right" }}>Variance</th></tr></thead>
            <tbody>
              <tr><td>Legacy retirement savings, annual — from decommissioning after S/4 cutover</td><td className="num" style={{ textAlign: "right" }}>$6.0M / yr<br /><span className="ledger-note">from last FY</span></td><td className="num" style={{ textAlign: "right" }}>$0</td><td className="num var-neg" style={{ textAlign: "right" }}>−$6.0M / yr</td></tr>
              <tr><td>Data-services revenue — subscriptions on the connected fleet</td><td className="num" style={{ textAlign: "right" }}>$12.0M ARR<br /><span className="ledger-note">by this FY</span></td><td className="num" style={{ textAlign: "right" }}>$1.9M ARR</td><td className="num var-neg" style={{ textAlign: "right" }}>−$10.1M</td></tr>
              <tr><td>Working-capital release — inventory reduction from S/4 supply chain</td><td className="num" style={{ textAlign: "right" }}>$9.0M one-time</td><td className="num" style={{ textAlign: "right" }}>n/a — module not live</td><td className="num var-neg" style={{ textAlign: "right" }}>−$9.0M</td></tr>
              <tr><td>Dealer digital adoption — portal-mediated order share</td><td className="num" style={{ textAlign: "right" }}>60%</td><td className="num" style={{ textAlign: "right" }}>31%</td><td className="num var-neg" style={{ textAlign: "right" }}>−29 pts</td></tr>
            </tbody>
          </table>
        </div>
        <div className="tblnote">
          <b>Finance note:</b> the benefits case has not been re-reviewed since board approval
          three years ago. Program spend continues to be drawn against it. This office has
          requested a revised case twice; none has been submitted.
        </div>
      </div>
    </>
  );
}

const SLIDES = 7;

/* Module-level, not declared inside F4 — a component defined during render gets
 * a fresh identity every time, so React unmounts and rebuilds the whole deck on
 * each Prev/Next instead of just toggling .slide--on. */
function Slide({ n, at, children }) {
  return (
    <div className={`slide ${at === n ? "slide--on" : ""}`}>
      {children}
      <span className="slide__brand">DigitalCo confidential{n === 0 ? " · T. Bryce, CIO" : ""}</span>
      <span className="slide__pg">{n + 1} / {SLIDES}</span>
    </div>
  );
}

function F4() {
  const [at, setAt] = useState(0);
  const go = (d) => setAt((c) => Math.max(0, Math.min(SLIDES - 1, c + d)));
  return (
    <>
      <p className="provenance">
        The deck that sold the board on all of it, three years ago. Flip through it the way
        the board saw it — then hold it against F2 and F3 and decide for yourselves{" "}
        <b>what&rsquo;s missing from every slide.</b>
      </p>
      <div className="deck">
        <Slide n={0} at={at}>
          <div className="bigclaim">DIGITALCO 2.0<br /><b>One company. One digital core.</b></div>
          <p style={{ marginTop: 0 }}>A transformation program to carry three generations of manufacturing excellence into the data era.</p>
        </Slide>
        <Slide n={1} at={at}>
          <h3>The burning platform</h3><div className="accentline" />
          <p>Our machines are the best in the region — and our systems are the oldest. Competitors are connecting their fleets. Customers expect digital. Every year we wait, the gap compounds.</p>
          <p style={{ marginTop: 14 }}><b>The risk is not moving too fast. The risk is moving too slow.</b></p>
        </Slide>
        <Slide n={2} at={at}>
          <h3>Four pillars, one program</h3><div className="accentline" />
          <div className="pillars">
            <div className="pillar"><div className="pillar__t">One Digital Core</div><div className="pillar__d">S/4HANA replaces the legacy estate. Modern, cloud, integrated.</div></div>
            <div className="pillar"><div className="pillar__t">Connected Fleet</div><div className="pillar__d">Every machine a data source. Telematics standard across the line.</div></div>
            <div className="pillar"><div className="pillar__t">Data-Driven Services</div><div className="pillar__d">New recurring revenue on the installed base.</div></div>
            <div className="pillar"><div className="pillar__t">Legacy Retirement</div><div className="pillar__d">Decommission fast. Fund the new with the old.</div></div>
          </div>
        </Slide>
        <Slide n={3} at={at}>
          <h3>Data-services revenue</h3><div className="accentline" />
          <div className="hockey">
            {[["8%", "$1M", "Y1"], ["18%", "$4M", "Y2"], ["42%", "$12M", "Y3"], ["66%", "$18M", "Y4"], ["100%", "$25M", "Y5"]].map(([h, v, y]) => (
              <div className="hbar" style={{ height: h }} key={y}>
                <span className="hbar__v">{v}</span><span className="hbar__y">{y}</span>
              </div>
            ))}
          </div>
        </Slide>
        <Slide n={4} at={at}>
          <h3>Program timeline</h3><div className="accentline" />
          <div style={{ marginTop: "auto", marginBottom: "auto" }}>
            <div className="ganttrow"><span className="ganttrow__l">S/4 core migration</span><span className="ganttrow__bar" style={{ marginRight: "22%" }} /></div>
            <div className="ganttrow"><span className="ganttrow__l">Connected-fleet rollout</span><span className="ganttrow__bar" style={{ marginRight: "12%" }} /></div>
            <div className="ganttrow"><span className="ganttrow__l">Data platform &amp; analytics</span><span className="ganttrow__bar" style={{ marginRight: "18%" }} /></div>
            <div className="ganttrow"><span className="ganttrow__l">Services go-to-market</span><span className="ganttrow__bar" style={{ marginLeft: "10%", marginRight: "8%" }} /></div>
            <div className="ganttrow"><span className="ganttrow__l">Legacy retirement</span><span className="ganttrow__bar" style={{ marginLeft: "6%" }} /></div>
          </div>
          <p style={{ fontSize: "clamp(10px,1.3vw,13px)", color: "#6B7580" }}>All workstreams launch in parallel to compress time-to-value.</p>
        </Slide>
        <Slide n={5} at={at}>
          <h3>Investment ask</h3><div className="accentline" />
          <div className="bigclaim" style={{ fontSize: "clamp(24px,4vw,44px)" }}>$25M over three years —<br /><b>self-funding by year four.</b></div>
          <p>Legacy retirement savings and services revenue carry the program from Y4 forward.</p>
        </Slide>
        <Slide n={6} at={at}>
          <div className="bigclaim">&ldquo;The companies that win the next decade are the ones that <b>move now.</b>&rdquo;</div>
          <p>— recommended for approval, T. Bryce</p>
        </Slide>
        <div className="deck__nav">
          <button className="deck__btn" type="button" onClick={() => go(-1)} disabled={at === 0}>
            ← Prev
          </button>
          <span className="deck__count mono">{at + 1} / {SLIDES}</span>
          <button className="deck__btn" type="button" onClick={() => go(1)} disabled={at === SLIDES - 1}>
            Next →
          </button>
        </div>
      </div>
    </>
  );
}

export default function ArtifactsWeek1() {
  const [tab, setTab] = useState("f1");
  return (
    <div>
      <div className="arttabs" style={{ padding: "14px 0 0" }}>
        {TABS.map(([key, ix, name]) => (
          <button
            key={key}
            type="button"
            className={`arttab ${tab === key ? "arttab--on" : ""}`}
            onClick={() => setTab(key)}
          >
            <span className="arttab__ix">{ix}</span>
            <span className="arttab__name">{name}</span>
          </button>
        ))}
      </div>
      <div className="artpane artpane--on" style={{ padding: "20px 0 6px" }}>
        {tab === "f1" && <F1 />}
        {tab === "f2" && <F2 />}
        {tab === "f3" && <F3 />}
        {tab === "f4" && <F4 />}
      </div>
    </div>
  );
}