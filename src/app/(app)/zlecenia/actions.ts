"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { JOB_STATUSES } from "@/lib/domain/dictionaries";
import { addJobFormSchema, updateJobSchema } from "@/lib/validation/job";
import { jobNotesSchema, uploadPhotoSchema } from "@/lib/validation/photo";
import {
  createJob,
  softDeleteJob,
  updateJob,
  updateJobNotes,
  updateJobStatus,
} from "@/lib/db/jobs";
import { findOrCreateCustomer } from "@/lib/db/customers";
import { deletePhoto, uploadPhoto } from "@/lib/db/photos";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toMessage(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Dane są nieprawidłowe.";
  if (e instanceof Error) return e.message;
  return "Wystąpił nieoczekiwany błąd.";
}

/** Odświeża widoki, na których widać zlecenia. */
function revalidateJobViews(id?: string) {
  revalidatePath("/kalendarz");
  revalidatePath("/"); // pulpit „Dziś"
  if (id) revalidatePath(`/zlecenia/${id}`);
}

/**
 * Dodanie zlecenia z ewentualnym utworzeniem klienta „w locie".
 * Nowy klient: jeśli numer już istnieje w bazie — podpinamy istniejącego.
 */
export async function addJobAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const v = addJobFormSchema.parse(input);

    let customerId: string | null = null;
    if (v.customerMode === "existing") {
      customerId = v.customerId;
    } else if (v.newCustomerName || v.newCustomerPhone) {
      customerId = await findOrCreateCustomer({
        name: v.newCustomerName,
        phone: v.newCustomerPhone,
      });
    }

    const job = await createJob({
      customerId,
      siteId: null,
      title: v.title,
      notes: v.notes,
      phone: null,
      address: v.address,
      status: v.status,
      scheduledAt: v.scheduledAt,
    });
    revalidateJobViews(job.id);
    return { ok: true, data: { id: job.id } };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Edycja zlecenia. */
export async function updateJobAction(input: unknown): Promise<ActionResult> {
  try {
    const values = updateJobSchema.parse(input);
    await updateJob(values);
    revalidateJobViews(values.id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Szybka zmiana statusu zlecenia. */
export async function setJobStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    z.enum(JOB_STATUSES).parse(status);
    await updateJobStatus({ id, status });
    revalidateJobViews(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Miękkie usunięcie zlecenia. */
export async function deleteJobAction(id: string): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeleteJob(id);
    revalidateJobViews(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Zapis notatki zlecenia (edytowalna na każdym etapie). */
export async function setJobNotesAction(input: unknown): Promise<ActionResult> {
  try {
    const { id, notes } = jobNotesSchema.parse(input);
    await updateJobNotes(id, notes);
    revalidatePath(`/zlecenia/${id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Upload zdjęcia (skompresowanego w przeglądarce) do zlecenia. */
export async function uploadPhotoAction(formData: FormData): Promise<ActionResult> {
  try {
    const jobId = String(formData.get("jobId") ?? "");
    const descriptionRaw = formData.get("description");
    const description =
      typeof descriptionRaw === "string" && descriptionRaw.trim().length > 0
        ? descriptionRaw.trim()
        : null;
    uploadPhotoSchema.parse({ jobId, description });

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Brak pliku zdjęcia.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Zdjęcie jest za duże.");
    }

    await uploadPhoto({ jobId, description, bytes: await file.arrayBuffer() });
    revalidatePath(`/zlecenia/${jobId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Usunięcie zdjęcia (twarde). `jobId` do odświeżenia widoku. */
export async function deletePhotoAction(
  id: string,
  jobId: string,
): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await deletePhoto(id);
    revalidatePath(`/zlecenia/${jobId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}
