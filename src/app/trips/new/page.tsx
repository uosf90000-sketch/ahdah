import { BadgeCheck, CalendarClock, Car, LockKeyhole, MapPin, Plane, Route } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MessageBanner } from "@/components/message-banner";
import { TripForm } from "@/components/trip-form";

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
        <span className="eyebrow mb-4"><Route size={15} /> للموصل</span>
        <h1 className="title">أضف مسارك كاملًا مهما تغيّرت وسيلة السفر</h1>
        <p className="muted mt-3">أضف مراحل رحلتك بالترتيب، وسنطابق الطلبات المناسبة مع مسارك ووزنك المتاح.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <MessageBanner error={query.error} />
          <TripForm minDate={minDate} />
        </div>

        <aside className="glass-panel lg:sticky lg:top-28" aria-label="معلومات للموصل">
          <span className="eyebrow mb-5"><BadgeCheck size={15} /> مسار مرن</span>
          <h2 className="text-xl font-bold text-ink-950">كيف تعمل المطابقة؟</h2>
          <div className="mt-6 space-y-5">
            <Info icon={Plane} title="طيران ثم طريق" text="تقدر تجعل كل مرحلة بوسيلة نقل مختلفة داخل نفس الرحلة." />
            <Info icon={Car} title="محطات مرنة" text="اكتب أي مدينة أو محافظة أو قرية أو مركز أو هجرة تمر بها." />
            <Info icon={MapPin} title="الترتيب هو الأساس" text="تظهر الطلبات التي تقع بين نقاط مسارك وبنفس اتجاه الرحلة." />
            <Info icon={CalendarClock} title="أنت تحدد السعر" text="راجع الطلب والوزن ثم قدم عرضك مباشرة من صفحة رحلتك." />
            <Info icon={LockKeyhole} title="المواقع الدقيقة محمية" text="بعد قبول عرضك تجد موقع الاستلام والتسليم داخل المحادثة." />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-palm-50 text-palm-700"><Icon size={19} /></span>
      <div><h3 className="font-bold text-ink-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>
    </div>
  );
}
