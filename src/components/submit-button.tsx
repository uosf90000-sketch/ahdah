"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary", pendingText = "جاري الحفظ..." }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <LoaderCircle className="animate-spin" size={18} />}
      {pending ? pendingText : children}
    </button>
  );
}
