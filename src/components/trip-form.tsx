"use client";

import { ArrowDown, ArrowUp, Car, Plane, Plus, Scale, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createTripAction } from "@/app/actions";
import { SaudiPlaceInput } from "@/components/saudi-place-input";
import { SubmitButton } from "@/components/submit-button";

type TravelMode = "AIR" | "ROAD";

export function TripForm({ minDate }: { minDate: string }) {
  const [mode, setMode] = useState<TravelMode>("AIR");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [stops, setStops] = useState<string[]>([]);

  const routePreview = useMemo(() => [fromCity, ...stops.filter(Boolean), toCity].filter(Boolean), [fromCity, stops, toCity]);

  function addStop() {
    if (stops.length >= 20) return;
    setStops((current) => [...current, ""]);
  }

  function updateStop(index: number, value: string) {
    setStops((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function removeStop(index: number) {
    setStops((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveStop(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;
    setStops((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={createTripAction} className="card space-y-7">
      <input type="hidden" name="travelMode" value={mode} />

      <div>
        <span className="section-kicker">طريقة التنقل</span>
        <h2 className="mt-2 text-xl font-bold text-ink-950">كيف ستسافر؟</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMode("AIR")} className={`min-h-20 rounded-2xl border p-4 text-right transition ${mode === "AIR" ? "border-palm-500 bg-palm-50 text-palm-800" : "border-slate-200 bg-white text-slate-600"}`}>
            <Plane className="mb-2" size={22} /><strong className="block">طيران</strong><span className="mt-1 block text-xs">رحلة جوية بين مدينتين</span>
          </button>
          <button type="button" onClick={() => setMode("ROAD")} className={`min-h-20 rounded-2xl border p-4 text-right transition ${mode === "ROAD" ? "border-palm-500 bg-palm-50 text-palm-800" : "border-slate-200 bg-white text-slate-600"}`}>
            <Car className="mb-2" size={22} /><strong className="block">على الطريق</strong><span className="mt-1 block text-xs">سيارة أو تنقل بري مع محطات</span>
          </button>
        </div>
      </div>

      <div className="border-t border-ink-100 pt-7">
        <span className="section-kicker">مسار الرحلة</span>
        <h2 className="mt-2 text-xl font-bold text-ink-950">من أين وإلى أين؟</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">اختر من الاقتراحات أو اكتب أي مدينة أو محافظة سعودية بنفسك.</p>
      </div>

      <div className="grid-form">
        <SaudiPlaceInput id="fromCity" name="fromCity" label="مدينة أو محافظة الانطلاق" value={fromCity} onChange={setFromCity} />
        <SaudiPlaceInput id="toCity" name="toCity" label="الوجهة النهائية" value={toCity} onChange={setToCity} />
      </div>

      {mode === "ROAD" && (
        <section className="rounded-3xl border border-palm-100 bg-palm-50/50 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h3 className="font-black text-ink-950">محطات الطريق</h3><p className="mt-1 text-xs leading-6 text-slate-600">أضف أي مدينة أو محافظة بالترتيب الذي ستمر به. الطلب يطابق إذا كانت نقطة الاستلام قبل نقطة التسليم في مسارك.</p></div>
            <button type="button" onClick={addStop} className="btn-secondary shrink-0"><Plus size={16} /> إضافة محطة</button>
          </div>

          <div className="mt-4 space-y-3">
            {stops.map((stop, index) => (
              <div key={index} className="flex items-end gap-2 rounded-2xl bg-white p-3">
                <SaudiPlaceInput
                  className="min-w-0 flex-1"
                  id={`routeStop-${index}`}
                  name="routeStop"
                  label={`المحطة ${index + 1}`}
                  value={stop}
                  onChange={(value) => updateStop(index, value)}
                  placeholder="اكتب اسم المحطة"
                />
                <div className="flex gap-1 pb-7">
                  <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30" aria-label="تحريك المحطة للأعلى"><ArrowUp size={16} /></button>
                  <button type="button" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30" aria-label="تحريك المحطة للأسفل"><ArrowDown size={16} /></button>
                  <button type="button" onClick={() => removeStop(index)} className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 text-red-600" aria-label="حذف المحطة"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {!stops.length && <button type="button" onClick={addStop} className="w-full rounded-2xl border border-dashed border-palm-300 bg-white p-5 text-sm font-bold text-palm-700"><Plus className="mx-auto mb-2" size={20} /> أضف أول محطة في الطريق</button>}
          </div>

          {routePreview.length >= 2 && <div className="mt-4 rounded-2xl bg-white p-4"><p className="text-xs font-bold text-slate-500">مسارك</p><p className="mt-2 text-sm font-black leading-8 text-palm-800">{routePreview.join(" ← ")}</p></div>}
        </section>
      )}

      <div><label className="label" htmlFor="departureAt">تاريخ ووقت الانطلاق</label><input className="input" id="departureAt" name="departureAt" type="datetime-local" min={minDate} required /></div>

      {mode === "AIR" && (
        <>
          <div className="border-t border-ink-100 pt-7"><span className="section-kicker">بيانات الرحلة الجوية</span><h2 className="mt-2 text-xl font-bold text-ink-950">بيانات الطيران</h2></div>
          <div className="grid-form">
            <div><label className="label" htmlFor="airline">شركة الطيران</label><select className="select" id="airline" name="airline" defaultValue="" required><option value="" disabled>اختر الشركة</option><option>الخطوط السعودية</option><option>طيران ناس</option><option>طيران أديل</option><option>طيران الرياض</option><option>أخرى</option></select></div>
            <div><label className="label" htmlFor="flightNumber">رقم الرحلة (اختياري)</label><input className="input" id="flightNumber" name="flightNumber" placeholder="SV1042" dir="ltr" /></div>
          </div>
        </>
      )}

      <div><label className="label flex items-center gap-2" htmlFor="availableWeightKg"><Scale size={18} className="text-palm-600" /> الوزن المتاح (كجم)</label><input className="input" id="availableWeightKg" name="availableWeightKg" type="number" min="1" max="50" step="1" defaultValue="10" inputMode="numeric" required /><p className="mt-2 text-sm text-slate-500">أدخل الوزن المتاح بالكيلو الصحيح، مثل 10 كجم.</p></div>

      <SubmitButton className="btn-primary w-full" pendingText="جاري البحث عن مطابقات...">{mode === "AIR" ? <Plane size={18} /> : <Car size={18} />} إضافة الرحلة وعرض المطابقات</SubmitButton>
    </form>
  );
}
