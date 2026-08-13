"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { JOB_STATUSES } from "@/lib/domain/dictionaries";
import { addJobFormSchema, updateJobSchema } from "@/lib/validation/job";
import {
  createJob,
  softDeleteJob,
  updateJob,
  updateJobStatus,
} from "@/lib/db/jobs";
import { findOrCreateCustomer } from "@/lib/db/customers";

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
