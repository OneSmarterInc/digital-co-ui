/* Inline definitions for domain jargon on the decision screen.
 *
 * A6: option labels like "Descope" or "Slow-walk" are terms a student has to
 * guess at, and guessing at the vocabulary is not the exercise. Every entry
 * here defines the term *in form only* — what the option means — and never
 * says whether it's the right call. Keys are matched case-insensitively
 * against a field or choice label, so one definition covers every week that
 * uses the term.
 *
 * Adding a term: define it, don't recommend it. If a definition would help a
 * student pick, it's the wrong definition.
 */

const DEFINITIONS = {
  // dispositions
  "descope": "Cut scope deliberately — deliver less than planned so what remains can actually land.",
  "continue": "Carry on as currently planned, without changing scope or direction.",
  "pause": "Stop work for now without cancelling it; the option stays open to restart.",
  "kill": "End it outright. Committed spend is sunk and the capability goes away.",
  "stabilize and map dependencies": "Stop adding new work, get the thing running reliably, and document what depends on what before deciding next steps.",
  "stabilize_map": "Stop adding new work, get the thing running reliably, and document what depends on what before deciding next steps.",
  "slow-walk": "Keep it formally alive but deliberately under-resource it, so it advances slowly without being cancelled.",
  "slow_walk": "Keep it formally alive but deliberately under-resource it, so it advances slowly without being cancelled.",
  "commit and finish": "Fund it through to completion on the current path, accepting the remaining cost and risk.",
  "commit_finish": "Fund it through to completion on the current path, accepting the remaining cost and risk.",
  "pursue": "Actively invest in it now as a direction you're backing.",
  "rescue": "Keep the existing effort and try to recover it in place.",
  "restructure": "Keep the goal but rebuild the plan around it — new sequencing, new shape.",
  "renegotiate": "Go back to the counterparty and change the terms of the existing arrangement.",
  "replace": "End the current arrangement and bring in a different party.",

  // week 3 — integrator decision. "Take accelerator" is the trap option and was
  // the one choice on the form a student could not look up.
  "take accelerator": "Buy the integrator's proprietary tooling to speed the cutover, on their terms.",
  "take_accelerator": "Buy the integrator's proprietary tooling to speed the cutover, on their terms.",

  // week 2 — alignment
  "push bold raw": "Put the full, unsoftened proposal to the room and let it be argued on its merits.",
  "push_bold_raw": "Put the full, unsoftened proposal to the room and let it be argued on its merits.",
  "transform data services": "Back the data-and-services direction as the primary transformation.",
  "transform_data_services": "Back the data-and-services direction as the primary transformation.",
  "balanced split": "Fund both directions partially rather than choosing between them.",
  "balanced_split": "Fund both directions partially rather than choosing between them.",
  "governance": "The decision rights and review structure around the work — who approves what, and when.",
  "business voice": "A formal say for the business side in how the programme is steered, not just IT.",
  "stage gate": "A checkpoint where work must pass review before more money is released.",

  // recurring field concepts
  "current-state assessment": "Your read of the situation as it actually is — diagnosis, not plan.",
  "strategy statement": "The direction you're committing to and why. In Week 1 this becomes the anchor every later week is measured against.",
  "stakeholder anchor": "Which executive or relationship you're prioritising this week.",
  "coherence": "Whether your choices add up to one strategy rather than fourteen separate clever calls.",
  "ot": "Operational technology — the plant-floor and equipment systems, as distinct from corporate IT.",
  "ot black box": "The plant and fleet systems that sit outside IT's visibility.",
  "portability": "Being able to move off a provider later without rebuilding from scratch.",
  "lock-in": "Being committed to one provider because leaving would cost more than staying.",
  "stage gates": "Checkpoints where work must pass a review before more money is released.",
};

