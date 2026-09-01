import { redirect } from "next/navigation";
import { createClient, displayName } from "@/lib/supabase/server";
import { listReceipts, getReceiptStats } from "@/lib/receipts";
import Ledger from "./components/Ledger";

/**
 * Server shell. The first page of receipts and the register totals are fetched
 * here, so the ledger arrives printed rather than as a spinner that fills in.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this route; this is the backstop, and it also
  // narrows `user` for everything below.
  if (!user) redirect("/sign-in");

  const [page, stats] = await Promise.all([listReceipts(supabase), getReceiptStats(supabase)]);

  return <Ledger initialPage={page} initialStats={stats} userName={displayName(user)} />;
}
