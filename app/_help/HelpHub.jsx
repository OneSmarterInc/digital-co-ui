"use client";

/* The "?" help hub — one modal, three sources.
 *
 * Layout follows the assembly spec top to bottom: eyebrow, title, scope line,
 * full-guide link, the FAQ list, the answer panel, the ASK box, the exit button.
 *
 * The load-bearing interaction detail: the answer panel sits in a FIXED position
 * below the whole list, not inline inside the tapped row. Tapping a different
 * question swaps the answer in place, so the list never reflows and the ASK box
 * stays exactly where the student last saw it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "../../lib/api";
import { FAQ_GROUPS, FAQ_ITEMS } from "./faq";
import { ADVISOR_DOSSIERS } from "./advisors";

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

const SCOPE_LINE =
  "This answers questions about how the sim works. It knows nothing about DigitalCo's situation or what you should decide — for that, the advisors and your team are where the call gets made.";

// The guide is a full page, so it needs to know where to send the student back
// to. Passing the current route beats letting it guess from history.
const guideHref = (from) => (from ? `/guide?from=${encodeURIComponent(from)}` : "/guide");
const deliverableHref = (from) =>
  from ? `/deliverable-guide?from=${encodeURIComponent(from)}` : "/deliverable-guide";

/* Renders the ["text", {b:"bold"}] shape from faq.js. */
function Rich({ parts }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <b key={i} className="font-semibold text-[var(--paper)]">
            {part.b}
          </b>
        )
      )}
    </>
  );
}

