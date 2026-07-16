"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtMoney, billingOf } from "../_lib/helpers";
import { runAction, jsonPost } from "../_lib/actions";
import { api } from "../_lib/api";
import { ViewHeader, FillBar, BillingBar, Legend } from "./ui";
import { IconSend, IconUpload, IconDownload, IconLink } from "./icons";
import { BulkResultModal } from "./modals";

/* Enrollment view — dark console theme. Colors are written as
 * var(--token, #fallback) so the view renders correctly inside the themed
 * shell and standalone. Console vocabulary: amber = primary action
 * (Send invite, bulk send, generate link), ok-green = money received /
 * live things, blueprint = links and pending, steel = structure.
 * All handlers, uploads, and clipboard logic unchanged.
 */

const MONO = "font-['IBM_Plex_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Saira_Condensed',sans-serif]";

const PANEL =
  "rounded-[3px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite-raised,#1E2228)] shadow-[0_1px_0_rgba(0,0,0,0.4),0_8px_24px_-12px_rgba(0,0,0,0.6)]";
const COMMIT = `flex items-center gap-2 rounded-[2px] bg-[var(--amber,#E8A13C)] px-4 py-2 ${DISPLAY} text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--graphite,#16191D)] transition duration-150 hover:bg-[#F0B052] disabled:opacity-50`;
const GHOST = `rounded-[2px] border border-[var(--steel-line,#2C323A)] px-4 py-2 ${MONO} text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted,#8A94A0)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)] hover:text-[var(--paper,#ECEFF2)]`;

