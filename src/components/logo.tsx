import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="عُهدة - الرئيسية">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-palm-600 text-white shadow-float">
        <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full border-2 border-white/35" />
        <span className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full border-2 border-sand-300/70" />
        <span className="text-xl font-black">ع</span>
      </span>
      {!compact && (
        <span>
          <span className="block text-xl font-black leading-5">عُهدة</span>
          <span className="text-[10px] font-bold text-black/40">مساحتك توصل خير</span>
        </span>
      )}
    </Link>
  );
}
