"use client";

import { Receipt } from "@/types";
import { T, MONO, fmtMoney, fmtAmt, orderNo } from "./theme";
import { Tape, DashRule, DoubleRule, MetaLine, Barcode } from "./paper";

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
  /** Column width for the row's leading cell, dates need more room than day numbers. */
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
  return String(new Date(iso).getDate()).padStart(2, "0");
}

function shortDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
    .toUpperCase();
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
      leadWidth = 26;
      row = { receipt: r, lead: dayNum(r.date), main: r.storeName, trail: r.category };
    } else if (mode === "store") {
      key = r.storeName;
      label = r.storeName.toUpperCase();
      leadWidth = 60;
      row = { receipt: r, lead: shortDate(r.date), main: r.category };
    } else {
      key = r.category;
      label = r.category.toUpperCase();
      leadWidth = 60;
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
    g.meta = `${g.rows.length} TXN${g.rows.length === 1 ? "" : "S"}`;
  }

  // Date view keeps the incoming sort order (newest month first); the grouped
  // views lead with wherever the most money went.
  if (mode !== "date") groups.sort((a, b) => b.subtotal - a.subtotal);
  return groups;
}

export default function LedgerView({ receipts, mode, onSelect }: Props) {
  const groups = buildGroups(receipts, mode);
  const grandTotal = receipts.reduce((s, r) => s + r.totalAmount, 0);

  if (groups.length === 0) {
    return (
      <Tape padding="26px 26px 22px">
        <div style={{ textAlign: "center", padding: "34px 0" }}>
          {/* An empty roll: the tape ran out. */}
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: "50%",
              border: `2px dashed ${T.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.faint,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.1em",
            }}
          >
            ROLL
          </div>
          <MetaLine size={12} color={T.muted} align="center">
            PAPER OUT · NO TRANSACTIONS
          </MetaLine>
          <div style={{ marginTop: 8 }}>
            <MetaLine size={10} color={T.faint} align="center">
              ADJUST YOUR SEARCH OR CLEAR THE FILTERS TO REPRINT
            </MetaLine>
          </div>
        </div>
      </Tape>
    );
  }

  return (
    <Tape padding="16px 26px 14px">
      <div style={{ textAlign: "center" }}>
        <MetaLine size={9} color={T.faint} align="center">
          *** TRANSACTION LOG · {mode === "date" ? "BY DATE" : mode === "store" ? "BY MERCHANT" : "BY CATEGORY"} ***
        </MetaLine>
      </div>

      {groups.map((g) => (
        <div key={g.key}>
          {/* Group head: month banners centre, merchant/category heads sit left
              with their count so the eye can still find the money column. */}
          <DashRule margin="16px 0 10px" />
          <div
            style={{
              display: "flex",
              justifyContent: mode === "date" ? "center" : "space-between",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: T.ink,
                textTransform: "uppercase",
              }}
            >
              {g.label}
            </span>
            {mode !== "date" && (
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: T.faint,
                  whiteSpace: "nowrap",
                }}
              >
                {g.meta}
              </span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${g.leadWidth}px 1fr auto`,
              gap: "0 12px",
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: "0.14em",
              color: T.faint,
              paddingBottom: 4,
            }}
          >
            <span>{mode === "date" ? "DAY" : "DATE"}</span>
            <span>ITEM</span>
            <span style={{ textAlign: "right" }}>AMT</span>
          </div>

          {g.rows.map((row) => (
            <div
              key={row.receipt.id}
              className="ledger-row"
              onClick={() => onSelect(row.receipt)}
              role="button"
              tabIndex={0}
              aria-label={`Open receipt ${orderNo(row.receipt.id)} from ${row.receipt.storeName}, ${fmtMoney(row.receipt.totalAmount)}`}
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
                gap: "0 12px",
                padding: "9px 6px",
                margin: "0 -6px",
                minHeight: 44,
                borderBottom: "1px dotted rgba(0,0,0,0.18)",
                cursor: "pointer",
                fontFamily: MONO,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: T.soft,
                  letterSpacing: "0.06em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.lead}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: T.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.main}
                {row.trail && (
                  <span style={{ color: T.faint, fontSize: 11 }}> · {row.trail}</span>
                )}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.text,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                }}
              >
                {fmtAmt(row.receipt.totalAmount)}
              </span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              padding: "8px 0 2px",
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.12em",
              color: T.muted,
            }}
          >
            <span>SUBTOTAL</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.body }}>
              {fmtAmt(g.subtotal)}
            </span>
          </div>
        </div>
      ))}

      {/* End of tape: the grand total, then the roll's own barcode. */}
      <DoubleRule margin="16px 0 10px" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: T.ink,
        }}
      >
        <span>GRAND TOTAL</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMoney(grandTotal)}</span>
      </div>

      <div style={{ marginTop: 18 }}>
        <Barcode
          value={`log-${receipts.length}-${Math.round(grandTotal)}`}
          height={28}
          count={44}
          caption={`★ END OF TAPE ★ ${receipts.length} ENTRIES ★`}
        />
      </div>
    </Tape>
  );
}
