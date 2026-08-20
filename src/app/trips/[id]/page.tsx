import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, PackageSearch, Plane, Scale } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, formatDate } from "@/lib/domain";
import { getMatchesForTrip } from "@/lib/services/shipment-service";
import { MessageBanner } from "@/components/message-banner";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const trip = await db.trip.findFirst({ where: { id, travelerId: user.id } });
  if (!trip) notFound();
  const matches = await getMatchesForTrip(trip.id, user.id);
  return (
    <div className="page-wrap section-space">
      <MessageBanner error={query.error} success={query.success} />
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-card sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-palm-500">رحلتك القادمة</span><h1 className="mt-2 text-3xl font-black">{trip.fromCity} ← {trip.toCity}</h1></div><Plane className="text-sand-300" size={34} /></div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Fact Icon={CalendarDays} label="الموعد" value={formatDate(trip.departureAt)} />
          <Fact Icon={Plane} label="الطيران" value={trip.airline} />
          <Fact Icon={Scale} label="الوزن المتاح" value={`${trip.availableWeightKg.toString()} كجم`} />
          <Fact Icon={MapPin} label="رقم الرحلة" value={trip.flightNumber || "غير مضاف"} />
        </div>
      </section>

      <div className="mb-5 flex items-end justify-between"><div><p className="eyebrow mb-2">مطابقة ذكية</p><h2 className="text-2xl font-black">{matches.length} عُهد مناسبة لرحلتك</h2></div><Link href="/matches" className="hidden text-sm font-bold text-palm-600 sm:block">كل المطابقات <ArrowLeft className="inline" size={15} /></Link></div>
      {matches.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((shipment) => (
            <article className="card overflow-hidden !p-0" key={shipment.id}>
              <div className="relative h-44 bg-sand-50">
                {shipment.photos[0] ? <Image src={shipment.photos[0].url} alt="صورة محتويات العُهدة" fill unoptimized className="object-cover" /> : <PackageSearch className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-palm-600" size={42} />}
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black backdrop-blur">{shipment.weightKg.toString()} كجم</span>
              </div>
              <div className="p-5"><div className="mb-3 flex items-center justify-between"><strong>{CATEGORY_LABELS[shipment.category]}</strong><span className="text-xs font-bold text-black/40">{shipment.refCode}</span></div><p className="line-clamp-2 text-sm leading-7 text-black/55">{shipment.contents}</p><div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4"><span className="text-xs font-bold text-black/45">قبل {formatDate(shipment.requestedDeliveryAt)}</span><Link href={`/shipments/${shipment.id}?trip=${trip.id}`} className="text-sm font-black text-palm-600">عرض وتقديم سعر <ArrowLeft className="inline" size={15} /></Link></div></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card py-14 text-center"><PackageSearch className="mx-auto mb-4 text-palm-600" size={44} /><h3 className="text-xl font-black">لا توجد عُهد مطابقة الآن</h3><p className="muted mx-auto mt-2 max-w-md">سنعتبر رحلتك متاحة. جرّب لاحقًا بعد إضافة مرسلين جدد على نفس المسار.</p></div>
      )}
    </div>
  );
}

function Fact({ Icon, label, value }: { Icon: typeof Plane; label: string; value: string }) {
  return <div className="rounded-2xl bg-white/[.08] p-4"><Icon className="mb-3 text-palm-500" size={18} /><p className="text-[11px] text-white/40">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>;
}
