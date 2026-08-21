"use client";

import { Car, Plane, Plus, Scale, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createTripAction } from "@/app/actions";
import { SaudiPlaceInput } from "@/components/saudi-place-input";
import { SubmitButton } from "@/components/submit-button";
import type { TravelLeg } from "@/lib/trip-route";

type LegDraft = {
  mode: "AIR" | "ROAD";
  to: string;
  airline: string;
  flightNumber: string;
};

const newLeg = (mode: "AIR" | "ROAD" = "ROAD"): LegDraft => ({ mode, to: "", airline: "", flightNumber: "" });

export function TripForm({ minDate }: { minDate: string }) {
  const [from, setFrom] = useState("");
  const [legs, setLegs] = useState<LegDraft[]>([newLeg("AIR")]);

  const itinerary = useMemo<TravelLeg[]>(() => legs.map((leg, index) => ({
    mode: leg.mode,
    from: (index === 0 ? from : legs[index - 1].to).trim(),
    to: leg.to.trim(),
    ...(leg.mode === "AIR" && leg.airline ? { airline: leg.airline } : {}),
    ...(leg.mode === "AIR" && leg.flightNumber ? { flightNumber: leg.flightNumber.trim() } : {}),
  })), [from, legs]);

  function updateLeg(index: number, patch: Partial<LegDraft>) {
    setLegs((current) => current.map((leg, itemIndex) => itemIndex === index ? { ...leg, ...patch } : leg));
  }

  function addLeg() {
    if (legs.length >= 20) return;
    setLegs((current) => [...current, newLeg("ROAD")]);
  }

  function removeLeg(index: number) {
    if (legs.length === 1) return;
    setLegs((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const completePlaces = [from, ...legs.map((leg) => leg.to)].filter(Boolean);

  return (
    <form action={createTripAction} className="card space-y-7">
      <input type="hidden" name="itineraryJson" value={JSON.stringify(itinerary)} />

      <div>
        <span className="section-kicker">المسار الكامل</span>
        <h2 className="mt-2 text-xl font-bold text-ink-950">ابنِ رحلتك مرحلة بمرحلة</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">تقدر تبدأ بطيران ثم تكمل بالسيارة، أو تجعل الرحلة كلها على الطريق. كل مرحلة لها وسيلة نقل مستقلة.</p>
      </div>

      <SaudiPlaceInput id="trip-origin" name="tripOriginDisplay" label="نقطة الانطلاق" value={from} onChange={setFrom} placeholder="اكتب أي مدينة" />

      <div className="space-y-4">
        {legs.map((leg, index) => {
          const legFrom = index === 0 ? from : legs[index - 1].to;
          return (
            <section key={index} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-palm-700">المرحلة {index + 1}</p>
                  <p className="mt-1 text-sm font-bold text-ink-950">من {legFrom || "نقطة الانطلاق"}</p>
                </div>
                {legs.length > 1 && <button type="button" onClick={() => removeLeg(index)} className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 bg-white text-red-600" aria-label={`حذف المرحلة ${index + 1}`}><Trash2 size={16} /></button>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => updateLeg(index, { mode: "AIR" })} className={`min-h-16 rounded-2xl border p-3 text-right transition ${leg.mode === "AIR" ? "border-palm-500 bg-palm-50 text-palm-800" : "border-slate-200 bg-white text-slate-600"}`}>
                  <Plane className="mb-1.5" size={20} /><strong className="block text-sm">طيران</strong>
                </button>
                <button type="button" onClick={() => updateLeg(index, { mode: "ROAD", airline: "", flightNumber: "" })} className={`min-h-16 rounded-2xl border p-3 text-right transition ${leg.mode === "ROAD" ? "border-palm-500 bg-palm-50 text-palm-800" : "border-slate-200 bg-white text-slate-600"}`}>
                  <Car className="mb-1.5" size={20} /><strong className="block text-sm">على الطريق</strong>
                </button>
              </div>

              <div className="mt-4">
                <SaudiPlaceInput id={`trip-destination-${index}`} name={`tripDestinationDisplay-${index}`} label={index === legs.length - 1 ? "الوصول" : "المحطة التالية"} value={leg.to} onChange={(value) => updateLeg(index, { to: value })} />
              </div>

              {leg.mode === "AIR" && (
                <div className="mt-4 grid-form">
                  <div><label className="label" htmlFor={`airline-${index}`}>شركة الطيران</label><select className="select" id={`airline-${index}`} value={leg.airline} onChange={(event) => updateLeg(index, { airline: event.target.value })} required><option value="" disabled>اختر الشركة</option><option>الخطوط السعودية</option><option>طيران ناس</option><option>طيران أديل</option><option>طيران الرياض</option><option>أخرى</option></select></div>
                  <div><label className="label" htmlFor={`flight-${index}`}>رقم الرحلة (اختياري)</label><input className="input" id={`flight-${index}`} value={leg.flightNumber} onChange={(event) => updateLeg(index, { flightNumber: event.target.value })} dir="ltr" /></div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <button type="button" onClick={addLeg} disabled={legs.length >= 20} className="btn-secondary w-full disabled:opacity-50"><Plus size={17} /> إضافة محطة / مرحلة جديدة</button>

      {completePlaces.length >= 2 && (
        <div className="rounded-2xl border border-palm-100 bg-palm-50 p-4">
          <p className="text-xs font-bold text-palm-700">المسار</p>
          <p className="mt-2 text-sm font-black leading-8 text-palm-900">{completePlaces.join(" ← ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">{legs.filter((leg) => leg.to).map((leg, index) => <span className="pill" key={`${leg.to}-${index}`}>{leg.mode === "AIR" ? "✈️ طيران" : "🚗 طريق"} إلى {leg.to}</span>)}</div>
        </div>
      )}

      <div><label className="label" htmlFor="departureAt">تاريخ ووقت بداية الرحلة</label><input className="input" id="departureAt" name="departureAt" type="datetime-local" min={minDate} required /></div>

      <div><label className="label flex items-center gap-2" htmlFor="availableWeightKg"><Scale size={18} className="text-palm-600" /> الوزن المتاح طوال المسار (كجم)</label><input className="input" id="availableWeightKg" name="availableWeightKg" type="number" min="1" max="50" step="1" defaultValue="10" inputMode="numeric" required /><p className="mt-2 text-sm text-slate-500">الوزن الذي تستطيع حمله من أي نقطة إلى نقطة لاحقة في هذا المسار.</p></div>

      <SubmitButton className="btn-primary w-full" pendingText="جاري حفظ المسار والبحث عن الطلبات..."><Plus size={18} /> إضافة الرحلة وعرض المطابقات</SubmitButton>
    </form>
  );
}
