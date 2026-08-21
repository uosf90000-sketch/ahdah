import { AccountRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  exchangeGoogleCode,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
} from "@/lib/google-oauth";
import {
  CURRENT_POLICY_VERSION,
  POLICY_CONSENT_COOKIE,
} from "@/lib/policy-consent";
import { getPublicOrigin } from "@/lib/public-origin";
import { ensureRuntimeSchema } from "@/lib/runtime-schema";

function authError(request: NextRequest, message: string, register = false) {
  const url = new URL("/auth", getPublicOrigin(request));
  if (register) url.searchParams.set("tab", "register");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const publicOrigin = getPublicOrigin(request);
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return authError(request, "تم إلغاء تسجيل الدخول باستخدام Google");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;
  const policyConsent = request.cookies.get(POLICY_CONSENT_COOKIE)?.value;
  if (!code || !state || !storedState || !verifier || state !== storedState) {
    return authError(request, "انتهت محاولة تسجيل الدخول أو لم تعد صالحة. حاول مرة أخرى");
  }

  let userId: string;
  try {
    const profile = await exchangeGoogleCode({ code, verifier, origin: publicOrigin });
    await ensureRuntimeSchema();

    let user = await db.user.findFirst({
      where: { OR: [{ googleSubject: profile.sub }, { email: profile.email }] },
    });

    if (user?.googleSubject && user.googleSubject !== profile.sub) {
      return authError(request, "هذا البريد مرتبط بحساب Google مختلف");
    }

    if (user) {
      if (!user.googleSubject || !user.emailVerifiedAt) {
        user = await db.user.update({
          where: { id: user.id },
          data: { googleSubject: profile.sub, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        });
      }
    } else {
      if (policyConsent !== CURRENT_POLICY_VERSION) {
        return authError(request, "لإنشاء حساب جديد باستخدام Google يجب الموافقة على سياسات عهدتك أولًا", true);
      }

      user = await db.user.create({
        data: {
          name: profile.name?.trim() || profile.email.split("@")[0],
          email: profile.email,
          role: AccountRole.BOTH,
          passwordHash: "oauth:google",
          googleSubject: profile.sub,
          emailVerifiedAt: new Date(),
          policyAcceptedAt: new Date(),
          policyVersion: CURRENT_POLICY_VERSION,
        },
      });
    }
    userId = user.id;
  } catch (error) {
    console.error("Google sign-in failed", error);
    return authError(request, "تعذر إكمال تسجيل الدخول باستخدام Google الآن. حاول مرة أخرى");
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(GOOGLE_STATE_COOKIE);
    cookieStore.delete(GOOGLE_VERIFIER_COOKIE);
    cookieStore.delete(POLICY_CONSENT_COOKIE);
    await createSession(userId);
  } catch (error) {
    console.error(error);
    return authError(request, "تم التحقق من Google لكن تعذر إنشاء جلسة الدخول");
  }

  redirect(`${publicOrigin}/dashboard`);
}
