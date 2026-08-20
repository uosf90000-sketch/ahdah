import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap section-space">
      <div className="card mx-auto max-w-lg text-center">
        <div className="mb-4 text-6xl font-black text-palm-600">404</div>
        <h1 className="mb-2 text-2xl font-black">الصفحة غير موجودة</h1>
        <p className="muted mb-6">قد يكون الرابط تغير أو أن العُهدة لم تعد متاحة.</p>
        <Link className="btn-primary" href="/dashboard">العودة إلى لوحتي</Link>
      </div>
    </div>
  );
}
