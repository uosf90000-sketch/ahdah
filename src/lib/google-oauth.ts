import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_STATE_COOKIE = "ahdah_google_oauth_state";
export const GOOGLE_VERIFIER_COOKIE = "ahdah_google_oauth_verifier";
export const GOOGLE_COOKIE_MAX_AGE = 10 * 60;

const GOOGLE_REQUEST_TIMEOUT_MS = 10_000;

export function googleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function callbackUrl(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${origin}/auth/google/callback`;
}

export function createGoogleAuthorization(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId || !googleOAuthConfigured()) throw new Error("Google OAuth is not configured");

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = callbackUrl(origin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    include_granted_scopes: "true",
  }).toString();

  return { url, state, verifier, redirectUri };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(input: { code: string; verifier: string; origin: string }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(input.origin),
      grant_type: "authorization_code",
      code_verifier: input.verifier,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
  });

  if (!tokenResponse.ok) {
    console.error("Google token exchange failed", { status: tokenResponse.status });
    throw new Error("تعذر إكمال تسجيل الدخول باستخدام Google");
  }

  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("لم يتم استلام رمز دخول صالح من Google");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
  });
  if (!profileResponse.ok) throw new Error("تعذر قراءة حساب Google");

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.sub || !profile.email || !profile.email_verified) {
    throw new Error("يجب استخدام بريد Google موثق");
  }

  return { ...profile, email: profile.email.trim().toLowerCase() };
}

