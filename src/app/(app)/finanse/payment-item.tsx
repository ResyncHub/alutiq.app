"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatDatePl } from "@/lib/domain/dates";
import { formatPln } from "@/lib/domain/money";
import type { PaymentWithJob } from "@/lib/db/finance";
import { deletePaymentAction, updatePaymentAction } from "./actions";
import { PaymentForm } from "./payment-form";
import type { JobOption } from "./expense-form";

function grToInput(gr: number): string {
  return (gr / 100).toFixed(2).replace(".", ",");
}

export function PaymentItem({
  payment,
  jobs = [],
  hideJobSelect = false,
}: {
  payment: PaymentWithJob;
  jobs?: JobOption[];
  hideJobSelect?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const meta = [
    formatDatePl(new Date(`${payment.paid_on}T12:00:00Z`)),
    payment.job?.title ?? undefined,
    payment.description ?? undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-app border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">Wpłata</span>
          <span className="block truncate text-xs text-muted">{meta}</span>
        </span>
        <span className="tabular shrink-0 font-semibold text-success">
          {formatPln(payment.amount_gr)}
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Wpłata">
        <div className="flex flex-col gap-4">
          <PaymentForm
            defaultValues={{
              amount: grToInput(payment.amount_gr),
              paidOn: payment.paid_on,
              description: payment.description ?? "",
              jobId: payment.job_id ?? "",
            }}
            jobs={jobs}
            hideJobSelect={hideJobSelect}
            submitLabel="Zapisz zmiany"
            action={(values) => updatePaymentAction({ ...values, id: payment.id })}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
          <DeleteButton
            title="Usunąć wpłatę?"
            description="Wpłata trafi do kosza (kasowanie miękkie)."
            triggerLabel="Usuń wpłatę"
            triggerClassName="w-full border border-danger/40 bg-danger/5 text-danger"
            onConfirm={() => deletePaymentAction(payment.id)}
            onDeleted={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      </Sheet>
    </li>
  );
}
