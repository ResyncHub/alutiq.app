"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addJobAction } from "./actions";
import { JobAddForm } from "./job-add-form";
import type { CustomerOption } from "./job-form";

export function JobQuickAdd({
  customers,
  defaultScheduledAt = "",
  defaultCustomerId,
  triggerLabel = "Dodaj zlecenie",
  variant = "primary",
  className,
}: {
  customers: CustomerOption[];
  defaultScheduledAt?: string;
  defaultCustomerId?: string;
  triggerLabel?: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        <Plus className="size-4" aria-hidden />
        {triggerLabel}
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nowe zlecenie">
        <JobAddForm
          defaultScheduledAt={defaultScheduledAt}
          defaultCustomerId={defaultCustomerId}
          customers={customers}
          action={(values) => addJobAction(values)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}
