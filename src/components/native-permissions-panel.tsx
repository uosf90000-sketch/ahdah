"use client";

import { Bell, Camera as CameraIcon, CheckCircle2, LoaderCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";

type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export function NativePermissionsPanel() {
  const [native] = useState(() => Capacitor.isNativePlatform());
  const [busy, setBusy] = useState<string | null>(null);
  const [camera, setCamera] = useState<PermissionState>("unknown");
  const [location, setLocation] = useState<PermissionState>("unknown");
  const [notifications, setNotifications] = useState<PermissionState>("unknown");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!native) return;

    void Promise.all([
      Camera.checkPermissions().then((status) => setCamera(normalizePermission(status.camera))),
      Geolocation.checkPermissions().then((status) => setLocation(normalizePermission(status.location))),
      PushNotifications.checkPermissions().then((status) => setNotifications(normalizePermission(status.receive))),
    ]).catch(() => setMessage("تعذر قراءة صلاحيات الجهاز الآن"));
  }, [native]);

  async function requestCamera() {
    setBusy("camera");
    setMessage("");
    try {
      const status = await Camera.requestPermissions();
      setCamera(normalizePermission(status.camera));
    } catch {
      setMessage("تعذر طلب صلاحية الكاميرا. يمكنك تفعيلها من إعدادات الجهاز.");
    } finally {
      setBusy(null);
    }
  }

  async function requestLocation() {
    setBusy("location");
    setMessage("");
    try {
      const status = await Geolocation.requestPermissions();
      setLocation(normalizePermission(status.location));
    } catch {
      setMessage("تعذر طلب صلاحية الموقع. يمكنك تفعيلها من إعدادات الجهاز.");
    } finally {
      setBusy(null);
    }
  }

  async function requestNotifications() {
    setBusy("notifications");
    setMessage("");
    try {
      const permission = await PushNotifications.requestPermissions();
      const next = normalizePermission(permission.receive);
      setNotifications(next);
      if (next !== "granted") {
        setMessage("لم يتم السماح بالإشعارات. يمكنك تفعيلها لاحقًا من إعدادات الجهاز.");
        return;
      }

      const registration = await PushNotifications.addListener("registration", async (token) => {
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
        });
        setMessage("تم تفعيل إشعارات عهدتك على هذا الجهاز.");
        await registration.remove();
      });
      const errorListener = await PushNotifications.addListener("registrationError", async () => {
        setMessage("تعذر تسجيل الجهاز للإشعارات الآن.");
        await errorListener.remove();
      });
      await PushNotifications.register();
    } catch {
      setMessage("تعذر تفعيل الإشعارات الآن. تحقق من إعدادات الجهاز.");
    } finally {
      setBusy(null);
    }
  }

  if (!native) {
    return <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">تظهر أزرار صلاحيات iPhone وAndroid عند فتح عهدتك من نسخة التطبيق. الموقع الحالي يبقى متاحًا عبر صلاحيات المتصفح.</div>;
  }

  return (
    <div className="space-y-3">
      <PermissionButton Icon={CameraIcon} label="السماح بالكاميرا والصور" status={camera} busy={busy === "camera"} onClick={requestCamera} />
      <PermissionButton Icon={MapPin} label="السماح بالموقع أثناء الاستخدام" status={location} busy={busy === "location"} onClick={requestLocation} />
      <PermissionButton Icon={Bell} label="تفعيل إشعارات عهدتك" status={notifications} busy={busy === "notifications"} onClick={requestNotifications} />
      {message && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">{message}</p>}
    </div>
  );
}

function PermissionButton({ Icon, label, status, busy, onClick }: { Icon: typeof Bell; label: string; status: PermissionState; busy: boolean; onClick: () => void }) {
  const granted = status === "granted";
  return (
    <button type="button" onClick={onClick} disabled={busy || granted} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-right font-bold transition hover:border-palm-300 disabled:cursor-default disabled:bg-slate-50">
      <span className="flex items-center gap-3"><Icon size={18} className="text-palm-600" />{label}</span>
      {busy ? <LoaderCircle className="animate-spin text-palm-600" size={18} /> : granted ? <span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 size={16} /> مفعلة</span> : <span className="text-xs text-palm-700">تفعيل</span>}
    </button>
  );
}

function normalizePermission(value: string | undefined): PermissionState {
  if (value === "granted") return "granted";
  if (value === "denied") return "denied";
  if (value === "prompt" || value === "prompt-with-rationale") return "prompt";
  return "unknown";
}
