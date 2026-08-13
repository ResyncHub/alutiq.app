import { PageHeader } from "@/components/app-shell/page-header";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayInWarsaw,
  warsawRangeUtc,
} from "@/lib/domain/dates";
import { listCustomerOptions } from "@/lib/db/customers";
import { listJobsInRange, listUnscheduledJobs } from "@/lib/db/jobs";
import { JobQuickAdd } from "../zlecenia/job-quick-add";
import { JobListItem } from "../zlecenia/job-list-item";
import { MonthCalendar } from "./month-calendar";

function normalizeMonth(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return todayInWarsaw().slice(0, 7);
}

export default async function CalendarPage({
  searchParams,
}: PageProps<"/kalendarz">) {
  const params = await searchParams;
  const month = normalizeMonth(typeof params.m === "string" ? params.m : undefined);
  const firstOfMonth = `${month}-01`;

  // Zakres siatki (z dniami sąsiednich miesięcy) w UTC.
  const gridStart = startOfWeek(startOfMonth(firstOfMonth));
  const gridEnd = endOfWeek(endOfMonth(firstOfMonth));
  const { startUtc, endUtc } = warsawRangeUtc(gridStart, gridEnd);

  const [jobs, unscheduled, customers] = await Promise.all([
    listJobsInRange(startUtc, endUtc),
    listUnscheduledJobs(),
    listCustomerOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Kalendarz"
        subtitle="Zlecenia i terminy"
        action={<JobQuickAdd customers={customers} />}
      />

      <MonthCalendar month={month} jobs={jobs} customers={customers} />

      {unscheduled.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Bez terminu ({unscheduled.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {unscheduled.map((job) => (
              <li key={job.id}>
                <JobListItem job={job} showTime={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
