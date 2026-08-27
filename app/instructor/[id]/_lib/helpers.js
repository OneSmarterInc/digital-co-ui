// Pure helpers and shared constants for the instructor simulation detail views.
// No React and no API calls here, just formatting and shaping the detail payload.
// The frontend speaks "rounds" and "firms"; the backend maps those to weeks and teams.

export const FIRM_COLORS = ["#3b6ea5", "#1a804f", "#b7791f", "#7c3aed", "#c026d3", "#0891b2"];

export const SCORE_LABELS = {
  strategic_judgment: "Strategic judgment",
  execution_consequence: "Execution consequence",
  coherence: "Coherence",
  deliverable_quality: "Deliverable quality",
};

// The grading list chips. These used to abbreviate ("Judgment", "Deliverable"),
// which gave the same four dimensions different names on different screens —
// use the rubric's names everywhere.
export const SCORE_SHORT = SCORE_LABELS;

export const ANCHOR_OPTIONS = ["strong", "adequate", "weak"];

export function initials(name) {
  const p = String(name || "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function instructorName(i) {
  const full = [i.first_name, i.last_name].filter(Boolean).join(" ");
  return full || i.username || i.email || `#${i.id}`;
}

export function fmtMoney(n) {
  const v = Number(n) || 0;
  return v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : `$${v}`;
}

export function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function deriveRounds(detail) {
  const total = detail.total_rounds || 0;
  const current = detail.current_round || 1;
  const days = detail.days_per_round || 7;
  const base = detail.start_date ? new Date(`${detail.start_date}T00:00:00Z`) : null;
  const rows = [];
  for (let n = 1; n <= total; n++) {
    let start = "—";
    let end = "—";
    if (base) {
      const s = new Date(base);
      s.setUTCDate(s.getUTCDate() + (n - 1) * days);
      const e = new Date(s);
      e.setUTCDate(e.getUTCDate() + days);
      start = fmtDate(s);
      end = fmtDate(e);
    }
    rows.push({ n, start, end, status: n < current ? "Completed" : n === current ? "Active" : "Upcoming", extended_days: 0 });
  }
  return rows;
}

export function closesIn(round) {
  // Takes the round row, not a bare date string. `end_at` carries the cohort's
  // UTC offset; `end` alone was parsed as midnight UTC by every client, which
  // is the previous evening in New York and the same morning in Delhi.
  const row = typeof round === "string" ? { end: round } : round || {};
  const iso = row.end_at || row.end;
  if (!iso || iso === "—") return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  if (end.getTime() - Date.now() <= 0) return "deadline passed";
  try {
    // Rendered in the course's zone and labelled with it, so an instructor
    // abroad reads the deadline their students have. The abbreviation tracks
    // daylight saving on its own — EST in January, EDT in July.
    return `closes ${new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: row.timezone || undefined,
    }).format(end)}`;
  } catch {
    return `closes ${end.toLocaleString()}`;
  }
}

export function statusOf(detail) {
  if (detail.current_round >= detail.total_rounds) return { label: "Completed", tone: "var(--color-muted)" };
  if (detail.deployment_status === "students") return { label: "In progress", tone: "var(--color-go)" };
  if (detail.deployment_status === "faculty") return { label: "Ready", tone: "#3b6ea5" };
  return { label: "Draft", tone: "var(--color-muted)" };
}

export function billingOf(detail) {
  const students = detail.students ?? [];
  const price = detail.billing?.price_per_student ?? detail.price_per_student ?? 0;
  const paid = students.filter((s) => s.paid).length;
  return (
    detail.billing ?? {
      price_per_student: price,
      total_billed: students.length * price,
      received: paid * price,
      pending: (students.length - paid) * price,
      paid_count: paid,
      total_count: students.length,
    }
  );
}

/* Firms with their members, plus an Unassigned bucket.
 *
 * Seeded from detail.firms rather than from the students, so a firm with nobody
 * in it still appears. It used to be built only from students, which meant a
 * newly created firm was invisible until someone was moved into it — and an
 * empty firm, the only kind that can be deleted, could never be seen to delete.
 */
export function groupsOf(detail) {
  const students = detail.students ?? [];
  const map = new Map();

  for (const f of detail.firms ?? []) {
    map.set(f.name, { name: f.name, index: (f.number ?? 1) - 1, members: [] });
  }
  for (const s of students) {
    const key = s.firm ?? "Unassigned";
    if (!map.has(key)) {
      // Unassigned sorts last; it is a holding pen, not a firm.
      map.set(key, { name: key, index: s.firm ? s.firm_index ?? 0 : Number.MAX_SAFE_INTEGER, members: [] });
    }
    map.get(key).members.push(s);
  }

  for (const grp of map.values()) grp.members.sort((a, b) => a.name.localeCompare(b.name));
  return [...map.values()].sort((a, b) => a.index - b.index);
}

// Turn a trap flag (string or object) into something readable in a chip.
export function flagText(f) {
  if (typeof f === "string") return f.replace(/_/g, " ");
  return String(f?.code || f?.name || f?.label || "flag").replace(/_/g, " ");
}
