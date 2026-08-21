import {
  OfferStatus,
  Prisma,
  ShipmentStatus,
  TripStatus,
} from "@prisma/client";
import { createHmac, randomInt } from "node:crypto";
import { messagingAdapter } from "@/lib/adapters/messaging";
import { paymentAdapter } from "@/lib/adapters/payment";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";

const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const DELIVERY_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

function otpSecret() {
  const secret = process.env.OTP_HASH_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("OTP_HASH_SECRET or SESSION_SECRET must contain at least 32 characters");
  }
  return secret;
}

const otpHash = (otp: string) => createHmac("sha256", otpSecret()).update(otp).digest("hex");

function assertDeliveryToken(token: string) {
  if (!DELIVERY_TOKEN_PATTERN.test(token)) throw new DomainValidationError(["رابط التسليم غير صالح"]);
}

export async function acceptOfferSafely(senderId: string, offerId: string) {
  if (!offerId || offerId.length > 128) throw new DomainValidationError(["العرض غير صالح"]);
  const now = new Date();

  return db.$transaction(
    async (tx) => {
      const offer = await tx.offer.findFirst({
        where: {
          id: offerId,
          status: OfferStatus.PENDING,
          shipment: {
            senderId,
            acceptedOfferId: null,
            status: { in: [ShipmentStatus.NEW, ShipmentStatus.RECEIVING_OFFERS] },
          },
          trip: {
            status: TripStatus.OPEN,
            departureAt: { gt: now },
          },
        },
        include: { shipment: true, trip: true },
      });

      if (!offer) throw new DomainValidationError(["العرض غير موجود أو لم يعد متاحًا"]);
      if (offer.shipment.senderId !== senderId) throw new DomainValidationError(["لا تملك صلاحية قبول هذا العرض"]);

      const claimedShipment = await tx.shipment.updateMany({
        where: {
          id: offer.shipmentId,
          senderId,
          acceptedOfferId: null,
          status: { in: [ShipmentStatus.NEW, ShipmentStatus.RECEIVING_OFFERS] },
        },
        data: {
          acceptedOfferId: offer.id,
          status: ShipmentStatus.TRAVELER_ACCEPTED,
        },
      });
      if (claimedShipment.count !== 1) throw new DomainValidationError(["تم حسم هذه العُهدة مسبقًا"]);

      const reservedWeight = await tx.trip.updateMany({
        where: {
          id: offer.tripId,
          status: TripStatus.OPEN,
          departureAt: { gt: now },
          availableWeightKg: { gte: offer.shipment.weightKg },
        },
        data: { availableWeightKg: { decrement: offer.shipment.weightKg } },
      });
      if (reservedWeight.count !== 1) {
        throw new DomainValidationError(["لم يعد في الرحلة وزن كافٍ لهذه العُهدة"]);
      }

      const reservation = await paymentAdapter.reserve({
        shipmentRef: offer.shipment.refCode,
        amountSar: Number(offer.priceSar),
      });

      await tx.offer.updateMany({
        where: { shipmentId: offer.shipmentId, status: OfferStatus.PENDING },
        data: { status: OfferStatus.REJECTED },
      });
      await tx.offer.update({ where: { id: offer.id }, data: { status: OfferStatus.ACCEPTED } });
      await tx.payment.create({
        data: {
          shipmentId: offer.shipmentId,
          amountSar: offer.priceSar,
          providerRef: reservation.providerRef,
          provider: "mock",
        },
      });
      await tx.statusEvent.create({
        data: {
          shipmentId: offer.shipmentId,
          actorId: senderId,
          status: ShipmentStatus.TRAVELER_ACCEPTED,
          note: `تم قبول عرض بقيمة ${offer.priceSar} ر.س`,
        },
      });

      return offer.shipmentId;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000,
    },
  );
}

export async function issueDeliveryOtpSafely(qrToken: string) {
  assertDeliveryToken(qrToken);
  const shipment = await db.shipment.findUnique({
    where: { qrToken },
    select: {
      id: true,
      status: true,
      recipientPhone: true,
      refCode: true,
      deliveryOtpLastSentAt: true,
    },
  });
  if (!shipment || shipment.status !== ShipmentStatus.ARRIVED) {
    throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);
  }

  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS);
  const reserved = await db.shipment.updateMany({
    where: {
      id: shipment.id,
      status: ShipmentStatus.ARRIVED,
      OR: [
        { deliveryOtpLastSentAt: null },
        { deliveryOtpLastSentAt: { lte: cooldownCutoff } },
      ],
    },
    data: { deliveryOtpLastSentAt: now },
  });
  if (reserved.count !== 1) throw new DomainValidationError(["انتظر دقيقة قبل طلب رمز جديد"]);

  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const demoMode = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_OTP === "true";

  try {
    if (demoMode) {
      const otp = "2468";
      const updated = await db.shipment.updateMany({
        where: { id: shipment.id, status: ShipmentStatus.ARRIVED, deliveryOtpLastSentAt: now },
        data: {
          deliveryOtpHash: otpHash(otp),
          deliveryOtpExpiresAt: expiresAt,
          deliveryOtpAttempts: 0,
        },
      });
      if (updated.count !== 1) throw new DomainValidationError(["العُهدة لم تعد جاهزة للتسليم"]);
      return otp;
    }

    if (messagingAdapter.managesOtpVerification) {
      await messagingAdapter.sendOtp({ phone: shipment.recipientPhone, shipmentRef: shipment.refCode });
      const updated = await db.shipment.updateMany({
        where: { id: shipment.id, status: ShipmentStatus.ARRIVED, deliveryOtpLastSentAt: now },
        data: {
          deliveryOtpHash: null,
          deliveryOtpExpiresAt: expiresAt,
          deliveryOtpAttempts: 0,
        },
      });
      if (updated.count !== 1) throw new DomainValidationError(["العُهدة لم تعد جاهزة للتسليم"]);
      return null;
    }

    const otp = String(randomInt(1000, 10_000));
    await messagingAdapter.sendOtp({ phone: shipment.recipientPhone, otp, shipmentRef: shipment.refCode });
    const updated = await db.shipment.updateMany({
      where: { id: shipment.id, status: ShipmentStatus.ARRIVED, deliveryOtpLastSentAt: now },
      data: {
        deliveryOtpHash: otpHash(otp),
        deliveryOtpExpiresAt: expiresAt,
        deliveryOtpAttempts: 0,
      },
    });
    if (updated.count !== 1) throw new DomainValidationError(["العُهدة لم تعد جاهزة للتسليم"]);
    return null;
  } catch (error) {
    await db.shipment.updateMany({
      where: { id: shipment.id, status: ShipmentStatus.ARRIVED, deliveryOtpLastSentAt: now },
      data: { deliveryOtpLastSentAt: shipment.deliveryOtpLastSentAt },
    });
    throw error;
  }
}

