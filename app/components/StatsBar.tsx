"use client";

import { Receipt } from "@/types";
import { T, MONO, fmtMoney, fmtAmt } from "./theme";
import { Tape, DashRule, DoubleRule, DotRow, MetaLine } from "./paper";

interface Props {
  receipts: Receipt[];
  totalCount: number;
}

/**
 * The end-of-day register summary. A real X-report prints gross sales, the
 * transaction count and an average basket, so this shows the same four figures
 * over whatever the current filters have selected.
 */
export default function StatsBar({ receipts, totalCount }: Props) {
  const total = receipts.reduce((s, r) => s + r.totalAmount, 0);
  const avg = receipts.length ? total / receipts.length : 0;
  const largest = receipts.reduce<Receipt | null>(
    (best, r) => (!best || r.totalAmount > best.totalAmount ? r : best),
    null
  );
  const filtered = receipts.length !== totalCount;

  return (
    <Tape padding="14px 26px 12px">
      <div style={{ textAlign: "center" }}>
        <MetaLine size={9} color={T.faint} align="center">
          *** X-REPORT · SPEND SUMMARY ***
        </MetaLine>
      </div>

      <DashRule margin="10px 0" />

      {/* The headline figure gets register-display treatment, oversized,
          tabular, and the only thing on its line. */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.16em",
            color: T.soft,
            textTransform: "uppercase",
          }}
        >
          Gross
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: T.ink,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1.1,
          }}
        >
          {fmtMoney(total)}
        </span>
      </div>

      <DashRule margin="10px 0" />

      <DotRow label="TRANSACTIONS" value={String(receipts.length)} size={11} color={T.body} />
      <DotRow label="AVG BASKET" value={fmtAmt(avg)} size={11} color={T.body} />
      {largest && (
        <DotRow
          label="LARGEST SALE"
          value={`${largest.storeName.toUpperCase()}  ${fmtAmt(largest.totalAmount)}`}
          size={11}
          color={T.body}
        />
      )}

      <DoubleRule margin="10px 0 8px" />

      <MetaLine size={9} color={T.faint}>
        {filtered
          ? `FILTERED VIEW · ${receipts.length} OF ${totalCount} ON FILE`
          : `${totalCount} RECEIPT${totalCount === 1 ? "" : "S"} ON FILE · ALL RECORDS`}
      </MetaLine>
    </Tape>
  );
}
