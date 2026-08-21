import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { createShipmentFromForm } from "@/lib/services/shipment-service";

export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

const shipmentApiSelect = {
  id: true,
  refCode: true,
  senderId: true,
  fromCity: true,
  toCity: true,
  pickupLat: true,
  pickupLng: true,
  pickupNote: true,
  deliveryLat: true,
  deliveryLng: true,
  deliveryNote: true,
  transportPreference: true,
  weightKg: true,
  category: true,
  contents: true,
  approximateValueSar: true,
  requestedDeliveryAt: true,
  recipientName: true,
  recipientPhone: true,
  status: true,
  acceptedOfferId: true,
  createdAt: true,
  updatedAt: true,
  sender: { select: { id: true, name: true } },
  photos: { select: { id: true, kind: true, url: true, caption: true, createdAt: true } },
  acceptedOffer: {
    select: {
      id: true,
      travelerId: true,
      priceSar: true,
      status: true,
      traveler: { select: { id: true, name: true } },
    },
  },
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const shipments = await db.shipment.findMany({
    where: { OR: [{ senderId: user.id }, { acceptedOffer: { travelerId: user.id } }] },
    select: shipmentApiSelect,
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ shipments }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return Response.json({ error: ["يجب رفع الصور كملفات multipart/form-data"] }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: ["حجم الطلب أكبر من الحد المسموح"] }, { status: 413 });
  }

  try {
    const shipment = await createShipmentFromForm(user.id, await request.formData());
    const safeShipment = await db.shipment.findUnique({ where: { id: shipment.id }, select: shipmentApiSelect });
    return Response.json({ shipment: safeShipment }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الشحنة"];
    return Response.json({ error: message }, { status: 400 });
  }
}
