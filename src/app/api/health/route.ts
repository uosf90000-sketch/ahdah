import { db } from "@/lib/db";
import { ensureRuntimeSchema } from "@/lib/runtime-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureRuntimeSchema();
    await db.$queryRaw`SELECT 1`;

    return Response.json(
      {
        status: "ok",
        service: "ahdatuk",
        database: "connected",
        schema: "ready",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Runtime schema healthcheck failed", error);
    return Response.json(
      {
        status: "degraded",
        service: "ahdatuk",
        database: "unavailable",
        schema: "not-ready",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

