import { z } from "zod";
import { CUSTOMER_KINDS, DEVICE_TYPES } from "@/lib/domain/dictionaries";
import { optionalDate, optionalEmail, optionalText } from "./common";

/**
 * Schematy walidacji dla domeny klientów — jedno źródło prawdy dla formularzy
 * i Server Actions (CLAUDE.md §5). Pomocniki pól opcjonalnych w ./common.
 */

// ---------------------------------------------------------------------------
// customer
// ---------------------------------------------------------------------------

/** Wspólne pola klienta — używane też przez warstwę db (§5). */
export const customerFieldsSchema = z.object({
  kind: z.enum(CUSTOMER_KINDS).default("person"),
  name: optionalText(200),
  phone: optionalText(40),
  email: optionalEmail,
  notes: optionalText(2000),
});
export type CustomerFieldsValues = z.output<typeof customerFieldsSchema>;

/** Opcjonalny adres dołączany przy szybkim dodawaniu (utworzy obiekt site). */
const inlineAddress = z.object({
  address: optionalText(300),
  city: optionalText(120),
  postalCode: optionalText(12),
});

/**
 * Szybkie dodawanie klienta. Zasada minimum: przynajmniej jedno z
 * nazwa / telefon / adres. Reszta może zostać pusta.
 */
export const quickAddCustomerSchema = customerFieldsSchema.merge(inlineAddress).superRefine((val, ctx) => {
  if (!val.name && !val.phone && !val.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Podaj przynajmniej jedno: nazwę/imię, telefon lub adres.",
      path: ["name"],
    });
  }
});

export type QuickAddCustomerInput = z.input<typeof quickAddCustomerSchema>;
export type QuickAddCustomerValues = z.output<typeof quickAddCustomerSchema>;

/** Edycja klienta. */
export const updateCustomerSchema = customerFieldsSchema.extend({
  id: z.string().uuid(),
});
export type UpdateCustomerValues = z.output<typeof updateCustomerSchema>;

// ---------------------------------------------------------------------------
// site (obiekt / adres)
// ---------------------------------------------------------------------------

const siteFieldsSchema = z.object({
  customerId: z.string().uuid(),
  label: optionalText(120),
  address: optionalText(300),
  city: optionalText(120),
  postalCode: optionalText(12),
  notes: optionalText(2000),
});

/** Zasada minimum dla obiektu: nazwa albo adres. */
const siteMinRule = (
  val: { label: string | null; address: string | null },
  ctx: z.RefinementCtx,
) => {
  if (!val.label && !val.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Podaj nazwę obiektu lub adres.",
      path: ["address"],
    });
  }
};

export const createSiteSchema = siteFieldsSchema.superRefine(siteMinRule);
export type CreateSiteValues = z.output<typeof createSiteSchema>;

export const updateSiteSchema = siteFieldsSchema
  .extend({ id: z.string().uuid() })
  .superRefine(siteMinRule);
export type UpdateSiteValues = z.output<typeof updateSiteSchema>;

// ---------------------------------------------------------------------------
// device (urządzenie)
// ---------------------------------------------------------------------------

const deviceFieldsSchema = z.object({
  siteId: z.string().uuid(),
  deviceType: z.enum(DEVICE_TYPES).default("other"),
  brand: optionalText(120),
  model: optionalText(120),
  serialNumber: optionalText(120),
  installedOn: optionalDate,
  warrantyUntil: optionalDate,
  notes: optionalText(2000),
});

export const createDeviceSchema = deviceFieldsSchema;
export type CreateDeviceValues = z.output<typeof createDeviceSchema>;

export const updateDeviceSchema = deviceFieldsSchema.extend({
  id: z.string().uuid(),
});
export type UpdateDeviceValues = z.output<typeof updateDeviceSchema>;
