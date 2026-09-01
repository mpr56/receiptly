import { NextRequest, NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  RECEIPTS_BUCKET,
  decodeDataUrl,
  imagePathFor,
  listReceipts,
  newReceiptToRow,
  parseListParams,
  parseNewReceipt,
  rowToReceipt,
} from "@/lib/receipts";
import type { ReceiptRow } from "@/types";

/** GET /api/receipts — one keyset-paginated page of the ledger. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const page = await listReceipts(supabase, parseListParams(req.nextUrl.searchParams));
    return NextResponse.json(page);
  } catch (err) {
    console.error("List receipts failed:", err);
    return NextResponse.json({ error: "Failed to load receipts" }, { status: 500 });
  }
}

/** POST /api/receipts — store one scanned receipt and its image. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = await createClient();

  const parsed = parseNewReceipt(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.input;

  const id = crypto.randomUUID();
  let imagePath: string | null = null;

  // Image first, row second. A failed insert leaves an orphaned object, which
  // nothing references and nobody sees. The reverse — a row pointing at an
  // image that was never uploaded — is a visibly broken receipt.
  if (input.imageDataUrl) {
    const decoded = decodeDataUrl(input.imageDataUrl);
    if (!decoded) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });

    imagePath = imagePathFor(user.id, id, decoded.contentType);
    const { error: uploadError } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(imagePath, decoded.bytes, { contentType: decoded.contentType, upsert: true });

    if (uploadError) {
      console.error("Receipt image upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to store receipt image" }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("receipts")
    .insert(newReceiptToRow(input, user.id, id, imagePath))
    .select()
    .single();

  if (error || !data) {
    console.error("Receipt insert failed:", error);
    // Take the orphan back out rather than leaving it to accumulate.
    if (imagePath) await supabase.storage.from(RECEIPTS_BUCKET).remove([imagePath]);
    return NextResponse.json({ error: "Failed to save receipt" }, { status: 500 });
  }

  return NextResponse.json(rowToReceipt(data as ReceiptRow), { status: 201 });
}
