import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";
import { todayInWarsaw } from "@/lib/domain/dates";

export default function TodayPage() {
  const today = todayInWarsaw();

  return (
    <>
      <PageHeader title="Dziś" subtitle={`Dzień: ${today}`} />
      <EmptyState
        icon={<CalendarClock className="size-8" />}
        title="Pulpit w budowie"
        description="Tu pojawią się dzisiejsze wizyty, otwarte zlecenia i skróty do najczęstszych akcji. Budujemy moduły po kolei."
      />
    </>
  );
}
