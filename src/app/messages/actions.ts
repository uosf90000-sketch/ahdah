"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DomainValidationError } from "@/lib/domain";
import { sendChatMessage } from "@/lib/services/chat-service";

function messageFrom(error: unknown) {
  if (error instanceof DomainValidationError) return error.issues.join("، ");
  console.error(error);
  return "تعذر إرسال الرسالة الآن";
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
