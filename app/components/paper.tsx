"use client";

/**
 * The printed vocabulary: rules, perforations, barcodes, dot leaders, stamps.
 * Every surface in the app is assembled from these so the receipt conceit holds
 * together instead of being redrawn slightly differently in each component.
 */

import { CSSProperties, ReactNode } from "react";
import { T, MONO, TEAR_TOP, TEAR_BOTTOM, TEAR_HEIGHT, barPattern } from "./theme";

// --- Rules --------------------------------------------------------------------

/** The `- - - - - -` separator that divides every section of a receipt. */
export function DashRule({ margin = "14px 0", strong = false }: { margin?: string; strong?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        margin,
        background: `repeating-linear-gradient(to right, ${
          strong ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.26)"
        } 0 5px, transparent 5px 9px)`,
      }}
    />
  );
}

/** `======`, reserved for totals, the way a register tape marks a summary. */
export function DoubleRule({ margin = "12px 0" }: { margin?: string }) {
  return (
    <div aria-hidden style={{ margin }}>
      <div style={{ height: 1, background: "rgba(0,0,0,0.45)" }} />
      <div style={{ height: 1, marginTop: 2, background: "rgba(0,0,0,0.45)" }} />
    </div>
  );
}

/** A tear-off perforation with scissors, for cut lines between sections. */
export function PerfLine({ margin = "18px 0", label }: { margin?: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin }}>
      <span aria-hidden style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", lineHeight: 1 }}>
        ✂
      </span>
      <div
        aria-hidden
        style={{
          flex: 1,
          height: 1,
          background: "repeating-linear-gradient(to right, rgba(0,0,0,0.3) 0 4px, transparent 4px 10px)",
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: "0.16em",
            color: T.faint,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      <div
        aria-hidden
        style={{
          flex: 1,
          height: 1,
          background: "repeating-linear-gradient(to right, rgba(0,0,0,0.3) 0 4px, transparent 4px 10px)",
        }}
      />
    </div>
  );
}

// --- Rows ---------------------------------------------------------------------

/**
 * `LABEL ......... VALUE`, the dot leader that runs between a line item and
 * its amount. The dots are a background on a flexible spacer, so they fill
 * whatever room is left rather than being a fixed string of periods.
 */
export function DotRow({
  label,
  value,
  bold = false,
  size = 12,
  color = T.body,
  leader = true,
}: {
  label: ReactNode;
  value: ReactNode;
  bold?: boolean;
  size?: number;
  color?: string;
  leader?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        fontFamily: MONO,
        fontSize: size,
        color,
        fontWeight: bold ? 700 : 400,
        letterSpacing: "0.04em",
        padding: "3px 0",
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>{label}</span>
      {leader && (
        <span
          aria-hidden
          style={{
            flex: 1,
            height: "1em",
            minWidth: 12,
            backgroundImage: `radial-gradient(circle closest-side, ${
              bold ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.26)"
            } 100%, transparent 100%)`,
            backgroundSize: "5px 1.5px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left 0.68em",
          }}
        />
      )}
      {!leader && <span style={{ flex: 1 }} />}
      <span style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

/** Small tracked-out caps used for meta lines like `AUTH CODE: 402881`. */
export function MetaLine({
  children,
  color = T.muted,
  size = 10,
  align = "left",
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  align?: CSSProperties["textAlign"];
}) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        textAlign: align,
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

// --- Barcode ------------------------------------------------------------------

/**
 * Decorative only, the bars are seeded from `value` so a given receipt always
 * prints the same code, but nothing here encodes a real symbology.
 */
export function Barcode({
  value,
  height = 44,
  count = 58,
  caption,
}: {
  value: string;
  height?: number;
  count?: number;
  caption?: string;
}) {
  const bars = barPattern(value, count);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        aria-hidden
        style={{ display: "flex", alignItems: "stretch", height, maxWidth: "100%", overflow: "hidden" }}
      >
        {bars.map((w, i) => (
          <span
            key={i}
            style={{
              width: w,
              flexShrink: 0,
              background: i % 2 === 0 ? "#141414" : "transparent",
            }}
          />
        ))}
      </div>
      {caption && (
        <MetaLine size={9} color={T.faint} align="center">
          {caption}
        </MetaLine>
      )}
    </div>
  );
}

// --- Sheets -------------------------------------------------------------------

/**
 * A length of register tape: torn along both edges, fibre texture, no radius.
 * `crumple` adds fold shading, used for receipts that are meant to look like
 * they have been in a pocket, not for surfaces you read a lot of text on.
 */
export function Tape({
  children,
  crumple = false,
  padding = "10px 26px 8px",
  style,
}: {
  children: ReactNode;
  crumple?: boolean;
  padding?: string;
  style?: CSSProperties;
}) {
  const surface = crumple ? "paper-crumple" : "paper";
  return (
    // drop-shadow rather than box-shadow: the torn edges are a clip-path, and
    // only drop-shadow follows the resulting silhouette instead of boxing it.
    <div
      style={{
        position: "relative",
        filter: "drop-shadow(0 1px 1px rgba(40,35,25,0.10)) drop-shadow(0 10px 18px rgba(40,35,25,0.10))",
        ...style,
      }}
    >
      <div aria-hidden className={surface} style={{ height: TEAR_HEIGHT, clipPath: TEAR_TOP }} />
      <div className={surface} style={{ padding, fontFamily: MONO }}>
        {children}
      </div>
      <div aria-hidden className={surface} style={{ height: TEAR_HEIGHT, clipPath: TEAR_BOTTOM }} />
    </div>
  );
}

/** A rubber stamp, rotated, outlined, deliberately imperfect. */
export function Stamp({
  text,
  color,
  rotate = -14,
  style,
}: {
  text: string;
  color: string;
  rotate?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        fontFamily: MONO,
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: "0.18em",
        color,
        border: `2.5px solid ${color}`,
        borderRadius: 3,
        padding: "5px 12px",
        transform: `rotate(${rotate}deg)`,
        opacity: 0.5,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
}
