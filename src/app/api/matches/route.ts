import { getCurrentUser } from "@/lib/auth";
import { DomainValidationError } from "@/lib/domain";
import { getMatchesForTrip } from "@/lib/services/shipment-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const tripId = new URL(request.url).searchParams.get("tripId");
  if (!tripId) return Response.json({ error: "tripId مطلوب" }, { status: 400 });
  try {
    return Response.json({ matches: await getMatchesForTrip(tripId, user.id) });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر تحميل المطابقات"];
    return Response.json({ error: message }, { status: 400 });
  }
}
