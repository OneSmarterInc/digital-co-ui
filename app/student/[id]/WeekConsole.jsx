"use client";

/* The week screen, console edition — every week's three moves in one place.
 * Move 1 is the briefing (dossier, exec reads, signals, artifacts — rich
 * documents for Week 1, the API's file cards for weeks 2–14). Move 2 hands
 * off to the app's Advisors section (the war room). Move 3 is the decision,
 * generated from the API's decision_spec and submitted on his exact
 * contract: POST /run/submit/ {payload, deliverable_text}. A submitted week
 * renders the committed state instead of the form.
 */

import { useEffect, useState } from "react";
import WeekRail from "./WeekRail";
import { defineTerm, defineChoices } from "./jargon";
import { api } from "../../../lib/api";
import ArtifactsWeek1 from "./ArtifactsWeek1";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

/* Weeks with a full case exhibit behind the prose reference files. The briefing
 * used to summarise these in two sentences with the real document a nav item
 * away and nothing pointing at it — students (and the person who designed the
 * sim) never found it. */
const WEEK_EXHIBITS = {
  1: "Industry & Competitive Note · Financial Exhibits",
  3: "The Integrator's Accelerator Memo",
  4: "The Sweet Deal TCO Workbook",
  6: "Platform Sizing One-Pager",
  8: "Data Monetization Pro Formas",
  12: "The Bill at Fleet Scale",
};

function FileCard({ ix, artifact }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`file ${open ? "file--open" : ""}`}>
      <button className="file__head" type="button" onClick={() => setOpen(!open)}>
        <span className="file__ix">F{ix}</span>
        <span className="file__name">{artifact.title}</span>
        <span className="file__kind">{artifact.kind}</span>
        <span className="file__toggle">+</span>
      </button>
      <div className="file__body">
        <div className="file__inner">{artifact.body}</div>
      </div>
    </div>
  );
}

