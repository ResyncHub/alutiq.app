import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/domain/dictionaries";
import { accountingDate, amountGrField, optionalText, optionalUuid } from "./common";

// Wydatek --------------------------------------------------------------------

export const createExpenseSchema = z.object({
  amount: amountGrField,
  category: z.enum(EXPENSE_CATEGORIES).default("material_parts"),
  spentOn: accountingDate,
  description: optionalText(500),
  jobId: optionalUuid,
});
export type CreateExpenseValues = z.output<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().uuid(),
});
export type UpdateExpenseValues = z.output<typeof updateExpenseSchema>;

// Wpłata ---------------------------------------------------------------------

export const createPaymentSchema = z.object({
  amount: amountGrField,
  paidOn: accountingDate,
  description: optionalText(500),
  jobId: optionalUuid,
});
export type CreatePaymentValues = z.output<typeof createPaymentSchema>;

export const updatePaymentSchema = createPaymentSchema.extend({
  id: z.string().uuid(),
});
export type UpdatePaymentValues = z.output<typeof updatePaymentSchema>;
