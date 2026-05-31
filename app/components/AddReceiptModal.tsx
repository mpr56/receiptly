"use client";

import { useState, useRef, useCallback } from "react";
import { Receipt, ProductCategory } from "@/types";
import { CATEGORIES, getStoreColor, getInitials } from "@/lib/data";
import { processReceiptImage } from "@/lib/imageProcessor";
import { scanReceipt, OCRResult } from "@/lib/ocr";
import { X, Camera, Upload, Plus, Trash2, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";

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

interface ScanProgress {
  pct: number;
  status: string;
}

// Confidence badge
function ConfidenceBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  const high = score >= 0.75;
  return (
    <span
      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
      style={{
        background: high ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
        border: `1px solid ${high ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"}`,
        color: high ? "#86efac" : "#fde68a",
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
  const [scanProgress, setScanProgress] = useState<ScanProgress>({ pct: 0, status: "" });
  const [ocr, setOcr] = useState<OCRResult | null>(null);

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "digital">("card");
  const [items, setItems] = useState<ItemRow[]>([{ name: "", quantity: 1, unitPrice: 0 }]);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    setStep("scanning");
    setScanProgress({ pct: 2, status: "Processing image…" });

    try {
      // Step 1: compress + crop
      const processed = await processReceiptImage(file);
      setImageDataUrl(processed.dataUrl);
      setCompressedKB({ original: processed.originalSizeKB, compressed: processed.compressedSizeKB });
      setScanProgress({ pct: 8, status: "Image ready, scanning…" });

      // Step 2: OCR
      const result = await scanReceipt(processed.dataUrl, (pct, status) => {
        setScanProgress({ pct, status });
      });

      setOcr(result);

      // Pre-fill form
      setStoreName(result.storeName);
      setCategory(result.category);
      if (result.date) setDate(result.date);
      if (result.time) setTime(result.time);
      setPaymentMethod(result.paymentMethod);
      if (result.items.length > 0) {
        setItems(result.items);
      }

      setStep("details");
    } catch (err) {
      console.error("Scan failed:", err);
      // Fall through to manual entry
      setStep("details");
    }
  }, []);

  function addItem() {
    setItems([...items, { name: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof ItemRow, value: string | number) {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function handleSubmit() {
    if (!storeName.trim()) return;
    const dateTime = time ? `${date}T${time}:00` : `${date}T12:00:00`;
    const receipt: Receipt = {
      id: Date.now().toString(),
      storeName: storeName.trim(),
      storeLogoInitials: getInitials(storeName.trim()),
      storeColor: getStoreColor(storeName.trim()),
      category,
      date: new Date(dateTime).toISOString(),
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
      tags: [],
    };
    onAdd(receipt);
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "rgba(255,255,255,0.85)",
    outline: "none",
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={step !== "scanning" ? onClose : undefined}
    >
      <div
        className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "rgba(13,11,24,0.97)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-semibold text-lg">
            {step === "photo" && "Add Receipt"}
            {step === "scanning" && "Scanning…"}
            {step === "details" && (ocr ? "Confirm Details" : "Add Receipt")}
          </h2>
          {step !== "scanning" && (
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── STEP: PHOTO ───────────────────────────────────────── */}
        {step === "photo" && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-white/50 text-sm text-center mb-2">
              Take or upload a photo — we'll scan it automatically
            </p>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])} />

            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-3 py-5 rounded-2xl transition-all"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
            >
              <Camera size={22} />
              <span className="font-medium">Take Photo</span>
            </button>

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              <Upload size={18} />
              <span className="text-sm">Upload from Library</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-white/30 text-xs">or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <button onClick={() => setStep("details")} className="text-white/50 text-sm hover:text-white/70 transition-colors py-2">
              Skip — enter details manually
            </button>
          </div>
        )}

        {/* ── STEP: SCANNING ────────────────────────────────────── */}
        {step === "scanning" && (
          <div className="p-10 flex flex-col items-center gap-6">
            {/* Receipt thumbnail with scan line animation */}
            {imageDataUrl && (
              <div className="relative w-28 h-44 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                <img src={imageDataUrl} alt="Receipt" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "rgba(8,8,15,0.45)" }} />
                {/* Animated scan line */}
                <div
                  className="absolute left-0 right-0 h-0.5"
                  style={{
                    background: "linear-gradient(90deg, transparent, #6366f1, #a78bfa, transparent)",
                    boxShadow: "0 0 8px rgba(99,102,241,0.9)",
                    animation: "scanline 1.8s ease-in-out infinite",
                    top: `${scanProgress.pct}%`,
                    transition: "top 0.4s ease",
                  }}
                />
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full max-w-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs flex items-center gap-1.5">
                  <Sparkles size={11} className="text-indigo-400" />
                  Llama 4 Scout Vision
                </span>
                <span className="text-white/30 text-xs">{scanProgress.pct}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${scanProgress.pct}%`,
                    background: scanProgress.pct === 100
                      ? "#22c55e"
                      : "linear-gradient(90deg, #6366f1, #a78bfa)",
                    boxShadow: scanProgress.pct < 100 ? "0 0 6px rgba(99,102,241,0.7)" : "none",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 size={14} className="animate-spin text-indigo-400" />
              {scanProgress.status}
            </div>

            <p className="text-white/20 text-xs text-center">
              Reading your receipt with AI vision<br />Usually takes 3–5 seconds
            </p>
          </div>
        )}

        {/* ── STEP: DETAILS ─────────────────────────────────────── */}
        {step === "details" && (
          <div className="p-6 flex flex-col gap-5">

            {/* OCR badge + image compression info */}
            {ocr && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-medium">Receipt auto-scanned</span>
                </div>
                {compressedKB && (
                  <span className="text-white/30 text-xs">
                    {compressedKB.original}KB → {compressedKB.compressed}KB
                  </span>
                )}
              </div>
            )}

            {/* Preview photo */}
            {imageDataUrl && (
              <div className="relative">
                <img src={imageDataUrl} alt="Receipt" className="w-full rounded-xl max-h-36 object-cover" />
                <button onClick={() => setImageDataUrl(undefined)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Trash2 size={14} className="text-white/70" />
                </button>
              </div>
            )}

            {/* Store name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-white/50 text-xs uppercase tracking-widest">Store Name *</label>
                {ocr && <ConfidenceBadge score={ocr.confidence.storeName} />}
              </div>
              <input style={inputStyle} placeholder="e.g. Woolworths" value={storeName}
                onChange={(e) => setStoreName(e.target.value)} />
            </div>

            {/* Category + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Category</label>
                <select style={{ ...inputStyle, width: "100%" }} value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: "#0d0b18" }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-white/50 text-xs uppercase tracking-widest">Date</label>
                  {ocr && <ConfidenceBadge score={ocr.confidence.date} />}
                </div>
                <input type="date" style={inputStyle} value={date}
                  onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {/* Time + Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Time</label>
                <input type="time" style={inputStyle} value={time}
                  onChange={(e) => setTime(e.target.value)} />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-widest mb-2 block">Payment</label>
                <div className="flex gap-1.5">
                  {(["card", "cash", "digital"] as const).map((pm) => (
                    <button key={pm} onClick={() => setPaymentMethod(pm)}
                      className="flex-1 py-2 rounded-xl text-xs capitalize transition-all"
                      style={{
                        background: paymentMethod === pm ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${paymentMethod === pm ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
                        color: paymentMethod === pm ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                      }}>
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-white/50 text-xs uppercase tracking-widest">Items</label>
                  {ocr && <ConfidenceBadge score={ocr.confidence.items} />}
                </div>
                <button onClick={addItem} className="flex items-center gap-1 text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input style={{ ...inputStyle, flex: 3 }} placeholder="Item name" value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="Qty" min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
                    <input style={{ ...inputStyle, flex: 1.5 }} type="number" placeholder="$" step="0.01" min={0}
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-white/25 hover:text-red-400 transition-colors px-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-sm">Total</span>
                {ocr && <ConfidenceBadge score={ocr.confidence.total} />}
              </div>
              <span className="text-white font-bold">
                {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
                  total || ocr?.totalAmount || 0
                )}
              </span>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!storeName.trim()}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: "rgba(99,102,241,0.85)", color: "white", border: "1px solid rgba(99,102,241,0.5)" }}>
              Save Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
