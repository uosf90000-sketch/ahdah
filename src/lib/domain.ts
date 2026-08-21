export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الطائف",
  "أبها",
  "تبوك",
  "جازان",
  "حائل",
  "القصيم",
] as const;

export const SHIPMENT_STATUSES = [
  "NEW",
  "RECEIVING_OFFERS",
  "TRAVELER_ACCEPTED",
  "INSPECTED",
  "WITH_TRAVELER",
  "ARRIVED",
  "DELIVERED",
] as const;

export type ShipmentStatusName = (typeof SHIPMENT_STATUSES)[number];

export const STATUS_LABELS: Record<ShipmentStatusName | "CANCELLED", string> = {
  NEW: "طلب جديد",
  RECEIVING_OFFERS: "استلام عروض",
  TRAVELER_ACCEPTED: "تم قبول مسافر",
  INSPECTED: "تم فحص العُهدة",
  WITH_TRAVELER: "مع المسافر",
  ARRIVED: "وصلت للوجهة",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغاة",
};

export const CATEGORY_LABELS = {
  DOCUMENTS: "مستندات",
  CLOTHING: "ملابس",
  ELECTRONICS: "إلكترونيات",
  GIFTS: "هدايا",
  PERSONAL_ITEMS: "أغراض شخصية",
  OTHER: "أخرى",
} as const;

export const TRANSPORT_PREFERENCE_LABELS = {
  AIR: "طيران فقط",
  ROAD: "على الطريق فقط",
  ANY: "طيران أو طريق",
} as const;

export type TransportPreference = keyof typeof TRANSPORT_PREFERENCE_LABELS;

export class DomainValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues[0] ?? "البيانات غير صالحة");
    this.issues = issues;
    this.name = "DomainValidationError";
  }
}

function textValue(input: FormData | Record<string, unknown>, key: string) {
  const raw = input instanceof FormData ? input.get(key) : input[key];
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") return String(raw);
  return "";
}

function numberValue(input: FormData | Record<string, unknown>, key: string) {
  const raw = Number(textValue(input, key));
  return Number.isFinite(raw) ? raw : Number.NaN;
}

function required(value: string, label: string, issues: string[]) {
  if (!value) issues.push(`${label} مطلوب`);
}

