import { OfferStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError, validateOfferInput, validateTripInput } from "@/lib/domain";
import { sendPushToUser } from "@/lib/push-service";
import { encodeItinerary, encodeRoadStops, MULTI_ROUTE_AIRLINE, ROAD_AIRLINE, tripMatchesShipment, type TravelLeg } from "@/lib/trip-route";

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

function parseItinerary(input: FormData | Record<string, unknown>) {
  const raw = textValue(input, "itineraryJson");
  if (!raw) return [] as TravelLeg[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error();
    const legs = parsed.map((item) => {
      if (!item || typeof item !== "object") throw new Error();
      const leg = item as Partial<TravelLeg>;
      const mode = leg.mode === "AIR" || leg.mode === "ROAD" ? leg.mode : null;
      const from = typeof leg.from === "string" ? leg.from.trim() : "";
      const to = typeof leg.to === "string" ? leg.to.trim() : "";
      const airline = typeof leg.airline === "string" ? leg.airline.trim() : "";
      const flightNumber = typeof leg.flightNumber === "string" ? leg.flightNumber.trim() : "";
      if (!mode || !from || !to) throw new Error();
      if (mode === "AIR" && !airline) throw new DomainValidationError([`اختر شركة الطيران للمرحلة ${from} ← ${to}`]);
      return { mode, from, to, ...(airline ? { airline } : {}), ...(flightNumber ? { flightNumber } : {}) } satisfies TravelLeg;
    });
    if (!legs.length || legs.length > 20) throw new DomainValidationError(["أضف مرحلة واحدة على الأقل، وبحد أقصى 20 مرحلة"]);
    for (let index = 1; index < legs.length; index += 1) {
      if (normalizePlace(legs[index - 1].to) !== normalizePlace(legs[index].from)) {
        throw new DomainValidationError(["يجب أن تبدأ كل مرحلة من نهاية المرحلة السابقة"]);
      }
    }
    const route = [legs[0].from, ...legs.map((leg) => leg.to)];
    if (route.some((place) => place.length > 80)) throw new DomainValidationError(["اسم الموقع طويل جدًا"]);
    if (new Set(route.map(normalizePlace)).size !== route.length) throw new DomainValidationError(["لا تكرر نفس الموقع في مسار الرحلة"]);
    return legs;
  } catch (error) {
    if (error instanceof DomainValidationError) throw error;
    throw new DomainValidationError(["مسار الرحلة غير صالح؛ راجع المراحل والمحطات"]);
  }
}

function prepareTripInput(input: FormData | Record<string, unknown>) {
  const itinerary = parseItinerary(input);
  if (itinerary.length) {
    const fromCity = itinerary[0].from;
    const toCity = itinerary[itinerary.length - 1].to;
    const modes = new Set(itinerary.map((leg) => leg.mode));
    const airline = itinerary.length === 1 && itinerary[0].mode === "AIR"
      ? itinerary[0].airline || "طيران"
      : itinerary.length === 1 && itinerary[0].mode === "ROAD"
        ? ROAD_AIRLINE
        : modes.size > 1
          ? MULTI_ROUTE_AIRLINE
          : itinerary.every((leg) => leg.mode === "ROAD") ? ROAD_AIRLINE : "رحلة جوية متعددة";

    if (input instanceof FormData) {
      input.set("fromCity", fromCity);
      input.set("toCity", toCity);
      input.set("airline", airline);
      input.set("flightNumber", encodeItinerary(itinerary));
    } else {
      input.fromCity = fromCity;
      input.toCity = toCity;
      input.airline = airline;
      input.flightNumber = encodeItinerary(itinerary);
    }
    return validateTripInput(input);
  }

  const travelMode = textValue(input, "travelMode") || "AIR";
  if (!["AIR", "ROAD"].includes(travelMode)) throw new DomainValidationError(["اختر طريقة تنقل صحيحة"]);
  if (travelMode === "ROAD") {
    const fromCity = textValue(input, "fromCity");
    const toCity = textValue(input, "toCity");
    const stops = listValue(input, "routeStop");
    if (stops.length > 20) throw new DomainValidationError(["الحد الأقصى 20 محطة وسيطة"]);
    const route = [fromCity, ...stops, toCity].filter(Boolean);
    if (route.some((place) => place.length > 80)) throw new DomainValidationError(["اسم الموقع طويل جدًا"]);
    if (new Set(route.map(normalizePlace)).size !== route.length) throw new DomainValidationError(["لا تكرر نفس الموقع في مسار الطريق"]);
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
  const saved = await db.offer.upsert({
    where: { shipmentId_tripId: { shipmentId, tripId } },
    create: { ...offer, shipmentId, tripId, travelerId },
    update: { ...offer, status: OfferStatus.PENDING },
  });
  await sendPushToUser(shipment.senderId, {
    title: "عرض جديد على عهدتك",
    body: `وصلك عرض بقيمة ${offer.priceSar} ر.س على العُهدة ${shipment.fromCity} ← ${shipment.toCity}`,
    href: `/shipments/${shipmentId}`,
  });
  return saved;
}
