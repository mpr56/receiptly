import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, route handlers and server actions.
 * Reads and writes the session through Next's cookie store, so every query it
 * makes runs as the signed-in user and row-level security applies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Harmless here: proxy.ts
            // refreshes the session on every request, so the refreshed cookie
            // is already on its way to the browser.
          }
        },
      },
    }
  );
}

/**
 * The signed-in user, or null.
 *
 * Deliberately getUser() and not getSession(): getSession() returns whatever
 * the cookie claims without checking it, which is forgeable server-side.
 * getUser() revalidates the JWT against the auth server.
 */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The name to print on the receipt, falling back through what Google gives us. */
export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  if (!user) return "GUEST";
  const meta = user.user_metadata ?? {};
  const name = (meta.full_name ?? meta.name ?? meta.preferred_username) as string | undefined;
  return (name ?? user.email?.split("@")[0] ?? "GUEST").toUpperCase();
}
