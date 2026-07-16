import { api } from "./api";

// Small helper for the common "POST some JSON" request shape.
export const jsonPost = (obj) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj),
});

// Shared action runner: hits the API, reloads, toasts, and reports success.
// Views hand it a path, request options, a label, and the page's reload/notify.
export async function runAction({ path, opts, label, reload, notify, after }) {
  try {
    const r = await api(path, opts);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.detail || `Request failed (${r.status})`);
    }
    await reload();
    after?.();
    notify(`${label} ✓`);
    return true;
  } catch (e) {
    notify(`${label} failed: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}
