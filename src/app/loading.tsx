export default function Loading() {
  return (
    <div className="page-wrap section-space" aria-live="polite" aria-label="جاري التحميل">
      <div className="mb-6 h-9 w-48 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-3xl bg-slate-100" />)}
      </div>
    </div>
  );
}

