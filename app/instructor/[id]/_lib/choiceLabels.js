/* Enum value -> the label the student actually saw on the decision form.
 *
 * Generated from the backend week specs (weeks/week*.py), which remain the
 * source of truth. Re-extract after any label change rather than editing here.
 *
 * Keyed by field first, because one value can mean different things in
 * different weeks: `partial` is "Contain the critical path first" in Week 10
 * and "Present the strongest threads" in Week 13. The flat map is a fallback
 * for callers with no field key, and is wrong for those collisions.
 */

const BY_FIELD = {
  "ai_sourcing": {
    "build_differentiating_rent_commodity": "Build differentiating, rent commodity",
    "build_everything": "Build everything",
    "rent_everything": "Rent everything",
  },
  "alignment_choice": {
    "balanced_split": "Balanced split",
    "stabilize": "Stabilize",
    "transform_data_services": "Transform to data and services",
  },
  "analytics_architecture": {
    "descriptive_only": "Descriptive only",
    "none": "None",
    "predictive": "Predictive",
  },
  "architecture": {
    "centralize": "Centralize",
    "edge_and_repatriate": "Edge and repatriate",
    "minimal_change": "Hold the current architecture",
  },
  "ask_sizing": {
    "too_big": "Ask for the full programme",
    "too_small": "Ask for a first tranche only",
    "well_sized": "Ask for the next phase",
  },
  "business_case": {
    "board_language": "Lead with risk and return",
    "technical_jargon": "Lead with the technical detail",
  },
  "calloway_positioning": {
    "propose_safe_stabilization": "Propose safe stabilization",
    "push_bold_raw": "Push bold raw",
    "team_recommendation_with_cover": "Team recommendation with cover",
  },
  "cloud_commitment": {
    "multi_vendor": "Multi-vendor",
    "portability_protected": "Portability protected",
    "sweet_deal_as_written": "Sweet deal as written",
  },
  "communication_posture": {
    "blame_shift": "Attribute the failure to the integrator",
    "spin": "Lead with the recovery plan",
    "transparent_ownership": "Transparent ownership",
  },
  "connected_products_disposition": {
    "continue": "Continue",
    "kill": "Kill",
    "pause_assess": "Pause and assess",
  },
  "consequence_reckoning": {
    "honest": "Name what went wrong",
    "victory_narrative": "Lead with what worked",
  },
  "containment": {
    "contained": "Full containment now",
    "overwhelmed": "Sequential triage as capacity allows",
    "partial": "Contain the critical path first",
  },
  "data_strategy_posture": {
    "defer": "Defer",
    "pursue": "Pursue",
    "slow_walk": "Slow-walk",
  },
  "deployment": {
    "narrow_real": "Narrow real use cases",
    "predictive_maintenance_core": "Predictive maintenance core",
    "theater_scatter": "Broad pilot portfolio",
  },
  "differentiator_layer": {
    "own": "Own",
    "rent": "Rent",
  },
  "disclosure": {
    "spin_or_hide": "Disclose only what is required",
    "transparent": "Transparent",
  },
  "early_action": {
    "diagnose_only": "Diagnose only",
    "ot_visibility_assessment": "OT visibility assessment",
    "other_credibility_move": "Other credibility move",
    "premature_bold_move": "Announce a major initiative",
  },
  "forward_strategy": {
    "describes_unbuilt_company": "Set out the intended future state",
    "grounded_in_real_position": "Build from where you actually are",
  },
  "hostile_question_handled": {
    "defended": "Hold the position and answer directly",
    "folded": "Acknowledge the concern and qualify",
  },
  "hyperscaler_decision": {
    "committed_spend_discount": "Committed-spend discount",
    "hedge_further": "Hedge further",
    "renegotiate": "Renegotiate",
  },
  "innovation_capability": {
    "embedded": "Embedded",
    "separate_group": "Separate group",
  },
  "integration": {
    "genuine": "Trace the arc as it happened",
    "papered_over": "Present a unified narrative",
  },
  "integrator_decision": {
    "renegotiate": "Renegotiate",
    "replace": "Replace",
    "take_accelerator": "Take accelerator",
  },
  "investment_level": {
    "grand_spend": "Grand spend",
    "minimal": "Minimal",
    "right_sized": "Right-sized",
  },
  "legal_posture": {
    "defend": "Defend",
    "settle_where_serves": "Settle where serves",
  },
  "meridian_response": {
    "chase": "Chase",
    "ignore": "Ignore",
    "strategic_conviction": "Strategic conviction",
  },
  "migration_fate": {
    "descope": "Descope",
    "kill": "Kill",
    "rescue": "Rescue existing cutover",
    "restructure": "Restructure",
  },
  "narrative_coherence": {
    "coherent": "Present the arc as one continuous strategy",
    "contradictory": "Present each decision on its own merits",
    "partial": "Present the strongest threads",
  },
  "openness": {
    "closed": "Closed",
    "open_unguarded": "Open unguarded",
    "scoped_with_data_rights": "Scoped with data rights",
  },
  "platform_decision": {
    "connected_services": "Connected services",
    "grand_platform": "Grand platform",
    "narrow_ecosystem": "Narrow ecosystem",
    "pure_product": "Pure product",
  },
  "portfolio.additive_manufacturing": {
    "bet": "Bet",
    "ignore": "Ignore",
    "pilot": "Pilot",
    "watch": "Watch",
  },
  "portfolio.autonomy": {
    "bet": "Bet",
    "ignore": "Ignore",
    "pilot": "Pilot",
    "watch": "Watch",
  },
  "portfolio.digital_twins": {
    "bet": "Bet",
    "ignore": "Ignore",
    "pilot": "Pilot",
    "watch": "Watch",
  },
  "portfolio.edge_ai_low_end": {
    "bet": "Bet",
    "ignore": "Ignore",
    "pilot": "Pilot",
    "watch": "Watch",
  },
  "primary_stakeholder_anchor": {
    "calloway": "Calloway",
    "ferraro": "Ferraro",
    "fischer": "Fischer",
    "none": "None",
    "petrillo": "Petrillo",
    "reinhardt": "Reinhardt",
    "tran": "Tran",
  },
  "public_response": {
    "fight": "Fight",
    "reframe_and_offer": "Reframe and offer",
  },
  "ransom_decision": {
    "pay": "Pay",
    "refuse": "Refuse",
  },
  "rights_posture": {
    "duck": "Duck",
    "land_grab": "Land grab",
    "shared_value": "Shared value",
  },
  "rights_resolution": {
    "concede": "Concede",
    "hold_firm": "Hold firm",
    "shared_value": "Shared value",
  },
  "s4_disposition": {
    "commit_finish": "Commit to finish",
    "descope": "Descope",
    "kill": "Kill",
    "stabilize_map": "Stabilize and map dependencies",
  },
  "shadow_ai_response": {
    "governed_with_plan": "Governed with plan",
    "ungoverned": "Ungoverned",
  },
  "sourcing_approach": {
    "build_everything": "Build everything",
    "core_context_split": "Core/context split",
    "rent_cheapest": "Rent cheapest",
  },
  "triage_approach": {
    "linear": "Linear",
    "parallel": "Parallel",
  },
  "vendor_concentration": {
    "hedged": "Hedged",
    "single_hyperscaler": "Single hyperscaler",
  },
  "vendor_response": {
    "absorb": "Absorb",
    "hedge": "Hedge",
    "renegotiate": "Renegotiate",
    "switch": "Switch",
  },
};

