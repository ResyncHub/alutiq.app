"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addSiteAction } from "../actions";
import { SiteForm } from "./site-form";

export function SiteQuickAdd({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="px-3">
        <Plus className="size-4" aria-hidden />
        Obiekt
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nowy obiekt">
        <SiteForm
          defaultValues={{
            customerId,
            label: "",
            address: "",
            city: "",
            postalCode: "",
            notes: "",
          }}
          submitLabel="Zapisz obiekt"
          action={(values) => addSiteAction(values)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}
