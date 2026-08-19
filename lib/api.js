// Talks to the Django JWT API. The base can be overridden with
// NEXT_PUBLIC_API_URL; it defaults to the local dev backend.
//
// Exported: the invite and registration pages call the API before a token
// exists, so they cannot go through api() and need the base directly. It was
// module-private, so `import { API_BASE }` silently gave undefined and every
// request went to `undefined/...`, which the browser resolved against the
// current origin and the app answered with its own 404.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

// Same host without the /api suffix, for links out to the Django admin panel.
export const API_HOST = API_BASE.replace(/\/api\/?$/, "");

const ACCESS_KEY = "flexee_access";
const REFRESH_KEY = "flexee_refresh";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = new Error("login_failed");
    err.status = res.status;
    throw err;
  }
  const { access, refresh } = await res.json();
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  return access;
}

export async function api(path, options = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export async function fetchMe() {
  const res = await api("/me/");
  if (!res.ok) {
    const err = new Error("me_failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Whether an account is allowed into a given portal. A superuser can use both
// the admin and instructor portals; a plain instructor only the instructor one.
export function canAccess(me, role) {
  if (role === "admin") return Boolean(me.is_staff || me.is_superuser);
  if (role === "instructor") return Boolean(me.is_instructor);
  return me.role === "STUDENT";
}