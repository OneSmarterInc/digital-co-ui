// Inline icon set. All 24x24, 1.8 stroke, currentColor. Import the ones you need.

function Svg({ size = 18, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {children}
    </svg>
  );
}

export function IconBack(p) {
  return (
    <Svg {...p}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}
export function IconPlay(p) {
  return (
    <Svg {...p}>
      <path d="M6 4l14 8-14 8z" />
    </Svg>
  );
}
export function IconSend(p) {
  return (
    <Svg {...p}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </Svg>
  );
}
export function IconUpload(p) {
  return (
    <Svg {...p}>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </Svg>
  );
}
export function IconDownload(p) {
  return (
    <Svg {...p}>
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </Svg>
  );
}
export function IconLink(p) {
  return (
    <Svg {...p}>
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </Svg>
  );
}
export function IconChart(p) {
  return (
    <Svg {...p}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </Svg>
  );
}
export function IconGrid(p) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  );
}
export function IconArrow(p) {
  return (
    <Svg {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}
export function IconExternal(p) {
  return (
    <Svg {...p}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}
export function IconKey(p) {
  return (
    <Svg {...p}>
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="M10 13l9-9" />
      <path d="M16 7l3 3" />
    </Svg>
  );
}
export function IconUsers(p) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 3.5a4 4 0 0 1 0 7" />
      <path d="M22 21a7 7 0 0 0-5-6.7" />
    </Svg>
  );
}
export function IconCard(p) {
  return (
    <Svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </Svg>
  );
}
export function IconAlert(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="16" x2="12" y2="16" />
    </Svg>
  );
}
export function IconClipboard(p) {
  return (
    <Svg {...p}>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}
export function IconFlag(p) {
  return (
    <Svg {...p}>
      <path d="M4 21V4" />
      <path d="M4 4h13l-1.5 4L17 12H4" />
    </Svg>
  );
}
export function IconTrendUp(p) {
  return (
    <Svg {...p}>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M17 8h4v4" />
    </Svg>
  );
}
export function IconClock(p) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}
export function IconCheck(p) {
  return (
    <Svg {...p}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}
