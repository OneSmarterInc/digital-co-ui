"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runAction, jsonPost } from "../_lib/actions";
import { api } from "../_lib/api";
import { ViewHeader, MiniInfo, EmptyState, Th } from "./ui";
import { IconSend, IconUpload, IconDownload, IconLink } from "./icons";
import { BulkResultModal } from "./modals";

/* Invitees view — dark console theme, var(--token, #fallback) throughout.
 * Everything invitation-shaped lives here: single email invites, bulk file
 * uploads, the self-registration link, and the full invitations list with
 * statuses. Enrolled students have their own Students section.
 *
 * Status language: blueprint = pending (open, in flight), ok green =
 * accepted (done), muted = expired. Primary actions are amber commits,
 * matching EnrollmentView. All handlers unchanged. */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";
const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const COMMIT = `flex items-center gap-2 rounded-[2px] bg-[var(--amber,#E8A13C)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50`;
const GHOST_SM = `rounded-[2px] border border-[var(--steel-line,#2C323A)] px-3 py-1.5 ${MONO} text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--paper,#ECEFF2)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)] disabled:opacity-50`;
const INPUT =
  "rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-[var(--paper,#ECEFF2)] outline-none transition duration-150 placeholder:text-[var(--muted-dim,#5C6672)] focus:border-[var(--blueprint,#5BA3C4)] focus:bg-[var(--graphite-high,#252B32)]";

const STATUS_TONE = {
  PENDING: "var(--blueprint, #5BA3C4)",
  ACCEPTED: "var(--ok, #7FB08A)",
  EXPIRED: "var(--muted, #8A94A0)",
};

function StatusPill({ status }) {
  const tone = STATUS_TONE[status] || "var(--muted, #8A94A0)";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 ${MONO} text-[9px] uppercase tracking-[0.08em]`}
      style={{
        color: tone,
        borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`,
        background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {status?.toLowerCase() || "unknown"}
    </span>
  );
}

