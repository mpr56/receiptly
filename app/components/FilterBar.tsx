"use client";

import { useState, useRef, useEffect } from "react";
import { FilterState, ProductCategory, SortField } from "@/types";
import { CATEGORIES } from "@/lib/data";
import { T, MONO, pill, catStyle } from "./theme";
import { MetaLine } from "./paper";

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
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Lookup reads as a terminal prompt: a chevron, then the operator types. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: focused ? T.accent : T.line,
          padding: "10px 12px",
          background: T.paper,
          transition: "border-color 0.15s ease",
        }}
      >
        <span
          aria-hidden
          style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.accent, lineHeight: 1 }}
        >
          &gt;
        </span>
        <label htmlFor="lookup" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Search receipts by store, category, item or tag
        </label>
        <input
          id="lookup"
          type="text"
          className="underline-input"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="LOOKUP MERCHANT, ITEM OR TAG"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            borderRadius: 0,
            padding: 0,
            fontSize: 13,
            fontFamily: MONO,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            outline: "none",
            color: T.text,
          }}
        />
        {!filters.search && !focused && (
          <span
            aria-hidden
            className="caret"
            style={{ width: 7, height: 14, background: T.accent, opacity: 0.6, flexShrink: 0 }}
          />
        )}
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            aria-label="Clear search"
            className="paper-btn"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.12em",
              color: T.soft,
              padding: "4px 6px",
              flexShrink: 0,
            }}
          >
            VOID
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <MetaLine size={9} color={T.faint}>
          SORT BY
        </MetaLine>
        {SORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange({ ...filters, sortField: s.id })}
            aria-pressed={filters.sortField === s.id}
            style={{ ...pill(filters.sortField === s.id), minHeight: 32 }}
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
    ? "Dept"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} depts`;

  function toggle(c: ProductCategory) {
    onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          ...pill(active),
          minHeight: 32,
          display: "flex",
          alignItems: "center",
          gap: 7,
          borderStyle: active ? "solid" : "dashed",
        }}
      >
        {label}
        <span aria-hidden style={{ fontSize: 8, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        // Department list, printed: fixed-width checkboxes so the labels align
        // into a column the way a stocktake sheet would.
        <div
          className="paper"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 30,
            minWidth: 250,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: T.ink,
            boxShadow: "6px 6px 0 rgba(20,20,30,0.12)",
            padding: "10px 12px 8px",
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          <div style={{ paddingBottom: 8, borderBottom: `1px dashed ${T.line}`, marginBottom: 6 }}>
            <MetaLine size={9} color={T.faint}>
              DEPARTMENT INDEX
            </MetaLine>
          </div>

          {CATEGORIES.map((c) => {
            const on = selected.includes(c);
            const cs = catStyle(c);
            return (
              <button
                key={c}
                onClick={() => toggle(c)}
                aria-pressed={on}
                className="tape-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  minHeight: 34,
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  borderRadius: 0,
                  padding: "6px 4px",
                  fontSize: 12,
                  fontFamily: MONO,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: on ? T.ink : T.body,
                  fontWeight: on ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                <span aria-hidden style={{ color: on ? T.ink : T.faint, flexShrink: 0 }}>
                  {on ? "[X]" : "[ ]"}
                </span>
                <span
                  aria-hidden
                  style={{ width: 7, height: 7, flexShrink: 0, background: cs.text }}
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
                marginTop: 6,
                padding: "9px 4px",
                minHeight: 34,
                background: "transparent",
                border: "none",
                borderTop: `1px dashed ${T.line}`,
                borderRadius: 0,
                color: T.accent,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                fontFamily: MONO,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              ✂ VOID ALL DEPARTMENTS
            </button>
          )}
        </div>
      )}
    </div>
  );
}
