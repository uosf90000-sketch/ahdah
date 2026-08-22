import {
  PhotoKind,
  Prisma,
  ShipmentCategory,
  ShipmentStatus,
} from "@prisma/client";
import { randomBytes } from "node:crypto";
import { storageAdapter } from "@/lib/adapters/storage";
import { db } from "@/lib/db";
import {
  DomainValidationError,
  validateShipmentInput,
} from "@/lib/domain";

const categoryValues = new Set(Object.values(ShipmentCategory));

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
          { actorId: senderId, status: ShipmentStatus.RECEIVING_OFFERS, note: "تم نشر الطلب للموصلين المطابقين" },
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

export async function inspectShipment(travelerId: string, shipmentId: string, formData: FormData) {
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, include: { acceptedOffer: true } });
  if (!shipment?.acceptedOffer || shipment.acceptedOffer.travelerId !== travelerId) throw new DomainValidationError(["أنت لست الموصل المقبول لهذه العُهدة"]);
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
    db.statusEvent.create({ data: { shipmentId, actorId: travelerId, status: ShipmentStatus.INSPECTED, note: "عاين الموصل المحتويات ووافق على حملها" } }),
  ]);
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

