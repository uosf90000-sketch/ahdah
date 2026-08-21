import type { NextRequest } from "next/server";

const DEFAULT_PUBLIC_ORIGIN = "https://ahdah-production.up.railway.app";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    if (["0.0.0.0", "127.0.0.1", "localhost"].includes(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getPublicOrigin(request: NextRequest) {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || "https";

  const forwardedOrigin = normalizeOrigin(host ? `${proto}://${host}` : null);
  if (forwardedOrigin) return forwardedOrigin;

  return DEFAULT_PUBLIC_ORIGIN;
}
