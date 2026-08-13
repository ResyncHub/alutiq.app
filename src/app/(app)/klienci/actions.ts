"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createDeviceSchema,
  createSiteSchema,
  quickAddCustomerSchema,
  updateCustomerSchema,
  updateDeviceSchema,
  updateSiteSchema,
} from "@/lib/validation/customer";
import {
  createCustomer,
  softDeleteCustomer,
  updateCustomer,
} from "@/lib/db/customers";
import { createSite, softDeleteSite, updateSite } from "@/lib/db/sites";
import { createDevice, softDeleteDevice, updateDevice } from "@/lib/db/devices";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Zamienia dowolny błąd na czytelny komunikat po polsku. */
function toMessage(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues[0]?.message ?? "Dane są nieprawidłowe.";
  }
  if (e instanceof Error) return e.message;
  return "Wystąpił nieoczekiwany błąd.";
}

/** Szybkie dodanie klienta (+ opcjonalny adres jako obiekt site). */
export async function addCustomerAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const values = quickAddCustomerSchema.parse(input);
    const customer = await createCustomer({
      kind: values.kind,
      name: values.name,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    });

    if (values.address || values.city || values.postalCode) {
      await createSite({
        customerId: customer.id,
        label: null,
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        notes: null,
      });
    }

    revalidatePath("/klienci");
    return { ok: true, data: { id: customer.id } };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Edycja danych klienta. */
export async function updateCustomerAction(input: unknown): Promise<ActionResult> {
  try {
    const values = updateCustomerSchema.parse(input);
    await updateCustomer(values);
    revalidatePath("/klienci");
    revalidatePath(`/klienci/${values.id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Miękkie usunięcie klienta. */
export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeleteCustomer(id);
    revalidatePath("/klienci");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Dodanie obiektu (adresu) do klienta. */
export async function addSiteAction(input: unknown): Promise<ActionResult> {
  try {
    const values = createSiteSchema.parse(input);
    await createSite(values);
    revalidatePath(`/klienci/${values.customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Edycja obiektu. */
export async function updateSiteAction(input: unknown): Promise<ActionResult> {
  try {
    const values = updateSiteSchema.parse(input);
    await updateSite(values);
    revalidatePath(`/klienci/${values.customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Miękkie usunięcie obiektu. `customerId` służy do odświeżenia widoku. */
export async function deleteSiteAction(
  id: string,
  customerId: string,
): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeleteSite(id);
    revalidatePath(`/klienci/${customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Dodanie urządzenia do obiektu. `customerId` służy do odświeżenia widoku. */
export async function addDeviceAction(
  input: unknown,
  customerId: string,
): Promise<ActionResult> {
  try {
    const values = createDeviceSchema.parse(input);
    await createDevice(values);
    revalidatePath(`/klienci/${customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Edycja urządzenia. `customerId` służy do odświeżenia widoku. */
export async function updateDeviceAction(
  input: unknown,
  customerId: string,
): Promise<ActionResult> {
  try {
    const values = updateDeviceSchema.parse(input);
    await updateDevice(values);
    revalidatePath(`/klienci/${customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

/** Miękkie usunięcie urządzenia. `customerId` służy do odświeżenia widoku. */
export async function deleteDeviceAction(
  id: string,
  customerId: string,
): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeleteDevice(id);
    revalidatePath(`/klienci/${customerId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}
