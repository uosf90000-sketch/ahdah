import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAuthorization,
  GOOGLE_COOKIE_MAX_AGE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleOAuthConfigured,
} from "@/lib/google-oauth";
import { GOOGLE_POLICY_CONSENT_COOKIE } from "@/lib/legal";
import { getPublicOrigin } from "@/lib/public-origin";

function authError(request: NextRequest, message: string, tab?: "login" | "register") {
  const url = new URL("/auth", getPublicOrigin(request));
  if (tab) url.searchParams.set("tab", tab);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

function startGoogleAuthorization(request: NextRequest, recordConsent: boolean) {
  if (!googleOAuthConfigured()) {
    return authError(request, "تسجيل الدخول باستخدام Google غير مفعّل بعد");
  }

  try {
    const { url, state, verifier } = createGoogleAuthorization(getPublicOrigin(request));
    const response = NextResponse.redirect(url, 303);
    const common = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GOOGLE_COOKIE_MAX_AGE,
    };
    response.cookies.set(GOOGLE_STATE_COOKIE, state, common);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, common);

    if (recordConsent) {
      response.cookies.set(GOOGLE_POLICY_CONSENT_COOKIE, state, common);
    } else {
      response.cookies.set(GOOGLE_POLICY_CONSENT_COOKIE, "", { ...common, maxAge: 0 });
    }

    return response;
  } catch (error) {
    console.error(error);
    return authError(request, "تعذر بدء تسجيل الدخول باستخدام Google");
  }
}

export async function GET(request: NextRequest) {
  return startGoogleAuthorization(request, false);
}

export async function POST(request: NextRequest) {
  const expectedOrigin = getPublicOrigin(request);
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) {
    return authError(request, "تعذر بدء إنشاء الحساب من هذا المصدر", "register");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > 4096) {
    return authError(request, "تعذر قراءة موافقة السياسات", "register");
  }

  try {
    const formData = await request.formData();
    if (formData.get("consent") !== "1") {
      return authError(request, "يجب الموافقة على الشروط والسياسات قبل إنشاء الحساب", "register");
    }
  } catch {
    return authError(request, "تعذر قراءة موافقة السياسات", "register");
  }

  return startGoogleAuthorization(request, true);
}
