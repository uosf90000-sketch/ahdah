import { Camera, CircleAlert, PackagePlus, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createShipmentAction } from "@/app/actions";
import { CATEGORY_LABELS, SAUDI_CITIES } from "@/lib/domain";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "إرسال عُهدة" };

export default async function NewShipmentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const query = await searchParams;
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8"><span className="pill mb-4"><PackagePlus size={15} /> طلب شحنة جديد</span><h1 className="title">عرّفنا على عُهدتك</h1><p className="muted mt-3">الصور والوصف الدقيق يساعدان المسافر على اتخاذ قرار آمن ويختصران وقت الفحص.</p></div>
        <MessageBanner error={query.error} />
        <form action={createShipmentAction} className="card space-y-7">
          <fieldset>
            <legend className="mb-5 text-lg font-black">المسار والموعد</legend>
            <div className="grid-form">
              <CitySelect name="fromCity" label="مدينة الإرسال" />
              <CitySelect name="toCity" label="مدينة الوصول" />
              <div className="sm:col-span-2"><label className="label" htmlFor="requestedDeliveryAt">آخر موعد مطلوب للتسليم</label><input className="input" id="requestedDeliveryAt" name="requestedDeliveryAt" type="datetime-local" min={minDate} required /></div>
            </div>
          </fieldset>

          <hr className="border-black/5" />
          <fieldset>
            <legend className="mb-5 text-lg font-black">الوزن والأبعاد</legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <NumberField name="weightKg" label="الوزن (كجم)" step="0.1" max="50" />
              <NumberField name="lengthCm" label="الطول (سم)" max="200" />
              <NumberField name="widthCm" label="العرض (سم)" max="200" />
              <NumberField name="heightCm" label="الارتفاع (سم)" max="200" />
            </div>
          </fieldset>

          <hr className="border-black/5" />
          <fieldset>
            <legend className="mb-5 text-lg font-black">المحتويات والقيمة</legend>
            <div className="space-y-5">
              <div><label className="label" htmlFor="category">التصنيف</label><select className="select" id="category" name="category" defaultValue="" required><option value="" disabled>اختر التصنيف</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="label" htmlFor="contents">وصف المحتويات بالتفصيل</label><textarea className="textarea" id="contents" name="contents" minLength={15} maxLength={1500} required placeholder="اذكر كل قطعة، مادتها، وهل تحتوي على سائل أو بطارية..." /></div>
              <div><label className="label" htmlFor="approximateValueSar">القيمة التقريبية (ريال)</label><input className="input" id="approximateValueSar" name="approximateValueSar" type="number" min="0" max="100000" step="1" required inputMode="decimal" /></div>
              <div className="rounded-2xl border border-dashed border-palm-500/30 bg-palm-50/60 p-5">
                <label className="label flex items-center gap-2" htmlFor="photos"><Camera size={18} className="text-palm-600" /> صور واضحة للمحتويات</label>
                <input className="input bg-white" id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
                <p className="mt-2 text-xs text-black/45">من 1 إلى 6 صور، وبحد أقصى 3MB للصورة. تُحفظ داخل قاعدة البيانات في وضع الـMVP.</p>
              </div>
            </div>
          </fieldset>

          <hr className="border-black/5" />
          <fieldset>
            <legend className="mb-5 text-lg font-black">بيانات المستلم</legend>
            <div className="grid-form">
              <div><label className="label" htmlFor="recipientName">اسم المستلم</label><input className="input" id="recipientName" name="recipientName" required /></div>
              <div><label className="label" htmlFor="recipientPhone">جوال المستلم</label><input className="input" id="recipientPhone" name="recipientPhone" required placeholder="05xxxxxxxx" inputMode="tel" dir="ltr" pattern="05[0-9]{8}" /></div>
            </div>
          </fieldset>

          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><CircleAlert className="mt-0.5 shrink-0" size={19} /><p><strong>تنبيه:</strong> يمنع إرسال المواد المحظورة أو غير المصرّح بها للطيران. يتحمل المرسل مسؤولية صحة الوصف، وللمسافر رفض العُهدة أثناء الفحص.</p></div>
          <SubmitButton className="btn-primary w-full" pendingText="جاري نشر العُهدة..."><ShieldCheck size={18} /> مراجعة ونشر الطلب</SubmitButton>
        </form>
      </div>
    </div>
  );
}

function CitySelect({ name, label }: { name: string; label: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><select className="select" id={name} name={name} defaultValue="" required><option value="" disabled>اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></div>;
}

function NumberField({ name, label, max, step = "1" }: { name: string; label: string; max: string; step?: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><input className="input" id={name} name={name} type="number" min="0.1" max={max} step={step} inputMode="decimal" required /></div>;
}
