"use client";

import { useState, useRef, useCallback } from "react";
import { Receipt, ProductCategory } from "@/types";
import { CATEGORIES, getStoreColor, getInitials } from "@/lib/data";
import { processReceiptImage } from "@/lib/imageProcessor";
import { scanReceipt, OCRResult } from "@/lib/ocr";
import { T, SANS, seg, fieldStyle, labelStyle, fmtMoney } from "./theme";
import { Camera, Upload, Trash2, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface Props {
  onAdd: (receipt: Receipt) => void;
  onClose: () => void;
}

interface ItemRow {
  name: string;
  quantity: number;
  unitPrice: number;
}

type Step = "photo" | "scanning" | "details";

function ConfidenceBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  const high = score >= 0.75;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 999,
        fontFamily: SANS,
        background: high ? "oklch(94% 0.05 145)" : "oklch(94% 0.06 85)",
        color: high ? "oklch(38% 0.09 145)" : "oklch(40% 0.1 75)",
      }}
    >
      {high ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
      {high ? "Auto-detected" : "Check this"}
    </span>
  );
}

export default function AddReceiptModal({ onAdd, onClose }: Props) {
  const [step, setStep] = useState<Step>("photo");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [compressedKB, setCompressedKB] = useState<{ original: number; compressed: number } | null>(null);
  const [scanProgress, setScanProgress] = useState({ pct: 0, status: "" });
  const [scanError, setScanError] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OCRResult | null>(null);

  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "digital">("card");
  const [items, setItems] = useState<ItemRow[]>([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [tagInput, setTagInput] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    setStep("scanning");
    setScanError(null);
    setScanProgress({ pct: 2, status: "Processing image…" });

    try {
      const processed = await processReceiptImage(file);
      setImageDataUrl(processed.dataUrl);
      setCompressedKB({ original: processed.originalSizeKB, compressed: processed.compressedSizeKB });
      setScanProgress({ pct: 8, status: "Image ready, scanning…" });

      const result = await scanReceipt(processed.dataUrl, (pct, status) =>
        setScanProgress({ pct, status })
      );

      setOcr(result);
      setStoreName(result.storeName);
      setCategory(result.category);
      if (result.date) setDate(result.date);
      setPaymentMethod(result.paymentMethod);
      if (result.items.length > 0) setItems(result.items);

      setStep("details");
    } catch (err) {
      console.error("Scan failed:", err);
      setScanError(err instanceof Error ? err.message : "Scan failed");
      setStep("details");
    }
  }, []);

  function updateItem(i: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  function handleSubmit() {
    if (!storeName.trim()) return;
    const receipt: Receipt = {
      id: Date.now().toString(),
      storeName: storeName.trim(),
      storeLogoInitials: getInitials(storeName.trim()),
      storeColor: getStoreColor(storeName.trim()),
      category,
      date: new Date(`${date}T12:00:00`).toISOString(),
      totalAmount: total || (ocr?.totalAmount ?? 0),
      currency: "AUD",
      items: items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: parseFloat((i.quantity * i.unitPrice).toFixed(2)),
        })),
      paymentMethod,
      imageDataUrl,
      notes: "",
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    onAdd(receipt);
  }

  return (
    <div
      onClick={step !== "scanning" ? onClose : undefined}
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
      <div
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-none"
        style={{
          background: "#fff",
          width: 440,
          maxWidth: "100%",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 24px 60px rgba(20,20,30,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "85vh",
          overflowY: "auto",
          boxSizing: "border-box",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: T.text }}>
            {step === "photo" && "Add Receipt"}
            {step === "scanning" && "Scanning…"}
            {step === "details" && (ocr ? "Confirm Details" : "Add Receipt")}
          </h3>
          {step !== "scanning" && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: "oklch(96% 0.005 90)",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                color: T.label,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── STEP: PHOTO ─────────────────────────────────────────── */}
        {step === "photo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.soft, textAlign: "center" }}>
              Take or upload a photo — we&apos;ll read it automatically
            </p>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
            <button
              onClick={() => cameraRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "18px 0",
                borderRadius: 12,
                border: `1.5px dashed ${T.accent}`,
                background: "transparent",
                color: T.accent,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <Camera size={20} />
              Take Photo
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 0",
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                background: "#fff",
                color: T.label,
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <Upload size={16} />
              Upload from Library
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.faint }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <button
              onClick={() => setStep("details")}
              style={{
                border: "none",
                background: "none",
                color: T.soft,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Skip — enter details manually
            </button>
          </div>
        )}

        {/* ── STEP: SCANNING ──────────────────────────────────────── */}
        {step === "scanning" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              padding: "24px 0",
            }}
          >
            {imageDataUrl && (
              <div
                style={{
                  position: "relative",
                  width: 112,
                  height: 176,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={imageDataUrl}
                  alt="Receipt"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 2,
                    top: `${scanProgress.pct}%`,
                    background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
                    boxShadow: `0 0 8px ${T.accent}`,
                    transition: "top 0.4s ease",
                  }}
                />
              </div>
            )}

            <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.soft }}>
                  <Sparkles size={11} style={{ color: T.accent }} />
                  Qwen 3.8 Vision
                </span>
                <span style={{ color: T.faint }}>{scanProgress.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: "oklch(93% 0.005 90)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${scanProgress.pct}%`,
                    borderRadius: 999,
                    background: scanProgress.pct === 100 ? "oklch(60% 0.15 145)" : T.accent,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.soft }}>
              <Loader2 size={14} className="animate-spin" style={{ color: T.accent }} />
              {scanProgress.status}
            </div>
          </div>
        )}

        {/* ── STEP: DETAILS ───────────────────────────────────────── */}
        {step === "details" && (
          <>
            {scanError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "oklch(95% 0.04 25)",
                  color: "oklch(40% 0.12 25)",
                  fontSize: 12,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Couldn&apos;t read the receipt — enter the details manually. ({scanError})</span>
              </div>
            )}

            {ocr && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "oklch(96% 0.02 255)",
                  fontSize: 12,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.accent, fontWeight: 600 }}>
                  <Sparkles size={13} />
                  Receipt auto-scanned
                </span>
                {compressedKB && (
                  <span style={{ color: T.faint }}>
                    {compressedKB.original}KB → {compressedKB.compressed}KB
                  </span>
                )}
              </div>
            )}

            {imageDataUrl && (
              <div style={{ position: "relative" }}>
                <img
                  src={imageDataUrl}
                  alt="Receipt"
                  style={{ width: "100%", borderRadius: 10, maxHeight: 140, objectFit: "cover" }}
                />
                <button
                  onClick={() => setImageDataUrl(undefined)}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    padding: 6,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${T.border}`,
                    cursor: "pointer",
                    lineHeight: 0,
                  }}
                >
                  <Trash2 size={13} style={{ color: T.muted }} />
                </button>
              </div>
            )}

            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                Store name
                {ocr && <ConfidenceBadge score={ocr.confidence.storeName} />}
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Woolworths"
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  style={fieldStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                  Date
                  {ocr && <ConfidenceBadge score={ocr.confidence.date} />}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Payment</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["card", "digital", "cash"] as const).map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    style={{ ...seg(paymentMethod === pm), textTransform: "capitalize" }}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                Items
                {ocr && <ConfidenceBadge score={ocr.confidence.items} />}
              </label>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    placeholder="Item name"
                    style={{ ...fieldStyle, flex: 1, padding: "9px 12px" }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                    aria-label="Quantity"
                    style={{ ...fieldStyle, width: 58, padding: "9px 10px" }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={it.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    aria-label="Unit price"
                    style={{ ...fieldStyle, width: 82, padding: "9px 10px" }}
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                      aria-label="Remove item"
                      style={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 8,
                        border: `1px solid ${T.border}`,
                        background: "#fff",
                        cursor: "pointer",
                        color: T.soft,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setItems([...items, { name: "", quantity: 1, unitPrice: 0 }])}
                style={{
                  border: "none",
                  background: "none",
                  color: T.accent,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "inherit",
                }}
              >
                + Add item
              </button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 8,
                borderTop: "1px solid oklch(93% 0.005 90)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted }}>
                Total
                {ocr && <ConfidenceBadge score={ocr.confidence.total} />}
              </span>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
                {fmtMoney(total || ocr?.totalAmount || 0)}
              </span>
            </div>

            <div>
              <label style={labelStyle}>Tags (optional)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. weekly-shop, reimbursable"
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  borderRadius: 10,
                  padding: "11px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: T.label,
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!storeName.trim()}
                style={{
                  border: "none",
                  background: T.accent,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "11px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: storeName.trim() ? "pointer" : "not-allowed",
                  opacity: storeName.trim() ? 1 : 0.45,
                  fontFamily: "inherit",
                }}
              >
                Save Receipt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
