import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Reachable without a session. Everything else redirects to /sign-in. */
const PUBLIC_PATHS = ["/sign-in", "/auth/callback"];

/**
 * Next 16's replacement for the `middleware` file convention — same request
 * interception, renamed file and export.
 *
 * Two jobs, and the first one is the one that fails quietly if it is missing:
 *
 * 1. Refresh the session. Supabase access tokens last about an hour; the
 *    refresh happens here, on the way through, and the new cookie rides back
 *    on this response. Without this the app works fine for an hour and then
 *    starts failing server-side reads for no visible reason.
 * 2. Gate the routes.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser(), not getSession(): this both revalidates the JWT and triggers
  // the token refresh that the cookie handling above then persists.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && !isPublic) {
    // An API caller wants a status code, not a login page: redirecting fetch()
    // to /sign-in hands it 200 OK and a lump of HTML, which surfaces as a JSON
    // parse error rather than "you are signed out".
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && path === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's static output and image files. The session
    // refresh needs to run on real navigations and API calls, not on assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