export default function InviteesView({ gameId, detail, reload, notify }) {
  const [invites, setInvites] = useState([]);
  const [invitesLoaded, setInvitesLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [regUrl, setRegUrl] = useState(detail.registration_url ?? null);
  const [copied, setCopied] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadInvites = useCallback(async () => {
    try {
      const r = await api(`/instructor/simulations/${gameId}/invitations/`);
      if (r.ok) setInvites(await r.json());
    } catch {
      /* list is best-effort; actions still work */
    } finally {
      setInvitesLoaded(true);
    }
  }, [gameId]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const refreshAll = useCallback(async () => {
    await Promise.all([reload(), loadInvites()]);
  }, [reload, loadInvites]);

  const pending = invites.filter((i) => i.status === "PENDING").length;
  const accepted = invites.filter((i) => i.status === "ACCEPTED").length;
  const expired = invites.filter((i) => i.status === "EXPIRED").length;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invites
      .filter((i) => (statusFilter === "all" || i.status === statusFilter) && (!needle || i.email.toLowerCase().includes(needle)))
      .slice()
      .sort((a, b) => String(a.email).localeCompare(String(b.email)));
  }, [invites, q, statusFilter]);

  const doInvite = async (email, label = "Invite sent") => {
    const value = (email ?? inviteEmail).trim();
    if (!value) return;
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/invite/`,
      opts: jsonPost({ email: value }),
      label,
      reload: refreshAll,
      notify,
      after: () => setInviteEmail(""),
    });
    setBusy(false);
  };

  async function doBulkInvite() {
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
      await refreshAll();
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

  // Separate from `copied` above, which tracks the cohort-wide registration
  // link. This one holds the id of the invitation whose link was just copied,
  // so the confirmation appears on that row only.
  const [copiedInvite, setCopiedInvite] = useState(null);

  async function copyInviteLink(inv) {
    try {
      await navigator.clipboard.writeText(inv.url);
    } catch {
      // Clipboard access is refused without https or a user gesture in some
      // browsers. A prompt still gets the link into the instructor's hands,
      // which is the point.
      window.prompt("Copy this invitation link:", inv.url);
      return;
    }
    setCopiedInvite(inv.id);
    setTimeout(() => setCopiedInvite((c) => (c === inv.id ? null : c)), 2000);
  }

  async function doResend(inv) {
    setBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/invitations/${inv.id}/resend/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.detail || `Request failed (${r.status})`);
      await loadInvites();
      notify(`Re-sent to ${inv.email} ✓`);
    } catch (e) {
      notify(`Resend failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  const fmtSent = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  const filtersActive = q.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Invitations"
        title="Invitees"
        subtitle="Invite students one by one, upload a roster, or share a self-registration link — and track where every invitation stands."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniInfo label="Total invites" value={invites.length} sub="sent" />
        <MiniInfo label="Pending" value={pending} sub="awaiting response" />
        <MiniInfo label="Accepted" value={accepted} sub="joined" />
        <MiniInfo label="Expired" value={expired} sub="lapsed" />
      </div>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${PANEL}`}>
        <span className={`flex flex-none items-center gap-2 ${DISPLAY} text-[17px] font-semibold`}>
          <IconSend size={16} /> Invite student
        </span>
        <input
          className={`h-10 min-w-[220px] flex-1 px-3.5 text-[0.9rem] ${INPUT}`}
          placeholder="student@university.edu"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doInvite()}
        />
        <button onClick={() => doInvite()} disabled={busy || !inviteEmail.trim()} className={COMMIT}>
          <IconSend size={14} /> Send invite
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`p-6 ${PANEL}`}>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[2px] border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] text-[var(--amber,#E8A13C)]">
              <IconUpload size={18} />
            </span>
            <div>
              <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Bulk invite</h3>
              <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">Upload .xlsx, .xls, or .csv to invite many students at once.</p>
            </div>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[2px] border border-dashed border-[var(--steel-soft,#363E48)] px-4 py-3.5 text-sm text-[var(--muted,#8A94A0)] transition hover:border-[var(--amber-deep,#C4791F)] hover:text-[var(--paper,#ECEFF2)]"
          >
            <IconUpload size={15} /> {file?.name ?? "Choose a file…"}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-medium text-[var(--blueprint,#5BA3C4)] transition hover:text-[var(--paper,#ECEFF2)]"
            >
              <IconDownload size={14} /> Download template
            </button>
            <button onClick={doBulkInvite} disabled={!file || busy} className={COMMIT}>
              <IconSend size={14} /> {busy ? "Sending…" : "Send bulk invites"}
            </button>
          </div>
        </div>

        <div className={`p-6 ${PANEL}`}>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[2px] border border-[#3f5e46] bg-[var(--graphite,#16191D)] text-[var(--ok,#7FB08A)]">
              <IconLink size={18} />
            </span>
            <div>
              <h3 className={`${DISPLAY} text-[18px] font-semibold leading-tight`}>Registration link</h3>
              <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">Share this URL; students self-register and join the sim directly.</p>
            </div>
          </div>
          <div
            className={`mt-4 rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] text-sm text-[var(--muted,#8A94A0)] ${
              regUrl ? "py-2 pl-3.5 pr-2" : "p-3.5"
            }`}
          >
            {regUrl ? (
              <div className="flex items-center gap-2">
                <span className={`flex-1 truncate ${MONO} text-[11px] text-[var(--blueprint,#5BA3C4)]`}>{regUrl}</span>
                <button onClick={copyLink} className={`flex-none px-2.5 py-1 ${GHOST_SM}`}>
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
                className="text-sm font-medium text-[var(--muted,#8A94A0)] transition hover:text-[var(--signal-red,#D2564B)] disabled:opacity-50"
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
      </div>

      {/* invitations list */}
      <div className={`overflow-hidden ${PANEL}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className={`${DISPLAY} text-[19px] font-semibold leading-tight`}>All invitations</h2>
            <p className="mt-1 text-sm text-[var(--muted,#8A94A0)]">
              {invites.length} invited · resending is safe — it sends the same link again.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className={`h-9 w-[200px] px-3 text-[0.85rem] ${INPUT}`}
              placeholder="Search email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search invitations"
            />
            <select
              className={`h-9 px-2.5 text-[0.8rem] [color-scheme:dark] ${INPUT}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EXPIRED">Expired</option>
            </select>
            {filtersActive && (
              <button
                onClick={() => {
                  setQ("");
                  setStatusFilter("all");
                }}
                className={`${MONO} text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)] transition hover:text-[var(--paper,#ECEFF2)]`}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!invitesLoaded ? (
          <div className={`border-t border-[var(--steel-line,#2C323A)] px-6 py-10 text-center ${MONO} text-[11px] uppercase tracking-[0.12em] text-[var(--muted-dim,#5C6672)]`}>
            Loading invitations…
          </div>
        ) : invites.length === 0 ? (
          <div className="border-t border-[var(--steel-line,#2C323A)]">
            <EmptyState
              icon={<IconSend size={22} />}
              title="No invitations yet"
              message="Send the first one above, upload a roster, or share the registration link."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-t border-[var(--steel-line,#2C323A)] px-6 py-10 text-center text-sm text-[var(--muted,#8A94A0)]">
            No invitations match the current search and filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-y border-[var(--steel-line,#2C323A)]">
                  <Th className="pl-6">Email</Th>
                  <Th>Status</Th>
                  <Th>Delivery</Th>
                  <Th className="pr-6 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[var(--steel-line,#2C323A)] transition last:border-b-0 hover:bg-[var(--graphite-high,#252B32)]"
                  >
                    <td className="py-3 pl-6 pr-3">
                      <span className={`${MONO} text-[0.78rem] text-[var(--paper,#ECEFF2)]`}>{inv.email}</span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={inv.status} />
                    </td>
                    {/* Being on the list is not the same as having received it. */}
                    <td className="px-3 py-3">
                      {inv.send_error ? (
                        <span className={`${MONO} text-[0.72rem] text-[var(--signal-red,#D2564B)]`} title={inv.send_error}>
                          not delivered
                        </span>
                      ) : inv.sent_at ? (
                        <span className={`${MONO} text-[0.72rem] text-[var(--muted-dim,#5C6672)]`}>
                          sent {fmtSent(inv.sent_at)}
                        </span>
                      ) : (
                        <span className={`${MONO} text-[0.72rem] text-[var(--muted-dim,#5C6672)]`}>not sent</span>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right">
                      {/* The same link that was emailed. Useful for checking a
                          link actually works, and for handing it over by
                          another route when mail fails or lands in spam. */}
                      {inv.url && (
                        <button
                          onClick={() => copyInviteLink(inv)}
                          className={`${GHOST_SM} mr-2`}
                          title={inv.url}
                        >
                          {copiedInvite === inv.id ? "Copied ✓" : "Copy link"}
                        </button>
                      )}
                      {inv.status !== "ACCEPTED" && (
                        <button onClick={() => doResend(inv)} disabled={busy} className={GHOST_SM}>
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bulkResult && <BulkResultModal result={bulkResult} onClose={() => setBulkResult(null)} />}
    </div>
  );
}