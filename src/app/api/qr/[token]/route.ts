import QRCode from "qrcode";
import { NextRequest } from "next/server";
import { getPublicOrigin } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const safeBase = getPublicOrigin(request).replace(/\/$/, "");
  const svg = await QRCode.toString(`${safeBase}/handover/${encodeURIComponent(token)}`, {
    type: "svg",
    width: 320,
    margin: 2,
    color: { dark: "#132821", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}

