import { ProductCategory } from "@/types";

// --- Palette ------------------------------------------------------------------
// Two surfaces: the desk (page background) and the paper receipts sit on. Ink
// tones are warm-neutral so they read as printed rather than rendered.
export const T = {
  accent: "#3b6fd6",
  accentHover: "#2c58ad",
  accentWash: "oklch(96% 0.01 255)",
  desk: "oklch(89.5% 0.014 76)",
  paper: "oklch(99.4% 0.003 88)",
  ink: "oklch(18% 0.01 90)",
  text: "oklch(20% 0.01 90)",
  body: "oklch(25% 0.01 90)",
  label: "oklch(35% 0.01 90)",
  muted: "oklch(45% 0.01 90)",
  soft: "oklch(52% 0.01 90)",
  faint: "oklch(58% 0.01 90)",
  rule: "oklch(72% 0.008 90)",
  line: "oklch(80% 0.008 90)",
  border: "oklch(84% 0.008 90)",
  hover: "oklch(96% 0.012 78)",
} as const;

export const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
export const SANS = "'Inter', system-ui, sans-serif";

// --- Category pills -----------------------------------------------------------
// The handoff specified five; the remaining app categories follow the same
// lightness/chroma recipe on distinct hues so the set reads as one system.
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  "Groceries": { bg: "oklch(93% 0.05 145)", text: "oklch(32% 0.09 145)" },
  "Food & Dining": { bg: "oklch(93% 0.06 55)", text: "oklch(38% 0.12 45)" },
  "Electronics": { bg: "oklch(93% 0.04 280)", text: "oklch(38% 0.11 280)" },
  "Health & Pharmacy": { bg: "oklch(93% 0.05 20)", text: "oklch(40% 0.12 20)" },
  "Home & Garden": { bg: "oklch(93% 0.045 190)", text: "oklch(34% 0.08 190)" },
  "Clothing & Apparel": { bg: "oklch(93% 0.05 330)", text: "oklch(38% 0.11 330)" },
  "Transportation": { bg: "oklch(93% 0.05 240)", text: "oklch(38% 0.11 240)" },
  "Entertainment": { bg: "oklch(93% 0.05 305)", text: "oklch(38% 0.11 305)" },
  "Services": { bg: "oklch(93% 0.04 215)", text: "oklch(36% 0.09 215)" },
};

export function catStyle(cat: ProductCategory | string) {
  return CATEGORY_STYLES[cat] ?? { bg: "oklch(93% 0.01 90)", text: "oklch(38% 0.01 90)" };
}

// --- Torn paper edges ---------------------------------------------------------
// Paper does not tear in a sawtooth. These edges jitter both the spacing and
// the depth of every tooth so no two are alike, while still alternating between
// a shallow and a deep band so the result reads as a tear rather than as noise.
// The jitter is seeded, so an edge is stable across renders.

/** Deterministic float in [0, 1). */
function rng(seed: string) {
  let h = hashOf(seed);
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Ragged horizontal edge as clip-path points, walked left to right.
 * `depthAt` maps a 0..1 raggedness value to a CSS y-coordinate, which lets the
 * same generator drive both percentage-depth strips and pixel-depth sheets.
 */
function tornPoints(seed: string, teeth: number, depthAt: (t: number) => string): string[] {
  const rand = rng(seed);
  const step = 100 / teeth;
  const pts: string[] = [];

  for (let i = 0; i <= teeth; i++) {
    // Ends stay pinned so the edge meets the sides of the sheet cleanly.
    const jitter = i === 0 || i === teeth ? 0 : (rand() - 0.5) * step * 0.8;
    const x = clamp(i * step + jitter, 0, 100);
    // Alternating shallow/deep bands, each roughened by a third of its range.
    const deep = i % 2 === 1;
    const t = deep ? 0.62 + rand() * 0.38 : rand() * 0.34;
    pts.push(`${x.toFixed(2)}% ${depthAt(t)}`);
  }
  return pts;
}

export const TEAR_HEIGHT = 13;

/** Top strip: solid below, ragged along its upper boundary. */
export const TEAR_TOP = `polygon(${[
  ...tornPoints("tear-top", 30, (t) => `${(t * 100).toFixed(1)}%`),
  "100% 100%",
  "0% 100%",
].join(", ")})`;

/** Bottom strip: solid above, ragged along its lower boundary. */
export const TEAR_BOTTOM = `polygon(${[
  "0% 0%",
  "100% 0%",
  ...tornPoints("tear-bottom", 30, (t) => `${(100 - t * 100).toFixed(1)}%`).reverse(),
].join(", ")})`;

/**
 * Receipt-slip body: square top, torn bottom edge.
 *
 * Tooth depth is in px, not %, because a receipt's height varies with its item
 * count. A percentage depth turns into a 40px sawtooth on a long receipt and a
 * nick on a short one; only the horizontal spacing should scale.
 */
export const RECEIPT_CLIP = `polygon(${[
  "0% 0%",
  "100% 0%",
  ...tornPoints("receipt-tear", 30, (t) => `calc(100% - ${(t * 13).toFixed(1)}px)`).reverse(),
].join(", ")})`;

// --- Printed detail -----------------------------------------------------------
// Order numbers, auth codes, card tails and barcodes are all fabricated, but a
// receipt whose serial changes on every render stops reading as a document,
// so each is derived deterministically from the receipt id.

function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Cheap deterministic PRNG so one id can seed several independent fields. */
function seeded(seed: string, salt: string) {
  let h = hashOf(seed + "|" + salt);
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h;
  };
}