export default function HelpHub({ open, onClose, exitLabel = "Close" }) {
  const pathname = usePathname();
  const GUIDE_HREF = guideHref(pathname);
  const DELIVERABLE_HREF = deliverableHref(pathname);
  const ADVISORS_HREF = pathname
    ? `/advisors-guide?from=${encodeURIComponent(pathname)}`
    : "/advisors-guide";
  // One answer panel serves both lists, so the selection names which list it
  // came from: {kind: "faq" | "advisor", index}.
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState(null);
  const askRef = useRef(null);
  const answerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // The panel's position is fixed by design — but with sixteen rows above it,
  // that position is below the fold on a laptop, so tapping a question would
  // look like nothing happened. Bring the panel into view without moving it.
  useEffect(() => {
    if (!selected) return;
    answerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    try {
      const r = await api("/help/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      setAnswer(j.answer || "");
    } catch (e) {
      setAskError(e instanceof Error ? e.message : String(e));
    } finally {
      setAsking(false);
    }
  }, [question, asking]);

  if (!open) return null;

  const currentFaq = selected?.kind === "faq" ? FAQ_ITEMS[selected.index] : null;
  const currentAdvisor = selected?.kind === "advisor" ? ADVISOR_DOSSIERS[selected.index] : null;
  const hasAnswer = Boolean(currentFaq || currentAdvisor);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[var(--modal-scrim)] px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label="How this works"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[640px] rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-20px_rgba(0,0,0,0.8)]">
        {/* eyebrow + title + scope */}
        <div className="border-b border-[var(--steel-line)] px-7 pb-5 pt-6">
          <p className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>
            How this works
          </p>
          <h2 className={`mt-2 ${DISPLAY} text-[27px] font-bold leading-none`}>
            Questions about the exercise
          </h2>
          <p className="mt-3 text-[0.9rem] leading-[1.6] text-[var(--muted)]">{SCOPE_LINE}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <a
              href={GUIDE_HREF}
              className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--amber)] underline-offset-4 hover:underline`}
            >
              New here? Read the full walkthrough →
            </a>
            <a
              href={DELIVERABLE_HREF}
              className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--amber)] underline-offset-4 hover:underline`}
            >
              Not sure what a field is asking for? Understanding Your Deliverable →
            </a>
          </div>
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-7 py-5">
          {/* FAQ list — a stable stack; tapping only changes which row is lit. */}
          <div className="space-y-4">
            {FAQ_GROUPS.map((group) => (
              <div key={group.label}>
                <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>
                  {group.label}
                </p>
                <div className="space-y-px">
                  {group.items.map((item) => {
                    const index = FAQ_ITEMS.findIndex((f) => f.q === item.q);
                    const on = selected?.kind === "faq" && selected.index === index;
                    return (
                      <button
                        key={item.q}
                        onClick={() => setSelected(on ? null : { kind: "faq", index })}
                        aria-expanded={on}
                        className={`block w-full border-l-2 px-3 py-2 text-left text-[0.88rem] leading-snug transition ${
                          on
                            ? "border-l-[var(--amber)] bg-[var(--graphite-high)] text-[var(--paper)]"
                            : "border-l-transparent text-[var(--muted)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]"
                        }`}
                      >
                        {item.q}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* The advisors, as reference. Consulting costs money, so students
                need to remember who's who before they spend. Same tappable
                rows, same answer panel — nothing new to learn. */}
            <div>
              <p className={`mb-1.5 ${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>
                The advisors
              </p>
              <div className="space-y-px">
                {ADVISOR_DOSSIERS.map((advisor, index) => {
                  const on = selected?.kind === "advisor" && selected.index === index;
                  return (
                    <button
                      key={advisor.name}
                      onClick={() => setSelected(on ? null : { kind: "advisor", index })}
                      aria-expanded={on}
                      className={`flex w-full items-baseline gap-2 border-l-2 px-3 py-2 text-left text-[0.88rem] leading-snug transition ${
                        on
                          ? "border-l-[var(--amber)] bg-[var(--graphite-high)] text-[var(--paper)]"
                          : "border-l-transparent text-[var(--muted)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]"
                      }`}
                    >
                      <span>{advisor.name}</span>
                      <span className={`${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)]`}>
                        {advisor.lane}
                      </span>
                    </button>
                  );
                })}
              </div>
              <a
                href={ADVISORS_HREF}
                className={`mt-1.5 inline-block px-3 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim)] underline-offset-4 hover:text-[var(--amber)] hover:underline`}
              >
                Read all six side by side →
              </a>
            </div>
          </div>

          {/* Answer panel — fixed position under the whole list, so it lands in
              the same spot whichever row was tapped. Serves both lists. */}
          {hasAnswer && (
            <div
              ref={answerRef}
              className="mt-5 border-l-[3px] border-[var(--amber)] bg-[var(--graphite-high)] px-4 py-3.5"
            >
              {currentFaq && (
                <>
                  <p className={`mb-1.5 ${DISPLAY} text-[16px] font-semibold leading-tight`}>{currentFaq.q}</p>
                  <p className="text-[0.88rem] leading-[1.65] text-[var(--muted)]">
                    <Rich parts={currentFaq.a} />
                  </p>
                  {currentFaq.guideLink && (
                    <a
                      href={GUIDE_HREF}
                      className="mt-2 inline-block text-[0.85rem] text-[var(--amber)] underline-offset-4 hover:underline"
                    >
                      {currentFaq.guideLink} →
                    </a>
                  )}
                </>
              )}
              {currentAdvisor && (
                <>
                  <p className={`${DISPLAY} text-[16px] font-semibold leading-tight`}>{currentAdvisor.name}</p>
                  <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--amber-deep)]`}>
                    {currentAdvisor.lane}
                  </p>
                  <p className="text-[0.88rem] leading-[1.65] text-[var(--muted)]">{currentAdvisor.character}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-[0.85rem] leading-[1.6] text-[var(--muted)]">
                      <span className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--ok)]`}>
                        Listen for
                      </span>{" "}
                      {currentAdvisor.listen}
                    </p>
                    <p className="text-[0.85rem] leading-[1.6] text-[var(--muted)]">
                      <span className={`${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--signal-red)]`}>
                        Discount for
                      </span>{" "}
                      {currentAdvisor.discount}
                    </p>
                  </div>
                  <p className="mt-3 text-[0.85rem] leading-[1.6] text-[var(--muted)]">
                    Tends to ask: <b className="font-semibold text-[var(--paper)]">{currentAdvisor.asks}</b>
                  </p>
                </>
              )}
            </div>
          )}

          {/* ASK — the starved channel */}
          <div className="mt-6 border-t border-[var(--steel-line)] pt-5">
            <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>
              Something else
            </p>
            <div className="mt-2 flex gap-2">
              <input
                ref={askRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Ask about how the exercise works…"
                className="min-w-0 flex-1 rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3 py-2 text-[0.88rem] text-[var(--paper)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)]"
              />
              <button
                onClick={ask}
                disabled={asking || !question.trim()}
                className={`flex-none rounded-[2px] bg-[var(--amber)] px-5 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.06em] text-[var(--graphite)] transition hover:bg-[var(--amber-hover)] disabled:opacity-40`}
              >
                {asking ? "…" : "Ask"}
              </button>
            </div>
            {askError && (
              <p className="mt-2 text-[0.85rem] text-[var(--signal-red)]">{askError}</p>
            )}
            {answer && (
              <div className="mt-3 border-l-[3px] border-[var(--blueprint)] bg-[var(--graphite-high)] px-4 py-3.5">
                <p className="whitespace-pre-wrap text-[0.88rem] leading-[1.65] text-[var(--muted)]">{answer}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--steel-line)] px-7 py-4">
          <button
            onClick={onClose}
            className={`rounded-[2px] border border-[var(--steel-line)] px-4 py-2 ${MONO} text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)]`}
          >
            {exitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
