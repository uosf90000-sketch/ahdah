import { getCurrentUser } from "@/lib/auth";
import { DomainValidationError } from "@/lib/domain";
import { getTravelerMatchesForTrip } from "@/lib/services/match-service";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });
  const tripId = new URL(request.url).searchParams.get("tripId")?.trim();
  if (!tripId || tripId.length > 128) return Response.json({ error: "tripId مطلوب" }, { status: 400, headers: noStore });
  try {
    return Response.json({ matches: await getTravelerMatchesForTrip(tripId, user.id) }, { headers: noStore });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر تحميل المطابقات"];
    return Response.json({ error: message }, { status: 400, headers: noStore });
  }
}

