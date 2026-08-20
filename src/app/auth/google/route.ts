import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAuthorization,
  GOOGLE_COOKIE_MAX_AGE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleOAuthConfigured,
} from "@/lib/google-oauth";

function authError(request: NextRequest, message: string) {
  const url = new URL("/auth", request.nextUrl.origin);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!googleOAuthConfigured()) {
    return authError(request, "تسجيل الدخول باستخدام Google غير مفعّل بعد");
  }

  try {
    const { url, state, verifier } = createGoogleAuthorization(request.nextUrl.origin);
    const response = NextResponse.redirect(url);
    const common = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GOOGLE_COOKIE_MAX_AGE,
    };
    response.cookies.set(GOOGLE_STATE_COOKIE, state, common);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, common);
    return response;
  } catch (error) {
    console.error(error);
    return authError(request, "تعذر بدء تسجيل الدخول باستخدام Google");
  }
}
