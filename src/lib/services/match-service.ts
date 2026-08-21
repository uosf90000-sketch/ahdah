import { PhotoKind, ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { tripMatchesShipment } from "@/lib/trip-route";

export async function getTravelerMatchesForTrip(tripId: string, travelerId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, travelerId, status: "OPEN" } });
  if (!trip) throw new DomainValidationError(["الرحلة غير موجودة"]);
  if (trip.departureAt <= new Date()) return [];

  const candidates = await db.shipment.findMany({
    where: {
      senderId: { not: travelerId },
      weightKg: { lte: trip.availableWeightKg },
      status: { in: [ShipmentStatus.NEW, ShipmentStatus.RECEIVING_OFFERS] },
    },
    select: {
      id: true,
      refCode: true,
      senderId: true,
      fromCity: true,
      toCity: true,
      transportPreference: true,
      weightKg: true,
      category: true,
      contents: true,
      requestedDeliveryAt: true,
      status: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          ratingsReceived: { select: { score: true } },
        },
      },
      photos: {
        where: { kind: PhotoKind.ORIGINAL },
        select: { id: true, kind: true, url: true, caption: true },
      },
      offers: {
        where: { travelerId },
        select: { id: true, tripId: true, priceSar: true, note: true, status: true, createdAt: true, updatedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  return candidates.filter((shipment) => tripMatchesShipment(trip, shipment));
}
