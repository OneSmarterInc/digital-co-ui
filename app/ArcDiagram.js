"use client";

import { useEffect, useRef, useState } from "react";

const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);

// Geometry for the viewBox 0 0 1040 210
const LEFT = 112;
const RIGHT = 980;
const STEP = (RIGHT - LEFT) / 13;
const Y_BUDGET = 62;
const Y_OT = 112;
const Y_AXIS = 168;
const x = (week) => LEFT + (week - 1) * STEP;

const BUDGET_LEN = x(14) - x(1);
const OT_GREEN_LEN = x(7) - x(1);
const OT_RED_LEN = x(14) - x(7);

const DRAW = "transition-[stroke-dashoffset] ease-out motion-reduce:transition-none";
const FADE = "transition-opacity duration-500 motion-reduce:transition-none";
const LABEL = "font-mono";

export default function ArcDiagram() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 1040 210"
      role="img"
      aria-label="A sample fourteen-week run. One risk stays under control the whole way. Another turns bad in week seven and is beyond repair by week ten."
      className="mt-1.5 block h-auto w-full"
    >
      {WEEKS.map((w) => (
        <line key={`g${w}`} x1={x(w)} x2={x(w)} y1={Y_BUDGET} y2={Y_AXIS} stroke="rgba(24,35,47,0.07)" strokeWidth="1" />
      ))}

      {/* One risk held under control the whole way. */}
      <text x="10" y={Y_BUDGET + 4} fill="var(--color-muted)" className={LABEL} style={{ fontSize: 11, letterSpacing: "0.14em" }}>
        BUDGET
      </text>
      <line
        x1={x(1)} x2={x(14)} y1={Y_BUDGET} y2={Y_BUDGET}
        stroke="var(--color-go)" strokeWidth="2.5" className={DRAW}
        style={{ strokeDasharray: BUDGET_LEN, strokeDashoffset: on ? 0 : BUDGET_LEN, transitionDuration: "1100ms" }}
      />
      <circle cx={x(1)} cy={Y_BUDGET} r="4" fill="var(--color-go)" className={FADE} style={{ opacity: on ? 1 : 0, transitionDelay: "200ms" }} />
      <circle cx={x(14)} cy={Y_BUDGET} r="4" fill="var(--color-go)" className={FADE} style={{ opacity: on ? 1 : 0, transitionDelay: "1100ms" }} />

      {/* One risk left unattended: manageable, then not, then past saving. */}
      <text x="10" y={Y_OT + 4} fill="var(--color-muted)" className={LABEL} style={{ fontSize: 11, letterSpacing: "0.14em" }}>
        PLANT
      </text>
      <line
        x1={x(1)} x2={x(7)} y1={Y_OT} y2={Y_OT}
        stroke="var(--color-go)" strokeWidth="2.5" className={DRAW}
        style={{ strokeDasharray: OT_GREEN_LEN, strokeDashoffset: on ? 0 : OT_GREEN_LEN, transitionDuration: "650ms" }}
      />
      <line
        x1={x(7)} x2={x(14)} y1={Y_OT} y2={Y_OT}
        stroke="var(--color-alarm)" strokeWidth="2.5" className={DRAW}
        style={{ strokeDasharray: OT_RED_LEN, strokeDashoffset: on ? 0 : OT_RED_LEN, transitionDuration: "650ms", transitionDelay: "650ms" }}
      />
      <circle cx={x(7)} cy={Y_OT} r="5" fill="var(--color-caution)" className={FADE} style={{ opacity: on ? 1 : 0, transitionDelay: "700ms" }} />
      <circle
        cx={x(10)} cy={Y_OT} r="5.5" fill="var(--color-alarm)"
        className={`${FADE} ${on ? "motion-safe:animate-flash" : ""}`}
        style={{ opacity: on ? 1 : 0, transitionDelay: "1050ms" }}
      />

      {/* Week axis, ticks fade in in sequence as the arc draws */}
      {WEEKS.map((w) => (
        <g key={`t${w}`} className={FADE} style={{ opacity: on ? 1 : 0, transitionDelay: `${180 + w * 55}ms` }}>
          <line x1={x(w)} x2={x(w)} y1={Y_AXIS - 5} y2={Y_AXIS + 5} stroke="var(--color-linestrong)" strokeWidth="1.5" />
          <text x={x(w)} y={Y_AXIS + 22} textAnchor="middle" fill="var(--color-faint)" className={LABEL} style={{ fontSize: 12, letterSpacing: "0.04em" }}>
            {String(w).padStart(2, "0")}
          </text>
        </g>
      ))}

      {/* Verdict terminus */}
      <line x1={x(14)} x2={x(14)} y1={Y_BUDGET - 16} y2={Y_AXIS + 6} stroke="var(--color-linestrong)" strokeWidth="1" strokeDasharray="3 4" className={FADE} style={{ opacity: on ? 1 : 0, transitionDelay: "1200ms" }} />
      <text x={x(14)} y={Y_BUDGET - 24} textAnchor="middle" fill="var(--color-muted)" className={`${LABEL} ${FADE}`} style={{ fontSize: 11, letterSpacing: "0.16em", opacity: on ? 1 : 0, transitionDelay: "1300ms" }}>
        VERDICT
      </text>
    </svg>
  );
}