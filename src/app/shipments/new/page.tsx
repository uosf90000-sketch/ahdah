import { Camera, CheckCircle2, CircleAlert, PackagePlus, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MessageBanner } from "@/components/message-banner";
import { ShipmentForm } from "@/components/shipment-form";

export const metadata = { title: "إرسال عُهدة" };

export default async function NewShipmentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const query = await searchParams;
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="page-wrap section-space">
      <div className="mb-8 max-w-2xl">
        <span className="section-kicker"><PackagePlus aria-hidden="true" size={17} /> طلب شحن جديد</span>
        <h1 className="title">أضف عُهدتك في ثلاث خطوات</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">نطلب فقط المعلومات التي يحتاجها المسافر لاتخاذ قرار آمن وتقديم سعر واضح.</p>
      </div>
      <MessageBanner error={query.error} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_19rem]">
        <ShipmentForm minDate={minDate} />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl bg-ink p-5 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-blue-200"><ShieldCheck aria-hidden="true" size={21} /></span>
            <h2 className="mt-5 text-lg font-bold">لماذا نطلب الصور؟</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">حتى يراجع المسافر المحتويات قبل العرض، ثم يقارنها فعليًا عند فحص العُهدة.</p>
          </div>
          <div className="card !p-5">
            <h2 className="text-base font-bold">قبل أن تبدأ</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <Tip Icon={Camera} text="صوّر كل المحتويات بوضوح" />
              <Tip Icon={CheckCircle2} text="اكتب وصفًا لكل قطعة" />
              <Tip Icon={CircleAlert} text="لا تضف مواد محظورة بالطيران" warning />
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Tip({ Icon, text, warning = false }: { Icon: typeof Camera; text: string; warning?: boolean }) {
  return <li className="flex items-start gap-3"><Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${warning ? "text-sand-500" : "text-palm-600"}`} size={18} />{text}</li>;
}
