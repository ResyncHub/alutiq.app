"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { todayInWarsaw } from "@/lib/domain/dates";
import { addExpenseAction, addPaymentAction } from "./actions";
import { ExpenseForm, type JobOption } from "./expense-form";
import { PaymentForm } from "./payment-form";

export function ExpenseQuickAdd({
  jobs = [],
  defaultJobId,
  hideJobSelect = false,
}: {
  jobs?: JobOption[];
  defaultJobId?: string;
  hideJobSelect?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="px-3" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Wydatek
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nowy wydatek">
        <ExpenseForm
          defaultValues={{
            amount: "",
            category: "material_parts",
            spentOn: todayInWarsaw(),
            description: "",
            jobId: defaultJobId ?? "",
          }}
          jobs={jobs}
          hideJobSelect={hideJobSelect}
          submitLabel="Zapisz wydatek"
          action={(values) => addExpenseAction(values)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}

export function PaymentQuickAdd({
  jobs = [],
  defaultJobId,
  hideJobSelect = false,
  triggerLabel = "Wpłata",
}: {
  jobs?: JobOption[];
  defaultJobId?: string;
  hideJobSelect?: boolean;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="px-3" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {triggerLabel}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nowa wpłata">
        <PaymentForm
          defaultValues={{
            amount: "",
            paidOn: todayInWarsaw(),
            description: "",
            jobId: defaultJobId ?? "",
          }}
          jobs={jobs}
          hideJobSelect={hideJobSelect}
          submitLabel="Zapisz wpłatę"
          action={(values) => addPaymentAction(values)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}
