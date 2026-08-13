import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Kalendarz" subtitle="Wizyty i terminy" />
      <EmptyState
        icon={<CalendarDays className="size-8" />}
        title="Kalendarz powstanie w kolejnym etapie"
        description="Zaplanujesz tu wizyty powiązane ze zleceniami, z ostrzeżeniem o nakładających się terminach."
      />
    </>
  );
}
