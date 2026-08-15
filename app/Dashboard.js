"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, logout } from "../lib/api";

// Wraps a role dashboard: fetches the signed-in user, redirects to /login if
// there's no valid session, and draws the header. `children` is a function
// that receives the user object once loaded.
export default function Dashboard({ role, children }) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((user) => {
        if (!active) return;
        setMe(user);
        setPhase("ready");
      })
      .catch(() => {
        if (!active) return;
        setPhase("redirect");
        router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  function signOut() {
    logout();
    router.replace("/login");
  }

  if (phase !== "ready" || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-[0.8rem] uppercase tracking-[0.16em] text-muted">
          {phase === "redirect" ? "Redirecting\u2026" : "Loading\u2026"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between border-b border-line px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 font-mono text-[0.95rem] tracking-[0.02em]">
            <span className="h-2 w-2 rounded-full bg-go shadow-[0_0_0_3px_rgba(26,128,79,0.18)]" aria-hidden="true" />
            Flexee
          </a>
          <span className="rounded-full border border-line bg-panel2 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[0.72rem] text-muted">{me.username}</span>
          <button
            onClick={signOut}
            className="rounded-sm border border-line px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-linestrong hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-12">{children(me)}</main>
    </div>
  );
}