"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CUSTOMER_KINDS, CUSTOMER_KIND_LABELS } from "@/lib/domain/dictionaries";
import type { z } from "zod";
import { updateCustomerSchema, type UpdateCustomerValues } from "@/lib/validation/customer";
import type { Customer } from "@/lib/db/customers";
import { deleteCustomerAction, updateCustomerAction } from "../actions";

type FormValues = z.input<typeof updateCustomerSchema>;

export function CustomerActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormValues, unknown, UpdateCustomerValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      id: customer.id,
      kind: (customer.kind as FormValues["kind"]) ?? "person",
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      notes: customer.notes ?? "",
    },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async () => {
    setServerError(null);
    const res = await updateCustomerAction(form.getValues());
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  });

  async function onDelete() {
    setServerError(null);
    setDeleting(true);
    const res = await deleteCustomerAction(customer.id);
    setDeleting(false);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    router.push("/klienci");
  }

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        variant="ghost"
        aria-label="Edytuj klienta"
        onClick={() => setEditOpen(true)}
        className="px-2"
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        aria-label="Usuń klienta"
        onClick={() => setConfirmOpen(true)}
        className="px-2 text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>

      {/* Edycja */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edytuj klienta">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          >
            <TextInput {...form.register("name")} autoComplete="off" />
          </Field>
          <Field label="Telefon" error={errors.phone?.message}>
            <TextInput type="tel" inputMode="tel" {...form.register("phone")} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <TextInput type="email" inputMode="email" {...form.register("email")} />
          </Field>
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
            {isSubmitting ? "Zapisywanie…" : "Zapisz zmiany"}
          </Button>
        </form>
      </Sheet>

      {/* Potwierdzenie usunięcia */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Usunąć klienta?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Klient trafi do kosza (kasowanie miękkie). Powiązane obiekty i urządzenia
            pozostaną w bazie. Tej operacji nie cofniesz z poziomu aplikacji.
          </p>
          {serverError ? (
            <p
              className="rounded-app border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
              Anuluj
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={deleting} className="flex-1">
              {deleting ? "Usuwanie…" : "Usuń"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
