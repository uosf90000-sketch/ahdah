import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  MessageCircle,
  PackageCheck,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/domain";
import { StatusBadge } from "@/components/status";

export const metadata = { title: "لوحة الإدارة" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [
    users,
    shipments,
    delivered,
    activeShipments,
    openTrips,
    offers,
    messages,
    captured,
    reserved,
    recentUsers,
    recentShipments,
  ] = await Promise.all([
    db.user.count(),
    db.shipment.count(),
    db.shipment.count({ where: { status: "DELIVERED" } }),
    db.shipment.count({ where: { status: { in: ["TRAVELER_ACCEPTED", "INSPECTED", "WITH_TRAVELER", "ARRIVED"] } } }),
    db.trip.count({ where: { status: "OPEN" } }),
    db.offer.count(),
    db.chatMessage.count(),
    db.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amountSar: true }, _count: true }),
    db.payment.aggregate({ where: { status: "RESERVED" }, _sum: { amountSar: true }, _count: true }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, createdAt: true },
    }),
    db.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        sender: { select: { name: true } },
        acceptedOffer: { include: { traveler: { select: { name: true } } } },
      },
    }),
  ]);

  const conversion = shipments ? Math.round((delivered / shipments) * 100) : 0;

  return (
    <div className="page-wrap section-space">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-8 lg:p-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-palm-600/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100">
              <ShieldCheck aria-hidden="true" size={15} /> إدارة عهدتك
            </div>
            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">لوحة التحكم الإدارية</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              متابعة النشاط، العُهد، الرحلات والمدفوعات من مكان واحد. الدخول مخصص للحسابات الإدارية الموثقة.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm">
            <p className="text-xs text-slate-400">مسجّل كمسؤول</p>
            <p className="mt-1 font-semibold" dir="ltr">{admin.email}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="مؤشرات عهدتك">
        <Metric Icon={Users} label="إجمالي المستخدمين" value={users} />
        <Metric Icon={PackageCheck} label="إجمالي العُهد" value={shipments} />
        <Metric Icon={CheckCircle2} label="تم تسليمها" value={delivered} hint={`${conversion}% من جميع العُهد`} accent />
        <Metric Icon={Plane} label="رحلات مفتوحة" value={openTrips} />
        <Metric Icon={Sparkles} label="العروض المقدمة" value={offers} />
        <Metric Icon={MessageCircle} label="الرسائل" value={messages} />
        <Metric Icon={CircleDollarSign} label="مدفوعات مكتملة" value={formatMoney(captured._sum.amountSar ?? 0)} hint={`${captured._count} عملية`} />
        <Metric Icon={Banknote} label="مبالغ محجوزة" value={formatMoney(reserved._sum.amountSar ?? 0)} hint={`${reserved._count} عملية`} />
      </section>

      <section className="mt-6 rounded-3xl border border-palm-100 bg-palm-50 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold text-palm-700">قيد التنفيذ الآن</p>
            <h2 className="mt-1 text-xl font-bold">{activeShipments} عُهدة نشطة بعد قبول الموصل</h2>
            <p className="mt-2 text-sm text-slate-600">تشمل الفحص، الحمل، الوصول والانتظار للتسليم.</p>
          </div>
          <Link href="/dashboard" className="btn-secondary">فتح واجهة المستخدم <ArrowLeft aria-hidden="true" size={16} /></Link>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="eyebrow mb-1">آخر النشاط</p><h2 className="text-xl font-bold">أحدث العُهد</h2></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="text-xs text-slate-500"><tr className="border-b border-slate-200"><th className="pb-3 font-semibold">العُهدة</th><th className="pb-3 font-semibold">المرسل</th><th className="pb-3 font-semibold">الموصل</th><th className="pb-3 font-semibold">الحالة</th><th className="pb-3 font-semibold">التاريخ</th></tr></thead>
              <tbody>
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4"><Link href={`/shipments/${shipment.id}`} className="font-bold text-palm-700 hover:underline">{shipment.refCode}</Link><p className="mt-1 text-xs text-slate-500">{shipment.fromCity} ← {shipment.toCity}</p></td>
                    <td className="py-4 font-semibold">{shipment.sender.name}</td>
                    <td className="py-4 text-slate-600">{shipment.acceptedOffer?.traveler.name ?? "—"}</td>
                    <td className="py-4"><StatusBadge status={shipment.status} /></td>
                    <td className="py-4 text-xs text-slate-500">{formatDate(shipment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="mb-5"><p className="eyebrow mb-1">الحسابات</p><h2 className="text-xl font-bold">أحدث المستخدمين</h2></div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <article key={user.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{user.name}</p><p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{user.email}</p></div><span className="pill">{user.role}</span></div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{user.emailVerifiedAt ? "بريد موثّق" : "غير موثّق"}</span><span>{formatDate(user.createdAt)}</span></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ Icon, label, value, hint, accent = false }: { Icon: typeof Users; label: string; value: string | number; hint?: string; accent?: boolean }) {
  return (
    <article className={`rounded-3xl border p-4 sm:p-5 ${accent ? "border-palm-100 bg-palm-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${accent ? "bg-white text-palm-700" : "bg-slate-100 text-slate-600"}`}><Icon aria-hidden="true" size={19} /></span><strong className="text-xl font-bold tabular-nums sm:text-2xl">{value}</strong></div>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </article>
  );
}

