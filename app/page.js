import Reveal from "./Reveal";
import ArcDiagram from "./ArcDiagram";
import ThemeToggle from "./ThemeToggle";

/* Landing page in the dark console theme (matches .dc-console in app/console.css).
 * Palette is exposed as CSS vars on the page wrapper so ArcDiagram's
 * var(--color-go/-caution/-alarm/-neutral) references keep working —
 * they're remapped to ok-green / amber / signal-red / muted below.
 * Fonts: Saira Condensed (display), IBM Plex Mono (labels), IBM Plex Sans (body) —
 * already loaded by the console app.
 */


const ENDINGS = [
  { tier: "Triumph", color: "var(--amber)", desc: "You held one direction the whole way, and nothing came back to bite you. The board believes you." },
  { tier: "Win with scars", color: "var(--paper)", desc: "You got there, but something you left unfixed cost you along the way." },
  { tier: "Squeak through", color: "var(--muted)", desc: "Enough went right to survive the board vote. Not much more than that." },
  { tier: "Disaster", color: "var(--signal-red)", desc: "The failures compounded week over week. The board's confidence is gone." },
];

const HARD = [
  {
    title: "Some decisions can't be undone",
    body: "Money spent, systems chosen, promises made. Some of what you decide early stays decided.",
  },
  {
    title: "Nothing stays in its own week",
    body: "A choice in Week 2 changes what Week 9 looks like. You will not always be told which one.",
  },
  {
    title: "Six advisors, six agendas",
    body: "Every advisor is compelling, and every one is protecting something. The most persuasive voice in the room may be the one steering you straight into a trap.",
  },
  {
    title: "You are judged on the record",
    body: "At the end you present your case to the board. They have watched the whole run. A good story cannot outrun what actually happened.",
  },
];

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

