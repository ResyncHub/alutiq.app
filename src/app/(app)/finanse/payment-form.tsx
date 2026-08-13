"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { createPaymentSchema, type CreatePaymentValues } from "@/lib/validation/finance";
import type { JobOption } from "./expense-form";

type FormValues = z.input<typeof createPaymentSchema>;
type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent";

export function PaymentForm({
  defaultValues,
  jobs = [],
  hideJobSelect = false,
  submitLabel,
  action,
  onDone,
}: {
  defaultValues: FormValues;
  jobs?: JobOption[];
  hideJobSelect?: boolean;
  submitLabel: string;
  action: (values: CreatePaymentValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FormValues, unknown, CreatePaymentValues>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues,
  });
  const { errors, isSubmitting } = form.formState;

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
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Kwota (zł)" error={errors.amount?.message}>
            <TextInput
              inputMode="decimal"
              placeholder="0,00"
              {...form.register("amount")}
              autoComplete="off"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Data" error={errors.paidOn?.message}>
            <TextInput type="date" {...form.register("paidOn")} />
          </Field>
        </div>
      </div>

      {hideJobSelect ? (
        <input type="hidden" {...form.register("jobId")} />
      ) : (
        <Field label="Zlecenie (opcjonalnie)" error={errors.jobId?.message}>
          <select className={selectClass} {...form.register("jobId")}>
            <option value="">— bez zlecenia —</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Opis" error={errors.description?.message}>
        <TextArea {...form.register("description")} />
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
