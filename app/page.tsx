"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Receipt, FilterState } from "@/types";
import { MOCK_RECEIPTS } from "@/lib/data";
import StatsBar from "./components/StatsBar";
import FilterBar from "./components/FilterBar";
import ReceiptCard from "./components/ReceiptCard";
import ReceiptModal from "./components/ReceiptModal";
import AddReceiptModal from "./components/AddReceiptModal";
import GroupedView from "./components/GroupedView";
import GlassSurface from "./components/GlassSurface";
import { Plus, List, Layers, LayoutGrid } from "lucide-react";

const Silk = dynamic(() => import("./components/Silk"), { ssr: false });

const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  sortField: "date",
  sortDir: "desc",
};

type ViewMode = "list" | "store" | "category";

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filtered = useMemo(() => {
    let r = [...receipts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      r = r.filter(
        (receipt) =>
          receipt.storeName.toLowerCase().includes(q) ||
          receipt.category.toLowerCase().includes(q) ||
          receipt.items.some((i) => i.name.toLowerCase().includes(q)) ||
          receipt.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.category !== "All") {
      r = r.filter((receipt) => receipt.category === filters.category);
    }

    if (filters.dateFrom) {
      r = r.filter(
        (receipt) => new Date(receipt.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      r = r.filter(
        (receipt) => new Date(receipt.date) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    if (filters.amountMin) {
      r = r.filter((receipt) => receipt.totalAmount >= parseFloat(filters.amountMin));
    }

    if (filters.amountMax) {
      r = r.filter((receipt) => receipt.totalAmount <= parseFloat(filters.amountMax));
    }

    r.sort((a, b) => {
      let val = 0;
      if (filters.sortField === "date") {
        val = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (filters.sortField === "amount") {
        val = a.totalAmount - b.totalAmount;
      } else if (filters.sortField === "store") {
        val = a.storeName.localeCompare(b.storeName);
      }
      return filters.sortDir === "desc" ? -val : val;
    });

    return r;
  }, [receipts, filters]);

  function handleAdd(receipt: Receipt) {
    setReceipts((prev) => [receipt, ...prev]);
    setShowAdd(false);
  }

  const VIEW_MODES: { id: ViewMode; icon: typeof List; label: string }[] = [
    { id: "list", icon: List, label: "List" },
    { id: "store", icon: LayoutGrid, label: "By Store" },
    { id: "category", icon: Layers, label: "By Category" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "#08080f", color: "white", fontFamily: "'DM Sans', sans-serif" }}
    >
      <Silk />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(99,102,241,0.25)",
                  border: "1px solid rgba(99,102,241,0.4)",
                }}
              >
                <span style={{ fontSize: 14 }}>🧾</span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.65) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Receiptly
              </h1>
            </div>
            <p className="text-white/35 text-sm">Your digital receipt vault</p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{
              background: "rgba(99,102,241,0.85)",
              border: "1px solid rgba(99,102,241,0.5)",
              boxShadow: "0 0 24px rgba(99,102,241,0.35)",
            }}
          >
            <Plus size={15} />
            Add
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsBar receipts={filtered} />
        </div>

        {/* Filters */}
        <div className="mb-5">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/40 text-xs">
            {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
          </p>
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {VIEW_MODES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background:
                    viewMode === id
                      ? "rgba(99,102,241,0.3)"
                      : "transparent",
                  color:
                    viewMode === id
                      ? "#a5b4fc"
                      : "rgba(255,255,255,0.35)",
                  border: viewMode === id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                }}
              >
                <Icon size={12} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Receipt list / grouped views */}
        {viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <ReceiptCard key={r.id} receipt={r} onClick={() => setSelectedReceipt(r)} />
            ))}
            {filtered.length === 0 && (
              <GlassSurface padding="lg">
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🧾</p>
                  <p className="text-white/50 text-sm mb-1">No receipts found</p>
                  <p className="text-white/25 text-xs">Try adjusting your filters or add a new receipt</p>
                </div>
              </GlassSurface>
            )}
          </div>
        ) : (
          <GroupedView
            receipts={filtered}
            groupMode={viewMode as "store" | "category"}
            onReceiptClick={setSelectedReceipt}
          />
        )}
      </div>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
      {showAdd && (
        <AddReceiptModal
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
