import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST only, deliberately. A GET sign-out gets fired by link prefetching and
 * by anything that crawls URLs, which signs people out without them asking.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  // 303 so the browser follows with GET rather than re-POSTing to /sign-in.
  return NextResponse.redirect(`${origin}/sign-in`, { status: 303 });
}
