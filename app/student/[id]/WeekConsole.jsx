"use client";

/* The week screen, console edition — every week's three moves in one place.
 * Move 1 is the briefing (dossier, exec reads, signals, artifacts — rich
 * documents for Week 1, the API's file cards for weeks 2–14). Move 2 hands
 * off to the app's Advisors section (the war room). Move 3 is the decision,
 * generated from the API's decision_spec and submitted on his exact
 * contract: POST /run/submit/ {payload, deliverable_text}. A submitted week
 * renders the committed state instead of the form.
 */

import { useState } from "react";
import { api } from "../../../lib/api";
import ArtifactsWeek1 from "./ArtifactsWeek1";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

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
    return (
      <div className="field">
        <label className="toggle">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
          <span className="toggle__sw" />
          <span className="toggle__text">{field.label}</span>
        </label>
      </div>
    );
  }
  return (
    <div className="field">
      <div className="field__label">
        <span className="field__ix">{pad2(ix)}</span>
        <span className="field__name">{field.label}</span>
      </div>
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
    </div>
  );
}

export default function WeekConsole({ game, cohortId, playable, reload, notify, setSection }) {
  const [move, setMove] = useState("brief");
  const [values, setValues] = useState({});
  const [deliverable, setDeliverable] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const week = game?.week;
  const briefing = game?.briefing;
  const spec = game?.decision_spec;
  const artifacts = game?.artifacts ?? [];
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

  async function commit(e) {
    e.preventDefault();
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

  const moves = [
    ["brief", "01", "Briefing", "situation report"],
    ["war", "02", "War room", "six advisors"],
    ["dec", "03", "Decision", "commit the week"],
  ];

  return (
    <div className="dc-console" style={{ borderRadius: 6, overflow: "hidden" }}>
      <div className="shell" style={{ minHeight: "auto" }}>
        <nav className="rail">
          <div className="rail__wk">
            <div className="rail__num"><span>W</span>{pad2(weekNo)}</div>
            <div className="rail__title">{briefing?.title}</div>
            {weekNo === 1 && (
              <div className="rail__mandate">
                &ldquo;Take thirty days, get me a real read, and come back with a direction I
                can take to the board.&rdquo; — Ray Calloway, CEO
              </div>
            )}
          </div>
          <div className="rail__moves">
            {moves.map(([key, ix, label, sub]) => (
              <button
                key={key}
                type="button"
                className={`move-btn ${move === key ? "move-btn--on" : ""}`}
                onClick={() => (key === "war" ? setSection("advisors") : setMove(key))}
              >
                <span className="move-btn__ix">{ix}</span>
                <span>
                  <span className="move-btn__label">{label}</span>
                  <span className="move-btn__sub">{sub}</span>
                </span>
                {key === "dec" && (
                  <span className={`move-btn__flag ${submitted ? "flag--done" : "flag--open"}`}>
                    {submitted ? "committed" : "open"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <main className="stage">
          {move === "brief" && (
            <div className="move move--on">
              <div className="masthead">
                <div className="eyebrow">Situation report · Week {pad2(weekNo)}</div>
                <h1>{briefing?.title}</h1>
              </div>
              <article className="dossier">
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
                      The decision is recorded for your firm. The moves you made this week
                      seed threads that resurface as the arc unfolds. You won&rsquo;t see the
                      scoring — you&rsquo;ll feel the consequences.
                    </p>
                  </div>
                  <div className="confirmed__next">
                    The next week opens when your instructor advances the round. <b>Watch this space.</b>
                  </div>
                </div>
              ) : (
                <form className="decision" onSubmit={commit}>
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
                        <span className="field__name">Deliverable</span>
                      </div>
                      <textarea
                        style={{ minHeight: 150 }}
                        value={deliverable}
                        onChange={(e) => setDeliverable(e.target.value)}
                        placeholder="Write your firm's deliverable here…"
                      />
                    </div>
                  )}
                  {err && (
                    <div className="notice" style={{ borderColor: "var(--signal-red)" }}>{err}</div>
                  )}
                  <div className="commit-bar">
                    <button type="submit" className="commit" disabled={busy || !playable}>
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
