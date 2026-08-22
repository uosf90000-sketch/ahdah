import * as admin from "firebase-admin";

let app: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App | null {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn("Firebase not configured - FIREBASE_PROJECT_ID missing");
    return null;
  }

  if (app) return app;

  try {
    const credentials = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    };

    app = admin.initializeApp({
      credential: admin.credential.cert(credentials as admin.ServiceAccount),
    });

    return app;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
}

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const fbApp = getFirebaseApp();
  if (!fbApp) {
    console.warn("Firebase not available for push notification");
    return false;
  }

  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token: deviceToken,
    };

    await admin.messaging(fbApp).send(message);
    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

export async function sendMulticastNotification(
  deviceTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const fbApp = getFirebaseApp();
  if (!fbApp) {
    console.warn("Firebase not available for multicast notification");
    return { success: 0, failure: deviceTokens.length };
  }

  try {
    const message = {
      notification: { title, body },
      data: data || {},
    };

    const response = await admin.messaging(fbApp).sendMulticast({
      ...message,
      tokens: deviceTokens,
    });

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error) {
    console.error("Failed to send multicast notification:", error);
    return { success: 0, failure: deviceTokens.length };
  }
}

export async function unsubscribeFromTopic(deviceTokens: string[], topic: string) {
  const fbApp = getFirebaseApp();
  if (!fbApp) return;

  try {
    await admin.messaging(fbApp).unsubscribeFromTopic(deviceTokens, topic);
  } catch (error) {
    console.error("Failed to unsubscribe from topic:", error);
  }
}

export async function subscribeToTopic(deviceTokens: string[], topic: string) {
  const fbApp = getFirebaseApp();
  if (!fbApp) return;

  try {
    await admin.messaging(fbApp).subscribeToTopic(deviceTokens, topic);
  } catch (error) {
    console.error("Failed to subscribe to topic:", error);
  }
}
