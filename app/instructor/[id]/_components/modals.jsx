"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../_lib/api";
import { SCORE_LABELS, ANCHOR_OPTIONS } from "../_lib/helpers";

/* Dialogs live together so views only import the ones they open. Each closes
 * on backdrop click and Escape.
 *
 * Dark console theme, var(--token, #fallback) throughout. The backdrop is a
 * fixed dark scrim (the old color-mix on --color-ink turned light under the
 * theme adapter, since ink remaps to paper). Primary buttons are amber
 * commits, destructive/errors are signal red, structure is steel on
 * graphite-raised panels. All handlers unchanged. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const COMMIT = `rounded-[2px] bg-[var(--amber,#E8A13C)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50`;
const GHOST = `rounded-[2px] border border-[var(--steel-line,#2C323A)] px-4 py-2 text-sm text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)] hover:text-[var(--paper,#ECEFF2)] disabled:opacity-50`;
const INPUT =
  "rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-[var(--paper,#ECEFF2)] outline-none transition duration-150 placeholder:text-[var(--muted-dim,#5C6672)] focus:border-[var(--blueprint,#5BA3C4)] focus:bg-[var(--graphite-high,#252B32)]";

export function ModalShell({ children, onClose, maxWidth }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-[3px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite-raised,#1E2228)] text-[var(--paper,#ECEFF2)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.8)]"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function NumberPromptModal({ title, label, initial, min = 0, confirmLabel, onClose, onSubmit }) {
  const [val, setVal] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const valid = Number.isFinite(val) && val >= min;
  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(val);
        }}
      >
        <div className="border-b border-[var(--steel-line,#2C323A)] px-6 py-4">
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>{title}</h2>
        </div>
        <div className="px-6 py-5">
          <label className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)]`}>{label}</label>
          <input
            ref={ref}
            type="number"
            min={min}
            className={`w-full px-3.5 py-2 text-[0.9rem] ${INPUT}`}
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-4">
          <button type="button" onClick={onClose} className={GHOST}>
            Cancel
          </button>
          <button type="submit" disabled={!valid} className={COMMIT}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ConfirmModal({ title, body, confirmLabel, busy, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <ModalShell onClose={onCancel} maxWidth={440}>
      <div className="border-b border-[var(--steel-line,#2C323A)] px-6 py-4">
        <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>{title}</h2>
      </div>
      <div className="px-6 py-5 text-sm leading-[1.55] text-[var(--muted,#8A94A0)]">{body}</div>
      <div className="flex items-center justify-end gap-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-4">
        <button onClick={onCancel} disabled={busy} className={GHOST}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className={COMMIT}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function ResultStat({ label, value, tone }) {
  return (
    <div className="rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] p-3 text-center">
      <div className={`${DISPLAY} text-[1.7rem] font-bold leading-none`} style={{ color: tone }}>
        {value}
      </div>
      <div className={`mt-1 ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>{label}</div>
    </div>
  );
}

export function BulkResultModal({ result, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const { summary } = result;
  const problems = [...(result.errors ?? []), ...(result.skipped ?? [])];
  return (
    <ModalShell onClose={onClose} maxWidth={520}>
      <div className="flex max-h-[82vh] flex-col">
        <div className="border-b border-[var(--steel-line,#2C323A)] px-6 py-4">
          <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Bulk invite results</h2>
          <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
            {summary.rows} row{summary.rows === 1 ? "" : "s"} processed.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 px-6 py-4">
          <ResultStat label="Invited" value={summary.invited} tone="var(--ok, #7FB08A)" />
          <ResultStat label="Skipped" value={summary.skipped} tone="var(--muted, #8A94A0)" />
          <ResultStat label="Errors" value={summary.errors} tone="var(--signal-red, #D2564B)" />
        </div>
        {problems.length > 0 && (
          <div className="overflow-y-auto px-6 pb-2">
            <p className={`mb-2 ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
              Rows that need attention
            </p>
            <div className="space-y-1.5">
              {problems.map((p, i) => (
                <div
                  key={`${p.row}-${i}`}
                  className="flex items-start justify-between gap-3 border-b border-[var(--steel-line,#2C323A)] pb-1.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className={`${MONO} text-[9px] text-[var(--muted-dim,#5C6672)]`}>Row {p.row}</span>{" "}
                    <span className="truncate">{p.email || "(no email)"}</span>
                  </span>
                  <span className="max-w-[220px] flex-none text-right text-xs text-[var(--muted,#8A94A0)]">{p.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-4">
          <button onClick={onClose} className={COMMIT}>
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function GradingModal({ score, gameId, onClose, onGraded }) {
  const isWeek1 = score.week_number === 1;
  const auto = score.auto_scores || {};
  // These boxes are the instructor's ADJUSTMENT, which the backend adds on top
  // of the engine's score (scoring/services.merge_score_components). Pre-filling
  // them with the engine's own numbers made "agree and save" record auto + auto
  // — every graded score came out at exactly double. Start at zero: saving
  // untouched now records the engine's proposal unchanged.
  const [vals, setVals] = useState(() => {
    const init = {};
    for (const dim of Object.keys(SCORE_LABELS)) init[dim] = 0;
    return init;
  });
  const [anchor, setAnchor] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = !isWeek1 || !!anchor;

  async function save() {
    if (!canSave || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api(`/instructor/score/${score.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: vals, ...(isWeek1 ? { anchor_strength: anchor } : {}) }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Request failed (${r.status})`);
      }
      await onGraded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <ModalShell onClose={onClose} maxWidth={520}>
      <div className="border-b border-[var(--steel-line,#2C323A)] px-6 py-4">
        <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>Grade {score.team_name}</h2>
        <p className={`mt-1 ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--muted-dim,#5C6672)]`}>
          Round {score.week_number}
        </p>
      </div>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
        {isWeek1 && (
          <div className="rounded-[3px] border border-[var(--amber-deep,#C4791F)] bg-[rgba(232,161,60,0.07)] p-3.5">
            <label className={`mb-2 block ${DISPLAY} text-[15px] font-semibold`}>
              Anchor strength <span className="text-[var(--amber,#E8A13C)]">(required)</span>
            </label>
            <div className="flex gap-2">
              {ANCHOR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnchor(opt)}
                  className={`flex-1 rounded-[2px] border px-3 py-2 ${MONO} text-[10px] uppercase tracking-[0.08em] transition ${
                    anchor === opt
                      ? "border-[var(--amber-deep,#C4791F)] bg-[var(--amber,#E8A13C)] font-bold text-[var(--graphite,#16191D)]"
                      : "border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-[var(--muted,#8A94A0)] hover:border-[var(--steel-soft,#363E48)] hover:text-[var(--paper,#ECEFF2)]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className={`mt-2 ${MONO} text-[9px] text-[var(--muted-dim,#5C6672)]`}>
              Week 1 needs an anchor, or the coherence audit sinks the run.
            </p>
          </div>
        )}
        <p className={`${MONO} text-[9px] uppercase tracking-[0.08em] leading-[1.5] text-[var(--muted-dim,#5C6672)]`}>
          Enter an adjustment to the engine&rsquo;s score. Leave at 0 to accept it as proposed.
        </p>
        <div className="space-y-3">
          {Object.entries(SCORE_LABELS).map(([dim, label]) => (
            <div key={dim} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.9rem] font-semibold">{label}</p>
                <p className={`${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
                  engine: {auto[dim] ?? "—"}
                </p>
              </div>
              <input
                type="number"
                value={vals[dim]}
                onChange={(e) => setVals((v) => ({ ...v, [dim]: Number(e.target.value) }))}
                className={`w-20 px-3 py-2 text-right text-[0.9rem] ${INPUT}`}
              />
            </div>
          ))}
        </div>
        {err && <p className="text-sm text-[var(--signal-red,#D2564B)]">{err}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[var(--steel-line,#2C323A)] px-6 py-4">
        <button onClick={onClose} disabled={busy} className={GHOST}>
          Cancel
        </button>
        <button onClick={save} disabled={busy || !canSave} className={COMMIT}>
          {busy ? "Saving…" : "Save grade"}
        </button>
      </div>
    </ModalShell>
  );
}