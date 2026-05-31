"use client";

import { Receipt } from "@/types";
import { formatCurrency, groupByStore, groupByCategory, totalSpend } from "@/lib/data";
import GlassSurface from "./GlassSurface";
import { Receipt as ReceiptIcon, Store, Tag, TrendingUp } from "lucide-react";

interface Props {
  receipts: Receipt[];
}

export default function StatsBar({ receipts }: Props) {
  const spend = totalSpend(receipts);
  const stores = Object.keys(groupByStore(receipts)).length;
  const categories = Object.keys(groupByCategory(receipts)).length;
  const avgOrder = receipts.length > 0 ? spend / receipts.length : 0;

  const stats = [
    {
      label: "Total Spend",
      value: formatCurrency(spend),
      icon: TrendingUp,
      color: "#6366f1",
    },
    {
      label: "Receipts",
      value: receipts.length.toString(),
      icon: ReceiptIcon,
      color: "#a78bfa",
    },
    {
      label: "Stores",
      value: stores.toString(),
      icon: Store,
      color: "#818cf8",
    },
    {
      label: "Avg. Order",
      value: formatCurrency(avgOrder),
      icon: Tag,
      color: "#c4b5fd",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <GlassSurface key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}
              >
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">{s.label}</p>
                <p className="text-white font-semibold text-sm leading-none">{s.value}</p>
              </div>
            </div>
          </GlassSurface>
        );
      })}
    </div>
  );
}
