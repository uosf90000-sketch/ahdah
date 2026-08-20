import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { createShipment } from "@/lib/services/shipment-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const shipments = await db.shipment.findMany({
    where: { OR: [{ senderId: user.id }, { acceptedOffer: { travelerId: user.id } }] },
    include: { photos: { take: 1 }, acceptedOffer: { include: { traveler: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ shipments });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown> & { photoUrls?: unknown };
    const photoUrls = Array.isArray(body.photoUrls)
      ? body.photoUrls.filter((item): item is string => typeof item === "string" && (item.startsWith("data:image/") || item.startsWith("https://")))
      : [];
    const shipment = await createShipment(user.id, body, photoUrls);
    return Response.json({ shipment }, { status: 201 });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الشحنة"];
    return Response.json({ error: message }, { status: 400 });
  }
}
