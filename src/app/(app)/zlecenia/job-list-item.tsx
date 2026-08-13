import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { formatTimePl } from "@/lib/domain/dates";
import { JobStatusBadge } from "@/components/job-status-badge";
import type { JobWithCustomer } from "@/lib/db/jobs";

/** Główny podpis zlecenia — pierwsze, co jest wypełnione. */
export function jobTitle(job: JobWithCustomer): string {
  return (
    job.title ||
    job.customer?.name ||
    job.customer?.phone ||
    job.phone ||
    job.address ||
    "Zlecenie"
  );
}

/** Drugi wiersz — kontekst (klient / adres), jeśli różny od tytułu. */
function jobSubtitle(job: JobWithCustomer): string | null {
  const parts: string[] = [];
  if (job.title && job.customer?.name) parts.push(job.customer.name);
  if (job.address) parts.push(job.address);
  else if (!job.customer?.name && job.phone && job.title) parts.push(job.phone);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Wiersz zlecenia z linkiem do szczegółów. */
export function JobListItem({
  job,
  showTime = true,
}: {
  job: JobWithCustomer;
  showTime?: boolean;
}) {
  const subtitle = jobSubtitle(job);
  return (
    <Link
      href={`/zlecenia/${job.id}`}
      className="flex items-center gap-3 rounded-app border border-border bg-surface px-3 py-2.5 transition-colors hover:border-accent"
    >
      {showTime && job.scheduled_at ? (
        <span className="tabular flex w-12 shrink-0 flex-col items-center text-accent">
          <Clock className="size-3.5" aria-hidden />
          <span className="text-xs font-semibold">
            {formatTimePl(new Date(job.scheduled_at))}
          </span>
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{jobTitle(job)}</span>
          <JobStatusBadge status={job.status} />
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-sm text-muted">{subtitle}</span>
        ) : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