export default function EnrollmentView({ gameId, detail, reload, notify }) {
  const router = useRouter();
  const capacity = detail.enrollment_capacity ?? 0;
  const enrolled = (detail.students ?? []).length;
  const billing = billingOf(detail);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [regUrl, setRegUrl] = useState(detail.registration_url ?? null);
  const [regBusy, setRegBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const doInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setBusy(true);
    await runAction({
      path: `/instructor/simulations/${gameId}/invite/`,
      opts: jsonPost({ email }),
      label: "Invite sent",
      reload,
      notify,
      after: () => setInviteEmail(""),
    });
    setBusy(false);
  };

  async function doBulkInvite() {
    if (!file) return;
    setBulkBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api(`/instructor/simulations/${gameId}/bulk-invite/`, { method: "POST", body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || `Request failed (${r.status})`);
      }
      const res = await r.json();
      setBulkResult(res);
      await reload();
      const s = res.summary ?? {};
      notify(
        `Invited ${s.invited ?? 0}` +
          (s.skipped ? `, skipped ${s.skipped}` : "") +
          (s.errors ? `, ${s.errors} error${s.errors === 1 ? "" : "s"}` : "") +
          " ✓"
      );
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      notify(`Bulk invite failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBulkBusy(false);
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
    setRegBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/registration-link/`, jsonPost({ regenerate: !!regenerate }));
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const j = await r.json();
      setRegUrl(j.url ?? null);
      notify(regenerate ? "Link regenerated ✓" : "Link generated ✓");
    } catch (e) {
      notify(`Generate failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRegBusy(false);
    }
  }
  async function doDisableLink() {
    setRegBusy(true);
    try {
      const r = await api(`/instructor/simulations/${gameId}/registration-link/`, { method: "DELETE" });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      setRegUrl(null);
      notify("Link disabled ✓");
    } catch (e) {
      notify(`Disable failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRegBusy(false);
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

  const pct = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
  const seatsOpen = Math.max(0, capacity - enrolled);

  return (
    <div className="space-y-7 text-[var(--paper,#ECEFF2)]">
      <ViewHeader
        eyebrow="Students"
        title="Enrollment"
        subtitle="Invite students, upload a roster, or share a self-registration link, and keep an eye on billing as they join."
      />

      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <div className={`p-5 ${PANEL}`}>
          <div className="flex items-center justify-between">
            <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Enrollment</p>
            <span className={`rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-0.5 ${MONO} text-[8.5px] uppercase tracking-[0.1em] text-[var(--muted,#8A94A0)]`}>
              {pct}% full
            </span>
          </div>
          <p className={`mt-1.5 ${DISPLAY} text-[2rem] font-bold leading-none`}>
            {enrolled}
            <span className="text-[var(--muted-dim,#5C6672)]"> / {capacity}</span>
          </p>
          <div className="mt-3.5">
            <FillBar value={enrolled} total={capacity} />
          </div>
          <p className={`mt-2 ${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
            {seatsOpen} seat{seatsOpen === 1 ? "" : "s"} open
          </p>
        </div>

        <div className={`p-5 ${PANEL}`}>
          <p className={`${MONO} text-[9px] uppercase tracking-[0.16em] text-[var(--muted-dim,#5C6672)]`}>Billing</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className={`${DISPLAY} text-[2rem] font-bold leading-none text-[var(--ok,#7FB08A)]`}>{fmtMoney(billing.received)}</p>
            <p className={`${MONO} text-[8.5px] uppercase tracking-[0.08em] text-[var(--muted-dim,#5C6672)]`}>
              of {fmtMoney(billing.total_billed)} billed
            </p>
          </div>
          <div className="mt-3.5">
            <BillingBar received={billing.received} pending={billing.pending} />
          </div>
          <div className="mt-2.5">
            <Legend
              items={[
                ["var(--ok, #7FB08A)", `Received ${fmtMoney(billing.received)}`],
                ["var(--blueprint, #5BA3C4)", `Pending ${fmtMoney(billing.pending)}`],
              ]}
            />
          </div>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${PANEL}`}>
        <span className={`flex flex-none items-center gap-2 ${DISPLAY} text-[17px] font-semibold`}>
          <IconSend size={16} /> Invite student
        </span>
        <input
          className="h-10 min-w-[220px] flex-1 rounded-[2px] border border-[var(--steel-line,#2C323A)] bg-[var(--graphite,#16191D)] px-3.5 text-[0.9rem] text-[var(--paper,#ECEFF2)] outline-none transition duration-150 placeholder:text-[var(--muted-dim,#5C6672)] focus:border-[var(--blueprint,#5BA3C4)] focus:bg-[var(--graphite-high,#252B32)]"
          placeholder="student@university.edu"
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doInvite()}
        />
        <button onClick={doInvite} disabled={busy || !inviteEmail.trim()} className={COMMIT}>
          <IconSend size={14} /> Send invite
        </button>
        <button onClick={() => router.push(`/instructor/${gameId}/invitees`)} className={GHOST}>
          Invitees
        </button>
        <button onClick={() => router.push(`/instructor/${gameId}/students`)} className={GHOST}>
          Students
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
            <button onClick={doBulkInvite} disabled={!file || bulkBusy} className={COMMIT}>
              <IconSend size={14} /> {bulkBusy ? "Sending…" : "Send bulk invites"}
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
                <button
                  onClick={copyLink}
                  className={`flex-none rounded-[2px] border border-[var(--steel-line,#2C323A)] px-2.5 py-1 ${MONO} text-[9px] uppercase tracking-[0.1em] text-[var(--paper,#ECEFF2)] transition hover:border-[var(--steel-soft,#363E48)] hover:bg-[var(--graphite-high,#252B32)]`}
                >
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
                disabled={regBusy}
                className="text-sm font-medium text-[var(--muted,#8A94A0)] transition hover:text-[var(--signal-red,#D2564B)] disabled:opacity-50"
              >
                Disable link
              </button>
            ) : (
              <span />
            )}
            <button onClick={() => doRegLink(!!regUrl)} disabled={regBusy} className={COMMIT}>
              <IconLink size={14} /> {regBusy ? "Working…" : regUrl ? "Regenerate" : "Generate link"}
            </button>
          </div>
        </div>
      </div>

      {bulkResult && <BulkResultModal result={bulkResult} onClose={() => setBulkResult(null)} />}
    </div>
  );
}