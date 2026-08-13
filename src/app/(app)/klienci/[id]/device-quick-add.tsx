"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addDeviceAction } from "../actions";
import { DeviceForm } from "./device-form";

export function DeviceQuickAdd({
  siteId,
  customerId,
}: {
  siteId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="px-2 text-sm text-accent"
      >
        <Plus className="size-4" aria-hidden />
        Urządzenie
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nowe urządzenie">
        <DeviceForm
          defaultValues={{
            siteId,
            deviceType: "gate",
            brand: "",
            model: "",
            serialNumber: "",
            installedOn: "",
            warrantyUntil: "",
            notes: "",
          }}
          submitLabel="Zapisz urządzenie"
          action={(values) => addDeviceAction(values, customerId)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}
