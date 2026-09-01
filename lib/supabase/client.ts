"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser. Used only to start the Google OAuth flow —
 * every read and write goes through the app's own API routes, which run as the
 * signed-in user server-side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
