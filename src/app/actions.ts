"use server";

import { AccountRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { DomainValidationError } from "@/lib/domain";
import { clientAddress, enforceRateLimit } from "@/lib/rate-limit";
import {
  advanceShipment,
  createRating,
  createShipmentFromForm,
  inspectShipment,
} from "@/lib/services/shipment-service";
import { createRouteAwareOffer, createRouteAwareTrip } from "@/lib/services/route-trip-service";
import {
  acceptOfferSafely,
  completeDeliverySafely,
  issueDeliveryOtpSafely,
} from "@/lib/services/secure-workflow-service";

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
    const ip = await clientAddress();
    enforceRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000, "تم تجاوز عدد محاولات إنشاء الحساب. حاول لاحقًا");

    if (name.length < 2 || name.length > 120) throw new DomainValidationError(["الاسم يجب أن يكون بين حرفين و120 حرفًا"]);
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) throw new DomainValidationError(["البريد الإلكتروني غير صالح"]);
    if (phone && !/^05\d{8}$/.test(phone)) throw new DomainValidationError(["رقم الجوال غير صالح"]);
    if (password.length < 8 || password.length > 128) throw new DomainValidationError(["كلمة المرور يجب أن تكون بين 8 و128 حرفًا"]);
    if (await db.user.findUnique({ where: { email } })) throw new DomainValidationError(["البريد الإلكتروني مسجل مسبقًا"]);

    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: AccountRole.BOTH,
        passwordHash: await hashPassword(password),
      },
    });
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
    const ip = await clientAddress();
    enforceRateLimit(`login:ip:${ip}`, 30, 10 * 60 * 1000, "محاولات دخول كثيرة. حاول بعد عدة دقائق");
    enforceRateLimit(`login:account:${email.slice(0, 254)}`, 10, 10 * 60 * 1000, "محاولات دخول كثيرة لهذا الحساب. حاول بعد عدة دقائق");

    if (!email || email.length > 254 || password.length > 128) throw new DomainValidationError(["البريد أو كلمة المرور غير صحيحة"]);
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
    const trip = await createRouteAwareTrip(user.id, formData);
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
    await createRouteAwareOffer(user.id, shipmentId, tripId, formData);
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
    await acceptOfferSafely(user.id, String(formData.get("offerId") ?? ""));
    revalidatePath(`/shipments/${shipmentId}`);
    revalidatePath("/dashboard");
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
  const token = String(formData.get("token") ?? "").trim();
  let destination = `/handover/${encodeURIComponent(token)}`;
  try {
    const demoOtp = await issueDeliveryOtpSafely(token);
    const query = new URLSearchParams({ success: "تم إرسال رمز الاستلام إلى جوال المستلم" });
    if (demoOtp) query.set("demoOtp", demoOtp);
    destination += `?${query}`;
  } catch (error) {
    destination = withError(destination, messageFrom(error));
  }
  redirect(destination);
}

export async function completeDeliveryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  let destination = `/handover/${encodeURIComponent(token)}`;
  try {
    const shipmentId = await completeDeliverySafely(token, String(formData.get("otp") ?? ""));
    revalidatePath(`/shipments/${shipmentId}`);
    revalidatePath("/dashboard");
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
