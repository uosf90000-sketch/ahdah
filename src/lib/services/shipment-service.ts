import {
  OfferStatus,
  PhotoKind,
  Prisma,
  ShipmentCategory,
  ShipmentStatus,
  TripStatus,
} from "@prisma/client";
import { createHmac, randomBytes, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import {
  assertTransition,
  DomainValidationError,
  isTripMatch,
  validateOfferInput,
  validateShipmentInput,
  validateTripInput,
  type ShipmentStatusName,
} from "@/lib/domain";
import { storageAdapter } from "@/lib/adapters/storage";
import { paymentAdapter } from "@/lib/adapters/payment";
import { messagingAdapter } from "@/lib/adapters/messaging";

const categoryValues = new Set(Object.values(ShipmentCategory));
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60_000;

function otpSecret() {
  const secret = process.env.OTP_HASH_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("OTP_HASH_SECRET or SESSION_SECRET must contain at least 32 characters");
  return secret;
}

const otpHash = (otp: string) => createHmac("sha256", otpSecret()).update(otp).digest("hex");

function referenceCode() {
  const date = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `AHD-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createShipment(senderId: string, input: FormData | Record<string, unknown>, photoUrls: string[]) {
  const data = validateShipmentInput(input);
  if (!categoryValues.has(data.category as ShipmentCategory)) throw new DomainValidationError(["اختر تصنيفًا صحيحًا للشحنة"]);
  if (!photoUrls.length) throw new DomainValidationError(["أضف صورة واضحة واحدة على الأقل للمحتويات"]);

  return db.shipment.create({
    data: {
      ...data,
      lengthCm: 1,
      widthCm: 1,
      heightCm: 1,
      category: data.category as ShipmentCategory,
      senderId,
      refCode: referenceCode(),
      qrToken: randomBytes(24).toString("base64url"),
      status: ShipmentStatus.RECEIVING_OFFERS,
      photos: {
        create: photoUrls.map((url, index) => ({ uploadedById: senderId, kind: PhotoKind.ORIGINAL, url, caption: `صورة المحتويات ${index + 1}` })),
      },
      statusEvents: {
        create: [
          { actorId: senderId, status: ShipmentStatus.NEW, note: "تم إنشاء طلب الشحنة" },
          { actorId: senderId, status: ShipmentStatus.RECEIVING_OFFERS, note: "تم نشر الطلب للمسافرين المطابقين" },
        ],
      },
    },
  });
}

export async function createShipmentFromForm(senderId: string, formData: FormData) {
  const files = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoUrls = await storageAdapter.saveImages(files, `shipment-${senderId}`);
  return createShipment(senderId, formData, photoUrls);
}

export async function createTrip(travelerId: string, input: FormData | Record<string, unknown>) {
  const data = validateTripInput(input);
  return db.trip.create({ data: { ...data, travelerId, status: TripStatus.OPEN } });
}

export async function getMatchesForTrip(tripId: string, travelerId: string) {
  const trip = await db.trip.findFirst({ where: { id: tripId, travelerId } });
  if (!trip) throw new DomainValidationError(["الرحلة غير موجودة"]);
  return db.shipment.findMany({
    where: {
      senderId: { not: travelerId },
      fromCity: trip.fromCity,
      toCity: trip.toCity,
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
      sender: { select: { id: true, name: true } },
      photos: { where: { kind: PhotoKind.ORIGINAL }, select: { id: true, kind: true, url: true, caption: true } },
      offers: { where: { travelerId }, select: { id: true, tripId: true, priceSar: true, note: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOffer(travelerId: string, shipmentId: string, tripId: string, input: FormData | Record<string, unknown>) {
  const offer = validateOfferInput(input);
  const [trip, shipment] = await Promise.all([
    db.trip.findFirst({ where: { id: tripId, travelerId } }),
    db.shipment.findUnique({ where: { id: shipmentId } }),
  ]);
  if (!trip || !shipment) throw new DomainValidationError(["تعذر العثور على الرحلة أو الشحنة"]);
  if (shipment.senderId === travelerId) throw new DomainValidationError(["لا يمكنك تقديم عرض على شحنتك"]);
  if (!isTripMatch(
    { ...trip, availableWeightKg: Number(trip.availableWeightKg) },
    { ...shipment, weightKg: Number(shipment.weightKg) },
  )) throw new DomainValidationError(["هذه الشحنة لا تطابق مسار رحلتك أو الوزن المتاح"]);

  return db.offer.upsert({
    where: { shipmentId_tripId: { shipmentId, tripId } },
    create: { ...offer, shipmentId, tripId, travelerId },
    update: { ...offer, status: OfferStatus.PENDING },
  });
}

export async function acceptOffer(senderId: string, offerId: string) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { shipment: true, trip: true },
  });
  if (!offer || offer.shipment.senderId !== senderId) throw new DomainValidationError(["العرض غير موجود أو لا تملك صلاحية قبوله"]);
  if (offer.shipment.status !== ShipmentStatus.NEW && offer.shipment.status !== ShipmentStatus.RECEIVING_OFFERS) {
    throw new DomainValidationError(["تم حسم هذه الشحنة مسبقًا"]);
  }
  if (offer.status !== OfferStatus.PENDING) throw new DomainValidationError(["هذا العرض لم يعد متاحًا"]);

  const reservation = await paymentAdapter.reserve({ shipmentRef: offer.shipment.refCode, amountSar: Number(offer.priceSar) });
  return db.$transaction(async (tx) => {
    await tx.offer.updateMany({ where: { shipmentId: offer.shipmentId, status: OfferStatus.PENDING }, data: { status: OfferStatus.REJECTED } });
    await tx.offer.update({ where: { id: offer.id }, data: { status: OfferStatus.ACCEPTED } });
    await tx.shipment.update({
      where: { id: offer.shipmentId },
      data: { acceptedOfferId: offer.id, status: ShipmentStatus.TRAVELER_ACCEPTED },
    });
    await tx.payment.create({
      data: { shipmentId: offer.shipmentId, amountSar: offer.priceSar, providerRef: reservation.providerRef, provider: "mock" },
    });
    await tx.statusEvent.create({
      data: { shipmentId: offer.shipmentId, actorId: senderId, status: ShipmentStatus.TRAVELER_ACCEPTED, note: `تم قبول عرض بقيمة ${offer.priceSar} ر.س` },
    });
    return offer.shipmentId;
  });
}

export async function inspectShipment(travelerId: string, shipmentId: string, formData: FormData) {
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, include: { acceptedOffer: true } });
  if (!shipment?.acceptedOffer || shipment.acceptedOffer.travelerId !== travelerId) throw new DomainValidationError(["أنت لست المسافر المقبول لهذه العُهدة"]);
  if (shipment.status !== ShipmentStatus.TRAVELER_ACCEPTED) throw new DomainValidationError(["العُهدة ليست في مرحلة الفحص"]);

  const checks = {
    matchedDescription: formData.get("matchedDescription") === "on",
    matchedPhotos: formData.get("matchedPhotos") === "on",
    noProhibitedItems: formData.get("noProhibitedItems") === "on",
    packageSealed: formData.get("packageSealed") === "on",
  };
  if (Object.values(checks).some((value) => !value)) throw new DomainValidationError(["يجب التحقق من جميع بنود فحص العُهدة قبل الموافقة"]);
  const files = formData.getAll("inspectionPhotos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoUrls = await storageAdapter.saveImages(files, `inspection-${shipmentId}`);
  const notes = String(formData.get("notes") ?? "").trim();
  if (notes.length > 1000) throw new DomainValidationError(["ملاحظات الفحص طويلة جدًا"]);

  await db.$transaction([
    db.inspection.create({ data: { shipmentId, travelerId, ...checks, notes } }),
    db.shipmentPhoto.createMany({ data: photoUrls.map((url, index) => ({ shipmentId, uploadedById: travelerId, kind: PhotoKind.INSPECTION, url, caption: `صورة فحص ${index + 1}` })) }),
    db.shipment.update({ where: { id: shipmentId }, data: { status: ShipmentStatus.INSPECTED } }),
    db.statusEvent.create({ data: { shipmentId, actorId: travelerId, status: ShipmentStatus.INSPECTED, note: "عاين المسافر المحتويات ووافق على حملها" } }),
  ]);
}

export async function advanceShipment(travelerId: string, shipmentId: string, nextStatus: "WITH_TRAVELER" | "ARRIVED") {
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, include: { acceptedOffer: true } });
  if (!shipment?.acceptedOffer || shipment.acceptedOffer.travelerId !== travelerId) throw new DomainValidationError(["لا تملك صلاحية تحديث هذه الشحنة"]);
  assertTransition(shipment.status as ShipmentStatusName, nextStatus);
  await db.$transaction([
    db.shipment.update({ where: { id: shipmentId }, data: { status: nextStatus } }),
    db.statusEvent.create({ data: { shipmentId, actorId: travelerId, status: nextStatus, note: nextStatus === "WITH_TRAVELER" ? "استلم المسافر العُهدة وبدأ نقلها" : "أكد المسافر وصول العُهدة إلى مدينة الوجهة" } }),
  ]);
}

export async function issueDeliveryOtp(qrToken: string) {
  const shipment = await db.shipment.findUnique({ where: { qrToken } });
  if (!shipment || shipment.status !== ShipmentStatus.ARRIVED) throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);

  const now = new Date();
  if (shipment.deliveryOtpLastSentAt && now.getTime() - shipment.deliveryOtpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new DomainValidationError(["انتظر دقيقة قبل طلب رمز جديد"]);
  }

  const demoMode = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_OTP === "true";
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  if (demoMode) {
    const otp = "2468";
    await db.shipment.update({
      where: { id: shipment.id },
      data: { deliveryOtpHash: otpHash(otp), deliveryOtpExpiresAt: expiresAt, deliveryOtpAttempts: 0, deliveryOtpLastSentAt: now },
    });
    return otp;
  }

  if (messagingAdapter.managesOtpVerification) {
    await messagingAdapter.sendOtp({ phone: shipment.recipientPhone, shipmentRef: shipment.refCode });
    await db.shipment.update({
      where: { id: shipment.id },
      data: { deliveryOtpHash: null, deliveryOtpExpiresAt: expiresAt, deliveryOtpAttempts: 0, deliveryOtpLastSentAt: now },
    });
    return null;
  }

  const otp = String(randomInt(1000, 10_000));
  await messagingAdapter.sendOtp({ phone: shipment.recipientPhone, otp, shipmentRef: shipment.refCode });
  await db.shipment.update({
    where: { id: shipment.id },
    data: { deliveryOtpHash: otpHash(otp), deliveryOtpExpiresAt: expiresAt, deliveryOtpAttempts: 0, deliveryOtpLastSentAt: now },
  });
  return null;
}

export async function completeDelivery(qrToken: string, otp: string) {
  const shipment = await db.shipment.findUnique({ where: { qrToken } });
  if (!shipment || shipment.status !== ShipmentStatus.ARRIVED) throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);
  if (!shipment.deliveryOtpExpiresAt || shipment.deliveryOtpExpiresAt <= new Date()) {
    throw new DomainValidationError(["رمز الاستلام منتهي؛ اطلب رمزًا جديدًا"]);
  }
  if (shipment.deliveryOtpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new DomainValidationError(["تم تجاوز عدد محاولات الرمز؛ اطلب رمزًا جديدًا"]);
  }

  const cleanOtp = otp.trim();
  if (!/^\d{4}$/.test(cleanOtp)) throw new DomainValidationError(["رمز الاستلام يجب أن يكون 4 أرقام"]);

  const demoMode = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_OTP === "true";
  let verified = false;
  if (messagingAdapter.managesOtpVerification && !demoMode) {
    verified = await messagingAdapter.verifyOtp?.({ phone: shipment.recipientPhone, otp: cleanOtp, shipmentRef: shipment.refCode }) === true;
  } else {
    verified = Boolean(shipment.deliveryOtpHash && otpHash(cleanOtp) === shipment.deliveryOtpHash);
  }

  if (!verified) {
    await db.shipment.update({ where: { id: shipment.id }, data: { deliveryOtpAttempts: { increment: 1 } } });
    throw new DomainValidationError([shipment.deliveryOtpAttempts + 1 >= OTP_MAX_ATTEMPTS ? "تم تجاوز عدد محاولات الرمز؛ اطلب رمزًا جديدًا" : "رمز الاستلام غير صحيح"]);
  }

  await db.$transaction([
    db.shipment.update({
      where: { id: shipment.id },
      data: { status: ShipmentStatus.DELIVERED, deliveryOtpHash: null, deliveryOtpExpiresAt: null, deliveryOtpAttempts: 0 },
    }),
    db.payment.update({ where: { shipmentId: shipment.id }, data: { status: "CAPTURED" } }),
    db.statusEvent.create({ data: { shipmentId: shipment.id, status: ShipmentStatus.DELIVERED, note: "أكد المستلم الاستلام برمز OTP عبر رابط QR" } }),
  ]);
  return shipment.id;
}

export async function createRating(authorId: string, shipmentId: string, score: number, comment: string) {
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new DomainValidationError(["التقييم يجب أن يكون من نجمة إلى خمس نجوم"]);
  if (comment.length > 500) throw new DomainValidationError(["نص التقييم طويل جدًا"]);
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, include: { acceptedOffer: true } });
  if (!shipment?.acceptedOffer || shipment.status !== ShipmentStatus.DELIVERED) throw new DomainValidationError(["يمكن التقييم بعد اكتمال التسليم فقط"]);
  const travelerId = shipment.acceptedOffer.travelerId;
  const targetId = authorId === shipment.senderId ? travelerId : authorId === travelerId ? shipment.senderId : null;
  if (!targetId) throw new DomainValidationError(["لست طرفًا في هذه العُهدة"]);
  return db.rating.upsert({
    where: { shipmentId_authorId_targetId: { shipmentId, authorId, targetId } },
    create: { shipmentId, authorId, targetId, score, comment },
    update: { score, comment },
  });
}

export const shipmentDetailInclude = Prisma.validator<Prisma.ShipmentInclude>()({
  sender: { select: { id: true, name: true } },
  photos: { orderBy: { createdAt: "asc" } },
  offers: {
    include: {
      traveler: { select: { id: true, name: true, ratingsReceived: true } },
      trip: true,
    },
    orderBy: { priceSar: "asc" },
  },
  acceptedOffer: {
    include: {
      traveler: { select: { id: true, name: true, ratingsReceived: true } },
      trip: true,
    },
  },
  inspection: true,
  statusEvents: { orderBy: { createdAt: "asc" } },
  ratings: true,
  payment: true,
});
