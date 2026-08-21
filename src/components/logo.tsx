import Link from "next/link";
import { PackageCheck } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex min-h-11 items-center gap-3" aria-label="عهدتك - الرئيسية">
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white shadow-[0_10px_24px_rgba(11,31,51,.18)] transition group-hover:-translate-y-0.5">
        <PackageCheck aria-hidden="true" size={24} strokeWidth={1.8} />
        <span className="absolute -left-1 -top-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-sand-500" />
      </span>
      {!compact && (
        <span>
          <span className="block text-xl font-bold leading-5 text-ink">عهدتك</span>
          <span className="mt-1 block text-[10px] font-semibold text-slate-500">سفر موثوق · تسليم مؤكّد</span>
        </span>
      )}
    </Link>
  );
}
