import Link from "next/link";
import { BadgeCheck, KeyRound, LockKeyhole, PackageCheck, Send, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { completeDeliveryAction, sendOtpAction } from "@/app/actions";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/domain";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "تأكيد استلام العُهدة" };

export default async function HandoverPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; success?: string; demoOtp?: string; delivered?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const shipment = await db.shipment.findUnique({ where: { qrToken: token }, include: { acceptedOffer: { include: { traveler: true } } } });
  if (!shipment) notFound();
  const delivered = shipment.status === "DELIVERED" || query.delivered === "1";
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-lg">
        {delivered ? (
          <section className="card py-12 text-center"><div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-palm-50 text-palm-600"><PackageCheck size={40} /></div><span className="pill mb-4"><BadgeCheck size={14} /> تسليم موثق</span><h1 className="text-3xl font-black">تم استلام العُهدة</h1><p className="muted mt-3">شكرًا لتأكيد الاستلام. اكتملت رحلة {shipment.refCode} وتم تحرير المبلغ للمسافر في محاكي الدفع.</p><Link href="/" className="btn-secondary mt-7">العودة للرئيسية</Link></section>
        ) : (
          <>
            <div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-ink text-white shadow-float"><LockKeyhole /></div><p className="eyebrow mb-2">بوابة التسليم الآمن</p><h1 className="text-3xl font-black">تأكيد استلام العُهدة</h1></div>
            <MessageBanner error={query.error} success={query.success} />
            <section className="card mb-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-medium text-slate-500">رقم العُهدة</p><p className="mt-1 font-bold">{shipment.refCode}</p></div><span className="pill">{shipment.fromCity} ← {shipment.toCity}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs font-medium text-slate-500">المستلم</p><p className="mt-1 font-bold">{shipment.recipientName}</p></div><div><p className="text-xs font-medium text-slate-500">المسافر</p><p className="mt-1 font-bold">{shipment.acceptedOffer?.traveler.name ?? "—"}</p></div><div><p className="text-xs font-medium text-slate-500">آخر موعد</p><p className="mt-1 font-bold">{formatDate(shipment.requestedDeliveryAt)}</p></div><div><p className="text-xs font-medium text-slate-500">الجوال</p><p className="mt-1 font-bold" dir="ltr">•••• {shipment.recipientPhone.slice(-4)}</p></div></div>
            </section>
            {shipment.status === "ARRIVED" ? (
              <section className="card space-y-5">
                <div className="flex items-start gap-3 rounded-2xl bg-palm-50 p-4 text-sm leading-7 text-palm-700"><ShieldCheck className="mt-1 shrink-0" size={19} /><p>اطلب الرمز ثم أدخله أمام المسافر بعد معاينة العُهدة. الرمز صالح لمدة 10 دقائق.</p></div>
                <form action={sendOtpAction}><input type="hidden" name="token" value={token} /><SubmitButton className="btn-secondary w-full" pendingText="جاري إرسال الرمز..."><Send size={18} /> إرسال OTP إلى جوال المستلم</SubmitButton></form>
                {query.demoOtp && <div className="rounded-2xl border border-dashed border-palm-500 bg-palm-50 p-4 text-center"><p className="text-xs font-bold text-palm-700">رمز وضع التجربة</p><p className="mt-1 text-3xl font-black tracking-[.3em]" dir="ltr">{query.demoOtp}</p></div>}
                <form action={completeDeliveryAction} className="space-y-4"><input type="hidden" name="token" value={token} /><div><label className="label" htmlFor="otp">رمز الاستلام المكوّن من 6 أرقام</label><input className="input text-center text-2xl font-black tracking-[.35em]" id="otp" name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required dir="ltr" placeholder="••••••" /></div><SubmitButton className="btn-primary w-full" pendingText="جاري تأكيد التسليم..."><KeyRound size={18} /> تأكيد الاستلام وإنهاء العُهدة</SubmitButton></form>
              </section>
            ) : <div className="card text-center"><p className="muted">لا يمكن إتمام التسليم لأن حالة العُهدة الحالية ليست «وصلت للوجهة».</p></div>}
          </>
        )}
      </div>
    </div>
  );
}
