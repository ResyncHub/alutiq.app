import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { IsoDate } from "@/lib/domain/dates";
import {
  createExpenseSchema,
  createPaymentSchema,
  updateExpenseSchema,
  updatePaymentSchema,
} from "@/lib/validation/finance";

export type Expense = Database["public"]["Tables"]["expense"]["Row"];
export type Payment = Database["public"]["Tables"]["payment"]["Row"];

type JobRef = { id: string; title: string | null } | null;
export type ExpenseWithJob = Expense & { job: JobRef };
export type PaymentWithJob = Payment & { job: JobRef };

// Wydatki --------------------------------------------------------------------

export async function listExpenses(
  from: IsoDate,
  to: IsoDate,
): Promise<ExpenseWithJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense")
    .select("*, job:job_id(id, title)")
    .is("deleted_at", null)
    .gte("spent_on", from)
    .lte("spent_on", to)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ExpenseWithJob[]>();
  if (error) throw new Error(`Nie udało się pobrać wydatków: ${error.message}`);
  return data ?? [];
}

/** Wydatki podpięte do zlecenia. */
export async function listExpensesForJob(jobId: string): Promise<ExpenseWithJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense")
    .select("*, job:job_id(id, title)")
    .eq("job_id", jobId)
    .is("deleted_at", null)
    .order("spent_on", { ascending: false })
    .returns<ExpenseWithJob[]>();
  if (error) throw new Error(`Nie udało się pobrać kosztów: ${error.message}`);
  return data ?? [];
}

export async function createExpense(input: unknown): Promise<Expense> {
  const v = createExpenseSchema.parse(input);
  const supabase = await createClient();
  // Firma zwolniona z VAT: brutto = netto, VAT = 0 (§6, kolumny zostają).
  const { data, error } = await supabase
    .from("expense")
    .insert({
      job_id: v.jobId,
      category: v.category,
      spent_on: v.spentOn,
      description: v.description,
      net_gr: v.amount,
      vat_gr: 0,
      gross_gr: v.amount,
      vat_rate: 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać wydatku: ${error.message}`);
  return data;
}

export async function updateExpense(input: unknown): Promise<Expense> {
  const v = updateExpenseSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense")
    .update({
      job_id: v.jobId,
      category: v.category,
      spent_on: v.spentOn,
      description: v.description,
      net_gr: v.amount,
      vat_gr: 0,
      gross_gr: v.amount,
      vat_rate: 0,
    })
    .eq("id", v.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać wydatku: ${error.message}`);
  return data;
}

export async function softDeleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć wydatku: ${error.message}`);
}

/** Miesięczne sumy wpłat i wydatków dla całego roku (12 pozycji). */
export async function getYearlyTotals(
  year: number,
): Promise<{ month: number; incomeGr: number; expenseGr: number }[]> {
  const supabase = await createClient();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const [pays, exps] = await Promise.all([
    supabase
      .from("payment")
      .select("paid_on, amount_gr")
      .is("deleted_at", null)
      .gte("paid_on", from)
      .lte("paid_on", to),
    supabase
      .from("expense")
      .select("spent_on, gross_gr")
      .is("deleted_at", null)
      .gte("spent_on", from)
      .lte("spent_on", to),
  ]);
  if (pays.error) throw new Error(`Nie udało się pobrać wpłat: ${pays.error.message}`);
  if (exps.error) throw new Error(`Nie udało się pobrać wydatków: ${exps.error.message}`);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    incomeGr: 0,
    expenseGr: 0,
  }));
  for (const p of pays.data ?? []) {
    months[Number(p.paid_on.slice(5, 7)) - 1].incomeGr += p.amount_gr;
  }
  for (const e of exps.data ?? []) {
    months[Number(e.spent_on.slice(5, 7)) - 1].expenseGr += e.gross_gr;
  }
  return months;
}

// Wpłaty ---------------------------------------------------------------------

export async function listPayments(
  from: IsoDate,
  to: IsoDate,
): Promise<PaymentWithJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment")
    .select("*, job:job_id(id, title)")
    .is("deleted_at", null)
    .gte("paid_on", from)
    .lte("paid_on", to)
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<PaymentWithJob[]>();
  if (error) throw new Error(`Nie udało się pobrać wpłat: ${error.message}`);
  return data ?? [];
}

/** Wpłaty podpięte do zlecenia. */
export async function listPaymentsForJob(jobId: string): Promise<PaymentWithJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment")
    .select("*, job:job_id(id, title)")
    .eq("job_id", jobId)
    .is("deleted_at", null)
    .order("paid_on", { ascending: false })
    .returns<PaymentWithJob[]>();
  if (error) throw new Error(`Nie udało się pobrać wpłat: ${error.message}`);
  return data ?? [];
}

export async function createPayment(input: unknown): Promise<Payment> {
  const v = createPaymentSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment")
    .insert({
      job_id: v.jobId,
      paid_on: v.paidOn,
      description: v.description,
      amount_gr: v.amount,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać wpłaty: ${error.message}`);
  return data;
}

export async function updatePayment(input: unknown): Promise<Payment> {
  const v = updatePaymentSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment")
    .update({
      job_id: v.jobId,
      paid_on: v.paidOn,
      description: v.description,
      amount_gr: v.amount,
    })
    .eq("id", v.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać wpłaty: ${error.message}`);
  return data;
}

export async function softDeletePayment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć wpłaty: ${error.message}`);
}
