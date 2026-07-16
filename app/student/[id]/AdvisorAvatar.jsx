"use client";

import { useEffect, useState } from "react";

/* Advisor portraits live in the Next.js public folder at /public/advisor/,
 * named from the advisor's name exactly as shipped:
 *   "Daniel Stern" -> /advisor/Daniel_Stern_eyes_open.png (+ _eyes_closed.png)
 * Keep the filenames untouched — production hosts are case-sensitive. */
const ADVISOR_IMG_DIR = "/advisor";
const fileFor = (name, variant) => `${ADVISOR_IMG_DIR}/${String(name).trim().replace(/\s+/g, "_")}_eyes_${variant}.png`;
const advisorImg = (a, variant = "open") => (a?.name ? fileFor(a.name, variant) : null);

const DISPLAY = "font-['Saira_Condensed',sans-serif]";

/* Portrait with a life sign. Two behaviours:
 *   idle           — occasional natural blink (~140ms) every 3.5–7s
 *   live / talking — continuous open/close loop (open 2–4s, closed ~150ms),
 *                    used for the in-chat portrait so the advisor feels
 *                    present while they're speaking
 *
 * "talking" is accepted as an alias for "live" because that's the string the
 * war room actually passes; anything that wasn't exactly "live" used to fall
 * through to idle, so the speaking portrait never came alive.
 *
 * The root is inline-level but never plain `inline`: an inline <span> ignores
 * width and height, which is how the bench portraits collapsed to a 1px bar.
 * Both branches set their own display, so this renders correctly inside a flex
 * parent, a grid parent, or ordinary flow.
 *
 * Falls back to amber initials on graphite if the advisor has no image, and if
 * an advisor has an _eyes_open.png but no _eyes_closed.png, blinking is turned
 * off for them rather than flashing an empty frame every few seconds. */
function AdvisorAvatar({ advisor, size = 40, mode = "idle", rounded = "rounded-[2px]" }) {
  const [failed, setFailed] = useState(false);
  const [blinkFailed, setBlinkFailed] = useState(false); // no closed frame: hold the eyes open
  const [blink, setBlink] = useState(false);

  const name = advisor?.name ?? "";
  const openSrc = advisorImg(advisor, "open");
  const closedSrc = advisorImg(advisor, "closed");
  const live = mode === "live" || mode === "talking";

  // A new advisor in the same slot starts clean.
  useEffect(() => {
    setFailed(false);
    setBlinkFailed(false);
    setBlink(false);
  }, [name]);

  useEffect(() => {
    if (!name || failed || blinkFailed) return;
    const closed = new Image();
    closed.src = fileFor(name, "closed"); // preload so frame swaps don't flicker
    let timer;
    let cancelled = false;

    if (live) {
      // Natural human cadence: eyes open for a few seconds, a quick ~150ms
      // closure, repeat. Continuous, but at the pace real blinking happens.
      const openPhase = () => {
        setBlink(false);
        timer = setTimeout(() => !cancelled && closedPhase(), 2000 + Math.random() * 2200);
      };
      const closedPhase = () => {
        setBlink(true);
        timer = setTimeout(() => !cancelled && openPhase(), 140 + Math.random() * 40);
      };
      openPhase();
    } else {
      const schedule = () => {
        timer = setTimeout(() => {
          if (cancelled) return;
          setBlink(true);
          setTimeout(() => {
            if (!cancelled) setBlink(false);
            schedule();
          }, 140);
        }, 3500 + Math.random() * 3500);
      };
      schedule();
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Keyed on the name, not the advisor object, so a parent that rebuilds its
    // roster array on every render doesn't keep resetting the blink timers.
  }, [name, failed, blinkFailed, live]);

  if (!openSrc || failed) {
    return (
      <span
        className={`inline-flex flex-none items-center justify-center border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] ${DISPLAY} font-bold leading-none text-[var(--amber,#E8A13C)] ${rounded}`}
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        {(name || "?")
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block flex-none overflow-hidden border border-[var(--steel-soft,#363E48)] bg-[var(--graphite,#16191D)] ${rounded}`}
      style={{ width: size, height: size }}
    >
      {/* Both frames stay mounted; opacity swap avoids any decode flash. */}
      <img
        src={openSrc}
        alt={name}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: blink ? 0 : 1 }}
      />
      {!blinkFailed && (
        <img
          src={closedSrc}
          alt=""
          aria-hidden="true"
          onError={() => {
            // No closed frame for this advisor — stop blinking, and don't leave
            // them mid-blink with nothing showing.
            setBlinkFailed(true);
            setBlink(false);
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: blink ? 1 : 0 }}
        />
      )}
    </span>
  );
}

export default AdvisorAvatar;