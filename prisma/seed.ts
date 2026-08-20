import { PrismaClient, AccountRole, PhotoKind, ShipmentCategory, ShipmentStatus } from "@prisma/client";
import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  await prisma.$transaction([
    prisma.rating.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.statusEvent.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.shipmentPhoto.deleteMany(),
    prisma.shipment.updateMany({ data: { acceptedOfferId: null } }),
    prisma.offer.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await hashPassword("Demo1234!");

  const sender = await prisma.user.create({
    data: {
      name: "نورة العتيبي",
      email: "sender@ahdah.sa",
      phone: "0500000001",
      role: AccountRole.BOTH,
      passwordHash,
    },
  });

  const traveler = await prisma.user.create({
    data: {
      name: "سلمان الحربي",
      email: "traveler@ahdah.sa",
      phone: "0500000002",
      role: AccountRole.BOTH,
      passwordHash,
    },
  });

  const trip = await prisma.trip.create({
    data: {
      travelerId: traveler.id,
      fromCity: "جدة",
      toCity: "الرياض",
      departureAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      airline: "الخطوط السعودية",
      flightNumber: "SV1042",
      availableWeightKg: 12,
    },
  });

  const shipment = await prisma.shipment.create({
    data: {
      refCode: "AHD-260801",
      senderId: sender.id,
      fromCity: "جدة",
      toCity: "الرياض",
      weightKg: 4.5,
      lengthCm: 38,
      widthCm: 28,
      heightCm: 16,
      category: ShipmentCategory.GIFTS,
      contents: "هدايا عائلية مغلفة: عطران وقطعتا ملابس. لا توجد سوائل مفتوحة أو بطاريات.",
      approximateValueSar: 850,
      requestedDeliveryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      recipientName: "عبدالله العتيبي",
      recipientPhone: "0500000003",
      status: ShipmentStatus.RECEIVING_OFFERS,
      qrToken: "demo-ahdah-260801",
      photos: {
        create: [
          {
            uploadedById: sender.id,
            kind: PhotoKind.ORIGINAL,
            url: "/demo-package.svg",
            caption: "محتويات الشحنة قبل التغليف",
          },
        ],
      },
      statusEvents: {
        create: [
          { actorId: sender.id, status: ShipmentStatus.NEW, note: "تم إنشاء طلب الشحنة" },
          { actorId: sender.id, status: ShipmentStatus.RECEIVING_OFFERS, note: "الطلب متاح للمسافرين المطابقين" },
        ],
      },
    },
  });

  await prisma.offer.create({
    data: {
      shipmentId: shipment.id,
      tripId: trip.id,
      travelerId: traveler.id,
      priceSar: 145,
      note: "أستطيع الاستلام من حي الصفا مساءً وتسليمها في شمال الرياض.",
    },
  });

  console.info("Seed complete");
  console.info("Sender: sender@ahdah.sa / Demo1234!");
  console.info("Traveler: traveler@ahdah.sa / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
