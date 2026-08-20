import Link from "next/link";
import { ArrowLeft, BadgeCheck, Boxes, MapPin, PackageCheck, Plane, QrCode, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      <section className="page-wrap grid min-h-[74vh] items-center gap-10 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <span className="pill mb-5"><Sparkles size={14} /> طريقك فيه مساحة لخير أكثر</span>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.25] sm:text-6xl lg:text-7xl">
            مساحتك الزائدة<br /><span className="text-palm-600">توصل عُهدة.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-9 text-black/60">
            منصة سعودية آمنة تجمع بين مسافر لديه وزن متاح ومرسل يريد إيصال أغراضه إلى نفس الوجهة—بفحص موثق وتسليم مؤكد.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={user ? "/shipments/new" : "/auth?tab=register"} className="btn-primary">أرسل عُهدتك <ArrowLeft size={18} /></Link>
            <Link href={user ? "/trips/new" : "/auth?tab=register"} className="btn-secondary"><Plane size={18} /> عندي وزن متاح</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-black/50">
            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-palm-600" /> فحص قبل الاستلام</span>
            <span className="flex items-center gap-2"><QrCode size={18} className="text-palm-600" /> توثيق QR وOTP</span>
            <span className="flex items-center gap-2"><Star size={18} className="text-palm-600" /> تقييم متبادل</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-palm-100/60 blur-2xl" />
          <div className="overflow-hidden rounded-[2.5rem] bg-ink p-5 text-white shadow-2xl sm:p-7">
            <div className="mb-7 flex items-center justify-between">
              <div><p className="text-xs text-white/50">عُهدة رقم</p><p className="mt-1 font-black">AHD-260801</p></div>
              <span className="rounded-full bg-palm-500/20 px-3 py-1.5 text-xs font-bold text-[#8ce0bd]">تم فحص العُهدة</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl bg-white/[.08] p-5">
              <div><MapPin className="mb-3 text-sand-300" /><p className="text-xs text-white/45">من</p><p className="mt-1 text-xl font-black">جدة</p></div>
              <div className="relative h-px w-16 bg-white/20"><Plane className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-180 bg-ink px-1" size={24} /></div>
              <div><MapPin className="mb-3 text-palm-500" /><p className="text-xs text-white/45">إلى</p><p className="mt-1 text-xl font-black">الرياض</p></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[{ v: "4.5 كجم", l: "الوزن" }, { v: "145 ر.س", l: "العرض" }, { v: "SV1042", l: "الرحلة" }].map((item) => (
                <div className="rounded-2xl bg-white/[.08] p-3" key={item.l}><p className="text-xs text-white/40">{item.l}</p><p className="mt-1 font-black">{item.v}</p></div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-palm-600 p-4">
              <PackageCheck size={30} /><div><p className="text-sm font-black">المحتويات مطابقة</p><p className="text-xs text-white/65">وثّق سلمان الفحص بالصور</p></div><BadgeCheck className="mr-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/70 py-16">
        <div className="page-wrap">
          <p className="eyebrow mb-3">كيف تعمل؟</p>
          <h2 className="title mb-10">ثلاث خطوات تحفظ حق الجميع</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { Icon: Boxes, n: "01", t: "أنشئ العُهدة", d: "أضف المسار والوزن والوصف والصور الواضحة وقيمة المحتويات." },
              { Icon: Sparkles, n: "02", t: "قارن واختر", d: "نطابقها مع الرحلات المناسبة، ثم قارن عروض المسافرين واختر الأفضل." },
              { Icon: PackageCheck, n: "03", t: "افحص وسلّم", d: "المسافر يعاين المحتويات ويوثقها، والمستلم يؤكد التسليم برمز آمن." },
            ].map(({ Icon, n, t, d }) => (
              <article key={n} className="card relative overflow-hidden">
                <span className="absolute -left-2 -top-6 text-8xl font-black text-palm-50">{n}</span>
                <Icon className="relative mb-6 text-palm-600" size={34} />
                <h3 className="relative text-xl font-black">{t}</h3><p className="muted relative mt-3">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
