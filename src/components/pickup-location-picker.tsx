"use client";

import { LocateFixed, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type PickupCoordinates = { lat: number; lng: number };
export type LocationCoordinates = PickupCoordinates;

type LeafletMap = {
  setView(coords: [number, number], zoom: number): LeafletMap;
  on(event: "click", handler: (event: { latlng: { lat: number; lng: number } }) => void): void;
  remove(): void;
  invalidateSize(): void;
};

type LeafletMarker = {
  addTo(map: LeafletMap): LeafletMarker;
  setLatLng(coords: [number, number]): LeafletMarker;
  on(event: "dragend", handler: () => void): void;
  getLatLng(): { lat: number; lng: number };
};

type LeafletApi = {
  map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): { addTo(map: LeafletMap): unknown };
  marker(coords: [number, number], options?: Record<string, unknown>): LeafletMarker;
};

declare global {
  interface Window {
    L?: LeafletApi;
    __ahdatukLeafletPromise?: Promise<LeafletApi>;
  }
}

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_INTEGRITY = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
const LEAFLET_CSS_INTEGRITY = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__ahdatukLeafletPromise) return window.__ahdatukLeafletPromise;

  window.__ahdatukLeafletPromise = new Promise<LeafletApi>((resolve, reject) => {
    if (!document.querySelector("link[data-ahdatuk-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.integrity = LEAFLET_CSS_INTEGRITY;
      link.crossOrigin = "anonymous";
      link.referrerPolicy = "no-referrer";
      link.dataset.ahdatukLeaflet = "true";
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-ahdatuk-leaflet]");
    const finish = () => window.L ? resolve(window.L) : reject(new Error("Leaflet failed to load"));

    if (existing) {
      if (window.L) finish();
      else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.integrity = LEAFLET_JS_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.async = true;
    script.dataset.ahdatukLeaflet = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Leaflet failed to load")), { once: true });
    document.head.appendChild(script);
  });

  return window.__ahdatukLeafletPromise;
}

type LocationKind = "pickup" | "delivery";

export function PickupLocationPicker({
  value,
  onChange,
  showError = false,
  kind = "pickup",
}: {
  value: LocationCoordinates | null;
  onChange: (value: LocationCoordinates) => void;
  showError?: boolean;
  kind?: LocationKind;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<LeafletApi | null>(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [geoError, setGeoError] = useState("");
  const isPickup = kind === "pickup";
  const label = isPickup ? "موقع الاستلام" : "موقع التسليم";
  const prefix = isPickup ? "pickup" : "delivery";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        leafletRef.current = L;
        const initial: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;
        const map = L.map(containerRef.current, { zoomControl: true }).setView(initial, value ? 16 : 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        mapRef.current = map;

        const placeMarker = (lat: number, lng: number, zoom = false) => {
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on("dragend", () => {
              const next = marker.getLatLng();
              onChangeRef.current({ lat: next.lat, lng: next.lng });
            });
            markerRef.current = marker;
          }
          if (zoom) map.setView([lat, lng], 17);
        };

        if (value) placeMarker(value.lat, value.lng);
        map.on("click", (event) => {
          const next = { lat: event.latlng.lat, lng: event.latlng.lng };
          placeMarker(next.lat, next.lng);
          onChangeRef.current(next);
        });
        window.setTimeout(() => map.invalidateSize(), 80);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is initialized once; later coordinate changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value || !mapRef.current || !leafletRef.current) return;
    if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng]);
    else {
      const marker = leafletRef.current.marker([value.lat, value.lng], { draggable: true }).addTo(mapRef.current);
      marker.on("dragend", () => {
        const next = marker.getLatLng();
        onChangeRef.current({ lat: next.lat, lng: next.lng });
      });
      markerRef.current = marker;
    }
  }, [value]);

  async function useCurrentLocation() {
    setGeoError("");
    setLocating(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
          const requested = await Geolocation.requestPermissions({ permissions: ["location"] });
          if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
            throw new Error("location permission denied");
          }
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
        });
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        onChange(next);
        mapRef.current?.setView([next.lat, next.lng], 17);
        return;
      }

      if (!navigator.geolocation) throw new Error("geolocation unavailable");
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const next = { lat: position.coords.latitude, lng: position.coords.longitude };
            onChange(next);
            mapRef.current?.setView([next.lat, next.lng], 17);
            resolve();
          },
          reject,
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
        );
      });
    } catch {
      setGeoError("تعذر الوصول لموقعك. اسمح لتطبيق عهدتك باستخدام الموقع أو حدده يدويًا على الخريطة.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-bold"><MapPin className="text-palm-600" size={19} /> {label}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-500">استخدم موقعك الحالي أو اضغط على الخريطة، ويمكنك سحب الدبوس للتعديل.</p>
        </div>
        <button type="button" onClick={useCurrentLocation} disabled={locating} className="btn-secondary shrink-0">
          {locating ? <LoaderCircle className="animate-spin" size={17} /> : <LocateFixed size={17} />}
          {locating ? "جاري التحديد..." : "استخدم موقعي الحالي"}
        </button>
      </div>

      <input type="hidden" name={`${prefix}Lat`} value={value?.lat ?? ""} />
      <input type="hidden" name={`${prefix}Lng`} value={value?.lng ?? ""} />

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <div ref={containerRef} className="h-64 w-full sm:h-72" dir="ltr" aria-label={`خريطة تحديد ${label}`} />
        {mapError && <div className="absolute inset-0 grid place-items-center bg-slate-100 p-6 text-center text-sm text-slate-600">تعذر تحميل الخريطة. حاول تحديث الصفحة، ويمكنك استخدام GPS بعد عودة الاتصال.</div>}
      </div>

      {value && <p className="mt-3 text-xs font-semibold text-emerald-700">✓ تم تحديد {label}. حرّك الدبوس إذا احتجت تعديل النقطة.</p>}
      {showError && !value && <p className="mt-3 text-sm font-bold text-red-700">حدد {label} قبل الانتقال للخطوة التالية.</p>}
      {geoError && <p className="mt-3 text-xs leading-6 text-amber-800">{geoError}</p>}

      <div className="mt-4">
        <label className="label" htmlFor={`${prefix}Note`}>ملاحظة للموقع (اختياري)</label>
        <input className="input bg-white" id={`${prefix}Note`} name={`${prefix}Note`} maxLength={300} placeholder={isPickup ? "مثال: البوابة الرئيسية، اتصل عند الوصول" : "مثال: مدخل العمارة أو اسم الفندق"} />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white p-3 text-xs leading-6 text-slate-600">
        <ShieldCheck className="mt-0.5 shrink-0 text-palm-600" size={16} />
        <span>الموقع الدقيق لا يظهر قبل قبول العرض، وبعد القبول يظهر فقط لطرفي العُهدة.</span>
      </div>
    </div>
  );
}