const KICKER = `mb-4 ${MONO} text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] font-medium`;
const H2 = `mb-[18px] ${DISPLAY} text-[clamp(1.9rem,3.6vw,2.6rem)] font-bold leading-[1.06] text-[var(--paper)]`;
const BODY = "max-w-[64ch] text-[1.06rem] leading-[1.65] text-[var(--muted)]";
const SECTION = "mx-auto max-w-[1080px] border-t border-[var(--steel-line)] px-6 py-[66px]";
const CARD_SHADOW = "shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
    >
      <header className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between border-b border-[var(--steel-line)] px-6">
        <div className="flex items-center gap-3">
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[30px] w-[30px] flex-shrink-0" />
          {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[19px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </span>
        </div>
        <a
          href="/login"
          className={`rounded-[2px] border border-[var(--steel-line)] px-3.5 py-2.5 ${MONO} text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] transition-colors hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)] ${FOCUS}`}
        >
          Enter simulation
        </a>
        <ThemeToggle className="ml-3" />
      </header>

      <main>
        <section className="mx-auto max-w-[1080px] px-6 pt-16 pb-[60px] md:pt-[92px]">
          <Reveal delay={40}>
            <p className={`mb-[22px] ${MONO} text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]`}>
              Fourteen-week strategy simulation
            </p>
          </Reveal>
          <Reveal delay={130}>
            <h1 className={`mb-6 max-w-[17ch] ${DISPLAY} text-[clamp(3rem,7.5vw,5.4rem)] font-bold leading-[0.98] tracking-[0.01em]`}>
              You inherit a transformation that has already failed once.
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="mb-[34px] max-w-[62ch] text-[clamp(1.05rem,1.6vw,1.2rem)] leading-[1.6] text-[var(--muted)]">
              You&rsquo;re the new CIO at DigitalCo, an industrial manufacturer with a stalled core migration, a factory
              floor you have no visibility into, and a board that wants a real direction by the next meeting. Fourteen
              weeks, one continuous strategy, and every decision compounds into the next.
            </p>
          </Reveal>
          <Reveal delay={310}>
            <div className="flex flex-wrap gap-3.5">
              <a
                href="/login"
                className={`rounded-[2px] bg-[var(--amber)] px-[30px] py-3.5 ${DISPLAY} text-[16px] font-bold uppercase tracking-[0.06em] text-[var(--graphite)] transition duration-150 hover:-translate-y-px hover:bg-[var(--amber-hover)] ${FOCUS}`}
              >
                Take the CIO seat
              </a>
              <a
                href="#how-it-unfolds"
                className={`rounded-[2px] border border-[var(--steel-line)] px-[22px] py-3.5 ${MONO} text-[12px] uppercase tracking-[0.14em] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)] ${FOCUS}`}
              >
                How a run unfolds
              </a>
            </div>
          </Reveal>
        </section>

        <section id="how-it-unfolds" className="mx-auto max-w-[1080px] px-6 pt-9 pb-[72px]">
          <Reveal>
            <div className={`rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] px-[26px] pt-[26px] pb-[22px] ${CARD_SHADOW}`}>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-4">
                <span className={`${MONO} text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]`}>
                  Sample run &middot; week 01 &rarr; board verdict
                </span>
                <div className={`flex flex-wrap gap-[18px] ${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]`}>
                  <span className="inline-flex items-center gap-[7px]">
                    <i className="h-2.5 w-2.5 rounded-[2px] bg-[var(--ok)]" />Under control
                  </span>
                  <span className="inline-flex items-center gap-[7px]">
                    <i className="h-2.5 w-2.5 rounded-[2px] bg-[var(--amber)] shadow-[0_0_8px_-1px_var(--amber)]" />Going wrong
                  </span>
                  <span className="inline-flex items-center gap-[7px]">
                    <i className="h-2.5 w-2.5 rounded-[2px] bg-[var(--signal-red)] shadow-[0_0_8px_-1px_var(--signal-red)]" />Past fixing
                  </span>
                </div>
              </div>
              <ArcDiagram />
              <p className="mt-4 max-w-[68ch] text-[0.94rem] leading-[1.6] text-[var(--muted)]">
                If you ignore an early risk, it may not be fixable later. Your objective is to optimize fourteen weeks
                of results, so focus on the entire simulation, not just on the immediate result.
              </p>
            </div>
          </Reveal>
        </section>

        <section id="premise" className={SECTION}>
          <Reveal>
            <p className={KICKER}>The inheritance</p>
            <h2 className={`${H2} max-w-[22ch]`}>A bold mandate with no direction, on a broken foundation.</h2>
            <p className={`${BODY} mb-4`}>
              The CEO gives you thirty days to get a real read and come back with a direction. Underneath sits the mess
              your predecessor left. A core migration two years late and past budget. A connected-products platform that
              ships data nobody sells. A data lake used as a dumping ground. And an IT organisation where one or two
              people still understand the systems that run the plant.
            </p>
            <p className={`${BODY} border-l-2 border-[var(--steel-soft)] pl-3.5`}>
              The private-equity owners want returns. The founding family is wary. The board expects movement at the
              next meeting. Your first move has to create visibility{" "}
              <b className="font-semibold text-[var(--paper)]">without foreclosing the strategy you haven&rsquo;t written yet.</b>
            </p>
          </Reveal>
        </section>

        <section id="endings" className={SECTION}>
          <Reveal>
            <p className={KICKER}>How it ends</p>
            <h2 className={`${H2} max-w-[22ch]`}>Four ways it can land.</h2>
            <p className={BODY}>
              Your ending is earned across all fourteen weeks. Strong decisions build toward the best outcome.
              Unaddressed risks and broken promises pull it down.
            </p>
          </Reveal>
          <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {ENDINGS.map((e, i) => (
              <Reveal key={e.tier} delay={i * 80} className="h-full">
                <div
                  className={`h-full rounded-[3px] border border-[var(--steel-line)] border-t-2 bg-[var(--graphite-raised)] px-4 pt-[18px] pb-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)]`}
                  style={{ borderTopColor: e.color }}
                >
                  <p className={`mb-2.5 ${DISPLAY} text-[19px] font-bold uppercase tracking-[0.02em] leading-none`} style={{ color: e.color }}>
                    {e.tier}
                  </p>
                  <p className="text-[0.92rem] leading-[1.55] text-[var(--muted)]">{e.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="hard" className={SECTION}>
          <Reveal>
            <p className={KICKER}>Why it&rsquo;s hard</p>
            <h2 className={`${H2} max-w-[24ch]`}>The decisions compound, and some of them can&rsquo;t be undone.</h2>
          </Reveal>
          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            {HARD.map((h, i) => (
              <Reveal key={h.title} delay={i * 80} className="h-full">
                <div className="h-full rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] px-5 py-[22px] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--amber-deep)] hover:bg-[var(--graphite-high)]">
                  <h3 className={`mb-2 ${DISPLAY} text-[1.35rem] font-semibold leading-[1.15]`}>{h.title}</h3>
                  <p className="text-[0.96rem] leading-[1.6] text-[var(--muted)]">{h.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <footer className={`mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 border-t border-[var(--steel-line)] px-6 pt-[34px] pb-[60px] ${MONO} text-[11px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
        <span>FLEXEE · DigitalCo</span>
        <span>An IS/IT strategy simulation in fourteen weeks</span>
      </footer>
    </div>
  );
}