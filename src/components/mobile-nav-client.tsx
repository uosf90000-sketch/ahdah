"use client";

import Link from "next/link";
import { House, PackagePlus, Plane, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "لوحتي", Icon: House },
  { href: "/shipments/new", label: "إرسال", Icon: PackagePlus },
  { href: "/trips/new", label: "رحلة", Icon: Plane },
  { href: "/matches", label: "مطابقات", Icon: Sparkles },
];

export function MobileNavClient() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 z-50 grid grid-cols-4 rounded-[1.4rem] border border-slate-200 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(11,31,51,.18)] backdrop-blur-xl md:hidden" style={{ bottom: "max(.75rem, env(safe-area-inset-bottom))" }} aria-label="التنقل للجوال">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${active ? "bg-palm-50 text-palm-700" : "text-slate-500 hover:bg-slate-50"}`}>
            <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.4 : 1.8} />{label}
          </Link>
        );
      })}
    </nav>
  );
}
