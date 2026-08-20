import Link from "next/link";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { Logo } from "@/components/logo";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#fbfaf6]/90 backdrop-blur-xl">
      <div className="page-wrap flex h-[4.5rem] items-center justify-between py-3">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          <Link className="rounded-xl px-4 py-2 text-sm font-bold hover:bg-white" href="/dashboard">لوحتي</Link>
          <Link className="rounded-xl px-4 py-2 text-sm font-bold hover:bg-white" href="/shipments/new">إرسال عُهدة</Link>
          <Link className="rounded-xl px-4 py-2 text-sm font-bold hover:bg-white" href="/trips/new">إضافة رحلة</Link>
          <Link className="rounded-xl px-4 py-2 text-sm font-bold hover:bg-white" href="/matches">المطابقات</Link>
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-bold sm:inline">مرحبًا، {user.name.split(" ")[0]}</span>
            <form action={logoutAction}>
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-black/5 bg-white text-black/55 hover:text-coral" aria-label="تسجيل الخروج">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        ) : (
          <Link className="btn-primary min-h-10 px-4 py-2" href="/auth">دخول</Link>
        )}
      </div>
    </header>
  );
}
