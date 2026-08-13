import { z } from "zod";

// Wspólne pomocniki pól opcjonalnych. Akceptują string, null i undefined
// (nullish), a na wyjściu dają zawsze `string | null`. Dzięki temu schematy są
// idempotentne — można nimi ponownie sparsować własny wynik (formularz -> Server Action).

/** Pole tekstowe opcjonalne: "" / null / brak -> null, przycina białe znaki. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Maksymalnie ${max} znaków`)
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null));

/** Opcjonalny e-mail: pusty -> null, w innym razie musi być poprawny. */
export const optionalEmail = z
  .string()
  .trim()
  .max(320)
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: "Nieprawidłowy e-mail",
  });

/** Opcjonalna data kalendarzowa "YYYY-MM-DD". */
export const optionalDate = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "Data w formacie RRRR-MM-DD",
  });

/**
 * Opcjonalny termin z pola datetime-local "YYYY-MM-DDTHH:mm" (czas warszawski).
 * Zostaje jako lokalny string lub null — konwersję na UTC robi warstwa db
 * (jedno miejsce), żeby schemat pozostał idempotentny.
 */
export const optionalLocalDateTime = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), {
    message: "Termin w formacie data i godzina",
  });
