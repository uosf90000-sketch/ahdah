import type { CapacitorConfig } from "@capacitor/cli";

const rawServerUrl = process.env.CAPACITOR_SERVER_URL?.trim()
  || process.env.NEXT_PUBLIC_APP_URL?.trim()
  || "https://ahdah-production.up.railway.app";
const serverUrl = rawServerUrl.replace(/\/$/, "");
const serverHost = new URL(serverUrl).hostname;

const config: CapacitorConfig = {
  appId: "sa.ahdatuk.app",
  appName: "عهدتك",
  webDir: "mobile-dist",
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: [serverHost],
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
