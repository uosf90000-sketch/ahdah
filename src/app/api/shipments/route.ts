import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { InvalidRequestBodyError, readFormDataWithLimit, RequestBodyTooLargeError } from "@/lib/request-body";
import { createShipmentFromForm } from "@/lib/services/shipment-service";

export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const noStore = { "cache-control": "private, no-store" };

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
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });
  const shipments = await db.shipment.findMany({
    where: { OR: [{ senderId: user.id }, { acceptedOffer: { travelerId: user.id } }] },
    select: shipmentApiSelect,
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ shipments }, { headers: noStore });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return Response.json({ error: ["يجب رفع الصور كملفات multipart/form-data"] }, { status: 415, headers: noStore });
  }

  try {
    const formData = await readFormDataWithLimit(request, MAX_REQUEST_BYTES);
    const shipment = await createShipmentFromForm(user.id, formData);
    const safeShipment = await db.shipment.findUnique({ where: { id: shipment.id }, select: shipmentApiSelect });
    return Response.json({ shipment: safeShipment }, { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: ["حجم الطلب أكبر من الحد المسموح"] }, { status: 413, headers: noStore });
    }
    if (error instanceof InvalidRequestBodyError) {
      return Response.json({ error: ["تعذر قراءة بيانات الطلب"] }, { status: 400, headers: noStore });
    }
    const message = error instanceof DomainValidationError ? error.issues : ["تعذر إنشاء الشحنة"];
    return Response.json({ error: message }, { status: 400, headers: noStore });
  }
}

