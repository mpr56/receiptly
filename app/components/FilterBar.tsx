"use client";

import { useState, useRef, useEffect } from "react";
import { FilterState, ProductCategory, SortField } from "@/types";
import { CATEGORIES } from "@/lib/data";
import { T, SANS, pill, catStyle } from "./theme";

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const SORTS: { id: SortField; label: string }[] = [
  { id: "date", label: "Date" },
  { id: "amount", label: "Amount" },
  { id: "store", label: "Store" },
];

export default function FilterBar({ filters, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <input
        type="text"
        className="underline-input"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search stores or categories…"
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${T.line}`,
          borderRadius: 0,
          padding: "10px 2px",
          fontSize: 15,
          fontFamily: SANS,
          outline: "none",
          color: T.text,
        }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange({ ...filters, sortField: s.id })}
            style={pill(filters.sortField === s.id)}
          >
            {s.label}
          </button>
        ))}
        <CategoryFilter
          selected={filters.categories}
          onChange={(categories) => onChange({ ...filters, categories })}
        />
      </div>
    </div>
  );
}

function CategoryFilter({
  selected,
  onChange,
}: {
  selected: ProductCategory[];
  onChange: (c: ProductCategory[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = selected.length > 0;
  const label = !active
    ? "Category"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} categories`;

  function toggle(c: ProductCategory) {
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          ...pill(active),
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderStyle: active ? "solid" : "dashed",
        }}
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 30,
            minWidth: 230,
            background: T.paper,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(20,20,30,0.14)",
            padding: 6,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {CATEGORIES.map((c) => {
            const on = selected.includes(c);
            const cs = catStyle(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  background: on ? T.hover : "transparent",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: T.body,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    flexShrink: 0,
                    borderRadius: 4,
                    border: `1.5px solid ${on ? T.accent : T.border}`,
                    background: on ? T.accent : "transparent",
                    color: "#fff",
                    fontSize: 10,
                    lineHeight: "13px",
                    textAlign: "center",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: cs.text,
                  }}
                />
                {c}
              </button>
            );
          })}

          {active && (
            <button
              onClick={() => onChange([])}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                borderTop: `1px solid ${T.border}`,
                borderRadius: 0,
                color: T.accent,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
