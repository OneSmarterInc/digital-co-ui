/* The six advisor dossiers, as reference inside the "?" hub.
 *
 * Scope discipline: these are STUDENT-FACING — character, not mechanics. Who
 * each advisor is, their lane, their temperament, the Listen for / Discount for
 * framing students already met in the tour's bench scene, and the question each
 * tends to ask.
 *
 * They must NOT carry design-doc material: not which trap an advisor leads
 * toward, not the capture mechanics, not which weeks each one leads. Give them
 * the lens, withhold the lesson. Content is authoritative in the authored
 * digitalco-advisors.html.
 */

export const ADVISOR_DOSSIERS = [
  {
    name: "Daniel Stern",
    lane: "Business Strategy",
    character:
      "Daniel thinks in markets, competitive position, business models, and value, and he speaks the board's language fluently. He's the strongest voice in the room for turning DigitalCo's machines and data into a business — crisp, commercial, and comfortable with a bold direction. He frames every choice as a strategic and financial consequence.",
    listen:
      "The value sitting in the installed base — where the real competitive advantage and the defensible business model actually are.",
    discount:
      "Commitment before you've earned the path — the bold bet that outruns what you can feasibly deliver.",
    asks: "How does this make us money or stop us from losing it — and is the advantage actually defensible?",
  },
  {
    name: "Diane Brandt",
    lane: "Executive Coach",
    character:
      "Diane is a former CIO who ran IT at a regional equipment maker for fifteen years and made most of the mistakes already. She has no technical lane and doesn't want one — she talks about judgment, politics, credibility, timing, and your own blind spots, and she answers questions with questions. She's the conscience of coherence: does this choice fit the strategy you set in Week 1?",
    listen:
      "Whether you have a thesis or just a task list — and the gap between the right answer and the one that survives the politics.",
    discount: "Diagnosis that never becomes action — deliberation mistaken for wisdom.",
    asks: "What problem are you actually solving, and who has to own it with you?",
  },
  {
    name: "Marcus Webb",
    lane: "Architecture",
    character:
      "Marcus is the chief architect who actually understands the stack — the dual ERP, the IBM i nobody else can read, the data architecture, the integration mess, the cloud. He's pragmatic, precise, and allergic to hype, and he speaks in systems and dependencies. He sees the hidden technical reality a business-first read skates over.",
    listen:
      "The dependencies nobody mapped — hidden coupling, technical debt, and how a thing behaves when it scales.",
    discount:
      "Architecture purity that never ships — the perfectly-mapped plan that arrives late and over budget.",
    asks: "That's a nice slide. What does it actually run on, and what breaks when it scales?",
  },
  {
    name: "Renata Voss",
    lane: "Security & OT",
    character:
      "Renata is the security mind who sees attack surfaces and downside everywhere, and — crucially for a manufacturer — she's OT-aware, so she sees the factory floor and the connected fleet as the real exposure long before anyone funds the fix. She's quiet, concrete, and steady, and she doesn't cry wolf. Worry when she raises her voice, and know she may say the important thing only once.",
    listen:
      "The exposure nobody costed — the operational-security risk hidden inside a strategic choice.",
    discount: "Caution that freezes useful action — perfectly secure and strategically stalled.",
    asks: "What's the worst case, how bad does it get, and who owns it when it happens?",
  },
  {
    name: "Frank Delgado",
    lane: "Vendor & Partnership",
    character:
      "Frank has negotiated a hundred vendor contracts and knows where the bodies are buried. He sees lock-in, switching costs, and vendor incentives with a clarity the others lack, and he reads the fine print everyone else skips. He's shrewd, transactional, and a little cynical about vendor promises. He sees the bad terms buried in a deal that come due later.",
    listen:
      "The sweet deal that's actually a cage — lock-in, switching costs, and what a vendor really gets out of the arrangement.",
    discount:
      "Seeing lock-in everywhere — treating every partner as an adversary until you can't commit to anyone.",
    asks: "What does the vendor get out of this, and what does it cost us to leave once we're in?",
  },
  {
    name: "Zoe Park",
    lane: "Innovation",
    character:
      "Zoe is the scout, tracking emerging technology and what the leaders are piloting. She's energetic, curious, and future-oriented — the one bringing in the digital-twin demo and asking what happens when a technology everyone's dismissing gets good. Beneath the enthusiasm she's sometimes right about a real disruption while it still looks like a toy.",
    listen:
      "What the fleet could become — the genuine disruption or opportunity others are writing off too early.",
    discount: "Hype outrunning the foundation — novelty mistaken for value, chasing the dazzling demo.",
    asks: "Forget where this is today — what happens to our business when it gets good, and are we moving fast enough?",
  },
];
