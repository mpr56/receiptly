"use client";

import { useState, useMemo } from "react";
import { Receipt, FilterState } from "@/types";
import { MOCK_RECEIPTS } from "@/lib/data";
import StatsBar from "./components/StatsBar";
import FilterBar from "./components/FilterBar";
import ReceiptModal from "./components/ReceiptModal";
import AddReceiptModal from "./components/AddReceiptModal";
import LedgerView, { ViewMode } from "./components/LedgerView";
import { T, SANS, pill } from "./components/theme";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  sortField: "date",
};

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "date", label: "By Date" },
  { id: "store", label: "By Store" },
  { id: "category", label: "By Category" },
];

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<ViewMode>("date");

  const filtered = useMemo(() => {
    let r = [...receipts];

    const q = filters.search.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (receipt) =>
          receipt.storeName.toLowerCase().includes(q) ||
          receipt.category.toLowerCase().includes(q) ||
          receipt.items.some((i) => i.name.toLowerCase().includes(q)) ||
          receipt.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.categories.length > 0) {
      r = r.filter((receipt) => filters.categories.includes(receipt.category));
    }

    r.sort((a, b) => {
      if (filters.sortField === "amount") return b.totalAmount - a.totalAmount;
      if (filters.sortField === "store") return a.storeName.localeCompare(b.storeName);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return r;
  }, [receipts, filters]);

  return (
    <div
      style={{
        fontFamily: SANS,
        minHeight: "100vh",
        padding: "56px 24px 90px",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 26 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            paddingBottom: 18,
            borderBottom: `1px dashed ${T.rule}`,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: T.ink,
              }}
            >
              Receiptly
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.soft,
              }}
            >
              Your Digital Receipt Vault
            </p>
          </div>
          <button
            className="add-btn"
            onClick={() => setShowAdd(true)}
            style={{
              background: "transparent",
              border: `1.5px dashed ${T.accent}`,
              color: T.accent,
              borderRadius: 0,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: SANS,
              transform: "rotate(-1deg)",
              whiteSpace: "nowrap",
            }}
          >
            + Add Receipt
          </button>
        </div>

        <StatsBar receipts={filtered} totalCount={receipts.length} />

        <FilterBar filters={filters} onChange={setFilters} />

        {/* Count + view toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: T.soft }}>
            {filtered.length} receipt{filtered.length === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {VIEWS.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} style={pill(view === v.id)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <LedgerView receipts={filtered} mode={view} onSelect={setSelected} />
      </div>

      {selected && <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />}
      {showAdd && (
        <AddReceiptModal
          onAdd={(r) => {
            setReceipts((prev) => [r, ...prev]);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
