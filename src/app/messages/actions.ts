"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DomainValidationError } from "@/lib/domain";
import { sendPushToUser } from "@/lib/push-service";
import { getChatContext, sendChatMessage, updateChatLocation } from "@/lib/services/chat-service";

function messageFrom(error: unknown) {
  if (error instanceof DomainValidationError) return error.issues.join("، ");
  console.error(error);
  return "تعذر إكمال العملية الآن";
}

export async function sendChatMessageAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  let destination = `/messages/${shipmentId}`;
  try {
    const context = await getChatContext(user.id, shipmentId);
    await sendChatMessage(user.id, shipmentId, String(formData.get("body") ?? ""));
    await sendPushToUser(context.otherParticipant.id, {
      title: "رسالة جديدة في عهدتك",
      body: `لديك رسالة جديدة من ${user.name.split(" ")[0]}`,
      href: `/messages/${shipmentId}`,
    });
    revalidatePath(destination);
  } catch (error) {
    destination += `?error=${encodeURIComponent(messageFrom(error))}`;
  }
  redirect(destination);
}

export async function updateChatLocationAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  let destination = `/messages/${shipmentId}`;

  try {
    if (kind !== "pickup" && kind !== "delivery") throw new DomainValidationError(["نوع الموقع غير صالح"]);
    const context = await getChatContext(user.id, shipmentId);
    const prefix = kind === "pickup" ? "pickup" : "delivery";
    const rawLat = String(formData.get(`${prefix}Lat`) ?? "").trim();
    const rawLng = String(formData.get(`${prefix}Lng`) ?? "").trim();
    if (!rawLat || !rawLng) throw new DomainValidationError(["حدد الموقع على الخريطة قبل الحفظ"]);
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    const note = String(formData.get(`${prefix}Note`) ?? "");
    await updateChatLocation(user.id, shipmentId, kind, lat, lng, note);
    await sendPushToUser(context.otherParticipant.id, {
      title: kind === "pickup" ? "تم تحديد موقع الاستلام" : "تم تحديد موقع التسليم",
      body: "افتح المحادثة لعرض الموقع والاتجاهات.",
      href: `/messages/${shipmentId}`,
    });
    revalidatePath(destination);
    destination += `?success=${encodeURIComponent(kind === "pickup" ? "تم حفظ موقع الاستلام" : "تم حفظ موقع التسليم")}`;
  } catch (error) {
    destination += `?error=${encodeURIComponent(messageFrom(error))}`;
  }

  redirect(destination);
}
