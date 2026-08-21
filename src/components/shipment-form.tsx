"use client";

import { ArrowLeft, ArrowRight, Camera, Check, CircleAlert, MapPin, PackageCheck, Scale, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { createShipmentAction } from "@/app/actions";
import { CATEGORY_LABELS, SAUDI_CITIES } from "@/lib/domain";
import { PickupLocationPicker, type PickupCoordinates } from "@/components/pickup-location-picker";
import { SubmitButton } from "@/components/submit-button";

const steps = [
  { label: "المسار", Icon: MapPin },
  { label: "العُهدة", Icon: Scale },
  { label: "المستلم", Icon: UserRound },
];

export function ShipmentForm({ minDate }: { minDate: string }) {
  const [step, setStep] = useState(0);
  const [pickup, setPickup] = useState<PickupCoordinates | null>(null);
  const [locationError, setLocationError] = useState(false);
  const sections = useRef<Array<HTMLFieldSetElement | null>>([]);

  function goNext() {
    const section = sections.current[step];
    if (!section) return;
    const controls = Array.from(section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
    const invalid = controls.find((control) => !control.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (step === 0 && !pickup) {
      setLocationError(true);
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form action={createShipmentAction} encType="multipart/form-data" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
      <ol className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-3 sm:p-4" aria-label="خطوات إنشاء العُهدة">
        {steps.map(({ label, Icon }, index) => {
          const complete = index < step;
          const active = index === step;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className={`relative flex min-h-14 items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold sm:text-sm ${active ? "bg-white text-palm-700 shadow-sm" : complete ? "text-emerald-700" : "text-slate-400"}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-full ${active ? "bg-palm-600 text-white" : complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{complete ? <Check aria-hidden="true" size={15} /> : <Icon aria-hidden="true" size={15} />}</span>
              {label}
            </li>
          );
        })}
      </ol>

      <div className="p-5 sm:p-7">
        <fieldset ref={(node) => { sections.current[0] = node; }} hidden={step !== 0}>
          <legend className="text-xl font-bold">إلى أين ومتى؟</legend>
          <p className="mt-2 text-sm leading-7 text-slate-500">سنستخدم المسار والموعد لإظهار الطلب للمسافرين المناسبين فقط.</p>
          <div className="mt-7 grid-form">
            <CitySelect name="fromCity" label="مدينة الإرسال" />
            <CitySelect name="toCity" label="مدينة الوصول" />
            <div className="sm:col-span-2"><label className="label" htmlFor="requestedDeliveryAt">آخر موعد مطلوب للتسليم</label><input className="input" id="requestedDeliveryAt" name="requestedDeliveryAt" type="datetime-local" min={minDate} required /></div>
          </div>
          <div className="mt-6">
            <PickupLocationPicker
              value={pickup}
              showError={locationError}
              onChange={(next) => {
                setPickup(next);
                setLocationError(false);
              }}
            />
          </div>
        </fieldset>

        <fieldset ref={(node) => { sections.current[1] = node; }} hidden={step !== 1}>
          <legend className="text-xl font-bold">ما تفاصيل العُهدة؟</legend>
          <p className="mt-2 text-sm leading-7 text-slate-500">البيانات الدقيقة تختصر وقت الفحص وتساعد المسافر على تسعير النقل.</p>
          <div className="mt-7 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NumberField name="weightKg" label="الوزن (كجم)" step="0.1" max="50" />
              <NumberField name="lengthCm" label="الطول (سم)" max="200" />
              <NumberField name="widthCm" label="العرض (سم)" max="200" />
              <NumberField name="heightCm" label="الارتفاع (سم)" max="200" />
            </div>
            <div><label className="label" htmlFor="category">التصنيف</label><select className="select" id="category" name="category" defaultValue="" required><option value="" disabled>اختر التصنيف</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="label" htmlFor="contents">وصف المحتويات بالتفصيل</label><textarea className="textarea" id="contents" name="contents" minLength={15} maxLength={1500} required placeholder="اذكر كل قطعة، مادتها، وهل تحتوي على سائل أو بطارية..." /><p className="mt-2 text-xs leading-6 text-slate-500">لا تستخدم وصفًا عامًا مثل «أغراض شخصية»؛ اذكر القطع بوضوح.</p></div>
            <div><label className="label" htmlFor="approximateValueSar">القيمة التقريبية (ريال)</label><input className="input" id="approximateValueSar" name="approximateValueSar" type="number" min="0" max="100000" step="1" required inputMode="decimal" /></div>
            <div className="rounded-3xl border border-dashed border-palm-500 bg-palm-50/60 p-5">
              <label className="label flex items-center gap-2" htmlFor="photos"><Camera aria-hidden="true" size={18} className="text-palm-600" /> صور واضحة للمحتويات</label>
              <input className="input bg-white" id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
              <p className="mt-2 text-xs leading-6 text-slate-500">من صورة إلى 6 صور، وبحد أقصى 3MB للصورة.</p>
            </div>
          </div>
        </fieldset>

        <fieldset ref={(node) => { sections.current[2] = node; }} hidden={step !== 2}>
          <legend className="text-xl font-bold">من سيستلم العُهدة؟</legend>
          <p className="mt-2 text-sm leading-7 text-slate-500">لن يظهر رقم المستلم للعامة؛ يُستخدم فقط عند مرحلة التسليم الآمن.</p>
          <div className="mt-7 grid-form">
            <div><label className="label" htmlFor="recipientName">اسم المستلم</label><input className="input" id="recipientName" name="recipientName" autoComplete="name" required /></div>
            <div><label className="label" htmlFor="recipientPhone">جوال المستلم</label><input className="input" id="recipientPhone" name="recipientPhone" autoComplete="tel" required placeholder="05xxxxxxxx" inputMode="tel" dir="ltr" pattern="05[0-9]{8}" /></div>
          </div>
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <h2 className="flex items-center gap-2 font-bold"><PackageCheck aria-hidden="true" className="text-palm-600" size={20} /> قبل النشر</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" size={17} /> الصور تُظهر جميع المحتويات بوضوح.</li>
              <li className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" size={17} /> الوزن والقيمة والوصف صحيحة.</li>
              <li className="flex gap-2"><CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-sand-500" size={17} /> لا توجد مواد محظورة أو غير مصرح بها للطيران.</li>
            </ul>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:px-7">
        {step > 0 ? <button type="button" onClick={() => setStep((current) => current - 1)} className="btn-secondary"><ArrowRight aria-hidden="true" size={18} /> السابق</button> : <span />}
        {step < steps.length - 1 ? <button type="button" onClick={goNext} className="btn-primary">التالي <ArrowLeft aria-hidden="true" size={18} /></button> : <SubmitButton className="btn-primary" pendingText="جاري نشر العُهدة..."><PackageCheck aria-hidden="true" size={18} /> نشر الطلب</SubmitButton>}
      </div>
    </form>
  );
}

function CitySelect({ name, label }: { name: string; label: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><select className="select" id={name} name={name} defaultValue="" required><option value="" disabled>اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></div>;
}

function NumberField({ name, label, max, step = "1" }: { name: string; label: string; max: string; step?: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><input className="input" id={name} name={name} type="number" min="0.1" max={max} step={step} inputMode="decimal" required /></div>;
}
