import Link from "next/link";
import { ArrowLeft, Boxes, PackagePlus, PackageSearch, Plane, Scale, Sparkles, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/domain";
import { getTravelerMatchesForTrip } from "@/lib/services/match-service";
import { StatusBadge } from "@/components/status";

export const metadata = { title: "لوحتي" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [sent, trips, carrying, receivedRatings] = await Promise.all([
    db.shipment.findMany({ where: { senderId: user.id }, include: { offers: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.trip.findMany({ where: { travelerId: user.id }, include: { offers: true }, orderBy: { departureAt: "asc" }, take: 8 }),
    db.shipment.findMany({ where: { acceptedOffer: { travelerId: user.id }, status: { notIn: ["DELIVERED", "CANCELLED"] } }, include: { acceptedOffer: true }, orderBy: { updatedAt: "desc" } }),
    db.rating.aggregate({ where: { targetId: user.id }, _avg: { score: true }, _count: true }),
  ]);

  const openTrips = trips.filter((trip) => trip.status === "OPEN" && trip.departureAt > now);
  const matchRows = await Promise.all(
    openTrips.map(async (trip) => ({ trip, matches: await getTravelerMatchesForTrip(trip.id, user.id) })),
  );
  const availableToCarry = Array.from(
    new Map(
      matchRows
        .flatMap(({ trip, matches }) => matches.map((shipment) => ({ trip, shipment })))
        .map((item) => [item.shipment.id, item]),
    ).values(),
  ).slice(0, 6);

  return (
    <div className="page-wrap section-space">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-8 lg:p-10">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-palm-600/25 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-200">مرحبًا، {user.name.split(" ")[0]}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">ماذا تريد أن تنجز اليوم؟</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">أرسل عُهدة جديدة أو سجّل رحلتك، وسنتولى مطابقة المسار والوزن.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[29rem]">
            <Link href="/shipments/new" className="group flex min-h-24 items-center gap-4 rounded-3xl bg-white p-4 text-ink transition hover:-translate-y-0.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-palm-50 text-palm-700"><PackagePlus aria-hidden="true" size={23} /></span>
              <span><strong className="block">إرسال عُهدة</strong><small className="mt-1 block text-slate-500">أنشئ طلب شحن</small></span>
              <ArrowLeft aria-hidden="true" className="mr-auto text-palm-600 transition group-hover:-translate-x-1" size={19} />
            </Link>
            <Link href="/trips/new" className="group flex min-h-24 items-center gap-4 rounded-3xl border border-white/15 bg-white/10 p-4 text-white transition hover:bg-white/15">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-200"><Plane aria-hidden="true" size={23} /></span>
              <span><strong className="block">إضافة رحلة</strong><small className="mt-1 block text-slate-300">طيران أو على الطريق</small></span>
              <ArrowLeft aria-hidden="true" className="mr-auto text-blue-200 transition group-hover:-translate-x-1" size={19} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="ملخص الحساب">
        <Metric label="طلباتي المرسلة" value={sent.length} Icon={Boxes} />
        <Metric label="طلبات متاحة للتوصيل" value={availableToCarry.length} Icon={Sparkles} accent />
        <Metric label="عُهد أحملها" value={carrying.length} Icon={Scale} />
        <Metric label="تقييمي" value={receivedRatings._count ? `${receivedRatings._avg.score?.toFixed(1)} / 5` : "جديد"} Icon={Star} />
      </section>

      {carrying.length > 0 && (
        <section className="mt-6 rounded-3xl border border-blue-200 bg-palm-50 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold text-palm-700">مهمتك الحالية</p><h2 className="mt-1 text-xl font-bold">عُهد معك الآن</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-palm-700"><Scale aria-hidden="true" size={21} /></span></div>
          <div className="grid gap-3 md:grid-cols-2">
            {carrying.map((shipment) => <Link href={`/shipments/${shipment.id}`} className="group rounded-2xl border border-blue-100 bg-white p-4 transition hover:border-palm-500" key={shipment.id}><div className="flex items-center justify-between gap-3"><strong>{shipment.fromCity} ← {shipment.toCity}</strong><StatusBadge status={shipment.status} /></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span className="tabular-nums">{shipment.refCode} · {shipment.weightKg.toString()} كجم</span><ArrowLeft aria-hidden="true" className="text-palm-600 transition group-hover:-translate-x-1" size={16} /></div></Link>)}
          </div>
        </section>
      )}

      <section className="card mt-6 border-2 !border-palm-100">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">وضع الموصل</p>
            <h2 className="text-xl font-bold">طلبات متاحة للتوصيل</h2>
            <p className="muted mt-1">هذه طلبات مستخدمين آخرين فقط، ومطابقة لرحلاتك ووزنك المتاح.</p>
          </div>
          <Link href="/matches" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-palm-700 hover:bg-palm-50">كل المطابقات <ArrowLeft aria-hidden="true" size={15} /></Link>
        </div>

        {availableToCarry.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {availableToCarry.map(({ shipment, trip }) => (
              <article key={shipment.id} className="rounded-2xl border border-palm-100 bg-palm-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate">{shipment.fromCity} ← {shipment.toCity}</strong>
                    <p className="mt-1 text-xs text-slate-500">{shipment.refCode} · {shipment.weightKg.toString()} كجم</p>
                  </div>
                  <span className="pill shrink-0">{trip.availableWeightKg.toString()} كجم متاح</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{shipment.contents}</p>
                <div className="mt-4 flex items-center justify-between border-t border-palm-100 pt-3">
                  <span className="text-xs text-slate-500">وقت المرسل {formatDate(shipment.requestedDeliveryAt)}</span>
                  <Link href={`/trips/${trip.id}#shipment-${shipment.id}`} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-palm-600 px-4 text-sm font-bold text-white">عرض وتقديم سعر <ArrowLeft size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : openTrips.length ? (
          <div className="rounded-2xl bg-slate-50 p-7 text-center">
            <PackageSearch className="mx-auto mb-3 text-palm-600" size={38} />
            <p className="font-bold">لا توجد طلبات من مستخدمين آخرين مطابقة الآن</p>
            <p className="muted mt-2">طلب الشحن الذي أنشأته أنت لا يظهر هنا. ستظهر طلبات الحسابات الأخرى فور مطابقتها لرحلتك.</p>
          </div>
        ) : (
          <Empty text="أضف رحلة ووزنك المتاح لنظهر لك طلبات المستخدمين الآخرين" href="/trips/new" action="إضافة رحلة" />
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="card">
          <SectionHeading title="طلباتي المرسلة" href="/shipments/new" action="طلب جديد" />
          <p className="muted -mt-3 mb-4 text-xs">هذه الطلبات التي أنشأتها أنت كمرسل، وليست طلبات متاحة لتقديم سعر عليها.</p>
          <div className="space-y-3">
            {sent.length ? sent.map((shipment) => (
              <Link href={`/shipments/${shipment.id}`} key={shipment.id} className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-palm-500 hover:bg-palm-50/40">
                <div className="flex items-center justify-between gap-3"><div className="min-w-0"><strong className="block truncate">{shipment.fromCity} ← {shipment.toCity}</strong><p className="mt-1 text-xs text-slate-500">{shipment.refCode} · التسليم {formatDate(shipment.requestedDeliveryAt)}</p></div><StatusBadge status={shipment.status} /></div>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500"><span>{shipment.weightKg.toString()} كجم</span><span>{shipment.offers.filter((offer) => offer.status === "PENDING").length} عروض</span><ArrowLeft aria-hidden="true" className="mr-auto text-palm-600 transition group-hover:-translate-x-1" size={16} /></div>
              </Link>
            )) : <Empty text="لم تنشئ أي طلب شحن بعد" href="/shipments/new" action="أنشئ أول عُهدة" />}
          </div>
        </section>

        <section className="card">
          <SectionHeading title="رحلاتي" href="/trips/new" action="رحلة جديدة" />
          <div className="space-y-3">
            {trips.length ? trips.map((trip) => (
              <Link href={`/trips/${trip.id}`} key={trip.id} className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-palm-500 hover:bg-palm-50/40">
                <div className="flex justify-between gap-3"><strong>{trip.fromCity} ← {trip.toCity}</strong><span className="pill">{trip.availableWeightKg.toString()} كجم</span></div>
                <p className="mt-2 text-xs text-slate-500">{trip.airline} · {formatDate(trip.departureAt)}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-palm-700"><span>{trip.offers.length} عروض مقدمة</span><ArrowLeft aria-hidden="true" className="transition group-hover:-translate-x-1" size={16} /></div>
              </Link>
            )) : <Empty text="أضف رحلتك لنبحث عن عُهد مناسبة" href="/trips/new" action="إضافة رحلة" />}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, Icon, accent = false }: { label: string; value: string | number; Icon: typeof Boxes; accent?: boolean }) {
  return <div className={`rounded-3xl border p-4 sm:p-5 ${accent ? "border-palm-100 bg-palm-50" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${accent ? "bg-white text-palm-700" : "bg-slate-100 text-slate-600"}`}><Icon aria-hidden="true" size={19} /></span><strong className="text-2xl font-bold tabular-nums">{value}</strong></div><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p></div>;
}

function SectionHeading({ title, href, action }: { title: string; href: string; action: string }) {
  return <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{title}</h2><Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-palm-700 hover:bg-palm-50">{action}<ArrowLeft aria-hidden="true" size={15} /></Link></div>;
}

function Empty({ text, href, action }: { text: string; href: string; action: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center"><p className="muted mb-4">{text}</p><Link className="btn-secondary" href={href}>{action}</Link></div>;
}

