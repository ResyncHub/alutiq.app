"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "@/lib/domain/dictionaries";
import { createDeviceSchema, type CreateDeviceValues } from "@/lib/validation/customer";

export type DeviceFormValues = z.input<typeof createDeviceSchema>;
type Result = { ok: true } | { ok: false; error: string };

const selectClass =
  "touch-target w-full rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent";

/** Wspólny formularz urządzenia — używany do dodawania i edycji. */
export function DeviceForm({
  defaultValues,
  submitLabel,
  action,
  onDone,
}: {
  defaultValues: DeviceFormValues;
  submitLabel: string;
  action: (values: CreateDeviceValues) => Promise<Result>;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<DeviceFormValues, unknown, CreateDeviceValues>({
    resolver: zodResolver(createDeviceSchema),
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
      <input type="hidden" {...form.register("siteId")} />
      <Field label="Typ" error={errors.deviceType?.message}>
        <select className={selectClass} {...form.register("deviceType")}>
          {DEVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {DEVICE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Marka" error={errors.brand?.message}>
            <TextInput {...form.register("brand")} autoComplete="off" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Model" error={errors.model?.message}>
            <TextInput {...form.register("model")} autoComplete="off" />
          </Field>
        </div>
      </div>
      <Field label="Numer seryjny" error={errors.serialNumber?.message}>
        <TextInput {...form.register("serialNumber")} autoComplete="off" />
      </Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Montaż" error={errors.installedOn?.message}>
            <TextInput type="date" {...form.register("installedOn")} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Gwarancja do" error={errors.warrantyUntil?.message}>
            <TextInput type="date" {...form.register("warrantyUntil")} />
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
