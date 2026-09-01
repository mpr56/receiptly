"use client";

import { ReceiptStats } from "@/types";
import { T, MONO, fmtMoney, fmtAmt } from "./theme";
import { Tape, DashRule, DoubleRule, DotRow, MetaLine } from "./paper";

interface Props {
  stats: ReceiptStats;
}

/**
 * The end-of-day register summary. A real X-report prints gross sales, the
 * transaction count and an average basket, so this shows the same four figures
 * over whatever the current filters have selected.
 *
 * These figures arrive already computed from the database rather than being
 * summed here: the ledger only holds the pages that have been loaded, so
 * totalling it would report a page's gross, not the collection's.
 */
export default function StatsBar({ stats }: Props) {
  const { receiptCount, totalSpend, avgBasket, largestAmount, largestStore, totalCount } = stats;
  const filtered = receiptCount !== totalCount;

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
          {fmtMoney(totalSpend)}
        </span>
      </div>

      <DashRule margin="10px 0" />

      <DotRow label="TRANSACTIONS" value={String(receiptCount)} size={11} color={T.body} />
      <DotRow label="AVG BASKET" value={fmtAmt(avgBasket)} size={11} color={T.body} />
      {largestStore && largestAmount != null && (
        <DotRow
          label="LARGEST SALE"
          value={`${largestStore.toUpperCase()}  ${fmtAmt(largestAmount)}`}
          size={11}
          color={T.body}
        />
      )}

      <DoubleRule margin="10px 0 8px" />

      <MetaLine size={9} color={T.faint}>
        {filtered
          ? `FILTERED VIEW · ${receiptCount} OF ${totalCount} ON FILE`
          : `${totalCount} RECEIPT${totalCount === 1 ? "" : "S"} ON FILE · ALL RECORDS`}
      </MetaLine>
    </Tape>
  );
}
