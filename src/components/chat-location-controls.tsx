"use client";

import { MapPin, Navigation, X } from "lucide-react";
import { useState } from "react";
import { updateChatLocationAction } from "@/app/messages/actions";
import { PickupLocationPicker, type LocationCoordinates } from "@/components/pickup-location-picker";
import { SubmitButton } from "@/components/submit-button";

type LocationKind = "pickup" | "delivery";

type LocationValue = LocationCoordinates & { note?: string | null };

export function ChatLocationControls({
  shipmentId,
  isSender,
  writable,
  pickup,
  delivery,
}: {
  shipmentId: string;
  isSender: boolean;
  writable: boolean;
  pickup: LocationValue | null;
  delivery: LocationValue | null;
}) {
  const [active, setActive] = useState<LocationKind | null>(null);
  const [draft, setDraft] = useState<LocationCoordinates | null>(null);

  function openPicker(kind: LocationKind) {
    setActive(kind);
    setDraft(kind === "pickup" ? pickup : delivery);
  }

  const pickupHref = pickup ? mapsHref(pickup.lat, pickup.lng) : null;
  const deliveryHref = delivery ? mapsHref(delivery.lat, delivery.lng) : null;

  return (
    <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {pickupHref ? (
          <a href={pickupHref} target="_blank" rel="noreferrer" className="btn-secondary min-h-10 px-3 text-xs">
            <Navigation size={15} /> موقع الاستلام
          </a>
        ) : (
          <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">موقع الاستلام غير محدد</span>
        )}

        {deliveryHref ? (
          <a href={deliveryHref} target="_blank" rel="noreferrer" className="btn-secondary min-h-10 px-3 text-xs">
            <Navigation size={15} /> موقع التسليم
          </a>
        ) : (
          <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">موقع التسليم غير محدد</span>
        )}

        {isSender && writable && (
          <div className="mr-auto flex gap-2">
            <button type="button" onClick={() => openPicker("pickup")} className="grid h-10 w-10 place-items-center rounded-xl border border-palm-200 bg-palm-50 text-palm-700" aria-label="تحديد موقع الاستلام" title="تحديد موقع الاستلام">
              <MapPin size={17} />
            </button>
            <button type="button" onClick={() => openPicker("delivery")} className="grid h-10 w-10 place-items-center rounded-xl border border-palm-200 bg-palm-50 text-palm-700" aria-label="تحديد موقع التسليم" title="تحديد موقع التسليم">
              <MapPin size={17} />
            </button>
          </div>
        )}
      </div>

      {!isSender && !pickupHref && !deliveryHref && (
        <p className="mt-2 text-xs text-slate-500">بانتظار المرسل لتحديد المواقع داخل المحادثة.</p>
      )}

      {active && isSender && writable && (
        <form action={updateChatLocationAction} className="mt-4 rounded-3xl border border-palm-100 bg-slate-50 p-3 sm:p-4">
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="kind" value={active} />
          <PickupLocationPicker key={active} kind={active} value={draft} onChange={setDraft} />
          <div className="mt-3 flex items-center gap-2">
            <SubmitButton className="btn-primary flex-1" pendingText="جاري الحفظ...">حفظ الموقع</SubmitButton>
            <button type="button" onClick={() => setActive(null)} className="btn-secondary" aria-label="إغلاق تحديد الموقع"><X size={17} /> إغلاق</button>
          </div>
        </form>
      )}
    </div>
  );
}

function mapsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}
