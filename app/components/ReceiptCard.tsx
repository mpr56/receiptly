"use client";

import { Receipt } from "@/types";
import { formatCurrency, formatDate } from "@/lib/data";
import GlassSurface from "./GlassSurface";
import { CreditCard, Banknote, Smartphone, ChevronRight } from "lucide-react";

const PAYMENT_ICONS = {
  card: CreditCard,
  cash: Banknote,
  digital: Smartphone,
};

interface Props {
  receipt: Receipt;
  onClick: () => void;
}

export default function ReceiptCard({ receipt, onClick }: Props) {
  const PayIcon = PAYMENT_ICONS[receipt.paymentMethod];

  return (
    <GlassSurface hover onClick={onClick} padding="none">
      <div className="p-5 flex items-center gap-4">
        {/* Store logo */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: `${receipt.storeColor}22`,
            border: `1px solid ${receipt.storeColor}55`,
            color: receipt.storeColor,
          }}
        >
          {receipt.storeLogoInitials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white/90 font-medium text-sm truncate">
              {receipt.storeName}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.18)",
                color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              {receipt.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/40 text-xs">
            <span>{formatDate(receipt.date)}</span>
            <span className="flex items-center gap-1">
              <PayIcon size={11} />
              {receipt.paymentMethod}
            </span>
            <span>{receipt.items.length} items</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white font-semibold text-sm">
            {formatCurrency(receipt.totalAmount)}
          </span>
          <ChevronRight size={15} className="text-white/25" />
        </div>
      </div>
    </GlassSurface>
  );
}
