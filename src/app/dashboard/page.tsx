import Link from "next/link";
import { ArrowLeft, Boxes, PackagePlus, Plane, Scale, Sparkles, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/domain";
import { StatusBadge } from "@/components/status";

export const metadata = { title: "لوحتي" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [sent, trips, carrying, receivedRatings] = await Promise.all([
    db.shipment.findMany({ where: { senderId: user.id }, include: { offers: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.trip.findMany({ where: { travelerId: user.id }, include: { offers: true }, orderBy: { departureAt: "asc" }, take: 5 }),
    db.shipment.findMany({ where: { acceptedOffer: { travelerId: user.id }, status: { notIn: ["DELIVERED", "CANCELLED"] } }, include: { acceptedOffer: true }, orderBy: { updatedAt: "desc" } }),
    db.rating.aggregate({ where: { targetId: user.id }, _avg: { score: true }, _count: true }),
  ]);
  const openOffers = sent.reduce((total, shipment) => total + shipment.offers.filter((offer) => offer.status === "PENDING").length, 0);
  return (
    <div className="page-wrap section-space">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow mb-2">مساء الخير، {user.name.split(" ")[0]}</p><h1 className="title">كل عُهدك في مكان واحد</h1></div>
        <div className="flex gap-3"><Link className="btn-primary" href="/shipments/new"><PackagePlus size={18} /> عُهدة جديدة</Link><Link className="btn-secondary" href="/trips/new"><Plane size={18} /> أضف رحلة</Link></div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "عُهدي", value: sent.length, Icon: Boxes },
          { label: "العروض الجديدة", value: openOffers, Icon: Sparkles },
          { label: "عُهد معي", value: carrying.length, Icon: Scale },
          { label: "تقييمي", value: receivedRatings._count ? `${receivedRatings._avg.score?.toFixed(1)} / 5` : "جديد", Icon: Star },
        ].map(({ label, value, Icon }) => (
          <div className="card !p-4 sm:!p-5" key={label}><Icon className="mb-5 text-palm-600" size={24} /><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-black/40">{label}</p></div>
        ))}
      </div>

      {carrying.length > 0 && (
        <section className="card-soft mb-8">
          <div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">مهمتك الحالية</p><h2 className="mt-1 text-xl font-black">عُهد معك الآن</h2></div><Scale className="text-palm-600" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            {carrying.map((shipment) => <Link href={`/shipments/${shipment.id}`} className="rounded-2xl bg-white p-4 transition hover:-translate-y-0.5" key={shipment.id}><div className="flex items-center justify-between"><strong>{shipment.fromCity} ← {shipment.toCity}</strong><StatusBadge status={shipment.status} /></div><p className="mt-2 text-xs text-black/45">{shipment.refCode} · {shipment.weightKg.toString()} كجم</p></Link>)}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="card">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">طلبات الشحن</h2><Link href="/shipments/new" className="text-sm font-bold text-palm-600">إضافة <ArrowLeft className="inline" size={15} /></Link></div>
          <div className="space-y-3">
            {sent.length ? sent.map((shipment) => (
              <Link href={`/shipments/${shipment.id}`} key={shipment.id} className="block rounded-2xl border border-black/5 p-4 transition hover:border-palm-100 hover:bg-palm-50/40">
                <div className="flex items-center justify-between gap-3"><div><strong>{shipment.fromCity} ← {shipment.toCity}</strong><p className="mt-1 text-xs text-black/40">{shipment.refCode} · التسليم {formatDate(shipment.requestedDeliveryAt)}</p></div><StatusBadge status={shipment.status} /></div>
                <div className="mt-3 flex gap-4 text-xs font-bold text-black/50"><span>{shipment.weightKg.toString()} كجم</span><span>{shipment.offers.filter((offer) => offer.status === "PENDING").length} عروض</span></div>
              </Link>
            )) : <Empty text="لم تنشئ أي طلب شحن بعد" href="/shipments/new" action="أنشئ أول عُهدة" />}
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">رحلاتي</h2><Link href="/trips/new" className="text-sm font-bold text-palm-600">إضافة <ArrowLeft className="inline" size={15} /></Link></div>
          <div className="space-y-3">
            {trips.length ? trips.map((trip) => (
              <Link href={`/trips/${trip.id}`} key={trip.id} className="block rounded-2xl border border-black/5 p-4 hover:bg-sand-50">
                <div className="flex justify-between gap-3"><strong>{trip.fromCity} ← {trip.toCity}</strong><span className="pill">{trip.availableWeightKg.toString()} كجم</span></div>
                <p className="mt-2 text-xs text-black/45">{trip.airline} · {formatDate(trip.departureAt)}</p>
                <p className="mt-3 text-xs font-bold text-palm-600">{trip.offers.length} عروض مقدمة</p>
              </Link>
            )) : <Empty text="أضف رحلتك لنبحث عن عُهد مناسبة" href="/trips/new" action="إضافة رحلة" />}
          </div>
        </section>
      </div>
    </div>
  );
}

function Empty({ text, href, action }: { text: string; href: string; action: string }) {
  return <div className="rounded-2xl bg-black/[.025] p-6 text-center"><p className="muted mb-4">{text}</p><Link className="btn-secondary" href={href}>{action}</Link></div>;
}
