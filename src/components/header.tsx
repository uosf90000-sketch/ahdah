import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { Logo } from "@/components/logo";
import { DesktopNav } from "@/components/desktop-nav";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="page-wrap flex h-[4.75rem] items-center justify-between gap-4 py-3">
        <Logo />
        {user && <DesktopNav />}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden min-h-11 items-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-semibold text-ink sm:flex">
              <UserRound aria-hidden="true" size={17} className="text-palm-600" />
              {user.name.split(" ")[0]}
            </span>
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
