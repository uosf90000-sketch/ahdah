import Link from "next/link";
import { ArrowLeft, MessageCircle, PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/domain";
import { StatusBadge } from "@/components/status";

export const metadata = { title: "الرسائل" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser();
  const shipments = await db.shipment.findMany({
    where: {
      acceptedOfferId: { not: null },
      OR: [{ senderId: user.id }, { acceptedOffer: { is: { travelerId: user.id } } }],
    },
    include: {
      sender: { select: { id: true, name: true } },
      acceptedOffer: { include: { traveler: { select: { id: true, name: true } } } },
      chatMessages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const conversations = shipments.sort((a, b) => {
    const aTime = a.chatMessages[0]?.createdAt ?? a.updatedAt;
    const bTime = b.chatMessages[0]?.createdAt ?? b.updatedAt;
    return bTime.getTime() - aTime.getTime();
  });

  return (
    <div className="page-wrap section-space">
      <div className="mb-7">
        <p className="eyebrow mb-2">تواصل داخل عهدتك</p>
        <h1 className="title">الرسائل</h1>
        <p className="muted mt-2">المحادثة تفتح فقط بعد قبول الموصل وتبقى مرتبطة برقم العُهدة.</p>
      </div>

      {conversations.length ? (
        <div className="space-y-3">
          {conversations.map((shipment) => {
            const traveler = shipment.acceptedOffer!.traveler;
            const other = shipment.senderId === user.id ? traveler : shipment.sender;
            const last = shipment.chatMessages[0];
            return (
              <Link key={shipment.id} href={`/messages/${shipment.id}`} className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-palm-300 hover:bg-palm-50/30 sm:p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-palm-50 text-palm-700"><MessageCircle aria-hidden="true" size={22} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><strong className="truncate">{other.name}</strong><StatusBadge status={shipment.status} /></div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{shipment.refCode} · {shipment.fromCity} ← {shipment.toCity}</p>
                  <p className="mt-2 truncate text-sm text-slate-600">{last ? last.body : "ابدأ المحادثة لتنسيق الاستلام والتسليم"}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-[11px] text-slate-400">{formatDate(last?.createdAt ?? shipment.updatedAt)}</p>
                  <ArrowLeft aria-hidden="true" className="mt-3 mr-auto text-palm-600 transition group-hover:-translate-x-1" size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PackageCheck className="mx-auto mb-4 text-palm-600" size={34} />
          <h2 className="text-xl font-bold">لا توجد محادثات بعد</h2>
          <p className="muted mx-auto mt-2 max-w-md">عندما تقبل عرض موصل على عُهدة، تظهر المحادثة هنا تلقائيًا.</p>
          <Link href="/dashboard" className="btn-primary mt-6">العودة للوحة التحكم</Link>
        </div>
      )}
    </div>
  );
}

