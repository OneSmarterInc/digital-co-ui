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

/** Definitions for a field's choices, as [label, definition] pairs. */
export function defineChoices(choices = []) {
  return choices
    .map((c) => [c.label || c.value, defineTerm(c.label || c.value) || defineTerm(c.value)])
    .filter(([, def]) => Boolean(def));
}
