import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  CalendarDays,
  Camera,
  CircleAlert,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  Plane,
  QrCode,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_LABELS, formatDate, formatMoney, type ShipmentStatusName } from "@/lib/domain";
import { shipmentDetailInclude } from "@/lib/services/shipment-service";
import {
  acceptOfferAction,
  advanceShipmentAction,
  createOfferAction,
  createRatingAction,
  inspectShipmentAction,
} from "@/app/actions";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge, StatusTimeline } from "@/components/status";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ trip?: string; error?: string; success?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const shipment = await db.shipment.findUnique({ where: { id }, include: shipmentDetailInclude });
  if (!shipment) notFound();

  const isSender = shipment.senderId === user.id;
  const isAcceptedTraveler = shipment.acceptedOffer?.travelerId === user.id;
  const isOpen = ["NEW", "RECEIVING_OFFERS"].includes(shipment.status);
  if (!isOpen && !isSender && !isAcceptedTraveler) notFound();

  const compatibleTrips = !isSender && isOpen ? await db.trip.findMany({
    where: {
      travelerId: user.id,
      status: "OPEN",
      fromCity: shipment.fromCity,
      toCity: shipment.toCity,
      availableWeightKg: { gte: shipment.weightKg },
      departureAt: { gt: new Date() },
    },
    orderBy: { departureAt: "asc" },
  }) : [];
  const hasOwnOffer = shipment.offers.some((offer) => offer.travelerId === user.id);
  if (!isSender && isOpen && !compatibleTrips.length && !hasOwnOffer) notFound();
  const originalPhotos = shipment.photos.filter((photo) => photo.kind === "ORIGINAL");
  const inspectionPhotos = shipment.photos.filter((photo) => photo.kind === "INSPECTION");
  const existingRating = shipment.ratings.find((rating) => rating.authorId === user.id);
  const hasPickupLocation = shipment.pickupLat !== null && shipment.pickupLng !== null;
  const canSeePickupLocation = isSender || isAcceptedTraveler;

  return (
    <div className="page-wrap section-space">
      <MessageBanner error={query.error} success={query.success} />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={shipment.status} />
            <span className="text-xs font-bold text-slate-500">{shipment.refCode}</span>
            {shipment.acceptedOffer && (isSender || isAcceptedTraveler) && (
              <Link href={`/messages/${shipment.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-palm-200 bg-palm-50 px-3 text-xs font-black text-palm-700 transition hover:border-palm-400 hover:bg-palm-100">
                <MessageCircle size={15} aria-hidden="true" />
                {isSender ? "تحدث مع الأمين" : "تحدث مع العميل"}
              </Link>
            )}
          </div>
          <h1 className="title">{shipment.fromCity} ← {shipment.toCity}</h1>
          <p className="muted mt-2">أُنشئت بواسطة {shipment.sender.name} · {formatDate(shipment.createdAt)}</p>
        </div>
        <div className="flex gap-3"><span className="pill"><Scale size={15} /> {shipment.weightKg.toString()} كجم</span><span className="pill"><Box size={15} /> {CATEGORY_LABELS[shipment.category]}</span></div>
      </div>

      {shipment.status !== "CANCELLED" && <section className="card mb-6 overflow-x-auto"><StatusTimeline current={shipment.status as ShipmentStatusName} /></section>}

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-5 text-xl font-black">تفاصيل العُهدة</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Fact Icon={MapPin} label="المسار" value={`${shipment.fromCity} ← ${shipment.toCity}`} />
              <Fact Icon={CalendarDays} label="وقت المرسل للتنسيق" value={formatDate(shipment.requestedDeliveryAt)} />
              <Fact Icon={Scale} label="الوزن" value={`${shipment.weightKg.toString()} كجم`} />
              <Fact Icon={ShieldCheck} label="القيمة التقريبية" value={formatMoney(shipment.approximateValueSar)} />
              <Fact Icon={UserRoundCheck} label="المستلم" value={shipment.recipientName} />
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="mb-2 text-xs font-bold text-slate-500">وصف المحتويات</p><p className="whitespace-pre-wrap text-sm leading-8 text-slate-700">{shipment.contents}</p></div>
          </section>

          {hasPickupLocation && (
            canSeePickupLocation ? (
              <PickupLocationCard lat={shipment.pickupLat!} lng={shipment.pickupLng!} note={shipment.pickupNote} showDirections={isAcceptedTraveler} />
            ) : (
              <section className="card-soft">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-palm-700"><ShieldCheck size={20} /></span>
                  <div><h2 className="text-lg font-black">موقع الاستلام محمي</h2><p className="muted mt-2">ترى الآن مدينة الإرسال فقط. يظهر الموقع الدقيق للموصل بعد أن يقبل المرسل عرضه.</p></div>
                </div>
              </section>
            )
          )}

          <PhotoSection title="صور المرسل للمحتويات" photos={originalPhotos} />
          {inspectionPhotos.length > 0 && <PhotoSection title="صور فحص العُهدة" photos={inspectionPhotos} verified />}

          {isSender && isOpen && (
            <section className="card">
              <div className="mb-5"><p className="eyebrow mb-2">قارن قبل الاختيار</p><h2 className="text-xl font-black">عروض المسافرين ({shipment.offers.filter((offer) => offer.status === "PENDING").length})</h2></div>
              <div className="space-y-4">
                {shipment.offers.filter((offer) => offer.status === "PENDING").map((offer) => {
                  const avg = ratingAverage(offer.traveler.ratingsReceived);
                  return (
                    <article className="rounded-2xl border border-slate-200 p-5" key={offer.id}>
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><strong className="text-lg">{offer.traveler.name}</strong><BadgeCheck className="text-palm-600" size={18} /></div><p className="mt-1 text-xs font-medium text-slate-500">{offer.trip.airline} · {formatDate(offer.trip.departureAt)} · {avg}</p></div><strong className="text-2xl text-palm-700">{formatMoney(offer.priceSar)}</strong></div>
                      {offer.note && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">{offer.note}</p>}
                      <form action={acceptOfferAction} className="mt-4"><input type="hidden" name="offerId" value={offer.id} /><input type="hidden" name="shipmentId" value={shipment.id} /><SubmitButton className="btn-primary w-full sm:w-auto" pendingText="جاري القبول...">قبول العرض وحجز المبلغ</SubmitButton></form>
                    </article>
                  );
                })}
                {!shipment.offers.some((offer) => offer.status === "PENDING") && <div className="rounded-2xl bg-slate-50 p-7 text-center"><Plane className="mx-auto mb-3 text-palm-600" /><p className="muted">لم يصل عرض بعد. يظهر طلبك للمسافرين المطابقين تلقائيًا.</p></div>}
              </div>
            </section>
          )}

          {!isSender && isOpen && (
            <section className="card" id="offer">
              <p className="eyebrow mb-2">قدّم سعرك</p><h2 className="mb-2 text-xl font-black">هل تناسبك هذه العُهدة؟</h2><p className="muted mb-5">راجع المحتويات والصور أولًا. وقت المرسل ووقت رحلتك للتنسيق بينكما ولا يمنعان المطابقة.</p>
              {compatibleTrips.length ? (
                <form action={createOfferAction} className="space-y-5">
                  <input type="hidden" name="shipmentId" value={shipment.id} />
                  <div><label className="label" htmlFor="tripId">الرحلة المطابقة</label><select className="select" id="tripId" name="tripId" defaultValue={query.trip ?? compatibleTrips[0].id} required>{compatibleTrips.map((trip) => <option value={trip.id} key={trip.id}>{trip.fromCity} ← {trip.toCity} · {formatDate(trip.departureAt)}</option>)}</select></div>
                  <div><label className="label" htmlFor="priceSar">سعر النقل (ريال)</label><input className="input" id="priceSar" name="priceSar" type="number" min="10" max="10000" step="1" inputMode="decimal" required /></div>
                  <div><label className="label" htmlFor="note">ملاحظة للمرسل (اختياري)</label><textarea className="textarea" id="note" name="note" maxLength={500} placeholder="مكان ووقت الاستلام المناسب أو أي تفاصيل مهمة" /></div>
                  <SubmitButton className="btn-primary w-full" pendingText="جاري إرسال العرض...">إرسال العرض</SubmitButton>
                </form>
              ) : <div className="rounded-2xl bg-amber-50 p-5 text-sm leading-7 text-amber-900"><CircleAlert className="ml-2 inline" size={18} /> لا توجد رحلة لك تطابق المسار والوزن. <Link href="/trips/new" className="font-black underline">أضف رحلة مناسبة</Link>.</div>}
            </section>
          )}

          {isAcceptedTraveler && shipment.status === "TRAVELER_ACCEPTED" && (
            <section className="card border-2 !border-palm-100">
              <div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-palm-50 text-palm-700"><ClipboardCheck /></span><div><p className="eyebrow">خطوة إلزامية</p><h2 className="text-xl font-black">فحص العُهدة</h2></div></div>
              <p className="muted mb-5">افتح العُهدة مع المرسل، طابق كل المحتويات بالوصف والصور، ثم التقط صورًا جديدة قبل الإغلاق.</p>
              <form action={inspectShipmentAction} className="space-y-4" encType="multipart/form-data">
                <input type="hidden" name="shipmentId" value={shipment.id} />
                {[["matchedDescription", "المحتويات مطابقة للوصف المكتوب"], ["matchedPhotos", "المحتويات مطابقة لصور المرسل"], ["noProhibitedItems", "تأكدت من عدم وجود مواد محظورة أو مخفية"], ["packageSealed", "تم إغلاق العُهدة بعد الفحص"]].map(([name, label]) => <label key={name} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 font-bold hover:bg-palm-50"><input className="mt-1 h-5 w-5 accent-palm-600" type="checkbox" name={name} required /><span>{label}</span></label>)}
                <div><label className="label flex items-center gap-2" htmlFor="inspectionPhotos"><Camera size={18} className="text-palm-600" /> صور الفحص الجديدة</label><input className="input" id="inspectionPhotos" name="inspectionPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></div>
                <div><label className="label" htmlFor="notes">ملاحظات الفحص (اختياري)</label><textarea className="textarea" id="notes" name="notes" maxLength={1000} /></div>
                <SubmitButton className="btn-primary w-full" pendingText="جاري توثيق الفحص..."><PackageCheck size={18} /> أؤكد أنني شاهدت المحتويات ووافقت على حملها</SubmitButton>
              </form>
            </section>
          )}

          {isAcceptedTraveler && shipment.status === "INSPECTED" && <AdvanceCard shipmentId={shipment.id} nextStatus="WITH_TRAVELER" title="استلمت العُهدة" description="اضغط بعد استلام العُهدة المغلقة من المرسل." />}
          {isAcceptedTraveler && shipment.status === "WITH_TRAVELER" && <AdvanceCard shipmentId={shipment.id} nextStatus="ARRIVED" title="وصلت إلى الوجهة" description="أكد الوصول عندما تصبح العُهدة جاهزة لتسليم المستلم." />}

          {shipment.status === "DELIVERED" && (isSender || isAcceptedTraveler) && !existingRating && (
            <section className="card">
              <div className="mb-5"><p className="eyebrow mb-2">اكتملت العُهدة</p><h2 className="text-xl font-black">قيّم تجربتك</h2></div>
              <form action={createRatingAction} className="space-y-5"><input type="hidden" name="shipmentId" value={shipment.id} /><div><label className="label" htmlFor="score">التقييم</label><select className="select" id="score" name="score" defaultValue="5"><option value="5">★★★★★ ممتاز</option><option value="4">★★★★☆ جيد جدًا</option><option value="3">★★★☆☆ جيد</option><option value="2">★★☆☆☆ مقبول</option><option value="1">★☆☆☆☆ ضعيف</option></select></div><div><label className="label" htmlFor="comment">تعليق (اختياري)</label><textarea className="textarea" id="comment" name="comment" maxLength={500} /></div><SubmitButton className="btn-primary">حفظ التقييم</SubmitButton></form>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          {shipment.acceptedOffer ? (
            <section className="card">
              <div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-palm-50 text-palm-700"><UserRoundCheck /></span><div><p className="text-xs font-bold text-slate-500">المسافر المقبول</p><h2 className="text-lg font-bold">{shipment.acceptedOffer.traveler.name}</h2></div></div>
              <div className="space-y-3 text-sm"><Row label="السعر" value={formatMoney(shipment.acceptedOffer.priceSar)} /><Row label="الطيران" value={shipment.acceptedOffer.trip.airline} /><Row label="موعد الرحلة" value={formatDate(shipment.acceptedOffer.trip.departureAt)} /><Row label="تقييم المسافر" value={ratingAverage(shipment.acceptedOffer.traveler.ratingsReceived)} /></div>
              {shipment.payment && <p className="mt-4 rounded-xl bg-palm-50 p-3 text-xs font-bold text-palm-700">الدفع التجريبي: {shipment.payment.status === "CAPTURED" ? "تم تحرير المبلغ" : "المبلغ محجوز بأمان"}</p>}
            </section>
          ) : <section className="card-soft"><Plane className="mb-4 text-palm-600" /><h2 className="text-lg font-black">بانتظار المسافر المناسب</h2><p className="muted mt-2">نعرض طلبك للرحلات المطابقة للمسار والوزن. المواعيد تظهر للتنسيق بين الطرفين.</p></section>}

          {shipment.acceptedOffer && (
            <section className="card text-center">
              <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-palm-50 text-palm-700"><QrCode /></div><h2 className="text-lg font-black">رمز العُهدة</h2><p className="muted mt-2">يُستخدم الرمز عند الوصول لفتح صفحة التسليم وإرسال OTP للمستلم.</p>
              <div className="relative mx-auto my-5 aspect-square w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2"><Image src={`/api/qr/${shipment.qrToken}`} alt={`QR للعُهدة ${shipment.refCode}`} fill unoptimized className="object-contain p-2" /></div>
              <p className="text-xs font-bold text-slate-500">المستلم: {shipment.recipientName} · ••••{shipment.recipientPhone.slice(-4)}</p>
              {shipment.status === "ARRIVED" && <Link href={`/handover/${shipment.qrToken}`} className="btn-primary mt-5 w-full">فتح صفحة التسليم <ArrowLeft size={17} /></Link>}
            </section>
          )}

          <section className="card">
            <h2 className="mb-5 text-lg font-black">سجل العُهدة</h2>
            <ol className="space-y-4">{shipment.statusEvents.map((event) => <li key={event.id} className="relative border-r-2 border-palm-100 pr-4"><span className="absolute -right-[6px] top-1 h-2.5 w-2.5 rounded-full bg-palm-600 ring-4 ring-white" /><p className="text-sm font-bold">{event.note}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{formatDate(event.createdAt)}</p></li>)}</ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PickupLocationCard({ lat, lng, note, showDirections }: { lat: number; lng: number; note: string | null; showDirections: boolean }) {
  const delta = 0.006;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <section className="card overflow-hidden">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="eyebrow mb-1">خاص بالطرفين</p><h2 className="flex items-center gap-2 text-xl font-black"><MapPin className="text-palm-600" size={21} /> موقع استلام العُهدة</h2></div>
        {showDirections && <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-primary"><Navigation size={17} /> فتح الاتجاهات</a>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <iframe title="موقع استلام العُهدة" src={mapUrl} className="h-64 w-full border-0 sm:h-72" loading="lazy" referrerPolicy="no-referrer" />
      </div>
      {note && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">ملاحظة المرسل للموقع</p><p className="mt-1 text-sm leading-7 text-slate-700">{note}</p></div>}
      <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-palm-600" size={15} /> الموقع الدقيق خاص بالمرسل والموصل المقبول فقط.</p>
    </section>
  );
}

function Fact({ Icon, label, value }: { Icon: typeof Box; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><Icon className="mb-3 text-palm-600" size={19} /><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function PhotoSection({ title, photos, verified = false }: { title: string; photos: Array<{ id: string; url: string; caption: string | null }>; verified?: boolean }) {
  return <section className="card"><div className="mb-5 flex items-center gap-2"><h2 className="text-xl font-bold">{title}</h2>{verified && <span className="pill"><BadgeCheck size={14} /> موثقة</span>}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo) => <figure className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100" key={photo.id}><Image src={photo.url} alt={photo.caption ?? title} fill unoptimized className="object-cover" /></figure>)}</div></section>;
}

function AdvanceCard({ shipmentId, nextStatus, title, description }: { shipmentId: string; nextStatus: "WITH_TRAVELER" | "ARRIVED"; title: string; description: string }) {
  return <section className="card-soft"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">{title}</h2><p className="muted mt-1">{description}</p></div><form action={advanceShipmentAction}><input type="hidden" name="shipmentId" value={shipmentId} /><input type="hidden" name="nextStatus" value={nextStatus} /><SubmitButton className="btn-primary">تأكيد الحالة</SubmitButton></form></div></section>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>;
}

function ratingAverage(ratings: Array<{ score: number }>) {
  if (!ratings.length) return "جديد بلا تقييم";
  const avg = ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
  return `★ ${avg.toFixed(1)} (${ratings.length})`;
}
