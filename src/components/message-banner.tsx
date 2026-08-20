import { CheckCircle2, CircleAlert } from "lucide-react";

export function MessageBanner({ error, success }: { error?: string; success?: string }) {
  const message = error ?? success;
  if (!message) return null;
  const bad = Boolean(error);
  return (
    <div role="alert" className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold ${bad ? "border-red-200 bg-red-50 text-red-800" : "border-palm-100 bg-palm-50 text-palm-700"}`}>
      {bad ? <CircleAlert className="mt-0.5 shrink-0" size={19} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={19} />}
      <span>{message}</span>
    </div>
  );
}
