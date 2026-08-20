import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { createTrip } from "@/lib/services/shipment-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const trips = await db.trip.findMany({ where: { travelerId: user.id }, orderBy: { departureAt: "asc" } });
  return Response.json({ trips });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const trip = await createTrip(user.id, await request.json() as Record<string, unknown>);
    return Response.json({ trip }, { status: 201 });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الرحلة"];
    return Response.json({ error: message }, { status: 400 });
  }
}
