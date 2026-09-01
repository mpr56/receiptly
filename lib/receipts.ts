import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Receipt,
  ReceiptItem,
  ReceiptPage,
  ReceiptRow,
  ReceiptStats,
  ProductCategory,
  SortField,
} from "@/types";
import { CATEGORIES, getStoreColor, getInitials } from "@/lib/data";

export const PAGE_SIZE = 50;

const PAYMENT_METHODS = ["cash", "card", "digital"] as const;
const SORT_FIELDS: SortField[] = ["date", "amount", "store"];

// ---------------------------------------------------------------------------
// Row <-> Receipt
// ---------------------------------------------------------------------------

/**
 * storeColor and storeLogoInitials are computed here rather than stored, so a
 * change to the palette in lib/data.ts reaches every existing receipt.
 */
export function rowToReceipt(row: ReceiptRow): Receipt {
  const storeName = row.store_name;
  return {
    id: row.id,
    storeName,
    storeLogoInitials: getInitials(storeName),
    storeColor: getStoreColor(storeName),
    category: row.category as ProductCategory,
    date: row.purchased_at,
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    items: Array.isArray(row.items) ? row.items : [],
    paymentMethod: row.payment_method,
    tags: row.tags ?? [],
    notes: row.notes ?? undefined,
    imagePath: row.image_path ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Keyset cursors
// ---------------------------------------------------------------------------
// A cursor is the sort value and id of the last row on the previous page. The
// value is always carried as text and cast back to its real type in SQL, which
// keeps one cursor format working across all three sort fields.

interface Cursor {
  value: string;
  id: string;
}

export function encodeCursor(receipt: Receipt, sort: SortField): string {
  const value =
    sort === "amount"
      ? String(receipt.totalAmount)
      : sort === "store"
        ? receipt.storeName
        : receipt.date;
  return Buffer.from(JSON.stringify({ v: value, i: receipt.id }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined): Cursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed?.v !== "string" || typeof parsed?.i !== "string") return null;
    return { value: parsed.v, id: parsed.i };
  } catch {
    // A malformed cursor means "start from the beginning", not a 500.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface ListOptions {
  search?: string;
  categories?: string[];
  sort?: SortField;
  cursor?: string | null;
  limit?: number;
}

/** Normalises whatever arrived on the query string into safe RPC arguments. */
export function parseListParams(params: URLSearchParams): ListOptions {
  const sort = params.get("sort");
  const categories = params.getAll("category").filter((c) => CATEGORIES.includes(c as ProductCategory));
  return {
    search: params.get("search")?.trim() || undefined,
    categories: categories.length ? categories : undefined,
    sort: SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "date",
    cursor: params.get("cursor"),
  };
}

export async function listReceipts(
  supabase: SupabaseClient,
  opts: ListOptions = {}
): Promise<ReceiptPage> {
  const sort = opts.sort ?? "date";
  const limit = opts.limit ?? PAGE_SIZE;
  const cursor = decodeCursor(opts.cursor);

  // Ask for one more row than the page holds: its presence is what tells us
  // there is a next page, without a second count query.
  const { data, error } = await supabase.rpc("list_receipts", {
    p_search: opts.search ?? null,
    p_categories: opts.categories ?? null,
    p_sort: sort,
    p_cursor_value: cursor?.value ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit + 1,
  });

  if (error) throw new Error(`list_receipts failed: ${error.message}`);

  const rows = (data ?? []) as ReceiptRow[];
  const hasMore = rows.length > limit;
  const receipts = rows.slice(0, limit).map(rowToReceipt);

  return {
    receipts,
    nextCursor: hasMore && receipts.length ? encodeCursor(receipts[receipts.length - 1], sort) : null,
  };
}

export async function getReceiptStats(
  supabase: SupabaseClient,
  opts: Pick<ListOptions, "search" | "categories"> = {}
): Promise<ReceiptStats> {
  const { data, error } = await supabase.rpc("receipt_stats", {
    p_search: opts.search ?? null,
    p_categories: opts.categories ?? null,
  });

  if (error) throw new Error(`receipt_stats failed: ${error.message}`);

  // The function returns a single row; PostgREST hands back an array.
  const row = (Array.isArray(data) ? data[0] : data) ?? {};
  return {
    receiptCount: Number(row.receipt_count ?? 0),
    totalSpend: Number(row.total_spend ?? 0),
    avgBasket: Number(row.avg_basket ?? 0),
    largestAmount: row.largest_amount == null ? null : Number(row.largest_amount),
    largestStore: row.largest_store ?? null,
    totalCount: Number(row.total_count ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface NewReceiptInput {
  storeName: string;
  category: ProductCategory;
  date: string;
  totalAmount: number;
  currency: string;
  paymentMethod: "cash" | "card" | "digital";
  items: ReceiptItem[];
  tags: string[];
  notes?: string;
  /** Transient: uploaded to storage, never written to the row. */
  imageDataUrl?: string;
}

/**
 * Validates an untrusted request body. Returns the input or a reason string —
 * the caller turns that into a 400.
 */
export function parseNewReceipt(body: unknown): { input: NewReceiptInput } | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Expected an object" };
  const b = body as Record<string, unknown>;

  const storeName = typeof b.storeName === "string" ? b.storeName.trim() : "";
  if (!storeName) return { error: "storeName is required" };

  const date = typeof b.date === "string" ? b.date : "";
  if (!date || Number.isNaN(Date.parse(date))) return { error: "date must be an ISO date string" };

  const category = CATEGORIES.includes(b.category as ProductCategory)
    ? (b.category as ProductCategory)
    : "Other";

  const paymentMethod = PAYMENT_METHODS.includes(b.paymentMethod as (typeof PAYMENT_METHODS)[number])
    ? (b.paymentMethod as "cash" | "card" | "digital")
    : "card";

  const items: ReceiptItem[] = Array.isArray(b.items)
    ? b.items
        .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
        .map((i) => {
          const quantity = Number(i.quantity) || 0;
          const unitPrice = Number(i.unitPrice) || 0;
          return {
            name: String(i.name ?? "").trim(),
            quantity,
            unitPrice,
            totalPrice: Number(i.totalPrice) || round2(quantity * unitPrice),
          };
        })
        .filter((i) => i.name)
    : [];

  const totalAmount = Number(b.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount < 0) return { error: "totalAmount must be a number" };

  const imageDataUrl = typeof b.imageDataUrl === "string" ? b.imageDataUrl : undefined;
  if (imageDataUrl && !DATA_URL.test(imageDataUrl)) return { error: "imageDataUrl is not a data URL" };

  return {
    input: {
      storeName,
      category,
      date,
      totalAmount: round2(totalAmount),
      currency: typeof b.currency === "string" && b.currency ? b.currency : "AUD",
      paymentMethod,
      items,
      tags: Array.isArray(b.tags) ? b.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      notes: typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : undefined,
      imageDataUrl,
    },
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

/** Splits a base64 data URL into bytes and content type for the storage upload. */
export function decodeDataUrl(dataUrl: string): { bytes: Buffer; contentType: string } | null {
  const match = dataUrl.match(DATA_URL);
  if (!match) return null;
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64") };
}

export function newReceiptToRow(input: NewReceiptInput, userId: string, id: string, imagePath: string | null) {
  return {
    id,
    user_id: userId,
    store_name: input.storeName,
    category: input.category,
    purchased_at: new Date(input.date).toISOString(),
    total_amount: input.totalAmount,
    currency: input.currency,
    payment_method: input.paymentMethod,
    tags: input.tags,
    notes: input.notes ?? null,
    items: input.items,
    image_path: imagePath,
  };
}

export const RECEIPTS_BUCKET = "receipts";

/** Objects live at {userId}/{receiptId}.ext so storage policies can authorise on the prefix. */
export function imagePathFor(userId: string, receiptId: string, contentType: string): string {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return `${userId}/${receiptId}.${ext}`;
}
