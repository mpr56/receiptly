import { ProductCategory } from "@/types";

// ─── Palette ──────────────────────────────────────────────────────────────────
// Values lifted directly from the Claude Design handoff (Receiptly.dc.html).
export const T = {
  accent: "#3b6fd6",
  accentHover: "#2c58ad",
  accentWash: "oklch(96% 0.01 255)",
  paper: "#fff",
  ink: "oklch(18% 0.01 90)",
  text: "oklch(20% 0.01 90)",
  body: "oklch(25% 0.01 90)",
  label: "oklch(35% 0.01 90)",
  muted: "oklch(45% 0.01 90)",
  soft: "oklch(55% 0.01 90)",
  faint: "oklch(60% 0.01 90)",
  rule: "oklch(80% 0.005 90)",
  line: "oklch(85% 0.005 90)",
  border: "oklch(89% 0.005 90)",
  hover: "oklch(97% 0.004 90)",
} as const;

export const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
export const SANS = "'Inter', system-ui, sans-serif";

// ─── Category pills ───────────────────────────────────────────────────────────
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

// ─── Torn paper edges ─────────────────────────────────────────────────────────
// Zigzag clip-paths, generated rather than hand-written so the tooth count can
// change in one place.
function zigzag(teeth: number, startLow: boolean): string {
  const pts: string[] = [];
  const step = 100 / teeth;
  for (let i = 0; i <= teeth; i++) {
    const x = +(i * step).toFixed(2);
    const low = startLow ? i % 2 === 0 : i % 2 === 1;
    pts.push(`${x}% ${low ? 100 : 0}%`);
  }
  return `polygon(${pts.join(", ")})`;
}

export const TEAR_TOP = zigzag(34, true);
export const TEAR_BOTTOM = zigzag(34, false);
export const TEAR_HEIGHT = 13;

/** Receipt-slip body: square top, torn bottom edge. */
export const RECEIPT_CLIP = (() => {
  const pts = ["0% 0%", "100% 0%", "100% 97%"];
  for (let x = 94; x >= 4; x -= 6) {
    pts.push(`${x}% ${x % 12 === 4 ? 97 : 100}%`);
  }
  pts.push("0% 100%");
  return `polygon(${pts.join(", ")})`;
})();

// ─── Control styles ───────────────────────────────────────────────────────────
// Borders are declared longhand throughout: React warns when a shorthand
// (`border`) and a longhand (`borderColor`) for the same value are mixed across
// rerenders, which the active/inactive toggles would otherwise do.
const pillBase: React.CSSProperties = {
  borderRadius: 999,
  padding: "7px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  cursor: "pointer",
  borderWidth: 1,
  borderStyle: "solid",
  transition: "all 0.15s ease",
};

export function pill(active: boolean): React.CSSProperties {
  return active
    ? { ...pillBase, background: T.accent, color: "#fff", borderColor: T.accent }
    : { ...pillBase, background: T.paper, color: T.muted, borderColor: "oklch(90% 0.005 90)" };
}

const segBase: React.CSSProperties = {
  borderRadius: 9,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  borderWidth: 1,
  borderStyle: "solid",
  flex: 1,
  transition: "all 0.15s ease",
};

export function seg(active: boolean): React.CSSProperties {
  return active
    ? { ...segBase, background: T.accent, color: "#fff", borderColor: T.accent }
    : { ...segBase, background: T.paper, color: T.label, borderColor: T.border };
}

export const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  background: T.paper,
  color: T.text,
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: T.label,
  marginBottom: 6,
};

export function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
