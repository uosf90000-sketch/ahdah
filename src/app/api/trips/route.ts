import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { createRouteAwareTrip } from "@/lib/services/route-trip-service";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });
  const trips = await db.trip.findMany({ where: { travelerId: user.id }, orderBy: { departureAt: "asc" } });
  return Response.json({ trips }, { headers: noStore });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return Response.json({ error: ["نوع الطلب غير مدعوم"] }, { status: 415, headers: noStore });
  try {
    const trip = await createRouteAwareTrip(user.id, await request.json() as Record<string, unknown>);
    return Response.json({ trip }, { status: 201, headers: noStore });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الرحلة"];
    return Response.json({ error: message }, { status: 400, headers: noStore });
  }
}
