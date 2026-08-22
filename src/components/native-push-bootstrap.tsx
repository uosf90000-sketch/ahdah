"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export function NativePushBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    async function setup() {
      const registration = await PushNotifications.addListener("registration", async (token) => {
        if (disposed) return;
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
        }).catch(() => undefined);
      });
      handles.push(registration);

      const action = await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
        const href = event.notification.data?.href;
        if (typeof href === "string" && href.startsWith("/") && !href.startsWith("//")) {
          window.location.assign(href);
        }
      });
      handles.push(action);

      const permission = await PushNotifications.checkPermissions();
      if (permission.receive === "granted") await PushNotifications.register();
    }

    void setup().catch(() => undefined);
    return () => {
      disposed = true;
      for (const handle of handles) void handle.remove();
    };
  }, []);

  return null;
}

