import Link from "next/link";

export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-palm-700">عهدتك</Link>
          <span>/</span>
          <Link href="/legal/terms" className="hover:text-palm-700">الشروط</Link>
          <span>/</span>
          <Link href="/legal/privacy" className="hover:text-palm-700">الخصوصية</Link>
          <span>/</span>
          <Link href="/legal/prohibited-items" className="hover:text-palm-700">المحتويات المحظورة</Link>
        </div>
        <article className="card legal-copy">
          <p className="eyebrow mb-2">عهدتك</p>
          <h1 className="title">{title}</h1>
          <p className="muted mt-2">آخر تحديث: {updated}</p>
          <div className="mt-8 space-y-7 text-sm leading-8 text-slate-700">{children}</div>
        </article>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-black text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
