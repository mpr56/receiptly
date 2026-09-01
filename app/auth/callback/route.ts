import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Google sends the browser back to. Exchanges the one-time PKCE code for
 * a session and sets the cookies, then hands off to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only same-site relative paths. Without this check, ?next=//evil.example
  // would turn our own callback into an open redirect.
  const requested = searchParams.get("next") ?? "/";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Behind Vercel's proxy the request's own origin is the internal host,
      // so the forwarded host is what the browser can actually navigate to.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const base =
        process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`;
      return NextResponse.redirect(`${base}${next}`);
    }
    console.error("OAuth code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
