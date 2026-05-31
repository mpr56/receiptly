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

export const MOCK_RECEIPTS: Receipt[] = [
  {
    id: "1",
    storeName: "Woolworths",
    storeLogoInitials: "WW",
    storeColor: "#007B40",
    category: "Groceries",
    date: "2026-05-28T10:23:00",
    totalAmount: 87.45,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["weekly-shop"],
    items: [
      { name: "Full Cream Milk 2L", quantity: 2, unitPrice: 3.2, totalPrice: 6.4 },
      { name: "Sourdough Bread", quantity: 1, unitPrice: 5.5, totalPrice: 5.5 },
      { name: "Free Range Eggs 12pk", quantity: 1, unitPrice: 7.9, totalPrice: 7.9 },
      { name: "Chicken Breast 500g", quantity: 2, unitPrice: 10.0, totalPrice: 20.0 },
      { name: "Broccoli", quantity: 1, unitPrice: 3.5, totalPrice: 3.5 },
      { name: "Greek Yogurt 500g", quantity: 1, unitPrice: 5.2, totalPrice: 5.2 },
      { name: "Orange Juice 1L", quantity: 2, unitPrice: 4.9, totalPrice: 9.8 },
    ],
  },
  {
    id: "2",
    storeName: "JB Hi-Fi",
    storeLogoInitials: "JB",
    storeColor: "#FFD700",
    category: "Electronics",
    date: "2026-05-24T14:11:00",
    totalAmount: 249.0,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["gadgets"],
    items: [
      { name: "Sony WH-1000XM5 Headphones", quantity: 1, unitPrice: 249.0, totalPrice: 249.0 },
    ],
  },
  {
    id: "3",
    storeName: "McDonald's",
    storeLogoInitials: "MC",
    storeColor: "#FFC72C",
    category: "Food & Dining",
    date: "2026-05-27T19:45:00",
    totalAmount: 22.7,
    currency: "AUD",
    paymentMethod: "digital",
    tags: ["lunch"],
    items: [
      { name: "Big Mac Meal Large", quantity: 1, unitPrice: 14.5, totalPrice: 14.5 },
      { name: "McFlurry Oreo", quantity: 1, unitPrice: 5.2, totalPrice: 5.2 },
      { name: "Apple Pie", quantity: 1, unitPrice: 3.0, totalPrice: 3.0 },
    ],
  },
  {
    id: "4",
    storeName: "Chemist Warehouse",
    storeLogoInitials: "CW",
    storeColor: "#E31837",
    category: "Health & Pharmacy",
    date: "2026-05-20T11:30:00",
    totalAmount: 54.3,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["health"],
    items: [
      { name: "Vitamin D3 1000IU 200 tabs", quantity: 1, unitPrice: 18.99, totalPrice: 18.99 },
      { name: "Magnesium 300mg 60 tabs", quantity: 1, unitPrice: 22.5, totalPrice: 22.5 },
      { name: "Ibuprofen 200mg 24pk", quantity: 1, unitPrice: 6.99, totalPrice: 6.99 },
      { name: "Band-Aid Assorted 30pk", quantity: 1, unitPrice: 5.79, totalPrice: 5.79 },
    ],
  },
  {
    id: "5",
    storeName: "Coles",
    storeLogoInitials: "CO",
    storeColor: "#E31837",
    category: "Groceries",
    date: "2026-05-15T09:12:00",
    totalAmount: 63.2,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["weekly-shop"],
    items: [
      { name: "Pasta 500g x3", quantity: 3, unitPrice: 2.5, totalPrice: 7.5 },
      { name: "Canned Tomatoes 400g x4", quantity: 4, unitPrice: 1.8, totalPrice: 7.2 },
      { name: "Olive Oil 750ml", quantity: 1, unitPrice: 12.0, totalPrice: 12.0 },
      { name: "Salmon Fillet 400g", quantity: 2, unitPrice: 13.0, totalPrice: 26.0 },
    ],
  },
  {
    id: "6",
    storeName: "Uber Eats",
    storeLogoInitials: "UE",
    storeColor: "#06C167",
    category: "Food & Dining",
    date: "2026-05-22T20:10:00",
    totalAmount: 41.85,
    currency: "AUD",
    paymentMethod: "digital",
    tags: ["takeaway"],
    items: [
      { name: "Pad Thai Chicken", quantity: 2, unitPrice: 16.9, totalPrice: 33.8 },
      { name: "Spring Rolls x4", quantity: 1, unitPrice: 8.0, totalPrice: 8.0 },
      { name: "Delivery Fee", quantity: 1, unitPrice: 0.05, totalPrice: 0.05 },
    ],
  },
  {
    id: "7",
    storeName: "Bunnings",
    storeLogoInitials: "BW",
    storeColor: "#00AA00",
    category: "Home & Garden",
    date: "2026-05-10T08:45:00",
    totalAmount: 138.6,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["home"],
    items: [
      { name: "Paint Roller Kit", quantity: 1, unitPrice: 24.98, totalPrice: 24.98 },
      { name: "Interior Wall Paint 4L", quantity: 2, unitPrice: 48.0, totalPrice: 96.0 },
      { name: "Sandpaper Assorted 10pk", quantity: 1, unitPrice: 9.98, totalPrice: 9.98 },
    ],
  },
  {
    id: "8",
    storeName: "Apple Store",
    storeLogoInitials: "AS",
    storeColor: "#555555",
    category: "Electronics",
    date: "2026-04-30T16:00:00",
    totalAmount: 1699.0,
    currency: "AUD",
    paymentMethod: "card",
    tags: ["tech", "big-purchase"],
    items: [
      { name: "MacBook Air M3 13-inch 16GB", quantity: 1, unitPrice: 1699.0, totalPrice: 1699.0 },
    ],
  },
];

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
