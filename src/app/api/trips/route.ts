import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { InvalidRequestBodyError, readJsonObjectWithLimit, RequestBodyTooLargeError } from "@/lib/request-body";
import { createRouteAwareTrip } from "@/lib/services/route-trip-service";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "private, no-store" };
const MAX_REQUEST_BYTES = 64 * 1024;

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
    const body = await readJsonObjectWithLimit(request, MAX_REQUEST_BYTES);
    const trip = await createRouteAwareTrip(user.id, body);
    return Response.json({ trip }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return Response.json({ error: ["حجم الطلب أكبر من الحد المسموح"] }, { status: 413, headers: noStore });
    if (error instanceof InvalidRequestBodyError) return Response.json({ error: ["بيانات الطلب غير صالحة"] }, { status: 400, headers: noStore });
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الرحلة"];
    return Response.json({ error: message }, { status: 400, headers: noStore });
  }
}
