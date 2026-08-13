import { JOB_STATUS_CLASSES, jobStatusLabel, type JobStatus } from "@/lib/domain/dictionaries";
import { cn } from "@/lib/utils";

/** Kolorowa odznaka statusu zlecenia. */
export function JobStatusBadge({ status }: { status: string }) {
  const cls =
    (JOB_STATUS_CLASSES as Record<string, string>)[status] ?? "bg-surface-2 text-muted";
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        cls,
      )}
    >
      {jobStatusLabel(status as JobStatus)}
    </span>
  );
}
