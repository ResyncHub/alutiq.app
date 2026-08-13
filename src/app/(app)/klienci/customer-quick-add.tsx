"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CUSTOMER_KINDS, CUSTOMER_KIND_LABELS } from "@/lib/domain/dictionaries";
import {
  quickAddCustomerSchema,
  type QuickAddCustomerInput,
  type QuickAddCustomerValues,
} from "@/lib/validation/customer";
import { addCustomerAction } from "./actions";

const DEFAULTS: QuickAddCustomerInput = {
  kind: "person",
  name: "",
  phone: "",
  email: "",
  notes: "",
  address: "",
  city: "",
  postalCode: "",
};

export function CustomerQuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<QuickAddCustomerInput, unknown, QuickAddCustomerValues>({
    resolver: zodResolver(quickAddCustomerSchema),
    defaultValues: DEFAULTS,
  });

  const kind = useWatch({ control: form.control, name: "kind" });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async () => {
    setServerError(null);
    const res = await addCustomerAction(form.getValues());
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    form.reset(DEFAULTS);
    setOpen(false);
    router.push(`/klienci/${res.data.id}`);
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Dodaj klienta
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nowy klient">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {/* Osoba / firma */}
          <div className="flex gap-2">
            {CUSTOMER_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => form.setValue("kind", k)}
                className={cn(
                  "touch-target flex-1 rounded-app border text-sm font-medium transition-colors",
                  kind === k
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {CUSTOMER_KIND_LABELS[k]}
              </button>
            ))}
          </div>

          <Field
            label={kind === "company" ? "Nazwa firmy" : "Imię i nazwisko"}
            error={errors.name?.message}
            hint="Opcjonalne — wystarczy telefon lub adres."
          >
            <TextInput {...form.register("name")} autoComplete="off" />
          </Field>

          <Field label="Telefon" error={errors.phone?.message}>
            <TextInput type="tel" inputMode="tel" {...form.register("phone")} />
          </Field>

          <Field label="E-mail" error={errors.email?.message}>
            <TextInput type="email" inputMode="email" {...form.register("email")} />
          </Field>

          <div className="mt-1 border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Adres (opcjonalnie)
            </p>
            <div className="flex flex-col gap-3">
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
            {isSubmitting ? "Zapisywanie…" : "Zapisz klienta"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
