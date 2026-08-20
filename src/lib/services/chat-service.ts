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
