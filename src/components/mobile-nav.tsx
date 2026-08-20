import Link from "next/link";
import { House, PackagePlus, Plane, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function MobileNav() {
  const user = await getCurrentUser();
  if (!user) return null;
  const items = [
    { href: "/dashboard", label: "لوحتي", Icon: House },
    { href: "/shipments/new", label: "إرسال", Icon: PackagePlus },
    { href: "/trips/new", label: "رحلة", Icon: Plane },
    { href: "/matches", label: "مطابقات", Icon: Sparkles },
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-3xl border border-white/60 bg-ink/95 p-2 text-white shadow-2xl backdrop-blur md:hidden" aria-label="التنقل للجوال">
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold hover:bg-white/10">
          <Icon size={19} />{label}
        </Link>
      ))}
    </nav>
  );
}
