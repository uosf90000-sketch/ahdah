import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "unavailable" = "unavailable";

  try {
    await db.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    // Railway's deployment healthcheck should confirm the web process is alive.
    // Database migrations run in preDeployCommand; DB state is reported here
    // without making a transient database issue fail the whole deployment.
  }

  return Response.json(
    {
      status: "ok",
      service: "ahdatuk",
      database,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
