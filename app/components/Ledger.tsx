"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Receipt, FilterState, ReceiptPage, ReceiptStats } from "@/types";
import StatsBar from "./StatsBar";
import FilterBar from "./FilterBar";
import ReceiptModal from "./ReceiptModal";
import AddReceiptModal from "./AddReceiptModal";
import LedgerView, { ViewMode } from "./LedgerView";
import { T, MONO, pill } from "./theme";
import { PerfLine, MetaLine, Barcode, DashRule } from "./paper";

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

/** Long enough that typing a word is one request, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 250;

function buildQuery(filters: FilterState, cursor?: string | null): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  for (const c of filters.categories) params.append("category", c);
  params.set("sort", filters.sortField);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

interface Props {
  initialPage: ReceiptPage;
  initialStats: ReceiptStats;
  userName: string;
}

export default function Ledger({ initialPage, initialStats, userName }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialPage.receipts);
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor);
  const [stats, setStats] = useState<ReceiptStats>(initialStats);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<ViewMode>("date");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responses can arrive out of order — a slow "mil" landing after a fast
  // "milk" would show the wrong results. Only the newest request may write.
  const requestId = useRef(0);
  // The first render already has server-fetched data for the default filters,
  // so skip the fetch the filter effect would otherwise fire on mount.
  const primed = useRef(false);

  const load = useCallback(async (next: FilterState) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(next);
      const [pageRes, statsRes] = await Promise.all([
        fetch(`/api/receipts?${query}`),
        fetch(`/api/receipts/stats?${query}`),
      ]);
      if (!pageRes.ok || !statsRes.ok) throw new Error("Request failed");

      const page: ReceiptPage = await pageRes.json();
      const nextStats: ReceiptStats = await statsRes.json();

      if (id !== requestId.current) return;
      setReceipts(page.receipts);
      setCursor(page.nextCursor);
      setStats(nextStats);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("Failed to load receipts:", err);
      setError("Could not reach the register");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Category and sort changes are instant; typing waits out the debounce.
  useEffect(() => {
    if (!primed.current) {
      primed.current = true;
      return;
    }
    const t = setTimeout(() => load(filters), filters.search ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [filters, load]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/receipts?${buildQuery(filters, cursor)}`);
      if (!res.ok) throw new Error("Request failed");
      const page: ReceiptPage = await res.json();
      setReceipts((prev) => [...prev, ...page.receipts]);
      setCursor(page.nextCursor);
    } catch (err) {
      console.error("Failed to load more receipts:", err);
      setError("Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }

  /** A saved receipt goes straight to the top; the totals come from the server. */
  function handleAdded(receipt: Receipt) {
    setReceipts((prev) => [receipt, ...prev]);
    setShowAdd(false);
    load(filters);
  }

  function handleDeleted(id: string) {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
    load(filters);
  }

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
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <MetaLine size={9} color={T.faint}>
                REG 01 · LANE 03 · CASHIER: {userName}
              </MetaLine>
              {/* A plain form post: sign-out must not be reachable by GET. */}
              <form action="/auth/signout" method="post" style={{ display: "inline" }}>
                <button
                  type="submit"
                  className="no-print"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: T.faint,
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
            {/* Reserve the line before the clock resolves so nothing jumps. */}
            <MetaLine size={9} color={T.faint}>
              {stamp ?? "\u00a0"}
            </MetaLine>
          </div>

          <DashRule margin="10px 0 0" />
        </header>

        <StatsBar stats={stats} />

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
          {loading && (
            <MetaLine size={9} color={T.faint}>
              · Reading…
            </MetaLine>
          )}
        </div>

        {error && (
          <div role="alert">
            <MetaLine size={10} color="oklch(45% 0.15 25)">
              {error}
            </MetaLine>
          </div>
        )}

        <LedgerView receipts={receipts} mode={view} onSelect={setSelected} />

        {/* Grouped views group what is loaded, so the roll extends rather than
            paging: each pull appends to the same tape. */}
        {cursor && (
          <button
            className="paper-btn no-print"
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              background: "transparent",
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: T.line,
              color: T.muted,
              borderRadius: 0,
              padding: "12px 20px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: loadingMore ? "wait" : "pointer",
              fontFamily: MONO,
              minHeight: 42,
            }}
          >
            {loadingMore ? "Feeding paper…" : "Continue roll"}
          </button>
        )}

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

      {selected && (
        <ReceiptModal
          receipt={selected}
          cashier={userName}
          onDelete={handleDeleted}
          onClose={() => setSelected(null)}
        />
      )}
      {showAdd && <AddReceiptModal onAdd={handleAdded} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