const CHOICE_LABELS = {
  "absorb": "Absorb",
  "balanced_split": "Balanced split",
  "bet": "Bet",
  "blame_shift": "Attribute the failure to the integrator",
  "board_language": "Lead with risk and return",
  "build_differentiating_rent_commodity": "Build differentiating, rent commodity",
  "build_everything": "Build everything",
  "calloway": "Calloway",
  "centralize": "Centralize",
  "chase": "Chase",
  "closed": "Closed",
  "coherent": "Present the arc as one continuous strategy",
  "commit_finish": "Commit to finish",
  "committed_spend_discount": "Committed-spend discount",
  "concede": "Concede",
  "connected_services": "Connected services",
  "contained": "Full containment now",
  "continue": "Continue",
  "contradictory": "Present each decision on its own merits",
  "core_context_split": "Core/context split",
  "defend": "Defend",
  "defended": "Hold the position and answer directly",
  "defer": "Defer",
  "descope": "Descope",
  "describes_unbuilt_company": "Set out the intended future state",
  "descriptive_only": "Descriptive only",
  "diagnose_only": "Diagnose only",
  "duck": "Duck",
  "edge_and_repatriate": "Edge and repatriate",
  "embedded": "Embedded",
  "ferraro": "Ferraro",
  "fight": "Fight",
  "fischer": "Fischer",
  "folded": "Acknowledge the concern and qualify",
  "genuine": "Trace the arc as it happened",
  "governed_with_plan": "Governed with plan",
  "grand_platform": "Grand platform",
  "grand_spend": "Grand spend",
  "grounded_in_real_position": "Build from where you actually are",
  "hedge": "Hedge",
  "hedge_further": "Hedge further",
  "hedged": "Hedged",
  "hold_firm": "Hold firm",
  "honest": "Name what went wrong",
  "ignore": "Ignore",
  "kill": "Kill",
  "land_grab": "Land grab",
  "linear": "Linear",
  "minimal": "Minimal",
  "minimal_change": "Hold the current architecture",
  "multi_vendor": "Multi-vendor",
  "narrow_ecosystem": "Narrow ecosystem",
  "narrow_real": "Narrow real use cases",
  "none": "None",
  "open_unguarded": "Open unguarded",
  "ot_visibility_assessment": "OT visibility assessment",
  "other_credibility_move": "Other credibility move",
  "overwhelmed": "Sequential triage as capacity allows",
  "own": "Own",
  "papered_over": "Present a unified narrative",
  "parallel": "Parallel",
  "partial": "Contain the critical path first",
  "pause_assess": "Pause and assess",
  "pay": "Pay",
  "petrillo": "Petrillo",
  "pilot": "Pilot",
  "portability_protected": "Portability protected",
  "predictive": "Predictive",
  "predictive_maintenance_core": "Predictive maintenance core",
  "premature_bold_move": "Announce a major initiative",
  "propose_safe_stabilization": "Propose safe stabilization",
  "pure_product": "Pure product",
  "pursue": "Pursue",
  "push_bold_raw": "Push bold raw",
  "reframe_and_offer": "Reframe and offer",
  "refuse": "Refuse",
  "reinhardt": "Reinhardt",
  "renegotiate": "Renegotiate",
  "rent": "Rent",
  "rent_cheapest": "Rent cheapest",
  "rent_everything": "Rent everything",
  "replace": "Replace",
  "rescue": "Rescue existing cutover",
  "restructure": "Restructure",
  "right_sized": "Right-sized",
  "scoped_with_data_rights": "Scoped with data rights",
  "separate_group": "Separate group",
  "settle_where_serves": "Settle where serves",
  "shared_value": "Shared value",
  "single_hyperscaler": "Single hyperscaler",
  "slow_walk": "Slow-walk",
  "spin": "Lead with the recovery plan",
  "spin_or_hide": "Disclose only what is required",
  "stabilize": "Stabilize",
  "stabilize_map": "Stabilize and map dependencies",
  "strategic_conviction": "Strategic conviction",
  "sweet_deal_as_written": "Sweet deal as written",
  "switch": "Switch",
  "take_accelerator": "Take accelerator",
  "team_recommendation_with_cover": "Team recommendation with cover",
  "technical_jargon": "Lead with the technical detail",
  "theater_scatter": "Broad pilot portfolio",
  "too_big": "Ask for the full programme",
  "too_small": "Ask for a first tranche only",
  "tran": "Tran",
  "transform_data_services": "Transform to data and services",
  "transparent": "Transparent",
  "transparent_ownership": "Transparent ownership",
  "ungoverned": "Ungoverned",
  "victory_narrative": "Lead with what worked",
  "watch": "Watch",
  "well_sized": "Ask for the next phase",
};
/** The student-facing label for a stored choice value.
 *
 * Pass the field key where you have it — without it, a value used in more than
 * one week resolves to whichever label sorted first, which is wrong roughly
 * half the time for `partial`.
 */
export function choiceLabel(value, fieldKey) {
  if (typeof value !== "string") return value;
  const scoped = fieldKey && BY_FIELD[fieldKey]?.[value];
  if (scoped) return scoped;
  if (CHOICE_LABELS[value]) return CHOICE_LABELS[value];
  // Unknown value: at least don't shout an enum at the reader.
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export { BY_FIELD };
export default CHOICE_LABELS;
