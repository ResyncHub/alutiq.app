"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { createSiteSchema, type CreateSiteValues } from "@/lib/validation/customer";

export type SiteFormValues = z.input<typeof createSiteSchema>;
type Result = { ok: true } | { ok: false; error: string };

/** Wspólny formularz obiektu — używany do dodawania i edycji. */
export function SiteForm({
  defaultValues,
  submitLabel,
  action,
  onDone,
}: {
  defaultValues: SiteFormValues;
  submitLabel: string;
  action: (values: CreateSiteValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<SiteFormValues, unknown, CreateSiteValues>({
    resolver: zodResolver(createSiteSchema),
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
      <input type="hidden" {...form.register("customerId")} />
      <Field
        label="Nazwa obiektu"
        hint={'Np. „Dom”, „Zakład”. Opcjonalne, jeśli podasz adres.'}
        error={errors.label?.message}
      >
        <TextInput {...form.register("label")} autoComplete="off" />
      </Field>
      <Field label="Ulica i numer" error={errors.address?.message}>
        <TextInput {...form.register("address")} autoComplete="off" />
      </Field>
      <div className="flex gap-3">
        <div className="w-28">
          <Field label="Kod" error={errors.postalCode?.message}>
            <TextInput {...form.register("postalCode")} autoComplete="off" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Miejscowość" error={errors.city?.message}>
            <TextInput {...form.register("city")} autoComplete="off" />
          </Field>
        </div>
      </div>
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
