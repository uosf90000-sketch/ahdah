import Link from "next/link";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loginAction, registerAction } from "@/app/actions";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "الدخول والتسجيل" };

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const query = await searchParams;
  const register = query.tab === "register";
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.5rem] border border-black/5 bg-white shadow-card lg:grid-cols-[.8fr_1.2fr]">
        <aside className="bg-ink p-7 text-white sm:p-10">
          <span className="pill !bg-white/10 !text-white">حساب واحد · دورين</span>
          <h1 className="mt-6 text-3xl font-black leading-tight">أرسل عُهدتك<br />أو استثمر وزنك المتاح</h1>
          <p className="mt-4 text-sm leading-7 text-white/55">يمكنك استخدام الحساب نفسه كمرسل ومسافر والتحويل بين الرحلات والعُهد بسهولة.</p>
          <ul className="mt-8 space-y-4 text-sm font-bold text-white/75">
            <li className="flex gap-3"><ShieldCheck className="shrink-0 text-palm-500" /> جلسة دخول آمنة ومشفرة</li>
            <li className="flex gap-3"><ShieldCheck className="shrink-0 text-palm-500" /> لا مشاركة لرقم المستلم علنًا</li>
            <li className="flex gap-3"><ShieldCheck className="shrink-0 text-palm-500" /> كل تغيير مسجل في رحلة العُهدة</li>
          </ul>
        </aside>
        <section className="p-6 sm:p-10">
          <div className="mb-7 flex rounded-2xl bg-black/[.035] p-1.5">
            <Link href="/auth?tab=login" className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-black ${!register ? "bg-white text-palm-700 shadow" : "text-black/45"}`}>تسجيل الدخول</Link>
            <Link href="/auth?tab=register" className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-black ${register ? "bg-white text-palm-700 shadow" : "text-black/45"}`}>حساب جديد</Link>
          </div>
          <MessageBanner error={query.error} />
          {register ? (
            <form action={registerAction} className="space-y-5">
              <div><label className="label" htmlFor="name">الاسم الكامل</label><input className="input" id="name" name="name" autoComplete="name" required placeholder="مثال: يوسف الصبحي" /></div>
              <div className="grid-form">
                <div><label className="label" htmlFor="register-email">البريد الإلكتروني</label><input className="input" id="register-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" dir="ltr" /></div>
                <div><label className="label" htmlFor="phone">رقم الجوال</label><input className="input" id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="05xxxxxxxx" dir="ltr" /></div>
              </div>
              <div><label className="label" htmlFor="role">استخدام الحساب</label><select className="select" id="role" name="role" defaultValue="BOTH"><option value="BOTH">مرسل ومسافر</option><option value="SENDER">مرسل غالبًا</option><option value="TRAVELER">مسافر غالبًا</option></select></div>
              <div><label className="label" htmlFor="register-password">كلمة المرور</label><input className="input" id="register-password" type="password" name="password" autoComplete="new-password" minLength={8} required /></div>
              <SubmitButton className="btn-primary w-full" pendingText="جاري إنشاء الحساب..."><UserPlus size={18} /> إنشاء الحساب</SubmitButton>
            </form>
          ) : (
            <form action={loginAction} className="space-y-5">
              <div><label className="label" htmlFor="email">البريد الإلكتروني</label><input className="input" id="email" type="email" name="email" autoComplete="email" required dir="ltr" /></div>
              <div><label className="label" htmlFor="password">كلمة المرور</label><input className="input" id="password" type="password" name="password" autoComplete="current-password" required /></div>
              <SubmitButton className="btn-primary w-full" pendingText="جاري الدخول..."><KeyRound size={18} /> دخول آمن</SubmitButton>
              <div className="rounded-2xl bg-sand-50 p-4 text-xs leading-6 text-black/55">
                <strong className="text-ink">حساب التجربة بعد تشغيل seed:</strong><br />sender@ahdah.sa / Demo1234!
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
