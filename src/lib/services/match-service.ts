import { PhotoKind, ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { tripMatchesShipment } from "@/lib/trip-route";

export async function getTravelerMatchesForTrip(tripId: string, travelerId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, travelerId, status: "OPEN" } });
  if (!trip) throw new DomainValidationError(["الرحلة غير موجودة"]);
  if (trip.departureAt <= new Date()) return [];

  // Fetch lightweight candidates by weight/status, then apply ordered route matching in application code.
  // This supports road trips with multiple intermediate stations without changing the production DB schema.
  const candidates = await db.shipment.findMany({
    where: {
      senderId: { not: travelerId },
      weightKg: { lte: trip.availableWeightKg },
      status: { in: [ShipmentStatus.NEW, ShipmentStatus.RECEIVING_OFFERS] },
    },
    include: {
      sender: true,
      photos: { where: { kind: PhotoKind.ORIGINAL } },
      offers: { where: { travelerId } },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  return candidates.filter((shipment) => tripMatchesShipment(trip, shipment));
}
