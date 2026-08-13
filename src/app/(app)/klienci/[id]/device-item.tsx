"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Cpu, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { DeleteButton } from "@/components/ui/delete-button";
import { deviceTypeLabel, type DeviceType } from "@/lib/domain/dictionaries";
import { formatDatePl } from "@/lib/domain/dates";
import type { Device } from "@/lib/db/devices";
import { deleteDeviceAction, updateDeviceAction } from "../actions";
import { DeviceForm } from "./device-form";

function deviceTitle(d: Device): string {
  return [deviceTypeLabel(d.device_type), d.brand, d.model].filter(Boolean).join(" · ");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="tabular text-right text-sm">{value}</span>
    </div>
  );
}

/** Wiersz urządzenia + arkusz z podglądem, edycją i usuwaniem. */
export function DeviceItem({
  device,
  customerId,
}: {
  device: Device;
  customerId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  function close() {
    setOpen(false);
    setEditing(false);
  }

  const hasWarranty = Boolean(device.warranty_until);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-2 py-1.5 text-left"
      >
        <Cpu className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{deviceTitle(device)}</span>
          <span className="tabular block text-xs text-muted">
            {device.serial_number ? `S/N ${device.serial_number}` : "bez numeru"}
            {device.notes ? " · notatka" : ""}
          </span>
        </span>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
      </button>

      <Sheet
        open={open}
        onClose={close}
        title={editing ? "Edytuj urządzenie" : deviceTitle(device)}
      >
        {editing ? (
          <DeviceForm
            defaultValues={{
              siteId: device.site_id,
              deviceType: device.device_type as DeviceType,
              brand: device.brand ?? "",
              model: device.model ?? "",
              serialNumber: device.serial_number ?? "",
              installedOn: device.installed_on ?? "",
              warrantyUntil: device.warranty_until ?? "",
              notes: device.notes ?? "",
            }}
            submitLabel="Zapisz zmiany"
            action={(values) => updateDeviceAction({ ...values, id: device.id }, customerId)}
            onDone={() => {
              close();
              router.refresh();
            }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Row label="Typ" value={deviceTypeLabel(device.device_type)} />
              {device.brand ? <Row label="Marka" value={device.brand} /> : null}
              {device.model ? <Row label="Model" value={device.model} /> : null}
              {device.serial_number ? (
                <Row label="Numer seryjny" value={device.serial_number} />
              ) : null}
              {device.installed_on ? (
                <Row label="Montaż" value={formatDatePl(new Date(device.installed_on))} />
              ) : null}
              {hasWarranty ? (
                <Row
                  label="Gwarancja do"
                  value={formatDatePl(new Date(device.warranty_until as string))}
                />
              ) : null}
            </div>

            {device.notes ? (
              <div>
                <p className="mb-1 text-sm text-muted">Notatka</p>
                <p className="whitespace-pre-wrap rounded-app border border-border bg-surface-2 px-3 py-2 text-sm">
                  {device.notes}
                </p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" aria-hidden />
                Edytuj
              </Button>
              <DeleteButton
                title="Usunąć urządzenie?"
                description="Urządzenie trafi do kosza (kasowanie miękkie)."
                triggerLabel="Usuń"
                triggerClassName="flex-1 border border-danger/40 bg-danger/5 text-danger"
                onConfirm={() => deleteDeviceAction(device.id, customerId)}
                onDeleted={() => {
                  close();
                  router.refresh();
                }}
              />
            </div>
          </div>
        )}
      </Sheet>
    </li>
  );
}
