import { createSign } from "node:crypto";
import { db } from "@/lib/db";
import { ensureRuntimeSchema } from "@/lib/runtime-schema";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
};

type CachedToken = { value: string; expiresAt: number };
const globalPush = globalThis as typeof globalThis & { __ahdatukFcmToken?: CachedToken };

function firebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  const cached = globalPush.__ahdatukFcmToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const config = firebaseConfig();
  if (!config) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(config.privateKey).toString("base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`FCM OAuth failed with status ${response.status}`);
  const token = await response.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) throw new Error("FCM OAuth returned no access token");
  globalPush.__ahdatukFcmToken = {
    value: token.access_token,
    expiresAt: Date.now() + Math.max(300, token.expires_in ?? 3600) * 1000,
  };
  return token.access_token;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const config = firebaseConfig();
  if (!config) return;
  await ensureRuntimeSchema();
  const devices = await db.pushDevice.findMany({ where: { userId }, select: { id: true, token: true } });
  if (!devices.length) return;
  const bearer = await accessToken();
  if (!bearer) return;

  await Promise.all(devices.map(async (device) => {
    try {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${bearer}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title: payload.title, body: payload.body },
            data: payload.href ? { href: payload.href } : undefined,
            android: { priority: "high" },
            apns: { payload: { aps: { sound: "default" } } },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) return;
      const text = await response.text();
      if (response.status === 404 || text.includes("UNREGISTERED") || text.includes("registration-token-not-registered")) {
        await db.pushDevice.deleteMany({ where: { id: device.id } });
        return;
      }
      console.error("FCM send failed", { status: response.status, deviceId: device.id });
    } catch (error) {
      console.error("FCM send failed", { deviceId: device.id, error: error instanceof Error ? error.message : "unknown" });
    }
  }));
}

export async function notifyShipmentSender(shipmentId: string, payload: PushPayload) {
  const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, select: { senderId: true } });
  if (shipment) await sendPushToUser(shipment.senderId, payload);
}

export async function notifyAcceptedTraveler(shipmentId: string, payload: PushPayload) {
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    select: { acceptedOffer: { select: { travelerId: true } } },
  });
  if (shipment?.acceptedOffer) await sendPushToUser(shipment.acceptedOffer.travelerId, payload);
}
