"use client";

import { useState, useMemo, useEffect } from "react";
import { Receipt, FilterState } from "@/types";
import { MOCK_RECEIPTS } from "@/lib/data";
import StatsBar from "./components/StatsBar";
import FilterBar from "./components/FilterBar";
import ReceiptModal from "./components/ReceiptModal";
import AddReceiptModal from "./components/AddReceiptModal";
import LedgerView, { ViewMode } from "./components/LedgerView";
import { T, MONO, pill } from "./components/theme";
import { PerfLine, MetaLine, Barcode, DashRule } from "./components/paper";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  sortField: "date",
};

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "date", label: "Date" },
  { id: "store", label: "Merchant" },
  { id: "category", label: "Dept" },
];

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<ViewMode>("date");

  // The header prints a live timestamp. Resolving it after mount keeps the
  // server and client markup identical, a clock rendered on both sides is a
  // guaranteed hydration mismatch.
  const [stamp, setStamp] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setStamp(
        new Date()
          .toLocaleString("en-AU", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .toUpperCase()
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

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
        fontFamily: MONO,
        minHeight: "100vh",
        padding: "44px 20px 72px",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 22 }}>
        {/* -- Masthead: the head of the roll ---------------------------- */}
        <header>
          {/* Flush left, with the primary action beside it. Scanning is the
              first thing you come here to do, so it sits at the top rather than
              at the end of a roll you have to scroll past. */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 8vw, 42px)",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  color: T.ink,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                Receiptly
              </h1>
              <div style={{ marginTop: 10 }}>
                <MetaLine size={10} color={T.muted}>
                  Your Digital Receipt Vault
                </MetaLine>
              </div>
            </div>

            <button
              className="paper-btn no-print"
              onClick={() => setShowAdd(true)}
              style={{
                background: "transparent",
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: T.ink,
                color: T.ink,
                borderRadius: 0,
                padding: "13px 20px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: MONO,
                minHeight: 46,
                whiteSpace: "nowrap",
              }}
            >
              + Scan New Receipt
            </button>
          </div>

          <DashRule margin="18px 0 10px" />

          {/* Register identity left, live clock right, the way a till header
              prints it. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <MetaLine size={9} color={T.faint}>
              REG 01 · LANE 03 · CASHIER: MANAV
            </MetaLine>
            {/* Reserve the line before the clock resolves so nothing jumps. */}
            <MetaLine size={9} color={T.faint}>
              {stamp ?? "\u00a0"}
            </MetaLine>
          </div>

          <DashRule margin="10px 0 0" />
        </header>

        <StatsBar receipts={filtered} totalCount={receipts.length} />

        {/* -- Terminal controls ----------------------------------------- */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Same shape as the sort row above it: label, then its options. */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <MetaLine size={9} color={T.faint}>
            GROUP BY
          </MetaLine>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              style={{ ...pill(view === v.id), minHeight: 32 }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <LedgerView receipts={filtered} mode={view} onSelect={setSelected} />

        {/* -- Foot of the roll ------------------------------------------ */}
        <footer style={{ marginTop: 14, textAlign: "center" }}>
          <PerfLine margin="0 0 18px" label="END OF ROLL" />
          <MetaLine size={10} color={T.muted} align="center">
            THANK YOU FOR FILING WITH RECEIPTLY!
          </MetaLine>
          <div style={{ marginTop: 14 }}>
            <Barcode
              value="receiptly-pos"
              height={30}
              count={46}
              caption="RECEIPTLY POS v1.0 · GST REG 12 345 678 901"
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <MetaLine size={8} color={T.faint} align="center">
              RETAIN FOR YOUR RECORDS · NO CASH VALUE · ★ MERCHANT COPY ★
            </MetaLine>
          </div>
        </footer>
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
