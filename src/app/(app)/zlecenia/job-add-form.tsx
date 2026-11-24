"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/domain/dictionaries";
import type { SiteOption } from "@/lib/db/sites";
import { addJobFormSchema, type AddJobFormValues } from "@/lib/validation/job";
import type { CustomerOption } from "./job-form";

type FormValues = z.input<typeof addJobFormSchema>;
type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent";

export function JobAddForm({
  defaultScheduledAt,
  defaultCustomerId,
  customers,
  sites,
  action,
  onDone,
}: {
  defaultScheduledAt: string;
  defaultCustomerId?: string;
  customers: CustomerOption[];
  sites: SiteOption[];
  action: (values: AddJobFormValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FormValues, unknown, AddJobFormValues>({
    resolver: zodResolver(addJobFormSchema),
    defaultValues: {
      // Z karty klienta zaczynamy od trybu „z bazy" z podpiętym klientem.
      customerMode: defaultCustomerId ? "existing" : "new",
      customerId: defaultCustomerId ?? "",
      siteId: "",
      newCustomerName: "",
      newCustomerPhone: "",
      title: "",
      notes: "",
      address: "",
      status: "new",
      scheduledAt: defaultScheduledAt,
      scheduledUntil: "",
    },
  });
  const [mode, selectedCustomerId, selectedSiteId] = useWatch({
    control: form.control,
    name: ["customerMode", "customerId", "siteId"],
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
      {/* Klient: nowy albo z bazy */}
      <div>
        <div className="mb-2 flex gap-2">
          {(["new", "existing"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                form.setValue("customerMode", m);
                form.setValue("siteId", "");
              }}
              className={cn(
                "touch-target flex-1 rounded-app border text-sm font-medium transition-colors",
                mode === m
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {m === "new" ? "Nowy klient" : "Z bazy"}
            </button>
          ))}
        </div>

        {mode === "new" ? (
          <div className="flex flex-col gap-3">
            <Field
              label="Imię / nazwa"
              error={errors.newCustomerName?.message}
              hint="Nowy klient trafi do bazy. Jeśli numer już istnieje, podepniemy istniejącego."
            >
              <TextInput {...form.register("newCustomerName")} autoComplete="off" />
            </Field>
            <Field label="Telefon" error={errors.newCustomerPhone?.message}>
              <TextInput type="tel" inputMode="tel" {...form.register("newCustomerPhone")} />
            </Field>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Klient z bazy" error={errors.customerId?.message}>
              <select
                className={selectClass}
                {...form.register("customerId")}
                onChange={(e) => {
                  form.setValue("customerId", e.target.value);
                  form.setValue("siteId", "");
                }}
              >
                <option value="">— wybierz klienta —</option>
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
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3" />

      <Field label="Opis" error={errors.title?.message}>
        <TextInput
          {...form.register("title")}
          autoComplete="off"
          placeholder="np. wymiana napędu bramy"
        />
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field
            label="Termin"
            error={errors.scheduledAt?.message}
            hint="Zostaw puste, jeśli jeszcze nieumówione."
          >
            <TextInput type="datetime-local" {...form.register("scheduledAt")} />
          </Field>
        </div>
        <div className="w-32">
          <Field
            label="Do dnia"
            error={errors.scheduledUntil?.message}
            hint="Dla zlecenia na kilka dni."
          >
            <TextInput type="date" {...form.register("scheduledUntil")} />
          </Field>
        </div>
      </div>

      <Field label="Status" error={errors.status?.message}>
        <select className={selectClass} {...form.register("status")}>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      {!selectedSiteId ? (
        <Field
          label="Adres"
          error={errors.address?.message}
          hint="Gdy zlecenie nie jest podpięte pod obiekt klienta."
        >
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
        {isSubmitting ? "Zapisywanie…" : "Zapisz zlecenie"}
      </Button>
    </form>
  );
}
