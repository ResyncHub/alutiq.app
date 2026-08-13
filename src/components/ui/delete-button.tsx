"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./button";
import { Sheet } from "./sheet";

type Result = { ok: true } | { ok: false; error: string };

/** Przycisk usuwania z arkuszem potwierdzenia. Enkapsuluje stan i błędy. */
export function DeleteButton({
  title,
  description,
  confirmLabel = "Usuń",
  triggerLabel,
  triggerClassName,
  onConfirm,
  onDeleted,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  /** Tekst obok ikony; brak = sam przycisk-ikona. */
  triggerLabel?: string;
  triggerClassName?: string;
  onConfirm: () => Promise<Result>;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setPending(true);
    const res = await onConfirm();
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    onDeleted();
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel ?? title}
        className={triggerClassName ?? "px-2 text-danger"}
      >
        <Trash2 className="size-4" aria-hidden />
        {triggerLabel}
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{description}</p>
          {error ? (
            <p
              className="rounded-app border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "Usuwanie…" : confirmLabel}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
