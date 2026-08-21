import { BadgeCheck, CalendarClock, LockKeyhole, MapPin, Plane, Scale } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createTripAction } from "@/app/actions";
import { SAUDI_CITIES } from "@/lib/domain";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "إضافة رحلة" };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const query = await searchParams;
  // Server-rendered request time defines the earliest valid departure slot.
  // eslint-disable-next-line react-hooks/purity
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  return (
    <div className="page-wrap section-space">
      <div className="mb-8 max-w-2xl">
        <span className="eyebrow mb-4"><Plane size={15} /> للمسافر</span>
        <h1 className="title">أضف رحلتك واعرف العُهد المناسبة</h1>
        <p className="muted mt-3">لن نطلب بيانات الحجز. نستخدم المسار والوزن فقط للمطابقة، ووقت الرحلة يظهر للتنسيق.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
        <MessageBanner error={query.error} />
        <form action={createTripAction} className="card space-y-7">
          <div>
            <span className="section-kicker">مسار الرحلة</span>
            <h2 className="mt-2 text-xl font-bold text-ink-950">إلى أين ومتى ستسافر؟</h2>
          </div>
          <div className="grid-form">
            <CitySelect name="fromCity" label="مدينة المغادرة" />
            <CitySelect name="toCity" label="الوجهة" />
          </div>
          <div><label className="label" htmlFor="departureAt">تاريخ ووقت الرحلة</label><input className="input" id="departureAt" name="departureAt" type="datetime-local" min={minDate} required /></div>
          <div className="border-t border-ink-100 pt-7">
            <span className="section-kicker">بيانات الرحلة</span>
            <h2 className="mt-2 text-xl font-bold text-ink-950">ساعدنا على تحسين المطابقة</h2>
          </div>
          <div className="grid-form">
            <div><label className="label" htmlFor="airline">شركة الطيران</label><select className="select" id="airline" name="airline" defaultValue="" required><option value="" disabled>اختر الشركة</option><option>الخطوط السعودية</option><option>طيران ناس</option><option>طيران أديل</option><option>طيران الرياض</option><option>أخرى</option></select></div>
            <div><label className="label" htmlFor="flightNumber">رقم الرحلة (اختياري)</label><input className="input" id="flightNumber" name="flightNumber" placeholder="SV1042" dir="ltr" /></div>
          </div>
          <div><label className="label flex items-center gap-2" htmlFor="availableWeightKg"><Scale size={18} className="text-palm-600" /> الوزن المتاح (كجم)</label><input className="input" id="availableWeightKg" name="availableWeightKg" type="number" min="1" max="50" step="1" defaultValue="10" inputMode="numeric" required /><p className="mt-2 text-sm text-slate-500">أدخل الوزن بالكيلو الصحيح، مثل 10 كجم.</p></div>
          <SubmitButton className="btn-primary w-full" pendingText="جاري البحث عن مطابقات..."><Plane size={18} /> إضافة الرحلة وعرض المطابقات</SubmitButton>
        </form>
        </div>

        <aside className="glass-panel lg:sticky lg:top-28" aria-label="معلومات للمسافر">
          <span className="eyebrow mb-5"><BadgeCheck size={15} /> رحلة موثوقة</span>
          <h2 className="text-xl font-bold text-ink-950">ما الذي يحدث بعدها؟</h2>
          <div className="mt-6 space-y-5">
            <Info icon={MapPin} title="نطابق المسار والوزن" text="تظهر لك عُهد المستخدمين الآخرين إذا كان المسار نفسه والوزن ضمن المتاح لديك." />
            <Info icon={CalendarClock} title="أنت تحدد السعر" text="راجع المحتويات والصور والموعد، ثم أرسل عرضك." />
            <Info icon={LockKeyhole} title="فحص قبل الحمل" text="لا تحمل أي عُهدة قبل فحصها وتوثيق موافقتك." />
          </div>
          <div className="mt-6 rounded-2xl bg-palm-50 p-4 text-sm leading-7 text-palm-800">
            لا نشارك رقم رحلتك أو بياناتك الحساسة مع المرسل.
          </div>
        </aside>
      </div>
    </div>
  );
}

function CitySelect({ name, label }: { name: string; label: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><select className="select" id={name} name={name} defaultValue="" required><option value="" disabled>اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city}>{city}</option>)}</select></div>;
}

function Info({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-palm-50 text-palm-700"><Icon size={19} /></span>
      <div><h3 className="font-bold text-ink-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>
    </div>
  );
}
