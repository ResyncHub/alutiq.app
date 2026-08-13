"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createExpense,
  createPayment,
  softDeleteExpense,
  softDeletePayment,
  updateExpense,
  updatePayment,
} from "@/lib/db/finance";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toMessage(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Dane są nieprawidłowe.";
  if (e instanceof Error) return e.message;
  return "Wystąpił nieoczekiwany błąd.";
}

// Wydatki --------------------------------------------------------------------

export async function addExpenseAction(input: unknown): Promise<ActionResult> {
  try {
    await createExpense(input);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function updateExpenseAction(input: unknown): Promise<ActionResult> {
  try {
    await updateExpense(input);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeleteExpense(id);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

// Wpłaty ---------------------------------------------------------------------

export async function addPaymentAction(input: unknown): Promise<ActionResult> {
  try {
    await createPayment(input);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function updatePaymentAction(input: unknown): Promise<ActionResult> {
  try {
    await updatePayment(input);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}

export async function deletePaymentAction(id: string): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id);
    await softDeletePayment(id);
    revalidatePath("/finanse");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toMessage(e) };
  }
}
