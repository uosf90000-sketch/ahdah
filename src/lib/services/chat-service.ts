import { ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";

const closedStatuses = new Set<ShipmentStatus>([ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED]);

export async function getChatContext(userId: string, shipmentId: string) {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      refCode: true,
      fromCity: true,
      toCity: true,
      pickupLat: true,
      pickupLng: true,
      pickupNote: true,
      deliveryLat: true,
      deliveryLng: true,
      deliveryNote: true,
      status: true,
      senderId: true,
      sender: { select: { id: true, name: true } },
      acceptedOffer: {
        select: {
          travelerId: true,
          traveler: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!shipment?.acceptedOffer) throw new DomainValidationError(["المحادثة تفتح بعد قبول عرض الموصل"]);
  const travelerId = shipment.acceptedOffer.travelerId;
  if (userId !== shipment.senderId && userId !== travelerId) {
    throw new DomainValidationError(["لا تملك صلاحية فتح هذه المحادثة"]);
  }

  const otherParticipant = userId === shipment.senderId ? shipment.acceptedOffer.traveler : shipment.sender;
  return { shipment, otherParticipant, writable: !closedStatuses.has(shipment.status) };
}

export async function getChatMessages(userId: string, shipmentId: string) {
  await getChatContext(userId, shipmentId);
  return db.chatMessage.findMany({
    where: { shipmentId },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
}

export async function sendChatMessage(userId: string, shipmentId: string, rawBody: string) {
  const { writable } = await getChatContext(userId, shipmentId);
  if (!writable) throw new DomainValidationError(["تم إغلاق المحادثة بعد انتهاء العُهدة"]);

  const body = rawBody.replace(/\r\n/g, "\n").trim();
  if (!body) throw new DomainValidationError(["اكتب رسالة قبل الإرسال"]);
  if (body.length > 1000) throw new DomainValidationError(["الرسالة يجب ألا تتجاوز 1000 حرف"]);

  const recent = await db.chatMessage.findFirst({
    where: { shipmentId, senderId: userId, createdAt: { gt: new Date(Date.now() - 1000) } },
    select: { id: true },
  });
  if (recent) throw new DomainValidationError(["أرسل الرسائل بهدوء وحاول مرة أخرى بعد لحظة"]);

  return db.chatMessage.create({ data: { shipmentId, senderId: userId, body } });
}

export async function updateChatLocation(
  userId: string,
  shipmentId: string,
  kind: "pickup" | "delivery",
  lat: number,
  lng: number,
  note: string,
) {
  const { shipment, writable } = await getChatContext(userId, shipmentId);
  if (!writable) throw new DomainValidationError(["لا يمكن تعديل الموقع بعد انتهاء العُهدة"]);
  if (shipment.senderId !== userId) throw new DomainValidationError(["تحديد موقع الاستلام والتسليم متاح للمرسل فقط"]);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new DomainValidationError(["حدد موقعًا صحيحًا على الخريطة"]);
  }
  const cleanNote = note.trim();
  if (cleanNote.length > 300) throw new DomainValidationError(["ملاحظة الموقع طويلة جدًا"]);

  const data = kind === "pickup"
    ? { pickupLat: lat, pickupLng: lng, pickupNote: cleanNote }
    : { deliveryLat: lat, deliveryLng: lng, deliveryNote: cleanNote };
  const label = kind === "pickup" ? "الاستلام" : "التسليم";

  await db.$transaction([
    db.shipment.update({ where: { id: shipmentId }, data }),
    db.chatMessage.create({ data: { shipmentId, senderId: userId, body: `📍 تم تحديد موقع ${label}` } }),
  ]);
}