export async function completeDeliverySafely(qrToken: string, otp: string) {
  assertDeliveryToken(qrToken);
  const cleanOtp = otp.trim();
  if (!/^\d{4}$/.test(cleanOtp)) throw new DomainValidationError(["رمز الاستلام يجب أن يكون 4 أرقام"]);

  const initial = await db.shipment.findUnique({
    where: { qrToken },
    select: { id: true, status: true },
  });
  if (!initial || initial.status !== ShipmentStatus.ARRIVED) {
    throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);
  }

  const now = new Date();
  const reservedAttempt = await db.shipment.updateMany({
    where: {
      id: initial.id,
      status: ShipmentStatus.ARRIVED,
      deliveryOtpExpiresAt: { gt: now },
      deliveryOtpAttempts: { lt: OTP_MAX_ATTEMPTS },
    },
    data: { deliveryOtpAttempts: { increment: 1 } },
  });

  if (reservedAttempt.count !== 1) {
    const current = await db.shipment.findUnique({
      where: { id: initial.id },
      select: { status: true, deliveryOtpExpiresAt: true, deliveryOtpAttempts: true },
    });
    if (!current || current.status !== ShipmentStatus.ARRIVED) {
      throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);
    }
    if (!current.deliveryOtpExpiresAt || current.deliveryOtpExpiresAt <= now) {
      throw new DomainValidationError(["رمز الاستلام منتهي؛ اطلب رمزًا جديدًا"]);
    }
    throw new DomainValidationError(["تم تجاوز عدد محاولات الرمز؛ اطلب رمزًا جديدًا"]);
  }

  const shipment = await db.shipment.findUnique({
    where: { id: initial.id },
    select: {
      id: true,
      status: true,
      recipientPhone: true,
      refCode: true,
      deliveryOtpHash: true,
      deliveryOtpExpiresAt: true,
      deliveryOtpAttempts: true,
    },
  });
  if (!shipment || shipment.status !== ShipmentStatus.ARRIVED) {
    throw new DomainValidationError(["العُهدة غير جاهزة للتسليم"]);
  }
  if (!shipment.deliveryOtpExpiresAt || shipment.deliveryOtpExpiresAt <= now) {
    throw new DomainValidationError(["رمز الاستلام منتهي؛ اطلب رمزًا جديدًا"]);
  }

  const demoMode = process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_OTP === "true";
  const verified = messagingAdapter.managesOtpVerification && !demoMode
    ? await messagingAdapter.verifyOtp?.({
        phone: shipment.recipientPhone,
        otp: cleanOtp,
        shipmentRef: shipment.refCode,
      }) === true
    : Boolean(shipment.deliveryOtpHash && otpHash(cleanOtp) === shipment.deliveryOtpHash);

  if (!verified) {
    throw new DomainValidationError([
      shipment.deliveryOtpAttempts >= OTP_MAX_ATTEMPTS
        ? "تم تجاوز عدد محاولات الرمز؛ اطلب رمزًا جديدًا"
        : "رمز الاستلام غير صحيح",
    ]);
  }

  return db.$transaction(
    async (tx) => {
      const delivered = await tx.shipment.updateMany({
        where: { id: shipment.id, status: ShipmentStatus.ARRIVED },
        data: {
          status: ShipmentStatus.DELIVERED,
          deliveryOtpHash: null,
          deliveryOtpExpiresAt: null,
          deliveryOtpAttempts: 0,
          deliveryOtpLastSentAt: null,
        },
      });
      if (delivered.count !== 1) throw new DomainValidationError(["تم تأكيد الاستلام مسبقًا"]);

      await tx.payment.update({
        where: { shipmentId: shipment.id },
        data: { status: "CAPTURED" },
      });
      await tx.statusEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.DELIVERED,
          note: "أكد المستلم الاستلام برمز OTP عبر رابط QR",
        },
      });
      return shipment.id;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}
