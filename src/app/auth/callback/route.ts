import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = getSafeAuthRedirectUrl(
    requestUrl.searchParams.get("next"),
    requestUrl.origin,
  );

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(redirectUrl);
}
