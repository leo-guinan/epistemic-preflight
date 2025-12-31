import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Log all query parameters for debugging
  const allParams = Object.fromEntries(requestUrl.searchParams.entries());
  console.log("[Auth Callback] Request received:", {
    url: requestUrl.toString(),
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    allQueryParams: allParams,
    code: code ? "present" : "missing",
    error,
    errorDescription,
    next,
  });

  // Check for OAuth errors
  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription);
    const redirectUrl = new URL("/auth/signin?error=oauth_failed", requestUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    console.error("[Auth Callback] No authorization code provided");
    const redirectUrl = new URL("/auth/signin?error=no_code", requestUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Error exchanging code for session:", exchangeError);
      const redirectUrl = new URL("/auth/signin?error=exchange_failed", requestUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }

    console.log("[Auth Callback] Successfully authenticated user:", data.user?.email);

    // URL to redirect to after sign in process completes
    const redirectUrl = new URL(next, requestUrl.origin);
    console.log("[Auth Callback] Redirecting to:", redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[Auth Callback] Unexpected error:", error);
    const redirectUrl = new URL("/auth/signin?error=unexpected", requestUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }
}

