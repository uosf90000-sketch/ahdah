import Link from "next/link";
import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdminIdentity } from "@/lib/admin";
import { logoutAction } from "@/app/actions";
import { Logo } from "@/components/logo";
import { DesktopNav } from "@/components/desktop-nav";

export async function Header() {
  const user = await getCurrentUser();
  const admin = user ? isAdminIdentity(user) : false;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="page-wrap flex h-[4.75rem] items-center justify-between gap-4 py-3">
        <Logo />
        {user && <DesktopNav />}
        {user ? (
          <div className="flex items-center gap-2">
            {admin && (
              <Link href="/admin" className="hidden min-h-11 items-center gap-2 rounded-2xl border border-palm-100 bg-palm-50 px-3 text-sm font-semibold text-palm-700 transition hover:border-palm-300 sm:flex">
                <ShieldCheck aria-hidden="true" size={17} /> الإدارة
              </Link>
            )}
            <Link href="/settings" className="hidden min-h-11 items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-semibold text-ink transition hover:bg-palm-50 hover:text-palm-700 sm:flex">
              <UserRound aria-hidden="true" size={17} className="text-palm-600" />
              {user.name.split(" ")[0]}
            </Link>
            <Link href="/settings" className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-palm-200 hover:bg-palm-50 hover:text-palm-700 sm:hidden" aria-label="إعدادات الحساب">
              <Settings aria-hidden="true" size={18} />
            </Link>
            {admin && (
              <Link href="/admin" className="grid h-11 w-11 place-items-center rounded-2xl border border-palm-100 bg-palm-50 text-palm-700 sm:hidden" aria-label="لوحة الإدارة">
                <ShieldCheck aria-hidden="true" size={18} />
              </Link>
            )}
            <form action={logoutAction}>
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100" aria-label="تسجيل الخروج">
                <LogOut aria-hidden="true" size={18} />
              </button>
            </form>
          </div>
        ) : (
          <Link className="btn-primary min-h-11 px-5 py-2.5" href="/auth">دخول</Link>
        )}
      </div>
    </header>
  );
}

