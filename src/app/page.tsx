import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  MapPin,
  PackageCheck,
  Plane,
  QrCode,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  const senderHref = user ? "/shipments/new" : "/auth?tab=register";
  const travelerHref = user ? "/trips/new" : "/auth?tab=register";

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-palm-600/25 blur-3xl" aria-hidden="true" />
        <div className="page-wrap relative grid min-h-[calc(100dvh-4.75rem)] items-center gap-12 py-12 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">
              <ShieldCheck aria-hidden="true" size={17} /> سلسلة استلام موثقة من البداية للنهاية
            </span>
            <h1 className="mt-7 max-w-[13ch] text-4xl font-bold leading-[1.25] sm:text-6xl lg:text-[4.5rem]">
              وزنك المتاح يوصل <span className="text-[#8bbcff]">عهدتك بأمان.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg sm:leading-9">
              عهدتك تربط المرسل بمسافر على نفس الوجهة، مع صور واضحة وفحص حضوري ورمز تسليم يحفظ حق الجميع.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href={senderHref} className="btn min-h-14 bg-white px-6 text-base text-ink hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25">
                أرسل عُهدة <ArrowLeft aria-hidden="true" size={19} />
              </Link>
              <Link href={travelerHref} className="btn min-h-14 border border-white/20 bg-white/10 px-6 text-base text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                <Plane aria-hidden="true" size={19} /> لدي وزن متاح
              </Link>
            </div>
            <div className="mt-9 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <TrustLine Icon={BadgeCheck} text="فحص موثق" />
              <TrustLine Icon={QrCode} text="QR وOTP للتسليم" />
              <TrustLine Icon={Scale} text="عروض قابلة للمقارنة" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mr-auto">
            <div className="absolute -inset-6 rounded-[2.25rem] bg-gradient-to-br from-palm-600/30 to-sand-500/10 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#102942] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs text-slate-400">عُهدة رقم</p>
                  <p className="mt-1 font-semibold tabular-nums" dir="ltr">AHD-260801</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 aria-hidden="true" size={14} /> تم الفحص
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="rounded-3xl bg-white/[.07] p-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <RoutePoint city="جدة" label="الاستلام" accent="orange" />
                    <div className="flex items-center" aria-hidden="true">
                      <span className="h-px w-10 bg-white/20" />
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink"><Plane size={18} className="-rotate-90" /></span>
                      <span className="h-px w-10 bg-white/20" />
                    </div>
                    <RoutePoint city="الرياض" label="الوجهة" accent="blue" />
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
                    <MiniFact label="الوزن" value="4.5 كجم" />
                    <MiniFact label="العرض" value="145 ر.س" />
                    <MiniFact label="الرحلة" value="SV1042" ltr />
                  </div>
                </div>

                <div className="mt-4 rounded-3xl bg-white p-4 text-ink">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-palm-50 text-palm-700"><PackageCheck aria-hidden="true" size={23} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">المحتويات مطابقة</p>
                      <p className="mt-1 text-xs text-slate-500">تم توثيق الفحص بصور جديدة</p>
                    </div>
                    <BadgeCheck aria-hidden="true" className="text-palm-600" size={22} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink shadow-card sm:flex">
              <Sparkles aria-hidden="true" className="text-sand-500" size={19} />
              <div><p className="text-xs text-slate-500">مطابقة تلقائية</p><p className="text-sm font-semibold">نفس المسار والموعد</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-6">
        <div className="page-wrap grid gap-5 sm:grid-cols-3">
          <Value Icon={ShieldCheck} title="مسؤولية واضحة" text="الوصف والصور والفحص محفوظة في سجل العُهدة." />
          <Value Icon={Scale} title="سعر تختاره أنت" text="قارن عروض المسافرين قبل قبول أي عرض." />
          <Value Icon={QrCode} title="تسليم لا يلتبس" text="المستلم يؤكد الاستلام برمز OTP أو QR." />
        </div>
      </section>

      <section className="page-wrap py-16 sm:py-24">
        <div className="max-w-2xl">
          <span className="section-kicker"><Sparkles aria-hidden="true" size={17} /> تجربة مختصرة وواضحة</span>
          <h2 className="title">من الطلب إلى التسليم في ثلاث مراحل</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">كل مرحلة لها إجراء واحد واضح وسجل يمكن الرجوع إليه.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Step number="01" Icon={Boxes} title="أضف تفاصيل العُهدة" text="المسار والوزن والوصف والقيمة وصور المحتويات وبيانات المستلم." />
          <Step number="02" Icon={Plane} title="اختر المسافر المناسب" text="نطابق الرحلات تلقائيًا، ثم تقارن السعر والموعد وتقبل العرض الأنسب." />
          <Step number="03" Icon={PackageCheck} title="افحص وسلّم بأمان" text="المسافر يوثق الفحص، والمستلم يغلق الرحلة برمز تسليم آمن." />
        </div>
      </section>

      <section className="page-wrap pb-16 sm:pb-24">
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card lg:grid-cols-2">
          <RolePanel Icon={Boxes} eyebrow="للمرسل" title="أرسل أغراضك مع شخص على نفس الوجهة" text="أنشئ الطلب، استقبل الأسعار، اختر العرض، وتابع حالة العُهدة حتى التسليم." href={senderHref} action="إنشاء طلب شحن" />
          <RolePanel Icon={Plane} eyebrow="للمسافر" title="استفد من وزنك المتاح في الرحلة" text="سجّل مسارك، شاهد العُهد المطابقة، افحص المحتويات، ثم قدّم سعرك." href={travelerHref} action="إضافة رحلة" traveler />
        </div>
      </section>
    </>
  );
}

