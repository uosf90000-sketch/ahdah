import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const safeBase = baseUrl.replace(/\/$/, "");
  const svg = await QRCode.toString(`${safeBase}/handover/${encodeURIComponent(token)}`, {
    type: "svg",
    width: 320,
    margin: 2,
    color: { dark: "#132821", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
