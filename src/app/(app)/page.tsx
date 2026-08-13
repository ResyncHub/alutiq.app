import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";
import { todayInWarsaw, warsawDayRangeUtc } from "@/lib/domain/dates";
import { listJobsInRange } from "@/lib/db/jobs";
import { listCustomerOptions } from "@/lib/db/customers";
import { JobQuickAdd } from "./zlecenia/job-quick-add";
import { JobListItem } from "./zlecenia/job-list-item";

export default async function TodayPage() {
  const today = todayInWarsaw();
  const { startUtc, endUtc } = warsawDayRangeUtc(today);

  const [jobs, customers] = await Promise.all([
    listJobsInRange(startUtc, endUtc),
    listCustomerOptions(),
  ]);

  const dateLabel = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${today}T12:00:00Z`));

  return (
    <>
      <PageHeader
        title="Dziś"
        subtitle={dateLabel}
        action={<JobQuickAdd customers={customers} />}
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-8" />}
          title="Brak zleceń na dziś"
          description="Nic nie zaplanowano na dzisiaj. Dodaj zlecenie lub zajrzyj do kalendarza."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobListItem job={job} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
