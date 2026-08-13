"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/domain/dictionaries";
import { createExpenseSchema, type CreateExpenseValues } from "@/lib/validation/finance";

export type JobOption = { id: string; label: string };
type FormValues = z.input<typeof createExpenseSchema>;
type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent";

export function ExpenseForm({
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
  action: (values: CreateExpenseValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FormValues, unknown, CreateExpenseValues>({
    resolver: zodResolver(createExpenseSchema),
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
          <Field label="Data" error={errors.spentOn?.message}>
            <TextInput type="date" {...form.register("spentOn")} />
          </Field>
        </div>
      </div>

      <Field label="Kategoria" error={errors.category?.message}>
        <select className={selectClass} {...form.register("category")}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>

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
