"use client";

import { Receipt } from "@/types";
import { formatCurrency, groupByStore, groupByCategory } from "@/lib/data";
import GlassSurface from "./GlassSurface";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import ReceiptCard from "./ReceiptCard";

interface Props {
  receipts: Receipt[];
  groupMode: "store" | "category";
  onReceiptClick: (r: Receipt) => void;
}

export default function GroupedView({ receipts, groupMode, onReceiptClick }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups =
    groupMode === "store"
      ? groupByStore(receipts)
      : groupByCategory(receipts);

  const sorted = Object.entries(groups).sort(
    (a, b) =>
      b[1].reduce((s, r) => s + r.totalAmount, 0) -
      a[1].reduce((s, r) => s + r.totalAmount, 0)
  );

  function toggle(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([key, items]) => {
        const groupTotal = items.reduce((s, r) => s + r.totalAmount, 0);
        const isOpen = openGroups.has(key);
        const accentColor =
          groupMode === "store"
            ? items[0].storeColor
            : "#6366f1";

        return (
          <GlassSurface key={key} padding="none">
            {/* Group header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 rounded-2xl transition-all"
            >
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                }}
              >
                {groupMode === "store"
                  ? items[0].storeLogoInitials
                  : key.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/85 font-medium text-sm truncate">{key}</p>
                <p className="text-white/35 text-xs">
                  {items.length} receipt{items.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {formatCurrency(groupTotal)}
                </span>
                {isOpen ? (
                  <ChevronDown size={15} className="text-white/30" />
                ) : (
                  <ChevronRight size={15} className="text-white/30" />
                )}
              </div>
            </button>

            {/* Expanded items */}
            {isOpen && (
              <div
                className="mx-3 mb-3 flex flex-col gap-2 pt-1 border-t"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                {items.map((r) => (
                  <ReceiptCard key={r.id} receipt={r} onClick={() => onReceiptClick(r)} />
                ))}
              </div>
            )}
          </GlassSurface>
        );
      })}

      {sorted.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm">
          No receipts match your filters
        </div>
      )}
    </div>
  );
}
