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
  updateJobAddress,
  updateJobNotes,
  updateJobSchedule,
  updateJobStatus,
} from "@/lib/db/jobs";
import { findOrCreateCustomer } from "@/lib/db/customers";
import { findOrCreateSiteByAddress } from "@/lib/db/sites";
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

    let siteId = v.customerMode === "existing" ? v.siteId : null;
    let address = v.address;

    // Adres wpisany ręcznie dla klienta z bazy -> zapisujemy jako jego obiekt,
    // żeby był do wyboru przy kolejnym zleceniu (bez ponownego wpisywania).
    if (!siteId && customerId && address) {
      siteId = await findOrCreateSiteByAddress({ customerId, address });
      address = null;
    }

    const job = await createJob({
      customerId,
      siteId,
      title: v.title,
      notes: v.notes,
      phone: null,
      address,
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

    let siteId = values.siteId;
    let address = values.address;
    if (!siteId && values.customerId && address) {
      siteId = await findOrCreateSiteByAddress({ customerId: values.customerId, address });
      address = null;
    }

    await updateJob({ ...values, siteId, address });
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

/** Szybka zmiana terminu (bez wchodzenia w pełną edycję); obsługuje też zakres dni. */
export async function setJobScheduleAction(
  id: string,
  scheduledAt: string,
  scheduledUntil: string | null = null,
): Promise<ActionResult> {
  try {
    await updateJobSchedule({ id, scheduledAt, scheduledUntil });
    revalidateJobViews(id);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/**
 * Szybkie uzupełnienie/zmiana adresu zlecenia dodanego „na szybko"
 * (bez wchodzenia w pełną edycję). Adres wpisany ręcznie dla klienta z bazy
 * zapisuje się jako jego obiekt — tak samo jak przy pełnym formularzu.
 */
export async function setJobAddressAction(
  id: string,
  customerId: string | null,
  siteId: string,
  address: string,
): Promise<ActionResult<{ siteId: string | null }>> {
  try {
    let resolvedSiteId: string | null = siteId || null;
    let resolvedAddress: string | null = address.trim() || null;
    if (!resolvedSiteId && customerId && resolvedAddress) {
      resolvedSiteId = await findOrCreateSiteByAddress({ customerId, address: resolvedAddress });
      resolvedAddress = null;
    }
    await updateJobAddress({ id, siteId: resolvedSiteId, address: resolvedAddress });
    revalidateJobViews(id);
    return { ok: true, data: { siteId: resolvedSiteId } };
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
