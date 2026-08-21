import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white py-8 text-center text-xs text-slate-500">
      <div className="page-wrap flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span>© {new Date().getFullYear()} عهدتك</span>
        <Link href="/legal/terms" className="font-semibold hover:text-palm-700">الشروط والأحكام</Link>
        <Link href="/legal/privacy" className="font-semibold hover:text-palm-700">سياسة الخصوصية</Link>
        <Link href="/legal/acceptable-use" className="font-semibold hover:text-palm-700">سياسة الاستخدام</Link>
        <Link href="/legal/cancellations-disputes" className="font-semibold hover:text-palm-700">الإلغاء والنزاعات</Link>
        <Link href="/legal/prohibited-items" className="font-semibold hover:text-palm-700">المنتجات المحظورة</Link>
      </div>
    </footer>
  );
}