function TrustLine({ Icon, text }: { Icon: typeof ShieldCheck; text: string }) {
  return <span className="flex items-center gap-2"><Icon aria-hidden="true" className="text-blue-300" size={17} />{text}</span>;
}

function RoutePoint({ city, label, accent }: { city: string; label: string; accent: "orange" | "blue" }) {
  return <div><MapPin aria-hidden="true" className={accent === "orange" ? "text-[#ff986d]" : "text-[#8bbcff]"} size={21} /><p className="mt-3 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-bold">{city}</p></div>;
}

function MiniFact({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return <div><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold tabular-nums" dir={ltr ? "ltr" : undefined}>{value}</p></div>;
}

function Value({ Icon, title, text }: { Icon: typeof ShieldCheck; title: string; text: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-palm-50 text-palm-700"><Icon aria-hidden="true" size={20} /></span><div><h2 className="text-sm font-semibold text-ink">{title}</h2><p className="mt-1 text-xs leading-6 text-slate-500">{text}</p></div></div>;
}

function Step({ number, Icon, title, text }: { number: string; Icon: typeof Boxes; title: string; text: string }) {
  return <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><span className="absolute left-5 top-3 text-6xl font-bold text-slate-100" aria-hidden="true">{number}</span><span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"><Icon aria-hidden="true" size={22} /></span><h3 className="relative mt-7 text-xl font-bold">{title}</h3><p className="relative mt-3 text-sm leading-7 text-slate-600">{text}</p></article>;
}

function RolePanel({ Icon, eyebrow, title, text, href, action, traveler = false }: { Icon: typeof Boxes; eyebrow: string; title: string; text: string; href: string; action: string; traveler?: boolean }) {
  return <article className={`p-7 sm:p-10 ${traveler ? "border-t border-slate-200 bg-slate-50 lg:border-r lg:border-t-0" : ""}`}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${traveler ? "bg-white text-palm-700" : "bg-palm-50 text-palm-700"}`}><Icon aria-hidden="true" size={22} /></span><p className="mt-6 text-sm font-semibold text-palm-700">{eyebrow}</p><h2 className="mt-2 max-w-md text-2xl font-bold leading-[1.45]">{title}</h2><p className="mt-3 max-w-md text-sm leading-7 text-slate-600">{text}</p><Link href={href} className="mt-6 inline-flex min-h-12 items-center gap-2 font-semibold text-palm-700 hover:text-palm-600">{action}<ArrowLeft aria-hidden="true" size={18} /></Link></article>;
}

