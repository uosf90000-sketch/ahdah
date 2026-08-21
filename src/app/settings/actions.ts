"use server";

import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { deleteAccountCompletely } from "@/lib/account-deletion";
import { DomainValidationError } from "@/lib/domain";

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  try {
    await deleteAccountCompletely(user.id, String(formData.get("confirmation") ?? ""));
    await destroySession();
  } catch (error) {
    const message = error instanceof DomainValidationError
      ? error.issues.join("، ")
      : "تعذر حذف الحساب الآن. حاول مرة أخرى";
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }
  redirect(`/auth?success=${encodeURIComponent("تم حذف حسابك وبياناته المرتبطة")}`);
}