/* Definitions for every structured choice, keyed by field then value.
 *
 * Field-scoped because a value can mean different things in different weeks:
 * `none` is "no stakeholder prioritised" in Week 1 and "no analytics layer" in
 * Week 8; `build_everything` is the whole estate in Week 4 and AI capability in
 * Week 9. A flat map silently returns the wrong one.
 *
 * The rule for every entry: define what the CIO is proposing, and stop. Where
 * an option carries an obvious cost, state it as a fact about the option, not
 * as a warning. A definition that helps a student pick is the wrong definition.
 */
const CHOICE_DEFINITIONS = {
  "ai_sourcing": {
    "build_differentiating_rent_commodity": "Build in-house only what is specific to DigitalCo; buy or rent everything standard.",
    "build_everything": "Build all AI capability in-house, including the parts available off the shelf.",
    "rent_everything": "Source all capability from providers, paying as you use it and depending on their models and roadmaps.",
  },
  "alignment_choice": {
    "balanced_split": "Fund both directions in proportion, so neither is chosen over the other.",
    "stabilize": "Direct the company toward fixing and running what already exists before funding anything new.",
    "transform_data_services": "Direct the company toward selling services built on machine data, rather than only selling equipment.",
  },
  "analytics_architecture": {
    "descriptive_only": "Build reporting on what has already happened, without forecasting.",
    "none": "Build no analytics layer in this period.",
    "predictive": "Build the capability to forecast what will happen, such as which machines will fail and when.",
  },
  "architecture": {
    "centralize": "Consolidate everything onto one platform, which simplifies operations and increases dependence on that provider.",
    "edge_and_repatriate": "Move some processing closer to the machines and bring some workloads back off rented infrastructure.",
    "minimal_change": "Leave the estate as it is and find savings elsewhere.",
  },
  "ask_sizing": {
    "too_big": "Request the whole multi-year commitment in one decision.",
    "too_small": "Request a modest initial amount, leaving the larger case for later.",
    "well_sized": "Request what the next stage of work requires, with the rest to follow on evidence.",
  },
  "business_case": {
    "board_language": "Frame the case in the terms the board uses to judge any investment.",
    "technical_jargon": "Frame the case around the architecture and the technology decisions behind it.",
  },
  "calloway_positioning": {
    "propose_safe_stabilization": "Recommend the lower-risk option, which is straightforward to defend if it is questioned.",
    "push_bold_raw": "Recommend the ambitious version directly, without framing, softening or a fallback position.",
    "team_recommendation_with_cover": "Give the CEO a clear recommendation with your name on the risk, so he can support it publicly without owning the exposure himself.",
  },
  "cloud_commitment": {
    "multi_vendor": "Spread across more than one provider, which reduces dependence on any single one and adds cost and complexity to running it.",
    "portability_protected": "Structure the arrangement so your data and workloads can be moved elsewhere later, which costs more now.",
    "sweet_deal_as_written": "Accept the provider\u2019s offered terms and pricing as presented, including whatever commitments and exclusions they contain.",
  },
  "communication_posture": {
    "blame_shift": "Present the vendor\u2019s performance as the cause of the overrun and the missed dates.",
    "spin": "Present the situation primarily in terms of what happens next, giving less space to what went wrong and why.",
    "transparent_ownership": "Tell the board plainly what the increase costs, why the company is exposed, and what you are doing about it.",
  },
  "connected_products_disposition": {
    "continue": "Carry on funding and running the connected-products programme as currently planned, without changing its scope or pace.",
    "kill": "End the programme outright. Committed spend is gone and the capability, including the people who built it, goes away.",
    "pause_assess": "Stop active work without cancelling it. The team and the capability stay in place while you decide what it is for.",
  },
  "consequence_reckoning": {
    "honest": "State the decisions that did not work and what they cost.",
    "victory_narrative": "Build the account around the outcomes that went well.",
  },
  "containment": {
    "contained": "Shut down everything potentially affected immediately, accepting the operational disruption that causes.",
    "overwhelmed": "Work through systems in order as people and information become available, rather than acting on all fronts at once.",
    "partial": "Isolate the systems judged most exposed while the rest keep running.",
  },
  "data_strategy_posture": {
    "defer": "Do not fund it this period, and say so, leaving the decision for a later week.",
    "pursue": "Fund the machine-data programme now as a direction you are actively backing.",
    "slow_walk": "Keep it formally alive but deliberately under-resourced, so it advances slowly without being cancelled.",
  },
  "deployment": {
    "narrow_real": "Pick a small number of specific decisions currently made by judgement and target those.",
    "predictive_maintenance_core": "Aim the investment at one decision \u2014 forecasting equipment failure \u2014 and build around it.",
    "theater_scatter": "Run many small pilots across the business at once, covering a wide range of possible uses.",
  },
  "differentiator_layer": {
    "own": "Build and control it yourself, carrying the cost and the maintenance.",
    "rent": "Source it from a provider, paying as you use it and depending on their roadmap for it.",
  },
  "disclosure": {
    "spin_or_hide": "Meet the minimum obligation and say no more than that until more is known.",
    "transparent": "Tell customers, partners and regulators what is known and what is not, on your own timing.",
  },
  "early_action": {
    "diagnose_only": "Take no action in the first period beyond assessment; report findings and act later.",
    "ot_visibility_assessment": "Commission a survey of what is actually running on the factory floor and what can be seen from IT.",
    "other_credibility_move": "Some other early, visible action chosen to demonstrate competence to the executive team.",
    "premature_bold_move": "Make a large, public commitment in your first thirty days, before the diagnosis is complete.",
  },
  "forward_strategy": {
    "describes_unbuilt_company": "Describe the company the strategy is aimed at becoming.",
    "grounded_in_real_position": "Set out the next phase from the company\u2019s current state, including its constraints.",
  },
  "hostile_question_handled": {
    "defended": "Meet the challenge on its own terms and restate the case.",
    "folded": "Accept the point raised and add conditions to the position in response.",
  },
  "hyperscaler_decision": {
    "committed_spend_discount": "Commit to a multi-year spending level in exchange for lower unit pricing.",
    "hedge_further": "Move additional workloads to alternatives, reducing dependence and adding operating complexity.",
    "renegotiate": "Reopen the existing terms without committing to a higher spend level.",
  },
  "innovation_capability": {
    "embedded": "No separate team; evaluation sits inside the existing product and engineering organisations.",
    "separate_group": "A dedicated team, outside the existing structure, whose job is to assess and pilot emerging technology.",
  },
  "integration": {
    "genuine": "Follow the actual sequence of decisions, including where the direction changed and why.",
    "papered_over": "Tell the fourteen weeks as a single consistent story.",
  },
  "integrator_decision": {
    "renegotiate": "Go back to the existing partner and change the terms of the arrangement. You keep the relationship and the accumulated knowledge, and you keep the counterparty.",
    "replace": "End the current arrangement and bring in a different partner. New terms, and a new party learning the system from the beginning.",
  },
  "investment_level": {
    "grand_spend": "Fund at the full scale the proposal describes, ahead of demonstrated demand.",
    "minimal": "Fund only enough to keep the option open, without committing to build at scale.",
    "right_sized": "Fund the version supported by what you can currently demonstrate about demand.",
  },
  "legal_posture": {
    "defend": "Contest the claims on their merits and let them run.",
    "settle_where_serves": "Resolve claims where settling costs less than fighting, without conceding the principle everywhere.",
  },
  "meridian_response": {
    "chase": "Match the rival\u2019s move with a comparable programme of your own.",
    "ignore": "Take no action in response and continue with your existing plan unchanged.",
    "strategic_conviction": "Respond with your own bet, chosen on your own economics rather than on what the rival announced.",
  },
  "migration_fate": {
    "descope": "Deliberately cut what the programme will deliver, so that a smaller version can actually land.",
    "kill": "End the programme outright. Committed spend is gone and the capability, including the people who built it, goes away.",
    "rescue": "Keep the current plan and recover it in place, funding whatever it takes to complete the attempt as designed.",
    "restructure": "Keep the goal but rebuild the plan around it, with new sequencing and a new shape.",
  },
  "narrative_coherence": {
    "coherent": "Show the decisions as following from a single direction set at the start.",
    "contradictory": "Justify each week individually, on the reasoning available at the time.",
    "partial": "Show the parts of the record that hold together and give less space to the rest.",
  },
  "openness": {
    "closed": "No outside access. The company alone builds on and uses the data.",
    "open_unguarded": "Broad access without restrictions on what participants may do with the data they reach.",
    "scoped_with_data_rights": "Defined access for defined groups, with written terms on what each may use and how.",
  },
  "platform_decision": {
    "connected_services": "Build services on your own machine data, sold by you, without opening the layer to outside parties.",
    "grand_platform": "Build a full platform open to dealers, customers and outside developers, funded at the scale the business case describes.",
    "narrow_ecosystem": "Open a defined slice to a small, chosen set of partners rather than to everyone.",
    "pure_product": "Improve the product itself and do not build a platform layer at all.",
  },
  "portfolio.additive_manufacturing": {
    "bet": "Commit real money and people to it now, at a scale that matters to the business if it works.",
    "ignore": "Take no action in response and continue with your existing plan unchanged.",
    "pilot": "Fund a small, time-boxed trial to learn whether it works here, without committing to scale.",
    "watch": "Take no action beyond monitoring it, and revisit when there is more evidence.",
  },
  "portfolio.autonomy": {
    "bet": "Commit real money and people to it now, at a scale that matters to the business if it works.",
    "ignore": "Take no action in response and continue with your existing plan unchanged.",
    "pilot": "Fund a small, time-boxed trial to learn whether it works here, without committing to scale.",
    "watch": "Take no action beyond monitoring it, and revisit when there is more evidence.",
  },
  "portfolio.digital_twins": {
    "bet": "Commit real money and people to it now, at a scale that matters to the business if it works.",
    "ignore": "Take no action in response and continue with your existing plan unchanged.",
    "pilot": "Fund a small, time-boxed trial to learn whether it works here, without committing to scale.",
    "watch": "Take no action beyond monitoring it, and revisit when there is more evidence.",
  },
  "portfolio.edge_ai_low_end": {
    "bet": "Commit real money and people to it now, at a scale that matters to the business if it works.",
    "ignore": "Take no action in response and continue with your existing plan unchanged.",
    "pilot": "Fund a small, time-boxed trial to learn whether it works here, without committing to scale.",
    "watch": "Take no action beyond monitoring it, and revisit when there is more evidence.",
  },
  "primary_stakeholder_anchor": {
    "calloway": "The CEO. Sets direction and answers to the board, but will not spend his own capital early on a bet that might fail.",
    "ferraro": "Chief Revenue Officer. Owns the dealer and distributor channel and the revenue that runs through it.",
    "fischer": "Chief Product Officer. Runs engineering and originated the connected-products programme.",
    "none": "Prioritise no single relationship this week.",
    "petrillo": "VP Operations. Owns the plants, the legacy systems and everything on the factory floor.",
    "reinhardt": "The CFO. Controls funding and was burned by the previous CIO\u2019s overruns.",
    "tran": "General Counsel. Owns legal exposure, contracts and data rights.",
  },
  "public_response": {
    "fight": "Defend the company\u2019s position publicly and contest the criticism directly.",
    "reframe_and_offer": "Restate the position in terms of what the other side gains, and put a concrete offer alongside it.",
  },
  "ransom_decision": {
    "pay": "Pay the demand. There is no guarantee of what is returned, and the payment itself may carry legal and reputational consequences.",
    "refuse": "Do not pay. Recovery depends entirely on your own backups, systems and people.",
  },
  "rights_posture": {
    "duck": "Avoid settling the ownership question, leaving terms unstated and access informal.",
    "land_grab": "Assert the company\u2019s ownership of the machine data and charge dealers and customers for access to it.",
    "shared_value": "Share the value the data creates with the dealers and customers who generate it, in exchange for their continued participation.",
  },
  "rights_resolution": {
    "concede": "Withdraw the terms in response to the pressure, without changing how such terms get set in future.",
    "hold_firm": "Keep the terms you set and defend them, accepting the friction that follows.",
    "shared_value": "Restructure the arrangement so the parties who generate the data share in what it earns.",
  },
  "s4_disposition": {
    "commit_finish": "Fund the ERP migration through to completion on its current path, accepting the remaining cost and whatever risk is left in it.",
    "descope": "Deliberately cut what the programme will deliver, so that a smaller version can actually land.",
    "kill": "End the programme outright. Committed spend is gone and the capability, including the people who built it, goes away.",
    "stabilize_map": "Stop adding new work, get what exists running reliably, and document what depends on what before deciding anything further.",
  },
  "shadow_ai_response": {
    "governed_with_plan": "Acknowledge what is in use, set rules for it, and provide a supported path.",
    "ungoverned": "Set no policy and allow current practice to continue as it is.",
  },
  "sourcing_approach": {
    "build_everything": "Build and own the whole estate in-house, with full control and full ongoing responsibility for running it.",
    "core_context_split": "Build and own the parts that make the company different; source the rest from outside.",
    "rent_cheapest": "Source everything from whichever provider costs least, optimising on price rather than fit or exit.",
  },
  "triage_approach": {
    "linear": "Complete each stage before beginning the next.",
    "parallel": "Run containment, investigation and communication at the same time, across separate teams.",
  },
  "vendor_concentration": {
    "hedged": "Spread across more than one provider so no single one holds the whole capability.",
    "single_hyperscaler": "Consolidate on one large provider, which simplifies operations and concentrates dependence.",
  },
  "vendor_response": {
    "absorb": "Accept the new pricing and continue, treating the increase as a cost of doing business.",
    "hedge": "Accept the terms for now while building a viable alternative, so the next renewal is negotiated from a different position.",
    "renegotiate": "Go back to the vendor and press for different terms, using whatever alternatives you can credibly point to.",
    "switch": "Move off the vendor to an alternative, paying the migration cost and the disruption that comes with it.",
  },
};

