"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// One level deeper than the detail page, so one more hop up to the api client.
import { fetchMe, api, logout } from "../../../../lib/api";
import { initials } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { Avatar, Pill, FillBar } from "../_components/ui";
import { IconBack, IconSend, IconUpload, IconDownload, IconLink, IconUsers, IconCheck, IconClipboard, IconPlay } from "../_components/icons";
import { BulkResultModal } from "../_components/modals";

/* ================================================================== *
 * Cohort setup wizard: /instructor/[id]/setup
 * Three steps to go live — invite students (single email, bulk file,
 * or self-registration link), allocate everyone into firms, deploy.
 * Plus a clearly-marked TEST ONLY card that provisions mailinator
 * accounts round-robin across firms via the setup-test-team endpoint.
 * All actions hit existing backend routes; nothing here is stubbed.
 *
 * Dark console theme, fully native. Setup is the "waiting on you"
 * page par excellence, so amber does the heavy lifting: incomplete
 * step numbers, the in-progress status, the deploy commit, and the
 * TEST ONLY card (amber = special mode, same as Mimic). Steps flip
 * to ok green as they complete; pending counts are blueprint.
 * All handlers and endpoints unchanged.
 * ================================================================== */

const FIRM_TONES = ["#7FB08A", "#E8A13C", "#5BA3C4", "#9B8AC4", "#D2564B", "#5FB0A0"];

const THEME = {
  "--graphite": "#16191D",
  "--graphite-raised": "#1E2228",
  "--graphite-high": "#252B32",
  "--steel-line": "#2C323A",
  "--steel-soft": "#363E48",
  "--paper": "#ECEFF2",
  "--muted": "#8A94A0",
  "--muted-dim": "#5C6672",
  "--amber": "#E8A13C",
  "--amber-deep": "#C4791F",
  "--signal-red": "#D2564B",
  "--blueprint": "#5BA3C4",
  "--blueprint-deep": "#3B7E9C",
  "--ok": "#7FB08A",
};

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const COMMIT = `flex items-center gap-2 rounded-[2px] bg-[var(--amber)] px-4 py-2 font-['Saira_Condensed',sans-serif] text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50 disabled:hover:bg-[var(--amber)]`;
const GHOST = `rounded-[2px] border border-[var(--steel-line)] font-['IBM_Plex_Mono',ui-monospace,monospace] uppercase text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:bg-[var(--graphite-high)] hover:text-[var(--paper)] disabled:opacity-50`;

export default function CohortSetupPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const gameId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [me, setMe] = useState(null);
  const [detail, setDetail] = useState(null);
  const [invites, setInvites] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    const res = await api(`/instructor/simulations/${gameId}/`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    setDetail(await res.json());
    try {
      const iv = await api(`/instructor/simulations/${gameId}/invitations/`);
      if (iv.ok) setInvites(await iv.json());
    } catch {
      /* invites are additive info; the wizard still works without them */
    }
  }, [gameId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!user.is_instructor) {
          if (alive) {
            setPhase("redirect");
            router.replace("/login");
          }
          return;
        }
        await load();
        if (alive) {
          setMe(user);
          setPhase("ready");
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [load, router]);

  const reload = useCallback(async () => {
    try {
      await load();
    } catch (e) {
      notify(`Refresh failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [load, notify]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  if (phase !== "ready" || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16191D] px-6 text-[#ECEFF2]" style={THEME}>
        <p className={`${MONO} text-[12px] uppercase tracking-[0.16em] text-[var(--muted,#8A94A0)]`}>
          {phase === "error"
            ? `Couldn't load this cohort. ${error ?? ""}`
            : phase === "redirect"
              ? "Redirecting…"
              : "Loading setup…"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--graphite)] font-['IBM_Plex_Sans',system-ui,sans-serif] text-[var(--paper)] antialiased [color-scheme:dark] selection:bg-[var(--amber)] selection:text-[var(--graphite)]"
      style={THEME}
    >
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--steel-line)] bg-[rgba(22,25,29,0.85)] px-7 py-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/instructor/${gameId}`)}
            aria-label="Back to cohort"
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] text-[var(--muted)] transition-colors hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconBack size={16} />
          </button>
          <img src="/logo-1x.svg" alt="FLEXEE · DigitalCo" className="h-[26px] w-[26px] flex-shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            {/* Primary lockup — the same platform · sim treatment the opening tour uses. */}
          <span className={`flex flex-shrink-0 items-baseline gap-2 ${DISPLAY} text-[17px] font-bold leading-none tracking-[0.03em]`}>
            <span>FLEXEE</span>
            <span className="font-normal text-[var(--muted-dim)]">·</span>
            <span className="text-[var(--amber)]">DigitalCo</span>
          </span>
            <span className={`${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Instructor</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`truncate ${DISPLAY} text-[16px] font-semibold text-[var(--paper)]`}>{detail.name}</span>
            <span className="text-[var(--muted-dim)]">/</span>
            <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--muted)]`}>Setup</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden ${MONO} text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)] sm:inline`}>
            {me.first_name || me.username}
          </span>
          <button onClick={signOut} className={`px-4 py-2 text-[10.5px] font-semibold tracking-[0.14em] ${GHOST}`}>
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-[920px]">
          <Wizard gameId={gameId} detail={detail} invites={invites} reload={reload} notify={notify} router={router} />
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */

