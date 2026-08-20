import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected", service: "ahdah", timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable", service: "ahdah" }, { status: 503 });
  }
}
