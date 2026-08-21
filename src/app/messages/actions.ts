"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DomainValidationError } from "@/lib/domain";
import { sendChatMessage, updateChatLocation } from "@/lib/services/chat-service";

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
    await sendChatMessage(user.id, shipmentId, String(formData.get("body") ?? ""));
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
    const prefix = kind === "pickup" ? "pickup" : "delivery";
    const lat = Number(formData.get(`${prefix}Lat`));
    const lng = Number(formData.get(`${prefix}Lng`));
    const note = String(formData.get(`${prefix}Note`) ?? "");
    await updateChatLocation(user.id, shipmentId, kind, lat, lng, note);
    revalidatePath(destination);
    destination += `?success=${encodeURIComponent(kind === "pickup" ? "تم حفظ موقع الاستلام" : "تم حفظ موقع التسليم")}`;
  } catch (error) {
    destination += `?error=${encodeURIComponent(messageFrom(error))}`;
  }

  redirect(destination);
}