function Wizard({ gameId, detail, invites, reload, notify, router }) {
  const students = detail.students ?? [];
  const enrolled = students.length;
  const firmsRaw = useMemo(() => (detail.firms ?? []).slice().sort((a, b) => a.number - b.number), [detail.firms]);
  const firms = useMemo(
    () =>
      firmsRaw.map((t) => ({
        number: t.number,
        label: t.name ?? `Firm ${t.number}`,
        members: students.filter((s) => (s.firm_index ?? -1) === t.number - 1),
      })),
    [firmsRaw, students]
  );
  const awaiting = students.filter((s) => !s.firm);
  const placed = enrolled - awaiting.length;

  const pending = invites.filter((i) => i.status === "PENDING").length;
  const accepted = invites.filter((i) => i.status === "ACCEPTED").length;
  const expired = invites.filter((i) => i.status === "EXPIRED").length;
  const invitedCount = invites.length;

  // Deployment: draft (admin hasn't released to faculty) -> faculty (ready) -> students (live)
  const deployStatus = detail.deployment_status || "draft";
  const deployed = deployStatus === "students";
  const isDraft = deployStatus === "draft";

  const step1Done = invitedCount > 0 || enrolled > 0;
  const step2Done = enrolled > 0 && awaiting.length === 0;
  const step3Done = deployed;
  const completeCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const pct = Math.round((completeCount / 3) * 100);
  const canDeploy = step1Done && step2Done && deployStatus === "faculty";

  const [open, setOpen] = useState({ 1: true });
  const toggle = (n) => setOpen((o) => ({ ...o, [n]: !o[n] }));
  const [busy, setBusy] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [allocTab, setAllocTab] = useState("firms");
  const [newFirm, setNewFirm] = useState("");
  const [addingFirm, setAddingFirm] = useState(false);
  const [confirmDeleteFirm, setConfirmDeleteFirm] = useState(null);

  const act = async (path, opts, label, after) => {
    setBusy(true);
    await runAction({ path, opts, label, reload, notify, after });
    setBusy(false);
  };

  // Firms are created and removed here as well as on the Firms screen: setup is
  // where an instructor is actually shaping the cohort, and "ask an admin" used
  // to be the only answer when the firm count was wrong.
  const doCreateFirm = () => {
    const name = newFirm.trim();
    act(
      `/instructor/simulations/${gameId}/firms/`,
      jsonPost(name ? { name } : {}),
      name ? `${name} created` : "Firm created",
      () => {
        setNewFirm("");
        setAddingFirm(false);
      }
    );
  };

  // The server refuses while a firm holds students or has submitted work —
  // deleting one takes its run, rounds and grades with it.
  const doDeleteFirm = (firm) => {
    setConfirmDeleteFirm(null);
    act(
      `/instructor/simulations/${gameId}/firms/${firm.number}/`,
      { method: "DELETE" },
      `${firm.label} deleted`
    );
  };

  const doMove = (enrollmentId, firmNumber, label) => {
    setMenuFor(null);
    act(
      `/instructor/simulations/${gameId}/enrollments/${enrollmentId}/move/`,
      jsonPost({ firm_number: firmNumber }),
      firmNumber === 0 ? "Student unassigned" : `Moved to ${label}`
    );
  };
  const doDeploy = () =>
    act(`/instructor/simulations/${gameId}/deploy-students/`, { method: "POST" }, "Deployed to students", () =>
      router.push(`/instructor/${gameId}`)
    );

  return (
    <div className="space-y-6">
      {/* title */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-[2px] bg-[var(--amber)] px-2.5 py-1 ${MONO} text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--graphite)]`}>
            Setup
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1 ${MONO} text-[9px] uppercase tracking-[0.1em] ${
              deployed ? "border-[#3f5e46] text-[var(--ok)]" : "border-[var(--amber-deep)] text-[var(--amber)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                deployed ? "bg-[var(--ok)] shadow-[0_0_6px_-1px_var(--ok)]" : "bg-[var(--amber)] shadow-[0_0_6px_-1px_var(--amber)]"
              }`}
            />
            {deployed ? "Deployed" : "Setup in progress"}
          </span>
        </div>
        <h1 className={`mt-3 ${DISPLAY} text-[2.6rem] font-bold leading-none`}>{detail.name}</h1>
        <p className="mt-2 max-w-2xl text-[0.95rem] leading-[1.55] text-[var(--muted)]">
          Three steps to make this simulation available to students. You can revisit any step at any time.
        </p>
      </div>

      <TestTeamCard gameId={gameId} firmCount={firms.length} reload={reload} notify={notify} />

      {/* progress */}
      <div className={`p-5 ${PANEL}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`${DISPLAY} text-[17px] font-semibold`}>Setup progress</span>
          <span className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-[var(--blueprint)]`}>
            {completeCount} of 3 complete · {pct}%
          </span>
        </div>
        <div className="mt-3">
          <FillBar value={completeCount} total={3} />
        </div>
      </div>

      {/* STEP 1 — invite */}
      <StepCard
        n={1}
        done={step1Done}
        title="Invite students"
        subtitle="One email at a time, a spreadsheet of many, or a self-registration link"
        meta={
          <div className="text-right">
            <div className={`${DISPLAY} text-[1.5rem] font-bold leading-none text-[var(--amber)]`}>{invitedCount}</div>
            <div className={`mt-1 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>invited</div>
          </div>
        }
        open={!!open[1]}
        onToggle={() => toggle(1)}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Total invites" value={invitedCount} bar="var(--amber)" />
          <MiniStat label="Pending" value={pending} bar="var(--blueprint)" />
          <MiniStat label="Accepted" value={accepted} bar="var(--ok)" />
          <MiniStat label="Expired" value={expired} bar="var(--muted-dim)" />
        </div>
        <InvitePanel gameId={gameId} detail={detail} reload={reload} notify={notify} busy={busy} setBusy={setBusy} />
      </StepCard>

      {/* STEP 2 — allocate */}
      <StepCard
        n={2}
        done={step2Done}
        title="Allocate students to firms"
        subtitle={`Place each student into one of ${firms.length} competing firm${firms.length === 1 ? "" : "s"}`}
        meta={
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className={`${DISPLAY} text-[1.4rem] font-bold leading-none text-[var(--ok)]`}>{placed}</div>
              <div className={`mt-1 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>placed</div>
            </div>
            <div className="text-right">
              <div className={`${DISPLAY} text-[1.4rem] font-bold leading-none ${awaiting.length ? "text-[var(--amber)]" : ""}`}>
                {awaiting.length}
              </div>
              <div className={`mt-1 ${MONO} text-[8.5px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>unplaced</div>
            </div>
          </div>
        }
        open={!!open[2]}
        onToggle={() => toggle(2)}
      >
        <div className="mb-4 inline-flex gap-1 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite)] p-1">
          {[
            ["awaiting", `Awaiting placement (${awaiting.length})`],
            ["firms", `Firms (${firms.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAllocTab(key)}
              className={`rounded-[2px] px-4 py-1.5 ${MONO} text-[10px] uppercase tracking-[0.08em] transition ${
                allocTab === key
                  ? "border border-[var(--steel-soft)] bg-[var(--graphite-raised)] font-semibold text-[var(--paper)]"
                  : "border border-transparent text-[var(--muted)] hover:text-[var(--paper)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {allocTab === "firms" && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {addingFirm ? (
              <>
                <input
                  value={newFirm}
                  onChange={(e) => setNewFirm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") doCreateFirm();
                    if (e.key === "Escape") setAddingFirm(false);
                  }}
                  placeholder="Firm name (optional)"
                  autoFocus
                  className="h-8 w-[188px] rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-2.5 text-[0.8rem] text-[var(--paper)] outline-none focus:border-[var(--blueprint)]"
                />
                <button
                  onClick={doCreateFirm}
                  disabled={busy}
                  className={`rounded-[2px] bg-[var(--amber)] px-3 py-1.5 ${MONO} text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--graphite)] transition hover:bg-[#F0B052] disabled:opacity-50`}
                >
                  {busy ? "Adding…" : "Add firm"}
                </button>
                <button
                  onClick={() => setAddingFirm(false)}
                  className={`${MONO} text-[9.5px] uppercase tracking-[0.1em] text-[var(--muted-dim)] hover:text-[var(--paper)]`}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setAddingFirm(true)}
                className={`rounded-[2px] border border-[var(--steel-line)] px-3 py-1.5 ${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]`}
              >
                + New firm
              </button>
            )}
          </div>
        )}

        {allocTab === "awaiting" ? (
          awaiting.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Everyone has been placed in a firm.</p>
          ) : (
            <div className="space-y-2">
              {awaiting.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-[3px] border border-[var(--steel-line)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar text={initials(s.name)} />
                    <div className="min-w-0">
                      <p className="truncate text-[0.95rem] font-semibold">{s.name}</p>
                      <p className={`truncate ${MONO} text-[10px] text-[var(--muted-dim)]`}>{s.email}</p>
                    </div>
                  </div>
                  <FirmPicker
                    open={menuFor === s.id}
                    onToggle={() => setMenuFor((m) => (m === s.id ? null : s.id))}
                    firms={firms}
                    onPick={(n, label) => doMove(s.enrollment_id, n, label)}
                    label="Place"
                    busy={busy}
                  />
                </div>
              ))}
            </div>
          )
        ) : firms.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No firms yet. Add one above &mdash; students can&rsquo;t be placed until at least
            one exists.
          </p>
        ) : (
          <div className="space-y-4">
            {firms.map((f) => {
              const color = FIRM_TONES[(f.number - 1) % FIRM_TONES.length];
              return (
                <div
                  key={f.number}
                  className="rounded-[3px] border border-[var(--steel-line)]"
                  style={{ borderLeftWidth: 3, borderLeftColor: color }}
                >
                  <div className="flex items-center justify-between gap-3 rounded-t-[2px] bg-[var(--graphite-high)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-[30px] w-[30px] items-center justify-center rounded-[2px] ${DISPLAY} font-bold text-[var(--graphite)]`}
                        style={{ background: color }}
                      >
                        {f.number}
                      </span>
                      <p className={`${DISPLAY} text-[16px] font-semibold`}>{f.label}</p>
                    </div>
                    <div className="flex flex-none items-center gap-2.5">
                      <Pill tone={f.members.length ? "good" : "muted"}>
                        {f.members.length} member{f.members.length === 1 ? "" : "s"}
                      </Pill>
                      <button
                        onClick={() => setConfirmDeleteFirm(f)}
                        disabled={busy || f.members.length > 0}
                        title={
                          f.members.length > 0
                            ? "Move its students out before deleting this firm"
                            : `Delete ${f.label}`
                        }
                        className={`rounded-[2px] border px-2.5 py-1 ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em] transition ${
                          f.members.length > 0
                            ? "cursor-not-allowed border-[var(--steel-line)] text-[var(--muted-dim)]"
                            : "border-[#7a3b35] text-[var(--signal-red)] hover:bg-[rgba(210,86,75,0.1)]"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                    {f.members.length === 0 ? (
                      <p className="px-1 py-2 text-sm text-[var(--muted)]">No students yet.</p>
                    ) : (
                      f.members.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 rounded-[3px] border border-[var(--steel-line)] px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar text={initials(s.name)} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{s.name}</p>
                              <p className={`truncate ${MONO} text-[9px] text-[var(--muted-dim)]`}>{s.email}</p>
                            </div>
                          </div>
                          <FirmPicker
                            open={menuFor === s.id}
                            onToggle={() => setMenuFor((m) => (m === s.id ? null : s.id))}
                            firms={firms}
                            exclude={f.number}
                            allowUnassign
                            onPick={(n, label) => doMove(s.enrollment_id, n, label)}
                            label="Move"
                            busy={busy}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StepCard>

      {/* STEP 3 — deploy */}
      <StepCard
        n={3}
        done={step3Done}
        title="Deploy for students"
        subtitle="Make the simulation live so enrolled students can log in and play"
        open={!!open[3]}
        onToggle={() => toggle(3)}
      >
        <div className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite)] p-5">
          <p className={`mb-3 ${MONO} text-[9px] uppercase tracking-[0.2em] text-[var(--muted-dim)]`}>Before you deploy</p>
          <Check ok={step1Done} title="At least one student invited or enrolled" detail={`${Math.max(invitedCount, enrolled)} so far`} />
          <Check ok={step2Done} title="Every enrolled student placed in a firm" detail={`${placed} of ${enrolled} placed`} />
          <Check
            ok={!isDraft}
            title="Simulation released to faculty by an admin"
            detail={isDraft ? "Still in draft — ask an admin to deploy it for faculty first" : deployed ? "Live for students" : "Ready to deploy"}
          />
        </div>

        <div className="mt-4 rounded-[3px] border border-[var(--steel-line)] border-l-[3px] border-l-[var(--amber-deep)] bg-[var(--graphite-raised)] px-4 py-3.5">
          <p className="text-sm text-[var(--muted)]">
            <strong className="text-[var(--amber)]">Heads up:</strong> once deployed, students get immediate access and the simulation starts
            tracking decisions. You can still invite more students or move people between firms afterwards.
          </p>
        </div>

        <button
          onClick={doDeploy}
          disabled={!canDeploy || busy}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[2px] bg-[var(--amber)] px-4 py-3.5 ${DISPLAY} text-[16px] font-bold uppercase tracking-[0.04em] text-[var(--graphite)] transition duration-150 hover:bg-[#F0B052] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--amber)]`}
        >
          <IconPlay size={15} />
          {deployed ? "Already deployed" : busy ? "Deploying…" : `Deploy for ${enrolled} student${enrolled === 1 ? "" : "s"}`}
        </button>
        {!canDeploy && !deployed && (
          <p className={`mt-2 text-center ${MONO} text-[9px] uppercase tracking-[0.08em] text-[var(--muted-dim)]`}>
            {isDraft
              ? "An admin has to release this simulation to faculty before you can deploy it."
              : "Invite at least one student and place everyone in a firm to enable deploy."}
          </p>
        )}
      </StepCard>

      {confirmDeleteFirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(10,12,14,0.72)] px-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirmDeleteFirm(null)}
        >
          <div className="w-full max-w-[440px] rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.4),0_24px_60px_-24px_rgba(0,0,0,0.8)]">
            <h3 className={`${DISPLAY} text-[20px] font-semibold leading-tight`}>
              Delete {confirmDeleteFirm.label}?
            </h3>
            <p className="mt-2 text-[0.9rem] leading-[1.6] text-[var(--muted)]">
              This removes the firm and the run behind it, and cannot be undone. Firms with
              students in them, or with a submitted round, are refused.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteFirm(null)}
                className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--paper)]`}
              >
                Keep it
              </button>
              <button
                onClick={() => doDeleteFirm(confirmDeleteFirm)}
                disabled={busy}
                className={`rounded-[2px] bg-[var(--signal-red)] px-4 py-2 ${MONO} text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--paper)] transition hover:bg-[#E0655A] disabled:opacity-50`}
              >
                {busy ? "Deleting…" : "Delete firm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- invite panel: single / bulk / link, all backed by real endpoints ---- */

function InvitePanel({ gameId, detail, reload, notify, busy, setBusy }) {
  const [tab, setTab] = useState("single");
  const [email, setEmail] = useState("");
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [regUrl, setRegUrl] = useState(detail.registration_url ?? null);
  const [copied, setCopied] = useState(false);

  const doInvite = async () => {
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/invite/`,
      opts: jsonPost({ email: value }),
      label: "Invite sent",
      reload,
      notify,
      after: () => setEmail(""),
    });
    setBusy(false);
  };

  async function doBulk() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api(`/instructor/simulations/${gameId}/bulk-invite/`, { method: "POST", body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Request failed (${r.status})`);
      }
      setBulkResult(await r.json());
      await reload();
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      notify(`Bulk invite failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    try {
      const r = await api(`/instructor/simulations/${gameId}/bulk-invite-template/`);
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bulk-invite-template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify(`Template download failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function doRegLink(regenerate) {
    setBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/registration-link/`, jsonPost({ regenerate: !!regenerate }));
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const j = await r.json();
      setRegUrl(j.url ?? null);
      notify(regenerate ? "Link regenerated ✓" : "Link generated ✓");
    } catch (e) {
      notify(`Generate failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }
  async function doDisableLink() {
    setBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/registration-link/`, { method: "DELETE" });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      setRegUrl(null);
      notify("Link disabled ✓");
    } catch (e) {
      notify(`Disable failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }
  function copyLink() {
    if (!regUrl) return;
    navigator.clipboard
      ?.writeText(regUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => notify("Copy failed — select and copy manually"));
  }

  return (
    <div className="mt-4 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[2px] border border-[var(--steel-soft)] bg-[var(--graphite)] text-[var(--amber)]">
          <IconSend size={17} />
        </span>
        <div>
          <h4 className={`${DISPLAY} text-[17px] font-semibold`}>Send new invites</h4>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Every path lands students in this cohort's enrollment.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite)] p-1">
        {[
          ["single", "Single"],
          ["bulk", "Bulk file"],
          ["link", "Link"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-[2px] py-2 ${MONO} text-[10px] uppercase tracking-[0.08em] transition ${
              tab === key
                ? "border border-[var(--steel-soft)] bg-[var(--graphite-raised)] font-semibold text-[var(--paper)]"
                : "border border-transparent text-[var(--muted)] hover:text-[var(--paper)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "single" && (
        <div className="mt-4">
          <label className={`mb-1.5 block ${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]`}>Student email</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="h-10 min-w-[220px] flex-1 rounded-[2px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3.5 text-[0.9rem] text-[var(--paper)] outline-none transition duration-150 placeholder:text-[var(--muted-dim)] focus:border-[var(--blueprint)] focus:shadow-[0_0_0_3px_rgba(91,163,196,0.15)]"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doInvite()}
            />
            <button onClick={doInvite} disabled={busy || !email.trim()} className={COMMIT}>
              <IconSend size={14} /> Send invite
            </button>
          </div>
          <p className={`mt-1.5 ${MONO} text-[9px] text-[var(--muted-dim)]`}>
            They&apos;ll get an email with a link to join. Re-inviting the same address is safe.
          </p>
        </div>
      )}

      {tab === "bulk" && (
        <div className="mt-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-[3px] border border-dashed border-[var(--steel-soft)] px-4 py-3.5 text-sm text-[var(--muted)] transition hover:border-[var(--amber-deep)] hover:text-[var(--paper)]"
          >
            <IconUpload size={15} /> {file?.name ?? "Choose an .xlsx, .xls, or .csv…"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-medium text-[var(--blueprint)] transition hover:text-[var(--paper)]"
            >
              <IconDownload size={14} /> Download template
            </button>
            <button onClick={doBulk} disabled={!file || busy} className={COMMIT}>
              <IconSend size={14} /> {busy ? "Sending…" : "Send bulk invites"}
            </button>
          </div>
        </div>
      )}

      {tab === "link" && (
        <div className="mt-4">
          <div
            className={`rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite)] text-sm text-[var(--muted)] ${
              regUrl ? "py-2 pl-3.5 pr-2" : "p-3.5"
            }`}
          >
            {regUrl ? (
              <div className="flex items-center gap-2">
                <span className={`flex-1 truncate ${MONO} text-[0.72rem] text-[var(--blueprint)]`}>{regUrl}</span>
                <button onClick={copyLink} className={`flex-none px-2.5 py-1 text-[9px] tracking-[0.1em] ${GHOST}`}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            ) : (
              <>No registration link yet. Generate one so students can self-register without individual invites.</>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            {regUrl ? (
              <button
                onClick={doDisableLink}
                disabled={busy}
                className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--signal-red)] disabled:opacity-50"
              >
                Disable link
              </button>
            ) : (
              <span />
            )}
            <button onClick={() => doRegLink(!!regUrl)} disabled={busy} className={COMMIT}>
              <IconLink size={14} /> {busy ? "Working…" : regUrl ? "Regenerate" : "Generate link"}
            </button>
          </div>
        </div>
      )}

      {bulkResult && <BulkResultModal result={bulkResult} onClose={() => setBulkResult(null)} />}
    </div>
  );
}

/* ---- TEST ONLY: provision mailinator accounts round-robin across firms ---- */

function TestTeamCard({ gameId, firmCount, reload, notify }) {
  const [perFirm, setPerFirm] = useState(4);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function provision() {
    setBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/setup-test-team/`, jsonPost({ per_firm: perFirm }));
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      setResult(j);
      await reload();
      notify("Test team provisioned ✓");
    } catch (e) {
      notify(`Setup test team failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }
  function copy(text, label = "Copied ✓") {
    navigator.clipboard?.writeText(text).then(() => notify(label)).catch(() => {});
  }

  return (
    <div className="relative rounded-[3px] border-2 border-dashed border-[var(--amber-deep)] p-5">
      <span
        className={`absolute -top-3 left-4 flex items-center gap-1.5 rounded-[2px] bg-[var(--amber)] px-2.5 py-0.5 ${MONO} text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--graphite)]`}
      >
        Test only
      </span>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className={`${DISPLAY} text-[19px] font-semibold`}>Setup test team</h3>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Provisions <code className={`${MONO} text-[0.8em] text-[var(--paper)]`}>test-1@mailinator.com</code>,{" "}
            <code className={`${MONO} text-[0.8em] text-[var(--paper)]`}>test-2@mailinator.com</code>, … and round-robin enrolls them across
            firms. All accounts share one password; inboxes are readable at mailinator.com.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-[2px] border border-[var(--steel-line)] px-2.5 py-1.5">
            <span className={`${MONO} text-[9px] uppercase tracking-[0.12em] text-[var(--muted-dim)]`}>Per firm</span>
            <button
              onClick={() => setPerFirm((n) => Math.max(1, n - 1))}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[2px] border border-[var(--steel-line)] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
            >
              −
            </button>
            <span className={`min-w-[16px] text-center ${DISPLAY} text-[16px] font-semibold`}>{perFirm}</span>
            <button
              onClick={() => setPerFirm((n) => Math.min(20, n + 1))}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[2px] border border-[var(--steel-line)] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
            >
              +
            </button>
          </div>
          <button onClick={provision} disabled={busy} className={COMMIT}>
            <IconUsers size={14} /> {busy ? "Provisioning…" : `Setup test team (${perFirm * Math.max(firmCount, 1)} students)`}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-[3px] border border-[#3f5e46] bg-[var(--graphite-raised)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ok)]">
              <strong>{result.total}</strong> total · <strong>{result.created}</strong> created · <strong>{result.reused}</strong> reused ·{" "}
              <strong>{result.firms}</strong> firms · password <code className={`${MONO} text-[var(--paper)]`}>{result.password}</code>
            </p>
            <button
              onClick={() => copy(result.accounts.map((a) => a.email).join("\n"), "All emails copied ✓")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] tracking-[0.1em] ${GHOST}`}
            >
              <IconClipboard size={13} /> Copy all
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {result.accounts.map((a) => (
              <div
                key={a.email}
                className="flex items-center justify-between gap-2 rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite)] px-3 py-2"
              >
                <span className={`truncate ${MONO} text-[0.7rem]`}>{a.email}</span>
                <span className="flex flex-none items-center gap-2">
                  <span className={`rounded-[2px] border border-[var(--steel-line)] px-2 py-0.5 ${MONO} text-[9px] uppercase tracking-[0.06em] text-[var(--muted)]`}>
                    {a.firm}
                  </span>
                  <button
                    onClick={() => copy(a.email)}
                    className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-[var(--steel-line)] text-[var(--muted)] transition hover:border-[var(--steel-soft)] hover:text-[var(--paper)]"
                  >
                    <IconClipboard size={12} />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setResult(null)} className="mt-3 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--paper)]">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- pieces ---- */

function FirmPicker({ open, onToggle, firms, exclude, allowUnassign, onPick, label, busy }) {
  const options = firms.filter((f) => f.number !== exclude);
  return (
    <span className="relative flex-none">
      <button onClick={onToggle} disabled={busy} className={`px-3 py-1.5 text-[9px] font-semibold tracking-[0.1em] ${GHOST}`}>
        {label}
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={onToggle} />
          <div className="absolute right-0 z-40 mt-1 min-w-[160px] rounded-[3px] border border-[var(--steel-soft)] bg-[var(--graphite-high)] py-1 shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_30px_-12px_rgba(0,0,0,0.8)]">
            <p className={`px-3 py-1 ${MONO} text-[8px] uppercase tracking-[0.14em] text-[var(--muted-dim)]`}>Move to</p>
            {options.length === 0 && !allowUnassign ? (
              <p className="px-3 py-1.5 text-sm text-[var(--muted)]">No other firms</p>
            ) : (
              <>
                {options.map((f) => (
                  <button
                    key={f.number}
                    onClick={() => onPick(f.number, f.label)}
                    className="block w-full px-3 py-1.5 text-left text-sm text-[var(--paper)] transition hover:bg-[var(--graphite-raised)] hover:text-[var(--amber)]"
                  >
                    {f.label}
                  </button>
                ))}
                {allowUnassign && (
                  <button
                    onClick={() => onPick(0, "")}
                    className="block w-full border-t border-[var(--steel-line)] px-3 py-1.5 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--graphite-raised)] hover:text-[var(--paper)]"
                  >
                    Unassign
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </span>
  );
}

function StepCard({ n, title, subtitle, meta, done, open, onToggle, children }) {
  return (
    <div className={PANEL}>
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-4 rounded-t-[3px] px-6 py-4 text-left transition ${
          open ? "bg-[rgba(232,161,60,0.04)]" : ""
        } hover:bg-[var(--graphite-high)]`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-[2px] border ${DISPLAY} text-[16px] font-bold ${
              done
                ? "border-[#3f5e46] bg-[var(--graphite)] text-[var(--ok)]"
                : "border-[var(--amber-deep)] bg-[var(--amber)] text-[var(--graphite)]"
            }`}
          >
            {done ? <IconCheck size={17} /> : n}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>{title}</h3>
              {done && <Pill tone="good">Complete</Pill>}
            </div>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-4">
          {meta}
          <span className={`${MONO} text-[11px] text-[var(--muted-dim)]`}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && <div className="border-t border-[var(--steel-line)] px-6 py-5">{children}</div>}
    </div>
  );
}

function MiniStat({ label, value, bar }) {
  return (
    <div
      className="rounded-[3px] border border-[var(--steel-line)] bg-[var(--graphite-raised)] p-4 shadow-[0_1px_0_rgba(0,0,0,0.4)]"
      style={{ borderLeftWidth: 3, borderLeftColor: bar }}
    >
      <div className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim)]`}>{label}</div>
      <div className={`mt-1.5 ${DISPLAY} text-[1.7rem] font-bold leading-none`}>{value}</div>
    </div>
  );
}

function Check({ ok, title, detail }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[2px] ${
          ok ? "border border-[#3f5e46] bg-[var(--graphite-raised)] text-[var(--ok)]" : "border-[1.5px] border-[var(--steel-soft)] bg-transparent"
        }`}
      >
        {ok && <IconCheck size={14} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--paper)]">{title}</p>
        <p className={`mt-0.5 text-xs ${ok ? "text-[var(--ok)]" : "text-[var(--muted)]"}`}>{detail}</p>
      </div>
    </div>
  );
}