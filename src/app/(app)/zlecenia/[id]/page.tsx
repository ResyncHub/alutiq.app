import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Phone, User } from "lucide-react";
import { formatDateTimePl } from "@/lib/domain/dates";
import { getJob } from "@/lib/db/jobs";
import { listPhotosForJob } from "@/lib/db/photos";
import { listCustomerOptions } from "@/lib/db/customers";
import { JobStatusBadge } from "@/components/job-status-badge";
import { jobTitle } from "../job-list-item";
import { JobActions } from "./job-actions";
import { NoteEditor } from "./note-editor";
import { PhotoSection } from "./photo-section";

function siteLine(site: NonNullable<Awaited<ReturnType<typeof getJob>>>["site"]): string | null {
  if (!site) return null;
  const parts = [site.label, site.address, [site.postal_code, site.city].filter(Boolean).join(" ")]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function JobDetailPage({ params }: PageProps<"/zlecenia/[id]">) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const [customers, photos] = await Promise.all([
    listCustomerOptions(),
    listPhotosForJob(id),
  ]);
  const site = siteLine(job.site);

  return (
    <>
      <Link
        href="/kalendarz"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kalendarz
      </Link>

      <div className="mb-4 flex items-start gap-2">
        <h1 className="flex-1 text-xl font-semibold tracking-tight">{jobTitle(job)}</h1>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="mb-5 flex flex-col gap-2 rounded-app border border-border bg-surface p-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0 text-muted" aria-hidden />
          <span className={job.scheduled_at ? "tabular" : "text-muted"}>
            {job.scheduled_at
              ? formatDateTimePl(new Date(job.scheduled_at))
              : "Bez terminu"}
          </span>
        </div>

        {job.customer ? (
          <Link
            href={`/klienci/${job.customer.id}`}
            className="flex items-center gap-2 hover:text-accent"
          >
            <User className="size-4 shrink-0 text-muted" aria-hidden />
            <span>{job.customer.name || job.customer.phone || "Klient"}</span>
          </Link>
        ) : null}

        {job.phone ? (
          <a href={`tel:${job.phone}`} className="flex items-center gap-2 hover:text-accent">
            <Phone className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="tabular">{job.phone}</span>
          </a>
        ) : null}

        {job.address || site ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <span>{job.address || site}</span>
          </div>
        ) : null}
      </div>

      <JobActions job={job} customers={customers} />

      <div className="mt-6">
        <NoteEditor jobId={job.id} initialNotes={job.notes} />
        <PhotoSection jobId={job.id} photos={photos} />
      </div>
    </>
  );
}
