import Link from "next/link";
import { Bell, Camera, ChevronLeft, FileText, MapPin, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MessageBanner } from "@/components/message-banner";
import { NativePermissionsPanel } from "@/components/native-permissions-panel";
import { SubmitButton } from "@/components/submit-button";
import { deleteAccountAction } from "./actions";

export const metadata = { title: "إعدادات الحساب" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;

  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="eyebrow mb-2">حسابك</p>
          <h1 className="title">الإعدادات والخصوصية</h1>
          <p className="muted mt-2">تحكم في بياناتك وصلاحيات تطبيق عهدتك.</p>
        </div>

        <MessageBanner error={query.error} success={query.success} />

        <section className="card">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-palm-50 text-palm-700"><UserRound /></span>
            <div><p className="text-xs font-semibold text-slate-500">الحساب</p><h2 className="text-lg font-black">{user.name}</h2></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="البريد الإلكتروني" value={user.email} />
            <Info label="رقم الجوال" value={user.phone || "غير مضاف"} />
          </div>
        </section>

        <section className="card">
          <div className="mb-5">
            <p className="eyebrow mb-2">صلاحيات التطبيق</p>
            <h2 className="text-xl font-black">الكاميرا والموقع والإشعارات</h2>
            <p className="muted mt-2">نطلب كل صلاحية وقت الحاجة فقط. يمكنك تعديلها لاحقًا من إعدادات الجهاز.</p>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <PermissionHint Icon={Camera} title="الكاميرا" text="لصور العُهدة والفحص" />
            <PermissionHint Icon={MapPin} title="الموقع" text="لنقطة الاستلام والتسليم" />
            <PermissionHint Icon={Bell} title="الإشعارات" text="للعروض والرسائل والحالات" />
          </div>
          <NativePermissionsPanel />
        </section>

        <section className="card">
          <div className="mb-4 flex items-center gap-3"><ShieldCheck className="text-palm-600" /><h2 className="text-xl font-black">السياسات والحقوق</h2></div>
          <div className="divide-y divide-slate-100">
            <PolicyLink href="/legal/terms" label="الشروط والأحكام" />
            <PolicyLink href="/legal/privacy" label="سياسة الخصوصية" />
            <PolicyLink href="/legal/prohibited-items" label="المحتويات المحظورة" />
          </div>
        </section>

        <section className="card border-2 !border-red-100">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 /></span>
            <div>
              <h2 className="text-xl font-black text-red-700">حذف الحساب نهائيًا</h2>
              <p className="muted mt-1">يحذف الحساب والشحنات والرحلات والرسائل والصور والتقييمات والبيانات المرتبطة بك من قاعدة بيانات عهدتك، باستثناء أي بيانات يفرض النظام الاحتفاظ بها.</p>
            </div>
          </div>
          <form action={deleteAccountAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="confirmation">للتأكيد اكتب: حذف حسابي</label>
              <input className="input border-red-200 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(254,202,202,.6)]" id="confirmation" name="confirmation" autoComplete="off" required />
            </div>
            <p className="text-xs leading-6 text-red-700">هذه العملية نهائية ولا يمكن التراجع عنها.</p>
            <SubmitButton className="btn !bg-red-600 text-white hover:!bg-red-700" pendingText="جاري حذف الحساب..."><Trash2 size={17} /> حذف حسابي وبياناتي</SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold text-ink">{value}</p></div>;
}

function PermissionHint({ Icon, title, text }: { Icon: typeof Camera; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><Icon className="mb-2 text-palm-600" size={19} /><p className="font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>;
}

function PolicyLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex min-h-14 items-center justify-between py-3 font-bold text-ink transition hover:text-palm-700"><span className="flex items-center gap-2"><FileText size={17} className="text-palm-600" />{label}</span><ChevronLeft size={17} /></Link>;
}
