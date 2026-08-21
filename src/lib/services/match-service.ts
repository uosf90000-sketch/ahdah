import { PhotoKind, ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";

export async function getTravelerMatchesForTrip(tripId: string, travelerId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, travelerId, status: "OPEN" } });
  if (!trip) throw new DomainValidationError(["الرحلة غير موجودة"]);
  if (trip.departureAt <= new Date()) return [];

  // Sender timing is coordination information only. Matching is route + available weight.
  return db.shipment.findMany({
    where: {
      senderId: { not: travelerId },
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      weightKg: { lte: trip.availableWeightKg },
      status: { in: [ShipmentStatus.NEW, ShipmentStatus.RECEIVING_OFFERS] },
    },
    include: {
      sender: true,
      photos: { where: { kind: PhotoKind.ORIGINAL } },
      offers: { where: { travelerId } },
    },
    orderBy: { createdAt: "desc" },
  });
}
