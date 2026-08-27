"use client";

import { Receipt } from "@/types";
import { T, MONO, TEAR_TOP, TEAR_BOTTOM, TEAR_HEIGHT, fmtMoney } from "./theme";

export type ViewMode = "date" | "store" | "category";

interface Props {
  receipts: Receipt[];
  mode: ViewMode;
  onSelect: (r: Receipt) => void;
}

interface Row {
  receipt: Receipt;
  lead: string;
  main: string;
  trail?: string;
}

interface Group {
  key: string;
  label: string;
  meta?: string;
  rows: Row[];
  subtotal: number;
  /** Column width for the row's leading cell — dates need more room than day numbers. */
  leadWidth: number;
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}

function monthLabel(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-AU", { month: "long", year: "numeric" })
    .toUpperCase();
}

function dayNum(iso: string) {
  return String(new Date(iso).getDate());
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function buildGroups(receipts: Receipt[], mode: ViewMode): Group[] {
  const map = new Map<string, Group>();

  for (const r of receipts) {
    let key: string;
    let label: string;
    let row: Row;
    let leadWidth: number;

    if (mode === "date") {
      key = monthKey(r.date);
      label = monthLabel(r.date);
      leadWidth = 40;
      row = { receipt: r, lead: dayNum(r.date), main: r.storeName, trail: r.category };
    } else if (mode === "store") {
      key = r.storeName;
      label = r.storeName.toUpperCase();
      leadWidth = 70;
      row = { receipt: r, lead: shortDate(r.date), main: r.category };
    } else {
      key = r.category;
      label = r.category.toUpperCase();
      leadWidth = 70;
      row = { receipt: r, lead: shortDate(r.date), main: r.storeName };
    }

    let g = map.get(key);
    if (!g) {
      g = { key, label, rows: [], subtotal: 0, leadWidth };
      map.set(key, g);
    }
    g.rows.push(row);
    g.subtotal += r.totalAmount;
  }

  const groups = [...map.values()];
  for (const g of groups) {
    if (mode !== "date") {
      g.meta = `${g.rows.length} receipt${g.rows.length === 1 ? "" : "s"}`;
    }
  }

  // Date view keeps the incoming sort order (newest month first); the grouped
  // views lead with wherever the most money went.
  if (mode !== "date") groups.sort((a, b) => b.subtotal - a.subtotal);
  return groups;
}

export default function LedgerView({ receipts, mode, onSelect }: Props) {
  const groups = buildGroups(receipts, mode);

  if (groups.length === 0) {
    return (
      <Paper>
        <div style={{ textAlign: "center", padding: "44px 0", color: T.soft }}>
          <div style={{ fontSize: 13, letterSpacing: "0.08em" }}>NO RECEIPTS FOUND</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 8 }}>
            Try adjusting your search or filters
          </div>
        </div>
      </Paper>
    );
  }

  return (
    <Paper>
      {groups.map((g) => (
        <div key={g.key}>
          {mode === "date" ? (
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: T.muted,
                margin: "22px 0 6px",
              }}
            >
              {g.label}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                margin: "22px 0 6px",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: T.body,
                }}
              >
                {g.label}
              </span>
              <span style={{ fontSize: 11, color: T.soft, whiteSpace: "nowrap" }}>{g.meta}</span>
            </div>
          )}

          {g.rows.map((row) => (
            <div
              key={row.receipt.id}
              className="ledger-row"
              onClick={() => onSelect(row.receipt)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(row.receipt);
                }
              }}
              style={{
                display: "grid",
                gridTemplateColumns: `${g.leadWidth}px 1fr auto`,
                alignItems: "baseline",
                gap: 14,
                padding: "11px 0",
                borderBottom: "1px dotted rgba(0,0,0,0.16)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13, color: T.soft }}>{row.lead}</span>
              <span
                style={{
                  fontSize: 14,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.main}
                {row.trail && (
                  <span style={{ color: T.faint, fontSize: 12 }}> — {row.trail}</span>
                )}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.text,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                }}
              >
                {fmtMoney(row.receipt.totalAmount)}
              </span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "8px 0 4px",
              fontSize: 12,
              color: T.muted,
            }}
          >
            <span>{mode === "date" ? "Subtotal" : "Total"}</span>
            <span style={{ fontWeight: 700 }}>{fmtMoney(g.subtotal)}</span>
          </div>
        </div>
      ))}
    </Paper>
  );
}

/** White paper block with torn zigzag edges top and bottom. */
function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ height: TEAR_HEIGHT, background: T.paper, clipPath: TEAR_TOP }} />
      <div style={{ background: T.paper, padding: "6px 28px 4px", fontFamily: MONO }}>
        {children}
      </div>
      <div style={{ height: TEAR_HEIGHT, background: T.paper, clipPath: TEAR_BOTTOM }} />
    </div>
  );
}
