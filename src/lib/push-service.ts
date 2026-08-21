import { createSign } from "node:crypto";
import { connect } from "node:http2";
import { db } from "@/lib/db";
import { ensureRuntimeSchema } from "@/lib/runtime-schema";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
};

type CachedToken = { value: string; expiresAt: number };
const globalPush = globalThis as typeof globalThis & {
  __ahdatukFcmToken?: CachedToken;
  __ahdatukApnsToken?: CachedToken;
};

function firebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function apnsConfig() {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || "sa.ahdatuk.app";
  const environment = process.env.APNS_ENVIRONMENT?.trim().toLowerCase() === "development" ? "development" : "production";
  if (!keyId || !teamId || !privateKey) return null;
  return { keyId, teamId, privateKey, bundleId, environment };
}

function base64url(value: string | Buffer) {
  return typeof value === "string" ? Buffer.from(value).toString("base64url") : value.toString("base64url");
}

async function fcmAccessToken() {
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

function apnsProviderToken() {
  const cached = globalPush.__ahdatukApnsToken;
  if (cached && cached.expiresAt > Date.now() + 5 * 60_000) return cached.value;

  const config = apnsConfig();
  if (!config) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const payload = base64url(JSON.stringify({ iss: config.teamId, iat: now }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign({ key: config.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
  const token = `${unsigned}.${signature}`;
  globalPush.__ahdatukApnsToken = { value: token, expiresAt: Date.now() + 50 * 60_000 };
  return token;
}

async function sendAndroid(device: { id: string; token: string }, payload: PushPayload) {
  const config = firebaseConfig();
  if (!config) return;
  const bearer = await fcmAccessToken();
  if (!bearer) return;

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
}

async function sendIos(device: { id: string; token: string }, payload: PushPayload) {
  const config = apnsConfig();
  const bearer = apnsProviderToken();
  if (!config || !bearer) return;

  const authority = config.environment === "development"
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";

  await new Promise<void>((resolve, reject) => {
    const client = connect(authority);
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error("APNs request timed out"));
    }, 10_000);

    client.once("error", (error) => {
      clearTimeout(timer);
      client.destroy();
      reject(error);
    });

    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${encodeURIComponent(device.token)}`,
      authorization: `bearer ${bearer}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let responseBody = "";
    request.setEncoding("utf8");
    request.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    request.on("data", (chunk) => {
      responseBody += chunk;
    });
    request.on("end", async () => {
      clearTimeout(timer);
      client.close();
      if (status >= 200 && status < 300) return resolve();
      if (status === 410 || responseBody.includes("BadDeviceToken") || responseBody.includes("Unregistered")) {
        await db.pushDevice.deleteMany({ where: { id: device.id } }).catch(() => undefined);
        return resolve();
      }
      console.error("APNs send failed", { status, deviceId: device.id });
      resolve();
    });
    request.on("error", (error) => {
      clearTimeout(timer);
      client.destroy();
      reject(error);
    });

    request.end(JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: "default",
      },
      ...(payload.href ? { href: payload.href } : {}),
    }));
  });
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    await ensureRuntimeSchema();
    const devices = await db.pushDevice.findMany({
      where: { userId },
      select: { id: true, token: true, platform: true },
    });
    if (!devices.length) return;

    await Promise.all(devices.map(async (device) => {
      try {
        if (device.platform === "ios") await sendIos(device, payload);
        else if (device.platform === "android") await sendAndroid(device, payload);
      } catch (error) {
        console.error("push send failed", {
          platform: device.platform,
          deviceId: device.id,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }));
  } catch (error) {
    console.error("push notification skipped", { error: error instanceof Error ? error.message : "unknown" });
  }
}

export async function notifyShipmentSender(shipmentId: string, payload: PushPayload) {
  try {
    const shipment = await db.shipment.findUnique({ where: { id: shipmentId }, select: { senderId: true } });
    if (shipment) await sendPushToUser(shipment.senderId, payload);
  } catch (error) {
    console.error("sender notification skipped", { error: error instanceof Error ? error.message : "unknown" });
  }
}

export async function notifyAcceptedTraveler(shipmentId: string, payload: PushPayload) {
  try {
    const shipment = await db.shipment.findUnique({
      where: { id: shipmentId },
      select: { acceptedOffer: { select: { travelerId: true } } },
    });
    if (shipment?.acceptedOffer) await sendPushToUser(shipment.acceptedOffer.travelerId, payload);
  } catch (error) {
    console.error("traveler notification skipped", { error: error instanceof Error ? error.message : "unknown" });
  }
}