function DecisionField({ ix, field, value, onChange }) {
  if (field.field_type === "boolean") {
    // Toggles used to render unnumbered, so the form read 02 -> 06 and a student
    // could not tell whether they had skipped something. Every field counts.
    return (
      <div className="field">
        <div className="field__label">
          <span className="field__ix">{pad2(ix)}</span>
          <span className="field__name">{field.label}</span>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
          <span className="toggle__sw" />
          <span className="toggle__text">{field.toggle_hint || "Yes"}</span>
        </label>
      </div>
    );
  }
  const fieldDef = defineTerm(field.label);
  const choiceDefs = defineChoices(field.choices, field.key);

  return (
    <div className="field">
      <div className="field__label">
        <span className="field__ix">{pad2(ix)}</span>
        <span className="field__name">{field.label}</span>
      </div>
      {fieldDef && <p className="field__hint">{fieldDef}</p>}
      {field.choices?.length > 0 && field.choices.length <= 4 ? (
        <div className="segrow">
          {field.choices.map((c) => (
            <span className="seg-opt" key={c.value}>
              <input
                type="radio"
                id={`${field.key}_${c.value}`}
                name={field.key}
                checked={value === c.value}
                onChange={() => onChange(field.key, c.value)}
              />
              <label htmlFor={`${field.key}_${c.value}`}>{c.label || c.value}</label>
            </span>
          ))}
        </div>
      ) : field.choices?.length > 4 ? (
        <select value={value ?? ""} onChange={(e) => onChange(field.key, e.target.value)}>
          <option value="" disabled>Choose…</option>
          {field.choices.map((c) => (
            <option value={c.value} key={c.value}>{c.label || c.value}</option>
          ))}
        </select>
      ) : (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder=""
        />
      )}
      {choiceDefs.length > 0 && (
        <dl className="field__def">
          {choiceDefs.map(([label, def]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function WeekConsole({ game, cohortId, playable, reload, notify, setSection, weekMove }) {
  // The step is mirrored from the URL so arriving from the war room's rail
  // ("→ Decision") lands on the Decision rather than resetting to the Briefing.
  const [move, setMove] = useState(weekMove === "dec" ? "dec" : "brief");
  useEffect(() => {
    if (weekMove === "brief" || weekMove === "dec") setMove(weekMove);
  }, [weekMove]);
  const [values, setValues] = useState({});
  const [deliverable, setDeliverable] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const week = game?.week;
  const briefing = game?.briefing;
  const spec = game?.decision_spec;
  const artifacts = game?.artifacts ?? [];
  const earlier = game?.earlier_artifacts ?? [];
  const submitted = !!week?.submitted;
  const weekNo = week?.week_number ?? 1;

  if (!game) {
    return (
      <div className="dc-console" style={{ borderRadius: 6, padding: "40px 28px" }}>
        <div className="eyebrow">Weekly loop</div>
        <p style={{ marginTop: 10, color: "var(--muted)" }}>
          The weekly loop opens once you&rsquo;re placed in a firm and the simulation is live.
        </p>
      </div>
    );
  }

  const setValue = (key, v) => setValues((cur) => ({ ...cur, [key]: v }));

  // A9: committing is final and firm-wide, so the submit button asks first.
  // One stray click shouldn't lock an unfinished week for the whole team.
  const [confirming, setConfirming] = useState(false);

  function askToCommit(e) {
    e.preventDefault();
    setConfirming(true);
  }

  async function commit() {
    setConfirming(false);
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/run/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: values, deliverable_text: deliverable, cohort: cohortId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      notify("Week committed — one firm, one voice ✓");
      await reload();
      window.scrollTo({ top: 0 });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dc-console" style={{ borderRadius: 6, overflow: "hidden" }}>
      <div className="shell" style={{ minHeight: "auto" }}>
        <WeekRail
          weekNo={weekNo}
          title={briefing?.title}
          active={move}
          submitted={submitted}
          onMove={(key) => (key === "war" ? setSection("advisors") : setMove(key))}
        />

        <main className="stage">
          {move === "brief" && (
            <div className="move move--on">
              <div className="masthead">
                <div className="eyebrow">Situation report · Week {pad2(weekNo)}</div>
                <h1>{briefing?.title}</h1>
              </div>
              <article className="dossier">
                {/* Written for this firm alone, from what they have already
                    committed. The briefing below it is the same for everyone. */}
                {briefing?.preamble && (
                  <p className="dossier__preamble">{briefing.preamble}</p>
                )}
                <div className="dossier__body">
                  <p className="lede">{briefing?.body}</p>
                </div>

                {briefing?.exec_reads?.length > 0 && (
                  <>
                    <div className="band">
                      <span className="band__n">{pad2(briefing.exec_reads.length)}</span>
                      Who&rsquo;s in the room — executive reads
                    </div>
                    <div className="reads-wrap">
                      <div className="reads">
                        {briefing.exec_reads.map((r, i) => (
                          <div className="read" key={i}>{r}</div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {briefing?.signals?.length > 0 && (
                  <>
                    <div className="band">
                      <span className="band__n">{pad2(briefing.signals.length)}</span> Signals
                    </div>
                    <div className="signals">
                      {briefing.signals.map((s, i) => (
                        <div className="signal mono" key={i}>{s}</div>
                      ))}
                    </div>
                  </>
                )}

                <div className="band">
                  <span className="band__n">{pad2(weekNo === 1 ? 4 : artifacts.length)}</span>
                  On your desk — reference files
                </div>
                {weekNo === 1 ? (
                  <div style={{ padding: "0 34px 30px" }}>
                    <ArtifactsWeek1 />
                  </div>
                ) : (
                  <div className="files">
                    {artifacts.map((a, i) => (
                      <FileCard key={i} ix={i + 1} artifact={a} />
                    ))}
                  </div>
                )}

                {/* Earlier rounds, below this week's own files and clearly
                    marked as earlier. This week's memos argue from numbers
                    issued in earlier rounds, and a firm could previously read
                    the argument without reaching the evidence. */}
                {earlier.length > 0 && (
                  <>
                    <div className="band">
                      <span className="band__n">
                        {pad2(earlier.reduce((n, r) => n + r.artifacts.length, 0))}
                      </span>
                      Released earlier — still on file
                    </div>
                    {earlier.map((r) => (
                      <div key={r.week}>
                        <div className="files__round mono">
                          Round {pad2(r.week)} · {r.title}
                        </div>
                        <div className="files">
                          {r.artifacts.map((a, i) => (
                            <FileCard key={`${r.week}-${i}`} ix={i + 1} artifact={a} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* The prose files above summarise; this is the actual document,
                    with the numbers the week turns on. */}
                {WEEK_EXHIBITS[weekNo] && (
                  <div style={{ padding: "0 34px 30px" }}>
                    <button
                      type="button"
                      className="exhibit-link"
                      onClick={() => setSection?.("exhibits")}
                    >
                      <span className="exhibit-link__lab">The full case exhibit</span>
                      <span className="exhibit-link__name">{WEEK_EXHIBITS[weekNo]}</span>
                      <span className="exhibit-link__note">
                        The reference files above are summaries. This is the document itself —
                        costed tables, terms, and the rows it does not show you. Open it →
                      </span>
                    </button>
                  </div>
                )}
              </article>
            </div>
          )}

          {move === "dec" && (
            <div className="move move--on">
              <div className="masthead">
                <div className="eyebrow">Decision · Week {pad2(weekNo)}</div>
                <h1>Commit the Week</h1>
              </div>

              {submitted ? (
                <div className="confirmed confirmed--on" style={{ display: "block" }}>
                  <div className="confirmed__seal">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h2>Week {pad2(weekNo)} committed</h2>
                  <div className="confirmed__sub">{briefing?.title} · one firm, one voice</div>
                  <div className="confirmed__card">
                    <div className="eyebrow">What your call set in motion</div>
                    <p>
                      The decision is recorded for your firm. What you chose this week will
                      come back, in ways this screen doesn&rsquo;t tell you. You won&rsquo;t
                      see the scoring — you&rsquo;ll feel the consequences.
                    </p>
                  </div>
                  <div className="confirmed__next">
                    The next week opens when your instructor advances the round. <b>Watch this space.</b>
                  </div>
                </div>
              ) : (
                <form className="decision" onSubmit={askToCommit}>
                  {spec?.deliverable_prompt && (
                    <div className="decision__prompt">{spec.deliverable_prompt}</div>
                  )}
                  {(spec?.fields ?? []).map((f, i) => (
                    <DecisionField key={f.key} ix={i + 1} field={f} value={values[f.key]} onChange={setValue} />
                  ))}
                  {spec?.deliverable_prompt && (
                    <div className="field">
                      <div className="field__label">
                        <span className="field__ix">◆</span>
                        <span className="field__name">Your firm&rsquo;s written deliverable</span>
                      </div>
                      <p className="field__hint">
                        Your reasoning in your own words, as one firm — the consolidated
                        output you&rsquo;d actually hand over. The fields above capture the
                        specific calls; this is the whole, and it should agree with them.
                      </p>
                      <textarea
                        style={{ minHeight: 150 }}
                        value={deliverable}
                        onChange={(e) => setDeliverable(e.target.value)}
                        placeholder="Set out your reasoning — what you concluded and why…"
                      />
                    </div>
                  )}
                  {err && (
                    <div className="notice" style={{ borderColor: "var(--signal-red)" }}>{err}</div>
                  )}
                  {confirming && (
                    <div className="commit-confirm">
                      <p className="commit-confirm__t">Commit Week {pad2(weekNo)}?</p>
                      <p className="commit-confirm__b">
                        This locks the week for the whole firm and can&rsquo;t be undone.
                        You won&rsquo;t see a score — you&rsquo;ll feel the consequences later.
                      </p>
                      <div className="commit-confirm__row">
                        <button type="button" className="commit" onClick={commit} disabled={busy}>
                          {busy ? "Committing…" : "Yes, commit it"}
                        </button>
                        <button
                          type="button"
                          className="commit-confirm__back"
                          onClick={() => setConfirming(false)}
                          disabled={busy}
                        >
                          Keep working
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="commit-bar">
                    <button type="submit" className="commit" disabled={busy || !playable || confirming}>
                      {busy ? "Committing…" : "Commit decision"}
                    </button>
                    <div className="commit-note">
                      Committing is final for the whole firm — one decision, one voice. It
                      locks Week {pad2(weekNo)}.
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
