import { Route } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { MessageBanner } from "@/components/message-banner";
import { TripForm } from "@/components/trip-form";

export const metadata = { title: "إضافة رحلة" };

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  const query = await searchParams;
  // Server-rendered request time defines the earliest valid departure slot.
  // eslint-disable-next-line react-hooks/purity
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="page-wrap section-space">
      <div className="mb-8 max-w-2xl">
        <span className="eyebrow mb-4"><Route size={15} /> للموصل</span>
        <h1 className="title">أضف مسارك</h1>
      </div>

      <div className="max-w-3xl">
        <MessageBanner error={query.error} />
        <TripForm minDate={minDate} />
      </div>
    </div>
  );
}

