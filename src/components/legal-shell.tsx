import Link from "next/link";

const legalLinks = [
  ["/legal/terms", "الشروط والأحكام"],
  ["/legal/privacy", "الخصوصية"],
  ["/legal/acceptable-use", "سياسة الاستخدام"],
  ["/legal/cancellations-disputes", "الإلغاء والنزاعات"],
  ["/legal/prohibited-items", "المحظورات"],
] as const;

export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="page-wrap section-space">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500" aria-label="السياسات القانونية">
          <Link href="/" className="font-black text-palm-700 hover:text-palm-800">عهدتك</Link>
          {legalLinks.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-palm-700">{label}</Link>
          ))}
        </nav>
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
