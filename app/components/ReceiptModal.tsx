"use client";

import { useEffect, useRef, useState } from "react";
import { Receipt } from "@/types";
import {
  T,
  MONO,
  SANS,
  RECEIPT_CLIP,
  catStyle,
  fmtMoney,
  fmtAmt,
  gstOf,
  orderNo,
  authCode,
  cardTail,
  terminalNo,
  lane,
} from "./theme";
import { DashRule, DoubleRule, Barcode, MetaLine, Stamp } from "./paper";

interface Props {
  receipt: Receipt;
  /** Printed on the receipt as the cardholder and order name. */
  cashier: string;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/** How the tender block reads depends on how it was paid, cash receipts show
 *  change due, cards show an auth trace, wallets show a device token. */
function tenderLines(r: Receipt, cashier: string): [string, string][] {
  const auth = authCode(r.id);
  if (r.paymentMethod === "cash") {
    const tendered = Math.ceil(r.totalAmount / 5) * 5;
    return [
      ["CASH TENDERED", fmtAmt(tendered)],
      ["CHANGE DUE", fmtAmt(tendered - r.totalAmount)],
      ["DRAWER", `NO. ${terminalNo(r.id)}`],
    ];
  }
  if (r.paymentMethod === "digital") {
    return [
      ["WALLET", "DIGITAL / NFC"],
      ["DEVICE ID", `**** ${cardTail(r.id)}`],
      ["AUTH CODE", auth],
    ];
  }
  return [
    ["CARD #", `**** **** **** ${cardTail(r.id)}`],
    ["AUTH CODE", auth],
    ["CARDHOLDER", cashier],
  ];
}

export default function ReceiptModal({ receipt, cashier, onDelete, onClose }: Props) {
  const cs = catStyle(receipt.category);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The image lives in a private bucket, so it needs a signed URL. Minting one
  // per open rather than per listed receipt: the ledger shows no images, so
  // signing a whole page of them would be wasted round trips.
  useEffect(() => {
    if (!receipt.imagePath) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/receipts/${receipt.id}`);
        if (!res.ok) throw new Error("Request failed");
        const { imageUrl: url } = await res.json();
        if (active) setImageUrl(url ?? null);
      } catch (err) {
        console.error("Failed to sign receipt image:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [receipt.id, receipt.imagePath]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      onDelete(receipt.id);
    } catch (err) {
      console.error("Failed to void receipt:", err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const d = new Date(receipt.date);
  const longDate = d
    .toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
  const clock = d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });

  const { ex, gst } = gstOf(receipt.totalAmount);
  const unitCount = receipt.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Receipt from ${receipt.storeName}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(20% 0.01 90 / 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 50,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close receipt"
          className="paper-btn"
          style={{
            position: "absolute",
            top: -16,
            right: -16,
            width: 34,
            height: 34,
            borderRadius: 0,
            background: T.paper,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: T.ink,
            cursor: "pointer",
            fontSize: 16,
            fontFamily: MONO,
            color: T.ink,
            zIndex: 3,
          }}
        >
          ×
        </button>

        <div className="scrollbar-none" style={{ maxHeight: "88vh", overflowY: "auto" }}>
          <div
            className="feeding"
            style={{
              position: "relative",
              width: 372,
              maxWidth: "100%",
              filter: "drop-shadow(0 24px 44px rgba(20,20,30,0.34))",
            }}
          >
            {/* The printer head, chasing the sheet as it feeds out. */}
            <div
              aria-hidden
              className="print-head"
              style={{
                position: "absolute",
                left: -4,
                right: -4,
                height: 3,
                background: "rgba(0,0,0,0.5)",
                boxShadow: "0 0 12px rgba(0,0,0,0.4)",
                zIndex: 2,
              }}
            />

            <div
              className="paper-crumple"
              style={{
                padding: "34px 28px 26px",
                transform: "rotate(-0.5deg)",
                fontFamily: MONO,
                color: "#1c1c1c",
                clipPath: RECEIPT_CLIP,
              }}
            >
              {/* -- Head ----------------------------------------------- */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                  }}
                >
                  {receipt.storeName}
                </div>
                <div style={{ marginTop: 7 }}>
                  <MetaLine size={10} color="#6b6b6b" align="center">
                    {receipt.category}
                  </MetaLine>
                </div>
                <div style={{ marginTop: 14 }}>
                  <MetaLine size={9} color="#8a8a8a" align="center">
                    RECEIPTLY POS · TERM {terminalNo(receipt.id)} · LANE {lane(receipt.id)}
                  </MetaLine>
                </div>
              </div>

              <DashRule margin="18px 0 12px" />

              <MetaLine size={10} color="#4a4a4a">
                ORDER {orderNo(receipt.id)} FOR {cashier}
              </MetaLine>
              <MetaLine size={10} color="#4a4a4a">
                {longDate} · {clock}
              </MetaLine>

              <DashRule margin="12px 0 8px" />

              {/* -- Items ---------------------------------------------- */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px 1fr auto",
                  gap: "0 10px",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "#8a8a8a",
                  paddingBottom: 6,
                }}
              >
                <span>QTY</span>
                <span>ITEM</span>
                <span style={{ textAlign: "right" }}>AMT</span>
              </div>

              {receipt.items.length === 0 && (
                <MetaLine size={10} color="#9a9a9a" align="center">
                  * NO LINE ITEMS RECORDED *
                </MetaLine>
              )}

              {receipt.items.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "26px 1fr auto",
                    gap: "0 10px",
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    padding: "4px 0",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span style={{ color: "#6b6b6b", fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ textTransform: "uppercase" }}>
                    {it.name}
                    {it.quantity > 1 && (
                      <span style={{ color: "#8a8a8a" }}>
                        {" "}
                        @ {it.quantity} × {fmtAmt(it.unitPrice)}
                      </span>
                    )}
                  </span>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtAmt(it.totalPrice)}
                  </span>
                </div>
              ))}

              <DashRule margin="10px 0" />

              {/* -- Totals --------------------------------------------- */}
              <Total label="ITEM COUNT" value={String(unitCount)} />
              <Total label="SUBTOTAL (EX GST)" value={fmtAmt(ex)} />
              <Total label="GST 10%" value={fmtAmt(gst)} />
              <DoubleRule margin="8px 0" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                <span>TOTAL</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtMoney(receipt.totalAmount)}
                </span>
              </div>

              <DashRule margin="14px 0 10px" />

              {/* -- Tender --------------------------------------------- */}
              {tenderLines(receipt, cashier).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: "#4a4a4a",
                    lineHeight: 1.9,
                  }}
                >
                  <span>{k}:</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 6 }}>
                <MetaLine size={10} color="#4a4a4a">
                  *** APPROVED *** NO SIGNATURE REQUIRED
                </MetaLine>
              </div>

              {/* -- Stamp + tags --------------------------------------- */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 14,
                  minHeight: 40,
                }}
              >
                <Stamp text="PAID" color={cs.text} rotate={-11} />
                {receipt.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      flex: 1,
                    }}
                  >
                    {receipt.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: SANS,
                          fontSize: 10,
                          color: "#5a5a5a",
                          border: "1px solid rgba(0,0,0,0.2)",
                          padding: "2px 7px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {receipt.imagePath && (
                <>
                  <DashRule margin="14px 0 10px" />
                  <MetaLine size={9} color="#8a8a8a">
                    SCANNED ORIGINAL
                  </MetaLine>
                  {imageUrl ? (
                    // A signed storage URL with a short TTL: next/image would
                    // cache it past its expiry and then serve a broken image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`Photo of the original receipt from ${receipt.storeName}`}
                      style={{
                        width: "100%",
                        marginTop: 8,
                        maxHeight: 150,
                        objectFit: "cover",
                        filter: "grayscale(0.4) contrast(1.08)",
                        border: "1px solid rgba(0,0,0,0.14)",
                      }}
                    />
                  ) : (
                    // Hold the space so the receipt does not jump when it lands.
                    <div
                      style={{
                        width: "100%",
                        marginTop: 8,
                        height: 96,
                        border: "1px dashed rgba(0,0,0,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MetaLine size={9} color="#a5a5a5">
                        Retrieving…
                      </MetaLine>
                    </div>
                  )}
                </>
              )}

              {/* -- Foot ----------------------------------------------- */}
              <div style={{ marginTop: 22, textAlign: "center" }}>
                <MetaLine size={11} color="#2a2a2a" align="center">
                  THANK YOU FOR VISITING!
                </MetaLine>
                <div style={{ marginTop: 4 }}>
                  <MetaLine size={9} color="#9a9a9a" align="center">
                    KEEP THIS RECEIPT FOR WARRANTY · NO REFUNDS AFTER 30 DAYS
                  </MetaLine>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <Barcode
                  value={receipt.id}
                  height={40}
                  // Ids are UUIDs; the full 36 characters overrun the tape, and
                  // a short reference is what a real receipt prints anyway.
                  caption={`RECEIPTLY.APP/${receipt.id.slice(0, 8).toUpperCase()}`}
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <MetaLine size={8} color="#a5a5a5" align="center">
                  ★ ★ ★ CUSTOMER COPY ★ ★ ★
                </MetaLine>
              </div>

              {/* Voiding is destructive and takes the stored photo with it, so
                  the first press only arms it. */}
              <div style={{ marginTop: 18, textAlign: "center" }}>
                <button
                  className="no-print"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    background: "transparent",
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: confirmDelete ? "oklch(45% 0.15 25)" : "rgba(0,0,0,0.22)",
                    color: confirmDelete ? "oklch(45% 0.15 25)" : "#8a8a8a",
                    borderRadius: 0,
                    padding: "9px 16px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: deleting ? "wait" : "pointer",
                    fontFamily: MONO,
                  }}
                >
                  {deleting ? "Voiding…" : confirmDelete ? "Press again to void" : "Void this record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 11,
        letterSpacing: "0.1em",
        color: "#3a3a3a",
        lineHeight: 2,
      }}
    >
      <span>{label}:</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
