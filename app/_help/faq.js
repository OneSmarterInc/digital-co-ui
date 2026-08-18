/* FAQ content for the "?" hub.
 *
 * Authored copy — the assembly spec is authoritative over the standalone FAQ
 * document where the two differ. Register: direct answer first, then the
 * mechanic, then a nudge where it earns its place. Never spoils a decision:
 * every answer is about how the exercise works, never about what to decide.
 *
 * Rich text is expressed as arrays of strings and {b: "..."} marks so the copy
 * stays free of raw HTML.
 */

const b = (text) => ({ b: text });

export const FAQ_GROUPS = [
  {
    label: "The weekly loop",
    items: [
      {
        q: "What am I supposed to do each week?",
        a: [
          "Every week runs the same four moves: ", b("read"), " the briefing and exhibits, ",
          b("consult"), " the advisors, ", b("converge"), " as a team on one position, and ",
          b("commit"), " the decision with your written reasoning.",
        ],
        guideLink: "Read the full walkthrough in How to Read a Week",
      },
      {
        q: "Where do I find the briefing, exhibits, and decision?",
        a: [
          "All under ", b("This Week"), ". The situation report and executive reads are the briefing; ",
          "the reference files on the desk are the exhibits; the Decision panel is where you commit. ",
          "Advisors are in the war room.",
        ],
      },
      {
        q: "Do I have to do the moves in order?",
        a: [
          "You can move around freely, but reading and diagnosing ", b("before"),
          " you consult advisors means you spend advisor time well. The guide explains why the sequence matters.",
        ],
      },
      {
        q: "How long is the whole simulation?",
        a: [b("Fourteen weeks"), ", one decision each week, on a once-a-week clock."],
      },
    ],
  },
  {
    label: "The advisors",
    items: [
      {
        q: "How much does advisor time cost?",
        a: [
          "Advisor chat is ", b("billed by time"), ", so spend it deliberately. Your rate and usage show on the dashboard. ",
          "Batch questions into focused sessions.",
        ],
      },
      {
        q: "How many advisors can I consult?",
        a: [
          "All six are available, but you rarely need all of them. Part of the skill is deciding ",
          b("which"), " a decision calls for.",
        ],
      },
      {
        q: "The advisors disagree — who's right?",
        a: [
          "By design. Every advisor is worth hearing and ", b("none is safe to follow blindly"),
          " — each has a lane and a bias. Weigh them and reach your own judgment.",
        ],
      },
      {
        q: "Can I ask an advisor what we should decide?",
        a: [
          "You can ask anything, but an advisor gives a ", b("position shaped by their bias"),
          ", not a verdict. Bring sharp questions that test your thinking.",
        ],
      },
    ],
  },
  {
    label: "Decisions & deadlines",
    items: [
      {
        q: "Can we change a decision after we commit?",
        a: [b("No — committing is final"), ", and final for the whole team. Converge before you lock it in."],
      },
      {
        q: "Why don't I see a score after I commit?",
        a: [
          "There isn't one. ", b("DigitalCo has no weekly scores"), " by design. You'll feel the consequences later, ",
          "sometimes weeks on. A real strategy is judged over time, not graded turn by turn.",
        ],
      },
      {
        q: "What happens if we miss the deadline?",
        a: [
          "A week you don't commit gets decided for you, never in your favor. ",
          "Watch the countdown and commit before it closes.",
        ],
      },
      {
        q: "Does what we decide this week affect later weeks?",
        a: [
          "Yes, heavily. Decisions carry forward; some set consequences that surface weeks later. ",
          "Your Week 1 thesis is the anchor every later week is measured against.",
        ],
      },
      {
        q: "Can I come back to this later?",
        a: [
          b("Yes — your progress saves between sessions."),
          " DigitalCo runs across a term; pick up where you left off.",
        ],
      },
    ],
  },
  {
    label: "Your team",
    items: [
      {
        q: 'We’re a team — how does "one CIO" work?',
        a: [
          "Your whole team occupies ", b("one chair"), ". Debate internally, but the company hears one voice, ",
          "so reach a single position and commit together.",
        ],
      },
      {
        q: "How should we split up the work?",
        a: [
          "Divide it — one drives the briefing, one owns the exhibits, one runs advisor sessions — then reconvene. ",
          "Don't all read the same thing. The guide's team panel has more.",
        ],
      },
      {
        q: "What if our team can't agree?",
        a: [
          "Decide ", b("in advance how you'll break a tie"), ", so a split team can still commit on time.",
        ],
      },
    ],
  },
];

// Flat, stable ordering — the list must never reflow, so rows keep one index.
export const FAQ_ITEMS = FAQ_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label }))
);
