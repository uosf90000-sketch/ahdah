"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "لوحتي" },
  { href: "/shipments/new", label: "إرسال عُهدة" },
  { href: "/trips/new", label: "إضافة رحلة" },
  { href: "/matches", label: "المطابقات" },
];

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center rounded-2xl bg-slate-100/80 p-1 md:flex" aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`min-h-10 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-white text-palm-700 shadow-sm" : "text-slate-600 hover:text-ink"}`}>{item.label}</Link>;
      })}
    </nav>
  );
}
