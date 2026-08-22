import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "ahdah_csrf";
const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setCSRFCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;

  if (!token) {
    token = generateCsrfToken();
    await setCSRFCookie(token);
  }

  return token;
}

export async function verifyCSRFToken(headerToken: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_COOKIE)?.value;

  if (!storedToken || !headerToken) {
    return false;
  }

  // Timing-safe comparison
  const stored = Buffer.from(storedToken, "hex");
  const provided = Buffer.from(headerToken, "hex");

  if (stored.length !== provided.length) {
    return false;
  }

  let match = 0;
  for (let i = 0; i < stored.length; i++) {
    match |= stored[i] ^ provided[i];
  }

  return match === 0;
}

export async function verifyCsrfFromFormData(formData: FormData): Promise<boolean> {
  const token = formData.get("_csrf_token");
  if (typeof token !== "string") {
    return false;
  }
  return verifyCSRFToken(token);
}
