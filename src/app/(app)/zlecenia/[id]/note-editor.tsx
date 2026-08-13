"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/field";
import { setJobNotesAction } from "../actions";

/** Notatka zlecenia — podgląd + edycja w miejscu, na każdym etapie. */
export function NoteEditor({
  jobId,
  initialNotes,
}: {
  jobId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(notes);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setPending(true);
    setError(null);
    const res = await setJobNotesAction({ id: jobId, notes: draft });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotes(draft.trim());
    setEditing(false);
    router.refresh();
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Notatka
        </h2>
        {!editing ? (
          <Button variant="ghost" className="px-2 text-sm" onClick={startEdit}>
            <Pencil className="size-4" aria-hidden />
            {notes ? "Edytuj" : "Dodaj"}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            placeholder="Co trzeba zapamiętać przy tym zleceniu…"
          />
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(false)}
              disabled={pending}
            >
              Anuluj
            </Button>
            <Button className="flex-1" onClick={save} disabled={pending}>
              {pending ? "Zapisywanie…" : "Zapisz notatkę"}
            </Button>
          </div>
        </div>
      ) : notes ? (
        <p className="whitespace-pre-wrap rounded-app border border-border bg-surface px-4 py-3 text-sm">
          {notes}
        </p>
      ) : (
        <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-4 text-center text-sm text-muted">
          Brak notatki.
        </p>
      )}
    </section>
  );
}
