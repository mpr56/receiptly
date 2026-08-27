"use client";

import { Receipt } from "@/types";
import { T, MONO, fmtMoney } from "./theme";

interface Props {
  receipts: Receipt[];
  totalCount: number;
}

export default function StatsBar({ receipts, totalCount }: Props) {
  const total = receipts.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 28,
        padding: "4px 0 16px",
        fontFamily: MONO,
      }}
    >
      <Stat label="TOTAL SPEND" value={fmtMoney(total)} />
      <div
        style={{
          width: 1,
          alignSelf: "stretch",
          background: `repeating-linear-gradient(to bottom, ${T.rule} 0 4px, transparent 4px 8px)`,
        }}
      />
      <Stat label="RECEIPTS" value={String(totalCount)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: T.soft }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, marginTop: 4 }}>{value}</div>
    </div>
  );
}
