import Link from "next/link";
import { ArrowRight, LockKeyhole, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/domain";
import { getChatContext, getChatMessages } from "@/lib/services/chat-service";
import { sendChatMessageAction } from "@/app/messages/actions";
import { ChatLive } from "@/components/chat-live";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ shipmentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { shipmentId } = await params;
  const query = await searchParams;

  let context;
  try {
    context = await getChatContext(user.id, shipmentId);
  } catch {
    notFound();
  }
  const messages = await getChatMessages(user.id, shipmentId);

  return (
    <div className="page-wrap section-space">
      <ChatLive />
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <header className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="العودة للرسائل"><ArrowRight aria-hidden="true" size={19} /></Link>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-palm-50 text-palm-700"><MessageCircle aria-hidden="true" size={21} /></span>
            <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold">{context.otherParticipant.name}</h1><p className="mt-1 text-xs text-slate-500">{context.shipment.refCode} · {context.shipment.fromCity} ← {context.shipment.toCity}</p></div>
            <StatusBadge status={context.shipment.status} />
          </div>
        </header>

        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600 sm:px-5">
          <ShieldCheck aria-hidden="true" className="ml-1 inline text-palm-600" size={15} />
          لا يظهر رقم جوال المستلم هنا. استخدم المحادثة لتنسيق الاستلام والتسليم داخل عهدتك.
        </div>

        <MessageBanner error={query.error} />

        <section className="max-h-[58dvh] min-h-[24rem] space-y-3 overflow-y-auto bg-[#f7f9fc] p-4 sm:p-5" aria-label="المحادثة">
          {messages.length ? messages.map((message, index) => {
            const mine = message.senderId === user.id;
            const latest = index === messages.length - 1;
            return (
              <div key={message.id} id={latest ? "chat-latest" : undefined} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                <article className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${mine ? "rounded-tr-md bg-palm-600 text-white" : "rounded-tl-md border border-slate-200 bg-white text-ink"}`}>
                  {!mine && <p className="mb-1 text-[11px] font-bold text-palm-700">{message.sender.name}</p>}
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
                  <p className={`mt-1.5 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>{formatDate(message.createdAt)}</p>
                </article>
              </div>
            );
          }) : (
            <div className="grid min-h-[22rem] place-items-center text-center"><div><MessageCircle className="mx-auto mb-3 text-palm-500" size={32} /><h2 className="font-bold">ابدأ المحادثة</h2><p className="muted mt-2">نسّق مكان ووقت الاستلام وكل ما يخص هذه العُهدة.</p></div></div>
          )}
        </section>

        {context.writable ? (
          <form action={sendChatMessageAction} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
            <input type="hidden" name="shipmentId" value={shipmentId} />
            <label className="sr-only" htmlFor="body">الرسالة</label>
            <textarea id="body" name="body" required maxLength={1000} rows={1} className="textarea min-h-12 flex-1 resize-none py-3" placeholder="اكتب رسالتك..." />
            <SubmitButton className="btn-primary h-12 min-w-12 px-4" pendingText="..."><Send aria-hidden="true" size={18} /><span className="hidden sm:inline">إرسال</span></SubmitButton>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500"><LockKeyhole aria-hidden="true" size={17} /> تم إغلاق المحادثة بعد انتهاء العُهدة</div>
        )}
      </div>
    </div>
  );
}
