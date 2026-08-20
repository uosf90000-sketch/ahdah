import { Plane, Scale, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createTripAction } from "@/app/actions";
import { SAUDI_CITIES } from "@/lib/domain";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "إضافة رحلة" };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const query = await searchParams;
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8"><span className="pill mb-4"><Plane size={15} /> رحلة جديدة</span><h1 className="title">حوّل وزنك المتاح إلى فرصة</h1><p className="muted mt-3">أضف بيانات رحلتك وسنعرض فقط العُهد التي تناسب مسارك وموعدك ووزنك.</p></div>
        <MessageBanner error={query.error} />
        <form action={createTripAction} className="card space-y-6">
          <div className="grid-form">
            <CitySelect name="fromCity" label="مدينة المغادرة" />
            <CitySelect name="toCity" label="الوجهة" />
          </div>
          <div><label className="label" htmlFor="departureAt">تاريخ ووقت الرحلة</label><input className="input" id="departureAt" name="departureAt" type="datetime-local" min={minDate} required /></div>
          <div className="grid-form">
            <div><label className="label" htmlFor="airline">شركة الطيران</label><select className="select" id="airline" name="airline" defaultValue="" required><option value="" disabled>اختر الشركة</option><option>الخطوط السعودية</option><option>طيران ناس</option><option>طيران أديل</option><option>طيران الرياض</option><option>أخرى</option></select></div>
            <div><label className="label" htmlFor="flightNumber">رقم الرحلة (اختياري)</label><input className="input" id="flightNumber" name="flightNumber" placeholder="SV1042" dir="ltr" /></div>
          </div>
          <div><label className="label flex items-center gap-2" htmlFor="availableWeightKg"><Scale size={18} className="text-palm-600" /> الوزن المتاح (كجم)</label><input className="input" id="availableWeightKg" name="availableWeightKg" type="number" min="0.1" max="50" step="0.1" inputMode="decimal" required /></div>
          <div className="card-soft !p-4 text-sm leading-7 text-palm-700"><Sparkles className="ml-2 inline" size={18} /> لن يظهر رقم حجزك أو بياناتك الحساسة للمرسل. رقم الرحلة يستخدم للتحقق والسياق فقط.</div>
          <SubmitButton className="btn-primary w-full" pendingText="جاري البحث عن مطابقات..."><Plane size={18} /> إضافة الرحلة وعرض المطابقات</SubmitButton>
        </form>
      </div>
    </div>
  );
}

function CitySelect({ name, label }: { name: string; label: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><select className="select" id={name} name={name} defaultValue="" required><option value="" disabled>اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city}>{city}</option>)}</select></div>;
}
