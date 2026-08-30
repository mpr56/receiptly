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
  imageDataUrl?: string; // base64 photo
  notes?: string;
  paymentMethod: "cash" | "card" | "digital";
  tags: string[];
}

export type SortField = "date" | "amount" | "store";

export interface FilterState {
  search: string;
  /** Empty array means "no category filter", i.e. show all. */
  categories: ProductCategory[];
  sortField: SortField;
}