function optionalCoordinate(raw: string) {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function validateOptionalCoordinates(rawLat: string, rawLng: string, lat: number | null, lng: number | null, label: string, issues: string[]) {
  if (!rawLat && !rawLng) return;
  if (!rawLat || !rawLng) {
    issues.push(`إحداثيات ${label} غير مكتملة`);
    return;
  }
  if (lat === null || !(lat >= -90 && lat <= 90)) issues.push(`خط عرض ${label} غير صالح`);
  if (lng === null || !(lng >= -180 && lng <= 180)) issues.push(`خط طول ${label} غير صالح`);
}

export function validateShipmentInput(input: FormData | Record<string, unknown>) {
  const issues: string[] = [];
  const pickupLatRaw = textValue(input, "pickupLat");
  const pickupLngRaw = textValue(input, "pickupLng");
  const deliveryLatRaw = textValue(input, "deliveryLat");
  const deliveryLngRaw = textValue(input, "deliveryLng");
  const data = {
    fromCity: textValue(input, "fromCity"),
    toCity: textValue(input, "toCity"),
    pickupLat: optionalCoordinate(pickupLatRaw),
    pickupLng: optionalCoordinate(pickupLngRaw),
    pickupNote: textValue(input, "pickupNote"),
    deliveryLat: optionalCoordinate(deliveryLatRaw),
    deliveryLng: optionalCoordinate(deliveryLngRaw),
    deliveryNote: textValue(input, "deliveryNote"),
    transportPreference: (textValue(input, "transportPreference") || "ANY") as TransportPreference,
    weightKg: numberValue(input, "weightKg"),
    category: textValue(input, "category"),
    contents: textValue(input, "contents"),
    approximateValueSar: numberValue(input, "approximateValueSar"),
    requestedDeliveryAt: textValue(input, "requestedDeliveryAt"),
    recipientName: textValue(input, "recipientName"),
    recipientPhone: textValue(input, "recipientPhone"),
  };

  required(data.fromCity, "مكان الإرسال", issues);
  required(data.toCity, "مكان الوصول", issues);
  required(data.contents, "وصف المحتويات", issues);
  required(data.requestedDeliveryAt, "آخر وقت لاستلام العُهدة من المرسل", issues);
  required(data.recipientName, "اسم المستلم", issues);
  required(data.recipientPhone, "رقم المستلم", issues);
  validateOptionalCoordinates(pickupLatRaw, pickupLngRaw, data.pickupLat, data.pickupLng, "موقع الاستلام", issues);
  validateOptionalCoordinates(deliveryLatRaw, deliveryLngRaw, data.deliveryLat, data.deliveryLng, "موقع التسليم", issues);
  if (!Object.hasOwn(TRANSPORT_PREFERENCE_LABELS, data.transportPreference)) issues.push("اختر طريقة نقل صحيحة");
  if (data.pickupNote.length > 300) issues.push("ملاحظة موقع الاستلام طويلة جدًا");
  if (data.deliveryNote.length > 300) issues.push("ملاحظة موقع التسليم طويلة جدًا");
  if (data.fromCity && data.fromCity === data.toCity) issues.push("مكان الإرسال والوصول يجب أن يكونا مختلفين");
  if (!(Number.isInteger(data.weightKg) && data.weightKg >= 1 && data.weightKg <= 50)) issues.push("الوزن يجب أن يكون عددًا صحيحًا بين 1 و50 كجم");
  if (!(data.approximateValueSar >= 0 && data.approximateValueSar <= 100000)) issues.push("قيمة الشحنة غير صالحة");
  if (data.contents.length < 15) issues.push("اكتب وصفًا أوضح للمحتويات (15 حرفًا على الأقل)");
  if (!/^05\d{8}$/.test(data.recipientPhone)) issues.push("رقم المستلم يجب أن يكون رقم جوال سعوديًا مثل 05xxxxxxxx");
  const deliveryDate = new Date(data.requestedDeliveryAt);
  if (Number.isNaN(deliveryDate.getTime()) || deliveryDate <= new Date()) issues.push("آخر وقت لاستلام العُهدة يجب أن يكون في المستقبل");

  if (issues.length) throw new DomainValidationError(issues);
  return { ...data, requestedDeliveryAt: deliveryDate };
}

export function validateTripInput(input: FormData | Record<string, unknown>) {
  const issues: string[] = [];
  const data = {
    fromCity: textValue(input, "fromCity"),
    toCity: textValue(input, "toCity"),
    departureAt: textValue(input, "departureAt"),
    airline: textValue(input, "airline"),
    flightNumber: textValue(input, "flightNumber"),
    availableWeightKg: numberValue(input, "availableWeightKg"),
  };
  required(data.fromCity, "مدينة المغادرة", issues);
  required(data.toCity, "الوجهة", issues);
  required(data.airline, "شركة الطيران", issues);
  if (data.fromCity === data.toCity) issues.push("مدينة المغادرة والوجهة يجب أن تكونا مختلفتين");
  if (!(Number.isInteger(data.availableWeightKg) && data.availableWeightKg >= 1 && data.availableWeightKg <= 50)) issues.push("الوزن المتاح يجب أن يكون عددًا صحيحًا بين 1 و50 كجم");
  const departureDate = new Date(data.departureAt);
  if (Number.isNaN(departureDate.getTime()) || departureDate <= new Date()) issues.push("تاريخ الرحلة يجب أن يكون في المستقبل");
  if (issues.length) throw new DomainValidationError(issues);
  return { ...data, departureAt: departureDate };
}

export function validateOfferInput(input: FormData | Record<string, unknown>) {
  const issues: string[] = [];
  const priceSar = numberValue(input, "priceSar");
  const note = textValue(input, "note");
  if (!(priceSar >= 10 && priceSar <= 10000)) issues.push("السعر يجب أن يكون بين 10 و10,000 ريال");
  if (note.length > 500) issues.push("ملاحظة العرض طويلة جدًا");
  if (issues.length) throw new DomainValidationError(issues);
  return { priceSar, note };
}

export type MatchableTrip = {
  fromCity: string;
  toCity: string;
  departureAt: Date;
  availableWeightKg: number;
  status?: string;
};

export type MatchableShipment = {
  fromCity: string;
  toCity: string;
  requestedDeliveryAt: Date;
  weightKg: number;
  status?: string;
};

const normalizeCity = (city: string) => city.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar-SA");

export function isTripMatch(trip: MatchableTrip, shipment: MatchableShipment, now = new Date()) {
  return (
    normalizeCity(trip.fromCity) === normalizeCity(shipment.fromCity) &&
    normalizeCity(trip.toCity) === normalizeCity(shipment.toCity) &&
    trip.departureAt > now &&
    trip.availableWeightKg >= shipment.weightKg &&
    (!trip.status || trip.status === "OPEN") &&
    (!shipment.status || ["NEW", "RECEIVING_OFFERS"].includes(shipment.status))
  );
}

const ALLOWED_TRANSITIONS: Record<ShipmentStatusName, ShipmentStatusName[]> = {
  NEW: ["RECEIVING_OFFERS"],
  RECEIVING_OFFERS: ["TRAVELER_ACCEPTED"],
  TRAVELER_ACCEPTED: ["INSPECTED"],
  INSPECTED: ["WITH_TRAVELER"],
  WITH_TRAVELER: ["ARRIVED"],
  ARRIVED: ["DELIVERED"],
  DELIVERED: [],
};

export function canTransition(from: ShipmentStatusName, to: ShipmentStatusName) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ShipmentStatusName, to: ShipmentStatusName) {
  if (!canTransition(from, to)) throw new DomainValidationError([`لا يمكن نقل الحالة من ${STATUS_LABELS[from]} إلى ${STATUS_LABELS[to]}`]);
}

export function formatMoney(value: number | string | { toString(): string }) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(Number(value));
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
