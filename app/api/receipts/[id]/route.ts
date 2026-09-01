import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECEIPTS_BUCKET, rowToReceipt } from "@/lib/receipts";
import type { ReceiptRow } from "@/types";

/** Long enough that an open receipt does not go blank while it is being read. */
const SIGNED_URL_TTL_SECONDS = 3600;

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/receipts/:id — one receipt, plus a freshly signed URL for its
 * image. Signing happens here rather than in the list because the ledger
 * renders no images: signing a page of them would be 50 wasted round trips.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // No user_id filter: RLS already restricts this to the caller's own rows, so
  // someone else's id simply returns nothing.
  const { data, error } = await supabase.from("receipts").select().eq("id", id).maybeSingle();

  if (error) {
    console.error("Receipt fetch failed:", error);
    return NextResponse.json({ error: "Failed to load receipt" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const receipt = rowToReceipt(data as ReceiptRow);

  let imageUrl: string | null = null;
  if (receipt.imagePath) {
    const { data: signed } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(receipt.imagePath, SIGNED_URL_TTL_SECONDS);
    imageUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({ receipt, imageUrl });
}

/** DELETE /api/receipts/:id — remove the row, then its image. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Delete returns the row so we learn the image path and whether RLS let the
  // delete through, in one round trip.
  const { data, error } = await supabase.from("receipts").delete().eq("id", id).select().maybeSingle();

  if (error) {
    console.error("Receipt delete failed:", error);
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const imagePath = (data as ReceiptRow).image_path;
  if (imagePath) {
    const { error: removeError } = await supabase.storage.from(RECEIPTS_BUCKET).remove([imagePath]);
    // The receipt is already gone, so a failure here leaves an unreferenced
    // object rather than a broken record. Log it and report success.
    if (removeError) console.error("Receipt image cleanup failed:", removeError);
  }

  return NextResponse.json({ ok: true });
}
