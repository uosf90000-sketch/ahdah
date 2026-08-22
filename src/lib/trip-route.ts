export const ROAD_AIRLINE = "على الطريق";
export const MULTI_ROUTE_AIRLINE = "مسار متعدد";
const ROAD_STOPS_PREFIX = "ROAD_STOPS:";
const ITINERARY_PREFIX = "ITINERARY:";

export type TravelLeg = {
  mode: "AIR" | "ROAD";
  from: string;
  to: string;
  airline?: string;
  flightNumber?: string;
};

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
  transportPreference?: string | null;
  status?: string;
};

const normalizeCity = (city: string) => city.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-SA");

export function encodeRoadStops(stops: string[]) {
  return `${ROAD_STOPS_PREFIX}${JSON.stringify(stops)}`;
}

export function encodeItinerary(legs: TravelLeg[]) {
  return `${ITINERARY_PREFIX}${JSON.stringify(legs)}`;
}

export function decodeItinerary(trip: Pick<TripRouteLike, "flightNumber">): TravelLeg[] {
  if (!trip.flightNumber?.startsWith(ITINERARY_PREFIX)) return [];
  try {
    const parsed = JSON.parse(trip.flightNumber.slice(ITINERARY_PREFIX.length));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TravelLeg => {
      if (!item || typeof item !== "object") return false;
      const leg = item as Partial<TravelLeg>;
      return (leg.mode === "AIR" || leg.mode === "ROAD") && typeof leg.from === "string" && typeof leg.to === "string" && leg.from.trim().length > 0 && leg.to.trim().length > 0;
    });
  } catch {
    return [];
  }
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

export function isRoadTrip(trip: Pick<TripRouteLike, "airline" | "flightNumber">) {
  const itinerary = decodeItinerary(trip);
  if (itinerary.length) return itinerary.every((leg) => leg.mode === "ROAD");
  return trip.airline === ROAD_AIRLINE;
}

export function isMixedTrip(trip: Pick<TripRouteLike, "airline" | "flightNumber">) {
  const itinerary = decodeItinerary(trip);
  return itinerary.length > 1 && new Set(itinerary.map((leg) => leg.mode)).size > 1;
}

export function tripRouteCities(trip: Pick<TripRouteLike, "fromCity" | "toCity" | "airline" | "flightNumber">) {
  const itinerary = decodeItinerary(trip);
  if (itinerary.length) return [itinerary[0].from, ...itinerary.map((leg) => leg.to)];
  return [trip.fromCity, ...decodeRoadStops(trip), trip.toCity];
}

export function tripTransportLabel(trip: Pick<TripRouteLike, "airline" | "flightNumber">) {
  const itinerary = decodeItinerary(trip);
  if (!itinerary.length) return trip.airline === ROAD_AIRLINE ? "على الطريق" : trip.airline;
  const modes = new Set(itinerary.map((leg) => leg.mode));
  if (modes.size > 1) return "طيران + طريق";
  if (modes.has("ROAD")) return "على الطريق";
  return itinerary[0].airline || trip.airline || "طيران";
}

function transportModesBetween(trip: TripRouteLike, pickupIndex: number, deliveryIndex: number): Array<"AIR" | "ROAD"> {
  const itinerary = decodeItinerary(trip);
  if (itinerary.length) return itinerary.slice(pickupIndex, deliveryIndex).map((leg) => leg.mode);

  const mode: "AIR" | "ROAD" = trip.airline === ROAD_AIRLINE ? "ROAD" : "AIR";
  return Array.from({ length: deliveryIndex - pickupIndex }, () => mode);
}

export function tripMatchesShipment(trip: TripRouteLike, shipment: ShipmentRouteLike, now = new Date()) {
  if (trip.departureAt <= now) return false;
  if (Number(trip.availableWeightKg) < Number(shipment.weightKg)) return false;
  if (trip.status && trip.status !== "OPEN") return false;
  if (shipment.status && !["NEW", "RECEIVING_OFFERS"].includes(shipment.status)) return false;

  const route = tripRouteCities(trip).map(normalizeCity);
  const pickupIndex = route.indexOf(normalizeCity(shipment.fromCity));
  const deliveryIndex = route.indexOf(normalizeCity(shipment.toCity));
  if (pickupIndex < 0 || deliveryIndex <= pickupIndex) return false;

  const preference = shipment.transportPreference || "ANY";
  if (preference === "ANY") return true;
  if (preference !== "AIR" && preference !== "ROAD") return false;

  const modes = transportModesBetween(trip, pickupIndex, deliveryIndex);
  return modes.length > 0 && modes.every((mode) => mode === preference);
}

