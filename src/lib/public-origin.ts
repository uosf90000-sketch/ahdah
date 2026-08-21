import type { NextRequest } from "next/server";

const DEFAULT_PUBLIC_ORIGIN = "https://ahdah-production.up.railway.app";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (["0.0.0.0", "127.0.0.1", "localhost"].includes(url.hostname) && process.env.NODE_ENV === "production") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getPublicOrigin(request: NextRequest) {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  const redirectOrigin = (() => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (!redirectUri) return null;
    try {
      return normalizeOrigin(new URL(redirectUri).origin);
    } catch {
      return null;
    }
  })();
  if (redirectOrigin) return redirectOrigin;

  if (process.env.NODE_ENV !== "production") {
    const requestOrigin = normalizeOrigin(request.nextUrl.origin);
    if (requestOrigin) return requestOrigin;
  }

  return DEFAULT_PUBLIC_ORIGIN;
}
