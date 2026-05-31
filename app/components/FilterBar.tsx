"use client";

import { FilterState, ProductCategory } from "@/types";
import { CATEGORIES } from "@/lib/data";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import GlassSurface from "./GlassSurface";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const inputStyle = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: "rgba(255,255,255,0.8)",
  fontSize: 14,
  width: "100%",
};

export default function FilterBar({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const hasAdvanced =
    filters.category !== "All" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.amountMin ||
    filters.amountMax;

  return (
    <div className="flex flex-col gap-3">
      {/* Search row */}
      <div className="flex gap-2">
        <GlassSurface padding="none" className="flex-1">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search size={16} className="text-white/35 flex-shrink-0" />
            <input
              style={inputStyle}
              placeholder="Search stores, categories, items…"
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
            />
            {filters.search && (
              <button onClick={() => set("search", "")} className="text-white/30 hover:text-white/60 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </GlassSurface>

        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-2xl px-3.5 flex items-center gap-2 transition-all"
          style={{
            background: hasAdvanced
              ? "rgba(99,102,241,0.2)"
              : "rgba(255,255,255,0.055)",
            border: `1px solid ${hasAdvanced ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
            color: hasAdvanced ? "#a5b4fc" : "rgba(255,255,255,0.45)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <SlidersHorizontal size={15} />
          <span className="text-sm hidden sm:block">Filter</span>
          {hasAdvanced && (
            <span
              className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.6)", color: "white" }}
            >
              !
            </span>
          )}
        </button>
      </div>

      {/* Sort pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["date", "amount", "store"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              if (filters.sortField === f) {
                set("sortDir", filters.sortDir === "asc" ? "desc" : "asc");
              } else {
                set("sortField", f);
                set("sortDir", "desc");
              }
            }}
            className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-full capitalize transition-all"
            style={{
              background:
                filters.sortField === f
                  ? "rgba(99,102,241,0.2)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${filters.sortField === f ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
              color:
                filters.sortField === f
                  ? "#a5b4fc"
                  : "rgba(255,255,255,0.4)",
            }}
          >
            {f}
            {filters.sortField === f && (
              <span>{filters.sortDir === "desc" ? " ↓" : " ↑"}</span>
            )}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {expanded && (
        <GlassSurface padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                Category
              </label>
              <select
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.8)",
                  outline: "none",
                  padding: "9px 12px",
                  fontSize: 13,
                  width: "100%",
                }}
                value={filters.category}
                onChange={(e) =>
                  set("category", e.target.value as ProductCategory | "All")
                }
              >
                <option value="All" style={{ background: "#0d0b18" }}>
                  All Categories
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#0d0b18" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "rgba(255,255,255,0.7)",
                    outline: "none",
                    padding: "9px 10px",
                    fontSize: 12,
                    flex: 1,
                  }}
                  value={filters.dateFrom}
                  onChange={(e) => set("dateFrom", e.target.value)}
                />
                <input
                  type="date"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "rgba(255,255,255,0.7)",
                    outline: "none",
                    padding: "9px 10px",
                    fontSize: 12,
                    flex: 1,
                  }}
                  value={filters.dateTo}
                  onChange={(e) => set("dateTo", e.target.value)}
                />
              </div>
            </div>

            {/* Amount range */}
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">
                Amount Range (AUD)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "rgba(255,255,255,0.7)",
                    outline: "none",
                    padding: "9px 12px",
                    fontSize: 13,
                    flex: 1,
                  }}
                  value={filters.amountMin}
                  onChange={(e) => set("amountMin", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max $"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "rgba(255,255,255,0.7)",
                    outline: "none",
                    padding: "9px 12px",
                    fontSize: 13,
                    flex: 1,
                  }}
                  value={filters.amountMax}
                  onChange={(e) => set("amountMax", e.target.value)}
                />
              </div>
            </div>

            {/* Clear */}
            {hasAdvanced && (
              <div className="sm:col-span-2">
                <button
                  onClick={() =>
                    onChange({
                      ...filters,
                      category: "All",
                      dateFrom: "",
                      dateTo: "",
                      amountMin: "",
                      amountMax: "",
                    })
                  }
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </GlassSurface>
      )}
    </div>
  );
}
