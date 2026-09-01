import { Receipt, ProductCategory } from "@/types";

export const STORE_COLORS: Record<string, string> = {
  "Woolworths": "#007B40",
  "Coles": "#E31837",
  "JB Hi-Fi": "#FFD700",
  "Apple Store": "#555555",
  "McDonald's": "#FFC72C",
  "Chemist Warehouse": "#E31837",
  "ALDI": "#00A0E0",
  "Kmart": "#E31837",
  "Bunnings": "#00AA00",
  "Uber Eats": "#06C167",
  "7-Eleven": "#FF6B00",
  "Netflix": "#E50914",
  default: "#6366f1",
};

export const CATEGORIES: ProductCategory[] = [
  "Food & Dining",
  "Groceries",
  "Electronics",
  "Clothing & Apparel",
  "Health & Pharmacy",
  "Transportation",
  "Entertainment",
  "Home & Garden",
  "Services",
  "Other",
];

export function getStoreColor(storeName: string): string {
  return STORE_COLORS[storeName] ?? STORE_COLORS.default;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatCurrency(amount: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function groupByStore(receipts: Receipt[]): Record<string, Receipt[]> {
  return receipts.reduce((acc, r) => {
    if (!acc[r.storeName]) acc[r.storeName] = [];
    acc[r.storeName].push(r);
    return acc;
  }, {} as Record<string, Receipt[]>);
}

export function groupByCategory(receipts: Receipt[]): Record<string, Receipt[]> {
  return receipts.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Receipt[]>);
}

export function totalSpend(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => sum + r.totalAmount, 0);
}
