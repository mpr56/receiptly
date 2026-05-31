"use client";

import { Receipt } from "@/types";
import { formatCurrency, formatDate } from "@/lib/data";
import { X, CreditCard, Banknote, Smartphone, Tag, Camera } from "lucide-react";
import GlassSurface from "./GlassSurface";

const PAYMENT_ICONS = {
  card: CreditCard,
  cash: Banknote,
  digital: Smartphone,
};

interface Props {
  receipt: Receipt;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: Props) {
  const PayIcon = PAYMENT_ICONS[receipt.paymentMethod];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: "rgba(16,14,28,0.92)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-13 h-13 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{
                  background: `${receipt.storeColor}22`,
                  border: `1px solid ${receipt.storeColor}55`,
                  color: receipt.storeColor,
                  width: 52,
                  height: 52,
                }}
              >
                {receipt.storeLogoInitials}
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">{receipt.storeName}</h2>
                <p className="text-white/40 text-sm">{formatDate(receipt.date)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors rounded-lg p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Total + category */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">Total Paid</p>
              <p className="text-white text-3xl font-bold tracking-tight">
                {formatCurrency(receipt.totalAmount)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99,102,241,0.35)",
                }}
              >
                {receipt.category}
              </span>
              <span className="flex items-center gap-1 text-white/40 text-xs">
                <PayIcon size={11} />
                {receipt.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Items</p>
          <div className="space-y-2">
            {receipt.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-sm truncate">{item.name}</p>
                  {item.quantity > 1 && (
                    <p className="text-white/35 text-xs">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  )}
                </div>
                <span className="text-white/70 text-sm font-medium ml-4">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="flex items-center justify-between mt-4 pt-3">
            <span className="text-white/60 text-sm font-medium">Total</span>
            <span className="text-white font-bold">{formatCurrency(receipt.totalAmount)}</span>
          </div>
        </div>

        {/* Tags */}
        {receipt.tags.length > 0 && (
          <div
            className="px-6 pb-4 flex flex-wrap gap-2"
          >
            {receipt.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Receipt photo placeholder */}
        {receipt.imageDataUrl ? (
          <div className="px-6 pb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Receipt Photo</p>
            <img
              src={receipt.imageDataUrl}
              alt="Receipt"
              className="w-full rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div
              className="rounded-xl p-6 flex flex-col items-center gap-2 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
              }}
            >
              <Camera size={20} className="text-white/25" />
              <p className="text-white/30 text-xs">No receipt photo attached</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
