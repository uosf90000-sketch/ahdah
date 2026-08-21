import { getMatchesForTrip } from "@/lib/services/shipment-service";

export async function getTravelerMatchesForTrip(tripId: string, travelerId: string) {
  const matches = await getMatchesForTrip(tripId, travelerId);
  return matches.filter((shipment) => shipment.senderId !== travelerId);
}
