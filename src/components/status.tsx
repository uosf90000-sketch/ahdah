import { Check } from "lucide-react";
import { SHIPMENT_STATUSES, STATUS_LABELS, type ShipmentStatusName } from "@/lib/domain";

export function StatusBadge({ status }: { status: ShipmentStatusName | "CANCELLED" }) {
  const done = status === "DELIVERED";
  return <span className={`pill ${done ? "!border-palm-600 !bg-palm-600 !text-white" : ""}`}>{STATUS_LABELS[status]}</span>;
}

export function StatusTimeline({ current }: { current: ShipmentStatusName }) {
  const activeIndex = SHIPMENT_STATUSES.indexOf(current);
  return (
    <ol className="grid gap-0 sm:grid-cols-7" aria-label="مراحل الشحنة">
      {SHIPMENT_STATUSES.map((status, index) => {
        const complete = index <= activeIndex;
        return (
          <li key={status} className="relative flex items-center gap-3 pb-4 sm:flex-col sm:pb-0 sm:text-center">
            {index < SHIPMENT_STATUSES.length - 1 && <span aria-hidden="true" className={`absolute right-[15px] top-8 h-full w-0.5 sm:right-1/2 sm:top-4 sm:h-0.5 sm:w-full ${index < activeIndex ? "bg-palm-500" : "bg-ink-100"}`} />}
            <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-black ${complete ? "border-palm-600 bg-palm-600 text-white" : "border-ink-100 bg-white text-slate-500"}`}>
              {index < activeIndex ? <Check size={15} /> : index + 1}
            </span>
            <span className={`relative z-10 text-xs font-bold ${complete ? "text-palm-700" : "text-slate-500"}`} aria-current={index === activeIndex ? "step" : undefined}>{STATUS_LABELS[status]}</span>
          </li>
        );
      })}
    </ol>
  );
}
