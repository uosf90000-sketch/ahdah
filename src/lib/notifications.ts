import { db } from "@/lib/db";
import { sendMulticastNotification } from "@/lib/firebase-admin";
import { captureException } from "@/lib/sentry-init";

export type NotificationType =
  | "SHIPMENT_CREATED"
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "MESSAGE_RECEIVED"
  | "DELIVERY_READY"
  | "DELIVERY_COMPLETED"
  | "RATING_RECEIVED";

interface NotificationPayload {
  type: NotificationType;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { pushDevices: true },
    });

    if (!user || !user.pushDevices || user.pushDevices.length === 0) {
      return;
    }

    const validTokens = user.pushDevices
      .map((device) => device.token)
      .filter((token): token is string => typeof token === "string" && token.length > 0);
    if (validTokens.length === 0) return;

    const result = await sendMulticastNotification(validTokens, payload.title, payload.body, {
      type: payload.type,
      ...payload.data,
    });

    if (result.failure > 0) {
      console.warn(`Failed to send notifications: ${result.failure}/${validTokens.length} failed`);
    }

    await db.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sentAt: new Date(),
      },
    });
  } catch (error) {
    captureException(error, {
      context: "sendNotification",
      userId: payload.userId,
      type: payload.type,
    });
  }
}

export async function notifyShipmentCreated(shipmentId: string): Promise<void> {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    select: { refCode: true, fromCity: true, toCity: true },
  });

  if (!shipment) return;

  await sendNotification({
    type: "SHIPMENT_CREATED",
    userId: shipment.refCode,
    title: "تم نشر عُهدة جديدة",
    body: `من ${shipment.fromCity} إلى ${shipment.toCity}`,
    data: { shipmentId },
  });
}

export async function notifyOfferReceived(shipmentId: string): Promise<void> {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    select: { senderId: true, refCode: true },
  });

  if (!shipment) return;

  await sendNotification({
    type: "OFFER_RECEIVED",
    userId: shipment.senderId,
    title: "تلقيت عرضًا جديدًا",
    body: "موصل قدم عرضًا على عُهدتك",
    data: { shipmentId },
  });
}

export async function notifyOfferAccepted(shipmentId: string, travelerId: string): Promise<void> {
  await sendNotification({
    type: "OFFER_ACCEPTED",
    userId: travelerId,
    title: "تم قبول عرضك!",
    body: "المرسل وافق على عرضك للعُهدة",
    data: { shipmentId },
  });
}

export async function notifyMessageReceived(shipmentId: string, recipientId: string, senderName: string): Promise<void> {
  await sendNotification({
    type: "MESSAGE_RECEIVED",
    userId: recipientId,
    title: `رسالة من ${senderName}`,
    body: "لديك رسالة جديدة بخصوص العُهدة",
    data: { shipmentId },
  });
}

export async function notifyDeliveryReady(shipmentId: string, recipientId: string): Promise<void> {
  await sendNotification({
    type: "DELIVERY_READY",
    userId: recipientId,
    title: "العُهدة جاهزة للتسليم",
    body: "الموصل وصل إلى موقع التسليم",
    data: { shipmentId },
  });
}

export async function notifyDeliveryCompleted(shipmentId: string, senderId: string): Promise<void> {
  await sendNotification({
    type: "DELIVERY_COMPLETED",
    userId: senderId,
    title: "تم تسليم العُهدة بنجاح",
    body: "وصلت العُهدة إلى المستلم",
    data: { shipmentId },
  });
}

export async function notifyRatingReceived(userId: string, raterName: string): Promise<void> {
  await sendNotification({
    type: "RATING_RECEIVED",
    userId,
    title: `تقييم جديد من ${raterName}`,
    body: "تلقيت تقييمًا جديدًا",
    data: { userId },
  });
}
