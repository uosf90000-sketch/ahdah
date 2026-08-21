import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";

export async function deleteAccountCompletely(userId: string, confirmation: string) {
  if (confirmation.trim() !== "حذف حسابي") {
    throw new DomainValidationError(["اكتب «حذف حسابي» للتأكيد"]);
  }

  await db.$transaction(
    async (tx) => {
      // Remove user-generated data on shipments owned by other users first because
      // several legacy relations intentionally use RESTRICT for audit integrity.
      await tx.chatMessage.deleteMany({ where: { senderId: userId } });
      await tx.shipmentPhoto.deleteMany({ where: { uploadedById: userId } });
      await tx.inspection.deleteMany({ where: { travelerId: userId } });
      await tx.rating.deleteMany({ where: { OR: [{ authorId: userId }, { targetId: userId }] } });

      // Offers can be referenced as the accepted offer for another user's shipment.
      // Deleting them safely clears acceptedOfferId through the schema's ON DELETE SET NULL.
      await tx.offer.deleteMany({ where: { travelerId: userId } });
      await tx.trip.deleteMany({ where: { travelerId: userId } });

      // A sender requested complete deletion, so their own shipments and all data that
      // belongs exclusively to those shipments are removed through cascade relations.
      await tx.shipment.deleteMany({ where: { senderId: userId } });

      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 20_000,
    },
  );
}
