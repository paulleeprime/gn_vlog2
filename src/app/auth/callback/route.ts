import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // Only allow same-origin relative paths to avoid open redirects.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = new URL(next, origin);
      if (isNewSignup(data.user.created_at, data.user.last_sign_in_at)) {
        url.searchParams.set("welcome", "1");
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}

// On the first sign-in, Supabase sets created_at and last_sign_in_at to nearly the same moment.
function isNewSignup(createdAt: string, lastSignInAt?: string) {
  if (!lastSignInAt) return true;
  return (
    Math.abs(Date.parse(lastSignInAt) - Date.parse(createdAt)) < 10_000
  );
}
