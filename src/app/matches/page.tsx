import Link from "next/link";
import { ArrowLeft, PackageSearch, Plane, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/domain";
import { getMatchesForTrip } from "@/lib/services/shipment-service";

export const metadata = { title: "المطابقات" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();
  const trips = await db.trip.findMany({ where: { travelerId: user.id, status: "OPEN", departureAt: { gt: new Date() } }, orderBy: { departureAt: "asc" } });
  const rows = await Promise.all(trips.map(async (trip) => ({ trip, matches: await getMatchesForTrip(trip.id, user.id) })));
  const total = rows.reduce((sum, row) => sum + row.matches.length, 0);
  return (
    <div className="page-wrap section-space">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="eyebrow mb-4"><Sparkles size={15} /> {total} مطابقة متاحة</span><h1 className="title">عُهد تناسب رحلاتك</h1><p className="muted mt-3">النتائج تعتمد على المدينة والوجهة والموعد والوزن المتاح.</p></div><Link className="btn-primary" href="/trips/new"><Plane size={18} /> أضف رحلة</Link></div>
      {rows.length ? <div className="space-y-5">{rows.map(({ trip, matches }) => (
        <section className="card" key={trip.id}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><Plane className="text-palm-600" /><h2 className="text-xl font-bold">{trip.fromCity} ← {trip.toCity}</h2></div><p className="mt-2 text-xs font-medium text-slate-500">{formatDate(trip.departureAt)} · {trip.availableWeightKg.toString()} كجم متاح</p></div><div className="flex items-center gap-4"><span className="pill">{matches.length} عُهد</span><Link href={`/trips/${trip.id}`} className="inline-flex min-h-11 items-center text-sm font-bold text-palm-700">عرض النتائج <ArrowLeft className="inline" size={15} /></Link></div></div>
        </section>
      ))}</div> : <div className="card py-14 text-center"><PackageSearch className="mx-auto mb-4 text-palm-600" size={44} /><h2 className="text-xl font-black">أضف رحلة أولًا</h2><p className="muted mx-auto mt-2 max-w-md">بمجرد إضافة مسارك ووزنك المتاح سنطابقك تلقائيًا مع طلبات الشحن المناسبة.</p><Link className="btn-primary mt-6" href="/trips/new">إضافة رحلة</Link></div>}
    </div>
  );
}
