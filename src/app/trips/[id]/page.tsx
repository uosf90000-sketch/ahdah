import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Car, MapPin, PackageSearch, Plane, Route as RouteIcon, Scale } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, formatDate } from "@/lib/domain";
import { getTravelerMatchesForTrip } from "@/lib/services/match-service";
import { decodeItinerary, isMixedTrip, isRoadTrip, tripRouteCities, tripTransportLabel } from "@/lib/trip-route";
import { createOfferAction } from "@/app/actions";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const trip = await db.trip.findFirst({ where: { id, travelerId: user.id } });
  if (!trip) notFound();
  const matches = await getTravelerMatchesForTrip(trip.id, user.id);
  const itinerary = decodeItinerary(trip);
  const mixed = isMixedTrip(trip);
  const road = isRoadTrip(trip);
  const route = tripRouteCities(trip);
  const TravelIcon = mixed ? RouteIcon : road ? Car : Plane;
  const travelLabel = tripTransportLabel(trip);

  return (
    <div className="page-wrap section-space">
      <MessageBanner error={query.error} success={query.success} />
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-card sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div><span className="text-xs font-bold text-blue-200">{mixed ? "رحلة متعددة المراحل" : road ? "رحلة على الطريق" : "رحلة جوية"}</span><h1 className="mt-2 text-3xl font-bold">{trip.fromCity} ← {trip.toCity}</h1></div>
          <TravelIcon className="text-blue-200" size={34} />
        </div>

        {route.length > 2 && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.08] p-4">
            <p className="text-[11px] font-medium text-slate-300">المسار الكامل</p>
            <p className="mt-2 text-sm font-black leading-8 text-blue-100">{route.join(" ← ")}</p>
          </div>
        )}

        {itinerary.length > 1 && (
          <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {itinerary.map((leg, index) => (
              <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3" key={`${leg.from}-${leg.to}-${index}`}>
                <p className="text-[10px] font-bold text-blue-200">المرحلة {index + 1} · {leg.mode === "AIR" ? "✈️ طيران" : "🚗 طريق"}</p>
                <p className="mt-1 text-sm font-black">{leg.from} ← {leg.to}</p>
                {leg.mode === "AIR" && <p className="mt-1 text-[11px] text-slate-300">{leg.airline}{leg.flightNumber ? ` · ${leg.flightNumber}` : ""}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-4">
          <Fact Icon={CalendarDays} label="بداية الرحلة" value={formatDate(trip.departureAt)} />
          <Fact Icon={TravelIcon} label="طريقة التنقل" value={travelLabel} />
          <Fact Icon={Scale} label="الوزن المتاح" value={`${trip.availableWeightKg.toString()} كجم`} />
          <Fact Icon={MapPin} label="نقاط المسار" value={`${route.length} نقاط`} />
        </div>
      </section>

      <div className="mb-5 flex items-end justify-between">
        <div><p className="eyebrow mb-2">مطابقة ذكية</p><h2 className="text-2xl font-bold">{matches.length} عُهد مناسبة لرحلتك</h2><p className="muted mt-2">أي طلب يبدأ من نقطة في مسارك وينتهي عند نقطة لاحقة يظهر لك، حتى لو مر عبر طيران ثم طريق.</p></div>
        <Link href="/matches" className="hidden min-h-11 items-center text-sm font-bold text-palm-700 sm:inline-flex">كل المطابقات <ArrowLeft className="inline" size={15} /></Link>
      </div>

      {matches.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((shipment) => {
            const ownOffer = shipment.offers[0];
            return (
              <article className="card overflow-hidden !p-0" key={shipment.id} id={`shipment-${shipment.id}`}>
                <div className="relative h-44 bg-sand-50">
                  {shipment.photos[0] ? <Image src={shipment.photos[0].url} alt="صورة محتويات العُهدة" fill unoptimized className="object-cover" /> : <PackageSearch className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-palm-600" size={42} />}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black backdrop-blur">{shipment.weightKg.toString()} كجم</span>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between"><strong>{CATEGORY_LABELS[shipment.category]}</strong><span className="text-xs font-bold text-slate-500">{shipment.refCode}</span></div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600"><MapPin className="ml-1 inline text-palm-600" size={14} /> {shipment.fromCity} ← {shipment.toCity}</div>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{shipment.contents}</p>
                  <p className="mt-3 text-xs font-bold text-slate-500">وقت المرسل للتنسيق: {formatDate(shipment.requestedDeliveryAt)}</p>
                  {ownOffer && <div className="mt-4 rounded-xl bg-palm-50 p-3 text-xs font-bold text-palm-700">لديك عرض سابق على هذا الطلب. إرسال سعر جديد سيحدّث عرضك.</div>}
                  <form action={createOfferAction} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <input type="hidden" name="shipmentId" value={shipment.id} />
                    <input type="hidden" name="tripId" value={trip.id} />
                    <div><label className="label" htmlFor={`price-${shipment.id}`}>سعر النقل (ريال)</label><input className="input" id={`price-${shipment.id}`} name="priceSar" type="number" min="10" max="10000" step="1" inputMode="numeric" defaultValue={ownOffer?.priceSar.toString() ?? ""} required /></div>
                    <div><label className="label" htmlFor={`note-${shipment.id}`}>ملاحظة للمرسل (اختياري)</label><textarea className="textarea !min-h-20" id={`note-${shipment.id}`} name="note" maxLength={500} defaultValue={ownOffer?.note ?? ""} placeholder="مثال: أقدر أستلمها قبل الانطلاق بساعتين" /></div>
                    <SubmitButton className="btn-primary w-full" pendingText="جاري إرسال العرض...">إرسال العرض</SubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card py-14 text-center"><PackageSearch className="mx-auto mb-4 text-palm-600" size={44} /><h3 className="text-xl font-black">لا توجد عُهد من مستخدمين آخرين مطابقة الآن</h3><p className="muted mx-auto mt-2 max-w-md">سنفحص كل نقطة في مسارك، سواء كانت مرحلة طيران أو طريق، ونظهر الطلب المناسب فور توفره.</p></div>
      )}
    </div>
  );
}

function Fact({ Icon, label, value }: { Icon: typeof Plane; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.08] p-4"><Icon className="mb-3 text-blue-200" size={18} /><p className="text-[11px] font-medium text-slate-300">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
