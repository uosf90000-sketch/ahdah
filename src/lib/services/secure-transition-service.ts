import { ShipmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";

export async function advanceShipmentSafely(
  travelerId: string,
  shipmentId: string,
  nextStatus: "WITH_TRAVELER" | "ARRIVED",
) {
  if (!shipmentId || shipmentId.length > 128) throw new DomainValidationError(["العُهدة غير صالحة"]);

  const expectedStatus = nextStatus === "WITH_TRAVELER"
    ? ShipmentStatus.INSPECTED
    : ShipmentStatus.WITH_TRAVELER;
  const targetStatus = nextStatus === "WITH_TRAVELER"
    ? ShipmentStatus.WITH_TRAVELER
    : ShipmentStatus.ARRIVED;

  return db.$transaction(async (tx) => {
    const updated = await tx.shipment.updateMany({
      where: {
        id: shipmentId,
        status: expectedStatus,
        acceptedOffer: { travelerId },
      },
      data: { status: targetStatus },
    });

    if (updated.count !== 1) {
      throw new DomainValidationError(["لا تملك صلاحية هذا التحديث أو تم تنفيذ الخطوة مسبقًا"]);
    }

    await tx.statusEvent.create({
      data: {
        shipmentId,
        actorId: travelerId,
        status: targetStatus,
        note: nextStatus === "WITH_TRAVELER"
          ? "استلم المسافر العُهدة وبدأ نقلها"
          : "أكد المسافر وصول العُهدة إلى مدينة الوجهة",
      },
    });

    return shipmentId;
  });
}

