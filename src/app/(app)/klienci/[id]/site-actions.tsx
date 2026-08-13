"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { DeleteButton } from "@/components/ui/delete-button";
import type { Site } from "@/lib/db/sites";
import { deleteSiteAction, updateSiteAction } from "../actions";
import { SiteForm } from "./site-form";

/** Edycja i usuwanie pojedynczego obiektu. */
export function SiteActions({ site }: { site: Site }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        variant="ghost"
        className="px-2"
        aria-label="Edytuj obiekt"
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>

      <DeleteButton
        title="Usunąć obiekt?"
        description="Obiekt trafi do kosza (kasowanie miękkie). Urządzenia z tego obiektu pozostaną w bazie."
        onConfirm={() => deleteSiteAction(site.id, site.customer_id)}
        onDeleted={() => router.refresh()}
      />

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edytuj obiekt">
        <SiteForm
          defaultValues={{
            customerId: site.customer_id,
            label: site.label ?? "",
            address: site.address ?? "",
            city: site.city ?? "",
            postalCode: site.postal_code ?? "",
            notes: site.notes ?? "",
          }}
          submitLabel="Zapisz zmiany"
          action={(values) => updateSiteAction({ ...values, id: site.id })}
          onDone={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}
