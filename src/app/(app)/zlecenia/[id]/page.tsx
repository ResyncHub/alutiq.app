import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Phone, User } from "lucide-react";
import { formatDateTimePl } from "@/lib/domain/dates";
import { formatPln, sumGr } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import { getJob } from "@/lib/db/jobs";
import { listPhotosForJob } from "@/lib/db/photos";
import { listCustomerOptions } from "@/lib/db/customers";
import { listExpensesForJob, listPaymentsForJob } from "@/lib/db/finance";
import { JobStatusBadge } from "@/components/job-status-badge";
import { jobTitle } from "../job-list-item";
import { JobActions } from "./job-actions";
import { NoteEditor } from "./note-editor";
import { PhotoSection } from "./photo-section";
import { ExpenseItem } from "../../finanse/expense-item";
import { PaymentItem } from "../../finanse/payment-item";
import { ExpenseQuickAdd, PaymentQuickAdd } from "../../finanse/finance-quick-add";

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

  const [customers, photos, jobExpenses, jobPayments] = await Promise.all([
    listCustomerOptions(),
    listPhotosForJob(id),
    listExpensesForJob(id),
    listPaymentsForJob(id),
  ]);
  const site = siteLine(job.site);

  const incomeGr = sumGr(jobPayments.map((p) => p.amount_gr));
  const costGr = sumGr(jobExpenses.map((e) => e.gross_gr));
  const profitGr = incomeGr - costGr;

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

      {/* Rozliczenie zlecenia */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Rozliczenie
        </h2>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-app border border-border bg-surface px-3 py-2">
            <span className="tabular block text-lg font-semibold text-success">
              {formatPln(incomeGr)}
            </span>
            <span className="text-xs text-muted">Przychód</span>
          </div>
          <div className="rounded-app border border-border bg-surface px-3 py-2">
            <span className="tabular block text-lg font-semibold">{formatPln(costGr)}</span>
            <span className="text-xs text-muted">Koszty</span>
          </div>
          <div className="rounded-app border border-border bg-surface px-3 py-2">
            <span
              className={cn(
                "tabular block text-lg font-semibold",
                profitGr >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatPln(profitGr)}
            </span>
            <span className="text-xs text-muted">Zysk</span>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Wpłaty {jobPayments.length > 0 ? `(${jobPayments.length})` : ""}
          </h3>
          <PaymentQuickAdd defaultJobId={job.id} hideJobSelect triggerLabel="Wpłata" />
        </div>
        {jobPayments.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2">
            {jobPayments.map((p) => (
              <PaymentItem key={p.id} payment={p} hideJobSelect />
            ))}
          </ul>
        ) : (
          <p className="mb-4 rounded-app border border-dashed border-border bg-surface/50 px-4 py-4 text-center text-sm text-muted">
            Brak wpłat.
          </p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Koszty {jobExpenses.length > 0 ? `(${jobExpenses.length})` : ""}
          </h3>
          <ExpenseQuickAdd defaultJobId={job.id} hideJobSelect />
        </div>
        {jobExpenses.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {jobExpenses.map((e) => (
              <ExpenseItem key={e.id} expense={e} hideJobSelect />
            ))}
          </ul>
        ) : (
          <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-4 text-center text-sm text-muted">
            Brak kosztów.
          </p>
        )}
      </section>

      <div className="mt-6">
        <NoteEditor jobId={job.id} initialNotes={job.notes} />
        <PhotoSection jobId={job.id} photos={photos} />
      </div>
    </>
  );
}
