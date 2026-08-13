import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobStatus,
} from "@/lib/domain/dictionaries";
import { cn } from "@/lib/utils";
import { getJobStatusCounts, listAllJobs } from "@/lib/db/jobs";
import { listCustomerOptions } from "@/lib/db/customers";
import { JobListItem } from "./job-list-item";
import { JobQuickAdd } from "./job-quick-add";

function isJobStatus(v: string | undefined): v is JobStatus {
  return !!v && (JOB_STATUSES as readonly string[]).includes(v);
}

export default async function JobsPage({ searchParams }: PageProps<"/zlecenia">) {
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : undefined;
  const status = isJobStatus(raw) ? raw : undefined;

  const [counts, jobs, customers] = await Promise.all([
    getJobStatusCounts(),
    listAllJobs(status),
    listCustomerOptions(),
  ]);

  const tiles = [
    { key: undefined as JobStatus | undefined, label: "Wszystkie", count: counts.total },
    ...JOB_STATUSES.map((s) => ({
      key: s as JobStatus | undefined,
      label: JOB_STATUS_LABELS[s],
      count: counts.byStatus[s] ?? 0,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Zlecenia"
        subtitle="Wszystkie zlecenia i statystyki"
        action={<JobQuickAdd customers={customers} />}
      />

      {/* Statystyki = zarazem filtr etapów */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((t) => {
          const active = t.key === status;
          const href = t.key ? `/zlecenia?status=${t.key}` : "/zlecenia";
          return (
            <Link
              key={t.label}
              href={href}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex flex-col rounded-app border px-3 py-2 transition-colors",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent",
              )}
            >
              <span className="tabular text-2xl font-semibold">{t.count}</span>
              <span className="text-xs text-muted">{t.label}</span>
            </Link>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title={status ? "Brak zleceń na tym etapie" : "Brak zleceń"}
          description={
            status
              ? "Zmień filtr powyżej lub dodaj nowe zlecenie."
              : "Dodaj pierwsze zlecenie — z kalendarza lub stąd."
          }
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
