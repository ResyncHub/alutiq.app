"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { DeleteButton } from "@/components/ui/delete-button";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/domain/dictionaries";
import { utcToWarsawLocalInput } from "@/lib/domain/dates";
import type { JobDetail } from "@/lib/db/jobs";
import {
  deleteJobAction,
  setJobScheduleAction,
  setJobStatusAction,
  updateJobAction,
} from "../actions";
import { JobForm, type CustomerOption } from "../job-form";

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export function JobActions({
  job,
  customers,
}: {
  job: JobDetail;
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [status, setStatus] = useState(job.status);
  const [statusError, setStatusError] = useState<string | null>(null);

  const savedSchedule = job.scheduled_at ? utcToWarsawLocalInput(job.scheduled_at) : "";
  const [schedule, setSchedule] = useState(savedSchedule);
  const [scheduleSaved, setScheduleSaved] = useState(savedSchedule);
  const [schedulePending, setSchedulePending] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  async function onStatusChange(next: string) {
    setStatusError(null);
    const prev = status;
    setStatus(next);
    const res = await setJobStatusAction(job.id, next);
    if (!res.ok) {
      setStatus(prev);
      setStatusError(res.error);
      return;
    }
    router.refresh();
  }

  async function onScheduleSave() {
    setScheduleError(null);
    setSchedulePending(true);
    const res = await setJobScheduleAction(job.id, schedule);
    setSchedulePending(false);
    if (!res.ok) {
      setScheduleError(res.error);
      return;
    }
    setScheduleSaved(schedule);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-muted">Status</span>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1 pt-5">
          <Button
            variant="ghost"
            className="px-2"
            aria-label="Edytuj zlecenie"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <DeleteButton
            title="Usunąć zlecenie?"
            description="Zlecenie trafi do kosza (kasowanie miękkie)."
            onConfirm={() => deleteJobAction(job.id)}
            onDeleted={() => router.push("/kalendarz")}
          />
        </div>
      </div>

      {statusError ? (
        <p className="text-sm text-danger" role="alert">
          {statusError}
        </p>
      ) : null}

      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-muted">Termin</span>
          <TextInput
            type="datetime-local"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </label>
        {schedule !== scheduleSaved ? (
          <Button onClick={onScheduleSave} disabled={schedulePending} className="px-3">
            {schedulePending ? "Zapisywanie…" : "Zapisz"}
          </Button>
        ) : null}
      </div>
      {schedule !== scheduleSaved ? (
        <p className="-mt-1 text-xs text-muted">
          {schedule ? "Nowy termin — zapisz, żeby przenieść zlecenie." : "Termin zostanie usunięty (bez terminu)."}
        </p>
      ) : null}
      {scheduleError ? (
        <p className="text-sm text-danger" role="alert">
          {scheduleError}
        </p>
      ) : null}

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edytuj zlecenie">
        <JobForm
          defaultValues={{
            customerId: job.customer_id ?? "",
            siteId: job.site_id ?? "",
            title: job.title ?? "",
            notes: job.notes ?? "",
            phone: job.phone ?? "",
            address: job.address ?? "",
            status: job.status as (typeof JOB_STATUSES)[number],
            scheduledAt: job.scheduled_at
              ? utcToWarsawLocalInput(job.scheduled_at)
              : "",
          }}
          customers={customers}
          submitLabel="Zapisz zmiany"
          action={(values) => updateJobAction({ ...values, id: job.id })}
          onDone={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}