function digits(seed: string, salt: string, n: number): string {
  const next = seeded(seed, salt);
  let out = "";
  for (let i = 0; i < n; i++) out += next() % 10;
  return out;
}

/** A number in [1, max], zero-padded to two digits. */
function smallNo(seed: string, salt: string, max: number): string {
  return String((hashOf(seed + "|" + salt) % max) + 1).padStart(2, "0");
}

export const orderNo = (id: string) => "#" + digits(id, "order", 4);
export const authCode = (id: string) => digits(id, "auth", 6);
export const cardTail = (id: string) => digits(id, "card", 4);
export const terminalNo = (id: string) => smallNo(id, "term", 24);
export const lane = (id: string) => smallNo(id, "lane", 12);

/** Bar widths in px, alternating bar/space. Purely decorative, not scannable. */
export function barPattern(seed: string, count = 58): number[] {
  const next = seeded(seed, "bars");
  return Array.from({ length: count }, () => 1 + (next() % 3));
}

// --- Controls -----------------------------------------------------------------
// Nothing here is a rounded UI chip: controls are stamped boxes with square
// corners and a single-weight rule, so they belong on the same stock as
// everything else. Borders stay longhand, React warns when a shorthand and a
// longhand for the same property alternate across rerenders, which the
// active/inactive toggles would otherwise do.

const pillBase: React.CSSProperties = {
  borderRadius: 0,
  padding: "6px 12px",
  fontSize: 12,
  fontFamily: MONO,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
  borderWidth: 1,
  borderStyle: "solid",
  transition: "all 0.15s ease",
};

export function pill(active: boolean): React.CSSProperties {
  return active
    ? { ...pillBase, background: T.ink, color: T.paper, borderColor: T.ink, fontWeight: 700 }
    : { ...pillBase, background: "transparent", color: T.muted, borderColor: T.line };
}

const segBase: React.CSSProperties = {
  borderRadius: 0,
  padding: "9px 14px",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: MONO,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
  borderWidth: 1,
  borderStyle: "solid",
  flex: 1,
  transition: "all 0.15s ease",
};

export function seg(active: boolean): React.CSSProperties {
  return active
    ? { ...segBase, background: T.ink, color: T.paper, borderColor: T.ink }
    : { ...segBase, background: "transparent", color: T.label, borderColor: T.line };
}

export const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${T.line}`,
  borderRadius: 0,
  padding: "9px 11px",
  fontSize: 13,
  fontFamily: MONO,
  outline: "none",
  background: "transparent",
  color: T.text,
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: MONO,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: T.label,
  marginBottom: 6,
};

export function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Amounts inside a printed column drop the sign, the column header carries it. */
export function fmtAmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Australian prices are GST-inclusive, so the tax is backed out of the total. */
export function gstOf(total: number) {
  const ex = total / 1.1;
  return { ex, gst: total - ex };
}