/** The definition for a label, or null. Case- and punctuation-insensitive. */
export function defineTerm(label) {
  if (!label) return null;
  const key = String(label).trim().toLowerCase().replace(/[.…:]+$/, "");
  if (DEFINITIONS[key]) return DEFINITIONS[key];
  // Fall back to a contained term, so "S/4HANA disposition: descope" still hits.
  const hit = Object.keys(DEFINITIONS).find(
    (term) => term.length > 4 && key.includes(term)
  );
  return hit ? DEFINITIONS[hit] : null;
}

/** Definitions for a field's choices, as [label, definition] pairs.
 *
 * DEFINITIONS is consulted first: a hand-written entry that is more specific to
 * the week beats the generated one, which is why `take_accelerator` keeps its
 * own wording. Otherwise the field-scoped table answers, and it needs the field
 * key — `none` and `build_everything` mean different things in different weeks.
 */
export function defineChoices(choices = [], fieldKey) {
  const scoped = (fieldKey && CHOICE_DEFINITIONS[fieldKey]) || null;
  return choices
    .map((c) => {
      const label = c.label || c.value;
      const def =
        defineTerm(label) ||
        defineTerm(c.value) ||
        (scoped ? scoped[c.value] : null) ||
        null;
      return [label, def];
    })
    .filter(([, def]) => Boolean(def));
}
