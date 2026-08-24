"use client";

/* The war room, console edition — one room, six advisors, single screen.
 * The roster stays visible beside the conversation so comparing counsel is
 * one click, which is the behavior the sim is built to teach. All of the
 * existing machinery is kept: the blinking portraits, the ElevenLabs voice
 * playback with its full audio lifecycle, the hourly billing note, and the
 * optimistic send — plus two refinements: a failed send rolls the optimistic
 * message back, and the advisor turn budget is surfaced, with the compose
 * retiring gracefully once the advisor has given their closing counsel.
 *
 * Two modes, toggled at the top:
 *   1:1    — the original one-advisor consultation (billed per started hour).
 *   Group  — the war room proper: 2–4 advisors in one shared thread, talking
 *            to each other, not just the firm. A backend director picks who
 *            speaks each beat, so reply counts vary like a real room. Free.
 *
 * API contract:
 *   1:1   GET  /advisors/{id}/            -> conversation
 *         POST /advisors/{id}/  {content} -> updated conversation
 *         POST /advisors/{id}/speak/ {message_id} -> audio
 *   Group GET  /advisors/group/                       -> {session|null}
 *         POST /advisors/group/start/ {active_advisors} -> session
 *         POST /advisors/group/ {content}              -> updated session
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";
import WeekRail from "./WeekRail";
import AdvisorAvatar from "./AdvisorAvatar";

// Mirrors advisor_agents.turn_cap.DEFAULT_TURN_CAP on the backend. The API
// never blocks; the advisor closes out in character on the turn after the
// budget is spent, so the compose retires once that closing reply exists.
const TURN_CAP = 6;

// Room sizing, mirrors advisors.services MIN/MAX_GROUP_ADVISORS.
const MIN_GROUP = 2;
const MAX_GROUP = 4;

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : `$${v}`;
};

export default function AdvisorsConsole({ sim, game, cohortId, playable, notify, setSection }) {
  const advisors = game?.advisors ?? [];
  const [mode, setMode] = useState("solo"); // "solo" | "group"

  const [activeId, setActiveId] = useState(null);
  const [convo, setConvo] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  // ---- voice: play advisor replies in the advisor's ElevenLabs voice ----
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [loadingSpeechId, setLoadingSpeechId] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const stopSpeech = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    async (messageId, advisorId = activeId) => {
      if (!messageId || !advisorId) return;
      stopSpeech();
      setLoadingSpeechId(messageId);
      try {
        const r = await api(`/advisors/${advisorId}/speak/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: messageId, cohort: cohortId }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.detail || `Request failed (${r.status})`);
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        urlRef.current = url;
        audio.onended = () => stopSpeech();
        audio.onerror = () => stopSpeech();
        setSpeakingId(messageId);
        await audio.play();
      } catch (e) {
        stopSpeech();
        notify(`Voice failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoadingSpeechId(null);
      }
    },
    [activeId, cohortId, notify, stopSpeech]
  );

  useEffect(() => stopSpeech, [stopSpeech]);
  useEffect(() => { stopSpeech(); }, [activeId, stopSpeech]);
  // Leaving 1:1 mode should also silence any playback in flight.
  useEffect(() => { if (mode !== "solo") stopSpeech(); }, [mode, stopSpeech]);

  const openAdvisor = useCallback(
    async (id) => {
      setActiveId(id);
      setConvo(null);
      try {
        const r = await api(`/advisors/${id}/?cohort=${cohortId}`);
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        setConvo(await r.json());
      } catch (e) {
        notify(`Couldn't open conversation: ${e instanceof Error ? e.message : String(e)}`);
        setActiveId(null);
      }
    },
    [cohortId, notify]
  );

  // The room opens with the first advisor already across the table.
  useEffect(() => {
    if (mode === "solo" && playable && !activeId && advisors.length) openAdvisor(advisors[0].id);
  }, [mode, playable, activeId, advisors, openAdvisor]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [convo]);

  const advisorReplies = (convo?.messages ?? []).filter((m) => m.role === "ADVISOR").length;
  const turnsUsed = Math.min(advisorReplies, TURN_CAP);
  const closed = advisorReplies > TURN_CAP; // the closing counsel has been given

  async function send() {
    const content = draft.trim();
    if (!content || busy || !activeId || closed) return;
    setBusy(true);
    const before = convo; // for rollback if the send fails
    setConvo((c) =>
      c ? { ...c, messages: [...c.messages, { role: "STUDENT", content, created_at: new Date().toISOString() }] } : c
    );
    setDraft("");
    try {
      const r = await api(`/advisors/${activeId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, cohort: cohortId }),
      });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const next = await r.json();
      setConvo(next);
      if (autoSpeak) {
        const reply = [...next.messages].reverse().find((m) => m.role === "ADVISOR" && m.id);
        if (reply) speak(reply.id);
      }
    } catch (e) {
      setConvo(before); // roll the optimistic message back — it never arrived
      setDraft(content); // and give the student their words back to retry
      notify(`Send failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  // ---- group / war-room mode ----
  const [group, setGroup] = useState(null); // session payload, or null when no room is open
  const [groupLoaded, setGroupLoaded] = useState(false);
  const [picks, setPicks] = useState([]); // advisor keys chosen to convene
  const [groupDraft, setGroupDraft] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);
  const groupScrollRef = useRef(null);

  const loadGroup = useCallback(async () => {
    try {
      const r = await api(`/advisors/group/?cohort=${cohortId}`);
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const j = await r.json();
      setGroup(j.session);
    } catch (e) {
      notify(`Couldn't load the war room: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGroupLoaded(true);
    }
  }, [cohortId, notify]);

  // Fetch the current week's room the first time group mode is opened.
  useEffect(() => {
    if (mode === "group" && !groupLoaded) loadGroup();
  }, [mode, groupLoaded, loadGroup]);

  useEffect(() => {
    groupScrollRef.current?.scrollTo({ top: groupScrollRef.current.scrollHeight });
  }, [group]);

  const groupCapped = Boolean(group?.capped);

  function togglePick(key) {
    setPicks((p) =>
      p.includes(key) ? p.filter((k) => k !== key) : p.length >= MAX_GROUP ? p : [...p, key]
    );
  }

  async function convene() {
    if (picks.length < MIN_GROUP || groupBusy) return;
    setGroupBusy(true);
    try {
      const r = await api("/advisors/group/start/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_advisors: picks, cohort: cohortId }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Request failed (${r.status})`);
      }
      setGroup(await r.json());
    } catch (e) {
      notify(`Couldn't convene the room: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGroupBusy(false);
    }
  }

  function newRoom() {
    setGroup(null);
    setPicks([]);
    setGroupDraft("");
  }

  async function sendGroup() {
    const content = groupDraft.trim();
    if (!content || groupBusy || !group || groupCapped) return;
    setGroupBusy(true);
    const before = group; // rollback if the send fails
    setGroup((g) =>
      g
        ? {
            ...g,
            turns: [
              ...g.turns,
              { id: `tmp-${Date.now()}`, speaker: "student", speaker_name: "You", advisor: null, content },
            ],
          }
        : g
    );
    setGroupDraft("");
    try {
      const r = await api("/advisors/group/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, cohort: cohortId }),
      });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      setGroup(await r.json());
    } catch (e) {
      setGroup(before); // the optimistic message never landed
      setGroupDraft(content);
      notify(`Send failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGroupBusy(false);
    }
  }

  if (!playable) {
    return (
      <div className="dc-console" style={{ borderRadius: 6, padding: "36px 28px" }}>
        <div className="eyebrow">The war room</div>
        <p style={{ marginTop: 10, color: "var(--muted)" }}>
          Advisors open up once you&rsquo;re in a firm and the simulation is live.
        </p>
      </div>
    );
  }

  const active = advisors.find((a) => a.id === activeId);

  const modeTab = (key, label) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      className="mono"
      style={{
        padding: "6px 14px",
        borderRadius: 4,
        border: "1px solid var(--steel-soft, #363E48)",
        background: mode === key ? "var(--amber, #E8A13C)" : "transparent",
        color: mode === key ? "#16191D" : "var(--muted)",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        fontSize: 11,
      }}
    >
      {label}
    </button>
  );

  const weekNo = game?.week?.week_number ?? game?.run?.current_week ?? 1;
  const submitted = Boolean(game?.week?.submitted);

  return (
    <div className="dc-console" style={{ borderRadius: 6, overflow: "hidden" }}>
      <div className="shell" style={{ minHeight: "auto" }}>
        {/* The week's rail follows the student in here. Without it the war room
            was a dead end: no sense of where you are in the week, and no route
            to the Decision, which is the actual deliverable. */}
        <WeekRail
          weekNo={weekNo}
          title={game?.briefing?.title}
          active="war"
          submitted={submitted}
          onMove={(key) => key !== "war" && setSection?.("week", key)}
        />

        <main className="stage" style={{ padding: "26px 24px 28px" }}>
      <div className="masthead" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Advisory · consult before you commit</div>
        <h1>The War Room</h1>
      </div>
      <p className="warroom-intro">
        Six advisors on call. Each sees the company through their own specialism, and each
        has a blind spot. <b>Nothing said in this room is scored.</b> Split them across your
        team, then argue about what you each heard.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "6px 0 16px", alignItems: "center", flexWrap: "wrap" }}>
        {modeTab("solo", "1:1 · one advisor")}
        {modeTab("group", "Group · war room")}
        {/* Consulting is not the deliverable — committing is. This says so once,
            without hurrying anyone out of the room. */}
        {!submitted && setSection && (
          <button
            type="button"
            onClick={() => setSection("week", "dec")}
            className="mono"
            style={{
              marginLeft: "auto",
              fontSize: 10.5,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--muted-dim)",
              border: "1px solid var(--steel-line)",
              borderRadius: 2,
              padding: "6px 11px",
              background: "none",
            }}
            title="The week isn't committed yet"
          >
            Ready to commit? → Decision
          </button>
        )}
      </div>

      {mode === "solo" && sim.advisor_hourly_rate > 0 && (
        <div className="notice" style={{ maxWidth: 720 }}>
          <b>You have {TURN_CAP} turns with each advisor this week.</b> Use them well.
          Advisor time also bills the company at{" "}
          <b>{fmtMoney(sim.advisor_hourly_rate)} per started hour</b> — your first message
          opens an hour, and everything inside that hour is covered.
        </div>
      )}
      {mode === "group" && (
        <div className="notice" style={{ maxWidth: 720 }}>
          {sim.advisor_hourly_rate > 0 ? (
            <>
              A war-room hour bills{" "}
              <b>{fmtMoney(sim.advisor_hourly_rate)} per advisor in the room</b> — you are
              paying for every seat at once. {/* live room first, otherwise the pending picks */}
              {(group?.advisor_count || picks.length) > 0 && (
                <>
                  {" "}
                  {group ? "This room" : "The room you're assembling"} costs{" "}
                  <b>
                    {fmtMoney(
                      sim.advisor_hourly_rate * (group?.advisor_count || picks.length)
                    )}
                  </b>{" "}
                  per started hour ({group?.advisor_count || picks.length} advisors).
                </>
              )}{" "}
              Your first message opens the hour; messages within it are covered.
            </>
          ) : (
            <>
              Convene 2&ndash;4 advisors and let them argue it out. They&rsquo;ll talk to
              each other, not just to you; who jumps in each beat is up to them.
            </>
          )}
        </div>
      )}

      {mode === "solo" ? (
        <div className="warroom">
          <div className="roster">
            <div className="eyebrow roster__cap">Advisors</div>
            {advisors.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`adv ${a.id === activeId ? "adv--on" : ""}`}
                onClick={() => openAdvisor(a.id)}
              >
                <AdvisorAvatar advisor={a} size={34} rounded="rounded-sm" />
                <span className="adv__id">
                  <span className="adv__name">{a.name}</span>
                  <span className="adv__lane">{a.title}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="console-panel">
            {active ? (
              <>
                <div className="cp__head">
                  <AdvisorAvatar
                    advisor={active}
                    size={40}
                    mode={speakingId ? "talking" : "idle"}
                    rounded="rounded-sm"
                  />
                  <div>
                    <div className="cp__name">{active.name}</div>
                    <div className="cp__lane">{active.title}</div>
                  </div>
                  <div className="cp__live">
                    {speakingId ? "speaking…" : closed ? "session closed" : "on call"}
                  </div>
                </div>
                <div className="cp__log" ref={scrollRef}>
                  {!convo && <div className="cp__empty mono">Opening the conversation…</div>}
                  {convo && convo.messages.length === 0 && (
                    <div className="cp__empty">
                      The chair across the table is occupied. Ask your question.
                    </div>
                  )}
                  {convo?.messages.map((m, i) => (
                    <div key={m.id ?? i} className={`turn ${m.role === "STUDENT" ? "turn--you" : "turn--adv"}`}>
                      <div className="turn__who">
                        {m.role === "STUDENT" ? "Your firm — acting CIO" : active.name}
                      </div>
                      <div className="turn__body">{m.content}</div>
                      {m.role === "ADVISOR" && m.id && (
                        <button
                          type="button"
                          className="mono"
                          onClick={() => (speakingId === m.id ? stopSpeech() : speak(m.id))}
                          style={{
                            marginTop: 4, fontSize: 10, letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: speakingId === m.id ? "var(--amber)" : "var(--muted-dim)",
                          }}
                        >
                          {loadingSpeechId === m.id ? "loading…" : speakingId === m.id ? "■ stop" : "▶ voice"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="cp__compose">
                  <input
                    className="cp__input"
                    value={draft}
                    disabled={busy || closed}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={
                      closed
                        ? `${active.name.split(" ")[0]} has given their closing counsel for this week.`
                        : `Ask ${active.name}…`
                    }
                  />
                  <button className="cp__send" type="button" onClick={send} disabled={busy || closed}>
                    {busy ? "…" : "Send"}
                  </button>
                </div>
                <div className="cp__note mono">
                  Advisors explore, they don&rsquo;t score. Turns with{" "}
                  {active.name}: {turnsUsed} of {TURN_CAP}
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setAutoSpeak((v) => !v)}
                    style={{ color: autoSpeak ? "var(--amber)" : "var(--muted-dim)", letterSpacing: ".04em" }}
                  >
                    auto-voice {autoSpeak ? "on" : "off"}
                  </button>
                </div>
              </>
            ) : (
              <div className="cp__empty" style={{ padding: 40 }}>
                Pick an advisor to begin.
              </div>
            )}
          </div>
        </div>
      ) : (
        <GroupRoom
          advisors={advisors}
          groupLoaded={groupLoaded}
          group={group}
          picks={picks}
          togglePick={togglePick}
          convene={convene}
          newRoom={newRoom}
          groupBusy={groupBusy}
          groupCapped={groupCapped}
          groupDraft={groupDraft}
          setGroupDraft={setGroupDraft}
          sendGroup={sendGroup}
          scrollRef={groupScrollRef}
        />
      )}
        </main>
      </div>
    </div>
  );
}

/* The war-room screen: a roster picker until a room is convened, then the
 * shared multi-advisor transcript with its own compose. */
function GroupRoom({
  advisors, groupLoaded, group, picks, togglePick, convene, newRoom,
  groupBusy, groupCapped, groupDraft, setGroupDraft, sendGroup, scrollRef,
}) {
  if (!groupLoaded) {
    return <div className="cp__empty mono" style={{ padding: 40 }}>Opening the war room…</div>;
  }

  // No room yet — choose who sits at the table.
  if (!group) {
    return (
      <div className="warroom">
        <div className="roster">
          <div className="eyebrow roster__cap">Convene the room · {MIN_GROUP}–{MAX_GROUP}</div>
          {advisors.map((a) => {
            const on = picks.includes(a.key);
            const full = picks.length >= MAX_GROUP && !on;
            return (
              <button
                key={a.id}
                type="button"
                className={`adv ${on ? "adv--on" : ""}`}
                onClick={() => togglePick(a.key)}
                disabled={full}
                style={full ? { opacity: 0.4 } : undefined}
              >
                <AdvisorAvatar advisor={a} size={34} rounded="rounded-sm" />
                <span className="adv__id">
                  <span className="adv__name">{a.name}</span>
                  <span className="adv__lane">{a.title}</span>
                </span>
                <span className="mono" style={{ marginLeft: "auto", color: on ? "var(--amber)" : "var(--muted-dim)" }}>
                  {on ? "✓" : "+"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="console-panel">
          <div className="cp__empty" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--muted)", maxWidth: 380, margin: "0 auto 18px" }}>
              Pick <b>{MIN_GROUP} to {MAX_GROUP}</b> advisors. In the room they&rsquo;ll
              react to each other — agree, push back, call each other out — not just answer you in turn.
            </p>
            <button
              className="cp__send"
              type="button"
              onClick={convene}
              disabled={picks.length < MIN_GROUP || groupBusy}
              style={{ minWidth: 180 }}
            >
              {groupBusy ? "Convening…" : `Convene the room (${picks.length})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active room — shared transcript.
  const roster = group.active_advisors ?? [];
  return (
    <div className="console-panel">
      <div className="cp__head">
        <div style={{ display: "flex", gap: 4 }}>
          {roster.map((a) => (
            <AdvisorAvatar key={a.id} advisor={a} size={34} rounded="rounded-sm" />
          ))}
        </div>
        <div>
          <div className="cp__name">The room</div>
          <div className="cp__lane">{roster.map((a) => a.name.split(" ")[0]).join(" · ")}</div>
        </div>
        <button
          type="button"
          className="mono cp__live"
          onClick={newRoom}
          style={{ letterSpacing: ".06em", textTransform: "uppercase", fontSize: 11 }}
        >
          {groupCapped ? "room closed · new room" : "＋ new room"}
        </button>
      </div>

      <div className="cp__log" ref={scrollRef}>
        {group.turns.length === 0 && (
          <div className="cp__empty">
            The table is set. Put your question to the room.
          </div>
        )}
        {group.turns.map((t, i) => (
          <div key={t.id ?? i} className={`turn ${t.speaker === "student" ? "turn--you" : "turn--adv"}`}>
            <div className="turn__who" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {t.advisor && <AdvisorAvatar advisor={t.advisor} size={22} rounded="rounded-sm" />}
              {t.speaker === "student" ? "Your firm — acting CIO" : t.speaker_name}
            </div>
            <div className="turn__body">{t.content}</div>
          </div>
        ))}
      </div>

      <div className="cp__compose">
        <input
          className="cp__input"
          value={groupDraft}
          disabled={groupBusy || groupCapped}
          onChange={(e) => setGroupDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendGroup()}
          placeholder={
            groupCapped
              ? "The room has given its closing counsel for this week."
              : "Put a question to the room…"
          }
        />
        <button className="cp__send" type="button" onClick={sendGroup} disabled={groupBusy || groupCapped}>
          {groupBusy ? "…" : "Send"}
        </button>
      </div>
      <div className="cp__note mono">
        Advisors explore, they don&rsquo;t score
        {typeof group.student_turns === "number" ? ` · ${group.student_turns} rounds put to the room` : ""}.
      </div>
    </div>
  );
}
