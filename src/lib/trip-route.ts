export const ROAD_AIRLINE = "على الطريق";
const ROAD_STOPS_PREFIX = "ROAD_STOPS:";

export type TripRouteLike = {
  fromCity: string;
  toCity: string;
  departureAt: Date;
  airline: string;
  flightNumber?: string | null;
  availableWeightKg: number | string | { toString(): string };
  status?: string;
};

export type ShipmentRouteLike = {
  fromCity: string;
  toCity: string;
  weightKg: number | string | { toString(): string };
  status?: string;
};

const normalizeCity = (city: string) => city.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-SA");

export function encodeRoadStops(stops: string[]) {
  return `${ROAD_STOPS_PREFIX}${JSON.stringify(stops)}`;
}

export function decodeRoadStops(trip: Pick<TripRouteLike, "airline" | "flightNumber">) {
  if (trip.airline !== ROAD_AIRLINE || !trip.flightNumber?.startsWith(ROAD_STOPS_PREFIX)) return [];
  try {
    const parsed = JSON.parse(trip.flightNumber.slice(ROAD_STOPS_PREFIX.length));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}

export function isRoadTrip(trip: Pick<TripRouteLike, "airline">) {
  return trip.airline === ROAD_AIRLINE;
}

export function tripRouteCities(trip: Pick<TripRouteLike, "fromCity" | "toCity" | "airline" | "flightNumber">) {
  return [trip.fromCity, ...decodeRoadStops(trip), trip.toCity];
}

export function tripMatchesShipment(trip: TripRouteLike, shipment: ShipmentRouteLike, now = new Date()) {
  if (trip.departureAt <= now) return false;
  if (Number(trip.availableWeightKg) < Number(shipment.weightKg)) return false;
  if (trip.status && trip.status !== "OPEN") return false;
  if (shipment.status && !["NEW", "RECEIVING_OFFERS"].includes(shipment.status)) return false;

  if (!isRoadTrip(trip)) {
    return normalizeCity(trip.fromCity) === normalizeCity(shipment.fromCity) && normalizeCity(trip.toCity) === normalizeCity(shipment.toCity);
  }

  const route = tripRouteCities(trip).map(normalizeCity);
  const pickupIndex = route.indexOf(normalizeCity(shipment.fromCity));
  const deliveryIndex = route.indexOf(normalizeCity(shipment.toCity));
  return pickupIndex >= 0 && deliveryIndex > pickupIndex;
}
