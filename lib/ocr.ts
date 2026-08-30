import { ProductCategory } from "@/types";

export interface OCRResult {
  storeName: string;
  date: string;
  time: string;
  totalAmount: number;
  paymentMethod: "card" | "cash" | "digital";
  items: { name: string; quantity: number; unitPrice: number }[];
  category: ProductCategory;
  confidence: {
    storeName: number;
    date: number;
    total: number;
    items: number;
  };
}

// --- Category inference -------------------------------------------------------
const CATEGORY_MAP: { keywords: string[]; category: ProductCategory }[] = [
  { keywords: ["woolworths", "coles", "aldi", "iga", "foodland", "harris farm", "grocery", "supermarket"], category: "Groceries" },
  { keywords: ["mcdonald", "kfc", "hungry jack", "subway", "domino", "pizza", "noodle", "sushi", "cafe", "restaurant", "uber eats", "doordash", "menulog", "grill", "burger", "bakery", "coffee", "alex & co", "bistro", "kitchen", "dining", "eatery"], category: "Food & Dining" },
  { keywords: ["jb hi-fi", "jbhifi", "apple", "harvey norman", "officeworks", "samsung", "tech", "computer", "electronics", "phone", "camera"], category: "Electronics" },
  { keywords: ["chemist", "pharmacy", "priceline", "terry white", "amcal", "health", "medical", "vitamin", "supplement"], category: "Health & Pharmacy" },
  { keywords: ["adidas", "nike", "kmart", "target", "big w", "cotton on", "h&m", "zara", "uniqlo", "myer", "david jones", "sport", "apparel", "fashion", "clothing", "shoes"], category: "Clothing & Apparel" },
  { keywords: ["uber", "taxi", "transport", "bus", "train", "opal", "parking", "toll", "fuel", "petrol", "shell", "bp", "caltex", "ampol"], category: "Transportation" },
  { keywords: ["netflix", "spotify", "steam", "cinema", "event", "ticketek", "game", "entertainment", "movie"], category: "Entertainment" },
  { keywords: ["bunnings", "ikea", "garden", "hardware", "plumbing", "paint", "mitre 10"], category: "Home & Garden" },
  { keywords: ["telstra", "optus", "vodafone", "insurance", "bank", "subscription", "internet", "nbn"], category: "Services" },
];

export function inferCategory(storeName: string): ProductCategory {
  const lower = storeName.toLowerCase();
  for (const { keywords, category } of CATEGORY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Other";
}

// --- Main export, single vision API call -------------------------------------
export async function scanReceipt(
  imageDataUrl: string,
  onProgress?: (pct: number, status: string) => void
): Promise<OCRResult> {
  onProgress?.(15, "Sending to Qwen 3.8 Vision…");

  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  });

  onProgress?.(75, "Reading receipt…");

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? "Scan failed");
  }

  const data = await response.json();

  onProgress?.(92, "Structuring data…");

  const category = inferCategory(data.storeName ?? "");

  onProgress?.(100, "Done");

  return {
    storeName: data.storeName ?? "",
    date: data.date ?? "",
    time: data.time ?? "",
    totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : 0,
    paymentMethod: data.paymentMethod ?? "card",
    items: (data.items ?? []).map((item: { name: string; quantity: number; unitPrice: number }) => ({
      name: item.name ?? "",
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
    })),
    category,
    confidence: {
      storeName: data.confidence?.storeName ?? 0,
      date: data.confidence?.date ?? 0,
      total: data.confidence?.total ?? 0,
      items: data.confidence?.items ?? 0,
    },
  };
}
