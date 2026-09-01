import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReceiptStats, parseListParams } from "@/lib/receipts";

/**
 * GET /api/receipts/stats — X-report figures over the whole filtered set.
 *
 * Separate from the list endpoint because the list is one page: summing what
 * the client happens to have loaded would report a page's total, not a
 * collection's.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { search, categories } = parseListParams(req.nextUrl.searchParams);
    return NextResponse.json(await getReceiptStats(supabase, { search, categories }));
  } catch (err) {
    console.error("Receipt stats failed:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
