import { OfferStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError, validateOfferInput, validateTripInput } from "@/lib/domain";
import { encodeRoadStops, ROAD_AIRLINE, tripMatchesShipment } from "@/lib/trip-route";

function textValue(input: FormData | Record<string, unknown>, key: string) {
  if (input instanceof FormData) return String(input.get(key) ?? "").trim();
  const value = input[key];
  return typeof value === "string" ? value.trim() : "";
}

function listValue(input: FormData | Record<string, unknown>, key: string) {
  if (input instanceof FormData) return input.getAll(key).map((item) => String(item).trim()).filter(Boolean);
  const value = input[key];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function normalizePlace(place: string) {
  return place.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-SA");
}

function prepareTripInput(input: FormData | Record<string, unknown>) {
  const travelMode = textValue(input, "travelMode") || "AIR";
  if (!["AIR", "ROAD"].includes(travelMode)) throw new DomainValidationError(["اختر طريقة تنقل صحيحة"]);

  if (travelMode === "ROAD") {
    const fromCity = textValue(input, "fromCity");
    const toCity = textValue(input, "toCity");
    const stops = listValue(input, "routeStop");

    if (stops.length > 20) throw new DomainValidationError(["الحد الأقصى 20 محطة وسيطة"]);
    if ([fromCity, toCity, ...stops].some((place) => place.length > 80)) throw new DomainValidationError(["اسم المدينة أو المحافظة طويل جدًا"]);

    const route = [fromCity, ...stops, toCity].filter(Boolean);
    const normalized = route.map(normalizePlace);
    if (new Set(normalized).size !== normalized.length) throw new DomainValidationError(["لا تكرر نفس المدينة أو المحافظة في مسار الطريق"]);

    if (input instanceof FormData) {
      input.set("airline", ROAD_AIRLINE);
      input.set("flightNumber", encodeRoadStops(stops));
    } else {
      input.airline = ROAD_AIRLINE;
      input.flightNumber = encodeRoadStops(stops);
    }
  }

  return validateTripInput(input);
}

export async function createRouteAwareTrip(travelerId: string, input: FormData | Record<string, unknown>) {
  const data = prepareTripInput(input);
  return db.trip.create({ data: { ...data, travelerId, status: TripStatus.OPEN } });
}

export async function createRouteAwareOffer(travelerId: string, shipmentId: string, tripId: string, input: FormData | Record<string, unknown>) {
  const offer = validateOfferInput(input);
  const [trip, shipment] = await Promise.all([
    db.trip.findFirst({ where: { id: tripId, travelerId } }),
    db.shipment.findUnique({ where: { id: shipmentId } }),
  ]);

  if (!trip || !shipment) throw new DomainValidationError(["تعذر العثور على الرحلة أو الشحنة"]);
  if (shipment.senderId === travelerId) throw new DomainValidationError(["لا يمكنك تقديم عرض على شحنتك"]);
  if (!tripMatchesShipment(trip, shipment)) throw new DomainValidationError(["هذه الشحنة لا تقع ضمن مسار رحلتك أو تتجاوز الوزن المتاح"]);

  return db.offer.upsert({
    where: { shipmentId_tripId: { shipmentId, tripId } },
    create: { ...offer, shipmentId, tripId, travelerId },
    update: { ...offer, status: OfferStatus.PENDING },
  });
}
