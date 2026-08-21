"use server";

import { AccountRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import {
  acceptOffer,
  advanceShipment,
  completeDelivery,
  createOffer,
  createRating,
  createShipmentFromForm,
  createTrip,
  inspectShipment,
  issueDeliveryOtp,
} from "@/lib/services/shipment-service";

function messageFrom(error: unknown) {
  if (error instanceof DomainValidationError) return error.issues.join("، ");
  console.error(error);
  return "تعذر إكمال العملية الآن. تحقق من البيانات وحاول مرة أخرى";
}

const withError = (path: string, message: string) => `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`;

export async function registerAction(formData: FormData) {
  let destination = "/dashboard";
  try {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "BOTH") as AccountRole;
    if (name.length < 2) throw new DomainValidationError(["الاسم مطلوب"]);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new DomainValidationError(["البريد الإلكتروني غير صالح"]);
    if (phone && !/^05\d{8}$/.test(phone)) throw new DomainValidationError(["رقم الجوال غير صالح"]);
    if (password.length < 8) throw new DomainValidationError(["كلمة المرور يجب ألا تقل عن 8 أحرف"]);
    if (!Object.values(AccountRole).includes(role)) throw new DomainValidationError(["نوع الحساب غير صالح"]);
    if (await db.user.findUnique({ where: { email } })) throw new DomainValidationError(["البريد الإلكتروني مسجل مسبقًا"]);
    const user = await db.user.create({ data: { name, email, phone: phone || null, role, passwordHash: await hashPassword(password) } });
    await createSession(user.id);
  } catch (error) {
    destination = withError("/auth?tab=register", messageFrom(error));
  }
  redirect(destination);
}

export async function loginAction(formData: FormData) {
  let destination = "/dashboard";
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw new DomainValidationError(["البريد أو كلمة المرور غير صحيحة"]);
    await createSession(user.id);
  } catch (error) {
    destination = withError("/auth?tab=login", messageFrom(error));
  }
  redirect(destination);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function createShipmentAction(formData: FormData) {
  const user = await requireUser();
  let destination = "/shipments/new";
  try {
    const shipment = await createShipmentFromForm(user.id, formData);
    revalidatePath("/dashboard");
    destination = `/shipments/${shipment.id}?success=${encodeURIComponent("تم نشر طلب الشحنة واستقبال المطابقات")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function createTripAction(formData: FormData) {
  const user = await requireUser();
  let destination = "/trips/new";
  try {
    const trip = await createTrip(user.id, formData);
    revalidatePath("/dashboard");
    destination = `/trips/${trip.id}?success=${encodeURIComponent("تمت إضافة الرحلة وعرض الشحنات المطابقة")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function createOfferAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "").trim();
  const tripId = String(formData.get("tripId") ?? "").trim();
  const tripDestination = tripId ? `/trips/${tripId}` : "/dashboard";
  let destination = tripDestination;

  try {
    if (!shipmentId || !tripId) throw new DomainValidationError(["تعذر تحديد الطلب أو الرحلة. افتح الطلب من قسم الطلبات المتاحة وحاول مرة أخرى"]);
    await createOffer(user.id, shipmentId, tripId, formData);
    revalidatePath(`/shipments/${shipmentId}`);
    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/dashboard");
    destination = `${tripDestination}?success=${encodeURIComponent("تم إرسال عرضك للمرسل بنجاح")}`;
  } catch (error) {
    destination = withError(tripDestination, messageFrom(error));
  }

  redirect(destination);
}

export async function acceptOfferAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  let destination = `/shipments/${shipmentId}`;
  try {
    await acceptOffer(user.id, String(formData.get("offerId") ?? ""));
    revalidatePath(`/shipments/${shipmentId}`);
    destination += `?success=${encodeURIComponent("تم قبول المسافر وحجز المبلغ تجريبيًا")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function inspectShipmentAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  let destination = `/shipments/${shipmentId}`;
  try {
    await inspectShipment(user.id, shipmentId, formData);
    revalidatePath(`/shipments/${shipmentId}`);
    destination += `?success=${encodeURIComponent("تم توثيق فحص العُهدة بنجاح")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function advanceShipmentAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  let destination = `/shipments/${shipmentId}`;
  try {
    const status = String(formData.get("nextStatus")) as "WITH_TRAVELER" | "ARRIVED";
    if (!["WITH_TRAVELER", "ARRIVED"].includes(status)) throw new DomainValidationError(["الحالة المطلوبة غير صالحة"]);
    await advanceShipment(user.id, shipmentId, status);
    revalidatePath(`/shipments/${shipmentId}`);
    destination += `?success=${encodeURIComponent("تم تحديث حالة العُهدة")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function sendOtpAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  let destination = `/handover/${token}`;
  try {
    const demoOtp = await issueDeliveryOtp(token);
    const query = new URLSearchParams({ success: "تم إرسال رمز الاستلام إلى جوال المستلم" });
    if (demoOtp) query.set("demoOtp", demoOtp);
    destination += `?${query}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function completeDeliveryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  let destination = `/handover/${token}`;
  try {
    const shipmentId = await completeDelivery(token, String(formData.get("otp") ?? ""));
    revalidatePath(`/shipments/${shipmentId}`);
    destination += "?delivered=1";
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function createRatingAction(formData: FormData) {
  const user = await requireUser();
  const shipmentId = String(formData.get("shipmentId") ?? "");
  let destination = `/shipments/${shipmentId}`;
  try {
    await createRating(user.id, shipmentId, Number(formData.get("score")), String(formData.get("comment") ?? "").trim());
    revalidatePath(`/shipments/${shipmentId}`);
    destination += `?success=${encodeURIComponent("شكرًا، تم حفظ تقييمك")}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}
