import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, PackageCheck, Plane, ShieldCheck, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { googleOAuthConfigured } from "@/lib/google-oauth";
import { loginAction, registerAction } from "@/app/actions";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { PasswordField } from "@/components/password-field";

export const metadata = { title: "الدخول والتسجيل" };

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const query = await searchParams;
  const register = query.tab === "register";
  const googleEnabled = googleOAuthConfigured();

  return (
    <div className="page-wrap section-space">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card lg:grid-cols-[.9fr_1.1fr]">
        <aside className="order-2 relative overflow-hidden bg-ink p-7 text-white sm:p-10 lg:order-1">
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-palm-600/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100"><ShieldCheck aria-hidden="true" size={15} /> حساب واحد للدورين</span>
            <h1 className="mt-6 max-w-sm text-3xl font-bold leading-[1.45]">أرسل عُهدتك، أو سجّل رحلتك ووزنك المتاح.</h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">لا تحتاج إلى حسابين. يمكنك التحول بين دور المرسل والمسافر في أي وقت.</p>
            <ul className="mt-8 space-y-4 text-sm text-slate-200">
              <Feature text="تفاصيل وصور العُهدة قبل قبولها" />
              <Feature text="سجل فحص وحالات واضح للطرفين" />
              <Feature text="تسليم نهائي موثق برمز آمن" />
            </ul>
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.06] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-ink"><PackageCheck aria-hidden="true" size={22} /></span>
                <div><p className="font-semibold">جدة <ArrowLeft aria-hidden="true" className="mx-1 inline" size={15} /> الرياض</p><p className="mt-1 text-xs text-slate-400">عُهدة مفحوصة · تسليم مؤكد</p></div>
                <Plane aria-hidden="true" className="mr-auto text-blue-300" size={22} />
              </div>
            </div>
          </div>
        </aside>

        <section className="order-1 p-6 sm:p-10 lg:order-2">
          <div className="mb-7">
            <p className="text-sm font-semibold text-palm-700">مرحبًا بك في عهدتك</p>
            <h2 className="mt-2 text-3xl font-bold">{register ? "أنشئ حسابك" : "سجّل الدخول"}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">{register ? "ابدأ كمرسل ومسافر من الحساب نفسه." : "أدخل بياناتك للعودة إلى عُهدك ورحلاتك."}</p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="الدخول أو التسجيل">
            <Link href="/auth?tab=login" role="tab" aria-selected={!register} className={`min-h-11 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${!register ? "bg-white text-palm-700 shadow-sm" : "text-slate-500 hover:text-ink"}`}>تسجيل الدخول</Link>
            <Link href="/auth?tab=register" role="tab" aria-selected={register} className={`min-h-11 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${register ? "bg-white text-palm-700 shadow-sm" : "text-slate-500 hover:text-ink"}`}>حساب جديد</Link>
          </div>

          <MessageBanner error={query.error} />

          {googleEnabled && (
            <>
              <Link href="/auth/google" className="mb-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-ink transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                <GoogleIcon /> المتابعة باستخدام Google
              </Link>
              <div className="mb-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>أو باستخدام البريد</span><span className="h-px flex-1 bg-slate-200" /></div>
            </>
          )}

          {register ? (
            <form action={registerAction} className="space-y-5">
              <div><label className="label" htmlFor="name">الاسم الكامل</label><input className="input" id="name" name="name" autoComplete="name" required placeholder="مثال: يوسف الصبحي" /></div>
              <div className="grid-form">
                <div><label className="label" htmlFor="register-email">البريد الإلكتروني</label><input className="input" id="register-email" type="email" name="email" autoComplete="email" required placeholder="you@example.com" dir="ltr" /></div>
                <div><label className="label" htmlFor="phone">رقم الجوال</label><input className="input" id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="05xxxxxxxx" dir="ltr" /></div>
              </div>
              <div>
                <label className="label" htmlFor="role">كيف ستستخدم تطبيق عهدتك؟</label>
                <select className="select" id="role" name="role" defaultValue="BOTH" aria-describedby="role-help">
                  <option value="BOTH">مرسل ومسافر — موصى به</option>
                  <option value="SENDER">مرسل غالبًا</option>
                  <option value="TRAVELER">مسافر / موصل غالبًا</option>
                </select>
                <p id="role-help" className="mt-2 text-xs leading-6 text-slate-500">يمكنك استخدام جميع الوظائف مهما كان اختيارك.</p>
              </div>
              <PasswordField id="register-password" name="password" label="كلمة المرور" autoComplete="new-password" minLength={8} help="8 أحرف على الأقل" />
              <SubmitButton className="btn-primary w-full" pendingText="جاري إنشاء الحساب..."><UserPlus aria-hidden="true" size={18} /> إنشاء الحساب</SubmitButton>
            </form>
          ) : (
            <form action={loginAction} className="space-y-5">
              <div><label className="label" htmlFor="email">البريد الإلكتروني</label><input className="input" id="email" type="email" name="email" autoComplete="email" required dir="ltr" /></div>
              <PasswordField id="password" name="password" label="كلمة المرور" autoComplete="current-password" />
              <SubmitButton className="btn-primary w-full" pendingText="جاري الدخول..."><KeyRound aria-hidden="true" size={18} /> دخول آمن</SubmitButton>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return <li className="flex items-center gap-3"><CheckCircle2 aria-hidden="true" className="shrink-0 text-blue-300" size={18} />{text}</li>;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}
