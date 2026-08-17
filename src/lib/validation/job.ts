import { z } from "zod";
import { JOB_STATUSES } from "@/lib/domain/dictionaries";
import { optionalLocalDateTime, optionalText } from "./common";

/** Opcjonalny UUID: "" / null / brak -> null, w innym razie musi być UUID. */
const optionalUuid = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Nieprawidłowy identyfikator",
  });

const jobFieldsSchema = z.object({
  customerId: optionalUuid,
  siteId: optionalUuid,
  title: optionalText(200),
  notes: optionalText(2000),
  phone: optionalText(40),
  address: optionalText(300),
  status: z.enum(JOB_STATUSES).default("new"),
  scheduledAt: optionalLocalDateTime,
});

/** Zasada minimum: zlecenie musi mieć cokolwiek do identyfikacji. */
const jobMinRule = (
  val: {
    customerId: string | null;
    title: string | null;
    phone: string | null;
    address: string | null;
  },
  ctx: z.RefinementCtx,
) => {
  if (!val.customerId && !val.title && !val.phone && !val.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Podaj przynajmniej jedno: klienta, opis, telefon lub adres.",
      path: ["title"],
    });
  }
};

export const createJobSchema = jobFieldsSchema.superRefine(jobMinRule);
export type CreateJobValues = z.output<typeof createJobSchema>;

export const updateJobSchema = jobFieldsSchema
  .extend({ id: z.string().uuid() })
  .superRefine(jobMinRule);
export type UpdateJobValues = z.output<typeof updateJobSchema>;

/** Sama zmiana statusu (szybka akcja na liście/szczegółach). */
export const updateJobStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(JOB_STATUSES),
});

/** Sama zmiana terminu (szybkie przełożenie na inny dzień/godzinę). */
export const updateJobScheduleSchema = z.object({
  id: z.string().uuid(),
  scheduledAt: optionalLocalDateTime,
});

/**
 * Formularz dodawania zlecenia z tworzeniem klienta „w locie".
 * Tryb „new": wpisujesz nowego klienta (imię/nazwa + telefon) — jeśli klient
 * o tym telefonie już istnieje, podpinamy istniejącego (bez duplikatu).
 * Tryb „existing": wybierasz klienta z bazy.
 */
export const addJobFormSchema = z
  .object({
    customerMode: z.enum(["new", "existing"]).default("new"),
    customerId: optionalUuid,
    newCustomerName: optionalText(200),
    newCustomerPhone: optionalText(40),
    title: optionalText(200),
    notes: optionalText(2000),
    address: optionalText(300),
    status: z.enum(JOB_STATUSES).default("new"),
    scheduledAt: optionalLocalDateTime,
  })
  .superRefine((val, ctx) => {
    const hasCustomer =
      (val.customerMode === "existing" && val.customerId) ||
      (val.customerMode === "new" && (val.newCustomerName || val.newCustomerPhone));
    if (!hasCustomer && !val.title && !val.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj klienta, opis lub adres.",
        path: ["title"],
      });
    }
  });
export type AddJobFormValues = z.output<typeof addJobFormSchema>;
