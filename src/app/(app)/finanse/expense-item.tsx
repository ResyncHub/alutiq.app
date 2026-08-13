"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { DeleteButton } from "@/components/ui/delete-button";
import { expenseCategoryLabel, type ExpenseCategory } from "@/lib/domain/dictionaries";
import { formatDatePl } from "@/lib/domain/dates";
import { formatPln } from "@/lib/domain/money";
import type { ExpenseWithJob } from "@/lib/db/finance";
import { deleteExpenseAction, updateExpenseAction } from "./actions";
import { ExpenseForm, type JobOption } from "./expense-form";

function grToInput(gr: number): string {
  return (gr / 100).toFixed(2).replace(".", ",");
}

export function ExpenseItem({
  expense,
  jobs = [],
  hideJobSelect = false,
}: {
  expense: ExpenseWithJob;
  jobs?: JobOption[];
  hideJobSelect?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const meta = [
    formatDatePl(new Date(`${expense.spent_on}T12:00:00Z`)),
    expense.job?.title ?? undefined,
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
          <span className="block truncate font-medium">
            {expenseCategoryLabel(expense.category)}
          </span>
          <span className="block truncate text-xs text-muted">
            {meta}
            {expense.description ? ` · ${expense.description}` : ""}
          </span>
        </span>
        <span className="tabular shrink-0 font-semibold">
          {formatPln(expense.gross_gr)}
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Wydatek">
        <div className="flex flex-col gap-4">
          <ExpenseForm
            defaultValues={{
              amount: grToInput(expense.gross_gr),
              category: expense.category as ExpenseCategory,
              spentOn: expense.spent_on,
              description: expense.description ?? "",
              jobId: expense.job_id ?? "",
            }}
            jobs={jobs}
            hideJobSelect={hideJobSelect}
            submitLabel="Zapisz zmiany"
            action={(values) => updateExpenseAction({ ...values, id: expense.id })}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
          <DeleteButton
            title="Usunąć wydatek?"
            description="Wydatek trafi do kosza (kasowanie miękkie)."
            triggerLabel="Usuń wydatek"
            triggerClassName="w-full border border-danger/40 bg-danger/5 text-danger"
            onConfirm={() => deleteExpenseAction(expense.id)}
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
