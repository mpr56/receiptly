export type ProductCategory =
  | "Food & Dining"
  | "Groceries"
  | "Electronics"
  | "Clothing & Apparel"
  | "Health & Pharmacy"
  | "Transportation"
  | "Entertainment"
  | "Home & Garden"
  | "Services"
  | "Other";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: string;
  storeName: string;
  storeLogoInitials: string;
  storeColor: string;
  category: ProductCategory;
  date: string; // ISO string
  totalAmount: number;
  currency: string;
  items: ReceiptItem[];
  /**
   * Storage object path, e.g. `{userId}/{receiptId}.jpg` — not a URL. Signed
   * URLs expire, so one is minted on demand when a receipt is opened.
   * Undefined for receipts entered without a photo.
   */
  imagePath?: string;
  notes?: string;
  paymentMethod: "cash" | "card" | "digital";
  tags: string[];
}

/** A row as it comes back from Postgres. */
export interface ReceiptRow {
  id: string;
  user_id: string;
  store_name: string;
  category: string;
  purchased_at: string;
  total_amount: number | string;
  currency: string;
  payment_method: "cash" | "card" | "digital";
  tags: string[];
  notes: string | null;
  items: ReceiptItem[];
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export type SortField = "date" | "amount" | "store";

export interface FilterState {
  search: string;
  /** Empty array means "no category filter", i.e. show all. */
  categories: ProductCategory[];
  sortField: SortField;
}

/**
 * Opaque keyset cursor. Encodes the sort value and id of the last row on the
 * previous page, so the next page seeks straight past it.
 */
export type ReceiptCursor = string;

export interface ReceiptPage {
  receipts: Receipt[];
  /** Null when this was the last page. */
  nextCursor: ReceiptCursor | null;
}

/**
 * Aggregates over the whole filtered set, computed in Postgres. Once the
 * ledger is paginated these cannot be derived from the loaded receipts.
 */
export interface ReceiptStats {
  receiptCount: number;
  totalSpend: number;
  avgBasket: number;
  largestAmount: number | null;
  largestStore: string | null;
  /** Every receipt on file for this user, ignoring filters. */
  totalCount: number;
}
