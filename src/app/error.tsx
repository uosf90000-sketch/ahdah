"use client";

import { CircleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-wrap section-space">
      <div className="card mx-auto max-w-lg text-center">
        <CircleAlert className="mx-auto mb-4 text-coral" size={44} />
        <h1 className="mb-2 text-2xl font-black">تعذر تحميل الصفحة</h1>
        <p className="muted mb-6">حدث خطأ غير متوقع. لم نفقد بياناتك، ويمكنك المحاولة مرة أخرى.</p>
        <button className="btn-primary" onClick={reset}>إعادة المحاولة</button>
      </div>
    </div>
  );
}

