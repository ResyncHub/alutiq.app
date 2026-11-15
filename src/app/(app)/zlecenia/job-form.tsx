"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/domain/dictionaries";
import type { SiteOption } from "@/lib/db/sites";
import { createJobSchema, type CreateJobValues } from "@/lib/validation/job";

export type JobFormValues = z.input<typeof createJobSchema>;
export type CustomerOption = { id: string; label: string };
type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent";

/** Wspólny formularz zlecenia — dodawanie i edycja. */
export function JobForm({
  defaultValues,
  customers,
  sites,
  submitLabel,
  action,
  onDone,
}: {
  defaultValues: JobFormValues;
  customers: CustomerOption[];
  sites: SiteOption[];
  submitLabel: string;
  action: (values: CreateJobValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<JobFormValues, unknown, CreateJobValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues,
  });
  const [selectedCustomerId, selectedSiteId] = useWatch({
    control: form.control,
    name: ["customerId", "siteId"],
  });
  const { errors, isSubmitting } = form.formState;

  const customerSites = sites.filter((s) => s.customerId === selectedCustomerId);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const res = await action(values);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field label="Klient" error={errors.customerId?.message}>
        <select
          className={selectClass}
          {...form.register("customerId")}
          onChange={(e) => {
            form.setValue("customerId", e.target.value);
            form.setValue("siteId", "");
          }}
        >
          <option value="">— bez klienta —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {customerSites.length > 0 ? (
        <Field label="Obiekt klienta" error={errors.siteId?.message}>
          <select className={selectClass} {...form.register("siteId")}>
            <option value="">— wpisz adres ręcznie —</option>
            {customerSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" {...form.register("siteId")} />
      )}

      <Field label="Opis" error={errors.title?.message}>
        <TextInput
          {...form.register("title")}
          autoComplete="off"
          placeholder="np. wymiana napędu bramy"
        />
      </Field>

      <Field label="Termin" error={errors.scheduledAt?.message} hint="Zostaw puste, jeśli jeszcze nieumówione.">
        <TextInput type="datetime-local" {...form.register("scheduledAt")} />
      </Field>

      <Field label="Status" error={errors.status?.message}>
        <select className={selectClass} {...form.register("status")}>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Telefon" error={errors.phone?.message}>
            <TextInput type="tel" inputMode="tel" {...form.register("phone")} />
          </Field>
        </div>
      </div>

      {!selectedSiteId ? (
        <Field label="Adres" error={errors.address?.message} hint="Gdy zlecenie nie jest podpięte pod obiekt klienta.">
          <TextInput {...form.register("address")} autoComplete="off" />
        </Field>
      ) : null}

      <Field label="Notatka" error={errors.notes?.message}>
        <TextArea {...form.register("notes")} />
      </Field>

      {serverError ? (
        <p
          className="rounded-app border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting ? "Zapisywanie…" : submitLabel}
      </Button>
    </form>
  );
}
