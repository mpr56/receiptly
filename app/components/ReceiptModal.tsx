"use client";

import { Receipt } from "@/types";
import { T, MONO, SANS, RECEIPT_CLIP, catStyle, fmtMoney } from "./theme";

interface Props {
  receipt: Receipt;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: Props) {
  const cs = catStyle(receipt.category);
  const dateLabel = new Date(receipt.date)
    .toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(20% 0.01 90 / 0.5)",
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
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: -14,
            right: -14,
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "#fff",
            border: `1px solid ${T.border}`,
            cursor: "pointer",
            fontSize: 16,
            color: T.label,
            zIndex: 2,
          }}
        >
          ×
        </button>

        <div className="scrollbar-none" style={{ maxHeight: "86vh", overflowY: "auto" }}>
          <div
            style={{
              background: "oklch(99% 0.002 90)",
              width: 360,
              maxWidth: "100%",
              padding: "36px 30px 30px",
              boxShadow: "0 24px 60px rgba(20,20,30,0.3)",
              transform: "rotate(-0.5deg)",
              fontFamily: MONO,
              color: "#1c1c1c",
              clipPath: RECEIPT_CLIP,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {receipt.storeName}
              </div>
              <div style={{ fontSize: 11, color: "#777", marginTop: 6, letterSpacing: "0.08em" }}>
                {dateLabel}
              </div>
            </div>

            <Rule margin="22px 0 18px" />

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.06em", color: "#777" }}>TOTAL PAID</span>
              <span
                style={{
                  background: cs.bg,
                  color: cs.text,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontFamily: SANS,
                  whiteSpace: "nowrap",
                }}
              >
                {receipt.category}
              </span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>
              {fmtMoney(receipt.totalAmount)}
            </div>
            <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
              Paid by {receipt.paymentMethod}
            </div>

            <Rule margin="20px 0 14px" />

            <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "#777", marginBottom: 10 }}>
              ITEMS
            </div>
            {receipt.items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "7px 0",
                  borderBottom: "1px dashed rgba(0,0,0,0.12)",
                  fontSize: 14,
                }}
              >
                <span>
                  {it.name}
                  {it.quantity > 1 && (
                    <span style={{ color: "#999", fontSize: 12 }}>
                      {" "}
                      {it.quantity} × {fmtMoney(it.unitPrice)}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {fmtMoney(it.totalPrice)}
                </span>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
                fontSize: 15,
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px dashed rgba(0,0,0,0.25)",
              }}
            >
              <span>TOTAL</span>
              <span>{fmtMoney(receipt.totalAmount)}</span>
            </div>

            {receipt.tags.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 16, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                {receipt.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-block",
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 11,
                      color: "#555",
                      fontFamily: SANS,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {receipt.imageDataUrl && (
              <img
                src={receipt.imageDataUrl}
                alt="Scanned receipt"
                style={{
                  width: "100%",
                  marginTop: 18,
                  maxHeight: 150,
                  objectFit: "cover",
                  filter: "grayscale(0.35) contrast(1.05)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            )}

            <div
              style={{
                height: 36,
                marginTop: 22,
                background:
                  "repeating-linear-gradient(90deg, #1a1a1a 0 2px, transparent 2px 3px, #1a1a1a 5px 6px, transparent 6px 9px, #1a1a1a 9px 12px, transparent 12px 14px)",
              }}
            />
            <div
              style={{
                textAlign: "center",
                fontSize: 9,
                color: "#999",
                letterSpacing: "0.06em",
                marginTop: 8,
              }}
            >
              receiptly.app/{receipt.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Rule({ margin }: { margin: string }) {
  return <div style={{ borderTop: "1px dashed rgba(0,0,0,0.25)", margin }} />;
}
